import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.dependencies import get_owned_workshop, require_workshop_owner
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.user import User
from app.models.workshop import Workshop
from app.schemas.common import Page
from app.schemas.order import OrderRead
from app.schemas.product import ProductCreateIn, ProductRead, ProductUpdateIn
from app.schemas.tour import TourSlotRead
from app.schemas.workshop import (
    WorkshopCreateIn,
    WorkshopRead,
    WorkshopRevenuePeriod,
    WorkshopUpdateIn,
    WorkshopWallet,
    WorkshopWalletPeriod,
)

router = APIRouter(prefix="/workshop", tags=["Workshop"])


@router.get("", response_model=WorkshopRead)
async def get_my_workshop(
    user: User = Depends(require_workshop_owner),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(Workshop).where(Workshop.owner_id == user.id))
    workshop = result.scalar_one_or_none()
    if workshop is None:
        raise HTTPException(404, "Bạn chưa có xưởng")
    return workshop


@router.post("", response_model=WorkshopRead, status_code=201)
async def create_workshop(
    body: WorkshopCreateIn,
    user: User = Depends(require_workshop_owner),
    session: AsyncSession = Depends(get_session),
):
    existing = await session.execute(select(Workshop).where(Workshop.owner_id == user.id))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(400, "Bạn đã có xưởng rồi")
    workshop = Workshop(
        owner_id=user.id,
        name=body.name,
        description=body.description,
        address=body.address,
        lat=body.lat,
        lng=body.lng,
        logo_url=body.logo_url,
        status="pending",
    )
    session.add(workshop)
    await session.commit()
    await session.refresh(workshop)
    return workshop


@router.patch("", response_model=WorkshopRead)
async def update_workshop(
    body: WorkshopUpdateIn,
    workshop: Workshop = Depends(get_owned_workshop),
    session: AsyncSession = Depends(get_session),
):
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(workshop, field, value)
    await session.commit()
    await session.refresh(workshop)
    return workshop


# ── Products ────────────────────────────────────────────────────────────


@router.get("/products", response_model=Page[ProductRead])
async def my_products(
    page: int = 1,
    page_size: int = 20,
    workshop: Workshop = Depends(get_owned_workshop),
    session: AsyncSession = Depends(get_session),
):
    """UC-09: danh sách sản phẩm của xưởng."""
    from app.models.product_passport import ProductPassport

    total_result = await session.execute(
        select(func.count())
        .select_from(Product)
        .where(Product.workshop_id == workshop.id, Product.is_deleted == False)
    )
    total = total_result.scalar_one()
    result = await session.execute(
        select(Product)
        .where(Product.workshop_id == workshop.id, Product.is_deleted == False)
        .order_by(Product.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    items = result.scalars().all()
    if items:
        passports = await session.execute(
            select(ProductPassport.product_id, ProductPassport.qr_code).where(
                ProductPassport.product_id.in_([p.id for p in items])
            )
        )
        qr_map = {pid: qr for pid, qr in passports.all()}
        for p in items:
            p.passport_qr = qr_map.get(p.id)
    return Page(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@router.post("/products", response_model=ProductRead, status_code=201)
async def create_product(
    body: ProductCreateIn,
    workshop: Workshop = Depends(get_owned_workshop),
    session: AsyncSession = Depends(get_session),
):
    """UC-10: đăng sản phẩm mới."""
    product = Product(
        workshop_id=workshop.id,
        name=body.name,
        description=body.description,
        theme=body.theme,
        material=body.material,
        firing_technique=body.firing_technique,
        glaze=body.glaze,
        original_price=body.original_price,
        sale_price=body.sale_price,
        stock=body.stock,
        images=body.images,
        video_url=body.video_url,
        status="draft",
    )
    session.add(product)
    await session.commit()
    await session.refresh(product)
    return product


@router.patch("/products/{product_id}", response_model=ProductRead)
async def update_product(
    product_id: uuid.UUID,
    body: ProductUpdateIn,
    workshop: Workshop = Depends(get_owned_workshop),
    session: AsyncSession = Depends(get_session),
):
    product = await session.get(Product, product_id)
    if product is None or product.workshop_id != workshop.id or product.is_deleted:
        raise HTTPException(404, "Không tìm thấy sản phẩm")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    await session.commit()
    await session.refresh(product)
    return product


@router.delete("/products/{product_id}", status_code=204)
async def delete_product(
    product_id: uuid.UUID,
    workshop: Workshop = Depends(get_owned_workshop),
    session: AsyncSession = Depends(get_session),
):
    """Xóa (ẩn) sản phẩm — không xóa vĩnh viễn để giữ lịch sử đơn hàng."""
    product = await session.get(Product, product_id)
    if product is None or product.workshop_id != workshop.id:
        raise HTTPException(404, "Không tìm thấy sản phẩm")
    if product.is_deleted:
        raise HTTPException(400, "Sản phẩm đã bị xóa")
    product.is_deleted = True
    await session.commit()
    return None


@router.post("/products/{product_id}/publish", response_model=ProductRead)
async def publish_product(
    product_id: uuid.UUID,
    workshop: Workshop = Depends(get_owned_workshop),
    session: AsyncSession = Depends(get_session),
):
    from app.models.product_passport import ProductPassport

    product = await session.get(Product, product_id)
    if product is None or product.workshop_id != workshop.id or product.is_deleted:
        raise HTTPException(404, "Không tìm thấy sản phẩm")
    product.status = "pending_review"
    # Tự sinh Product Passport (QR) nếu chưa có
    existing = await session.execute(
        select(ProductPassport).where(ProductPassport.product_id == product.id)
    )
    if existing.scalar_one_or_none() is None:
        qr_code = "PP-" + product.id.hex[:12].upper()
        session.add(
            ProductPassport(
                product_id=product.id,
                qr_code=qr_code,
                video_url=product.video_url,
                unlocked=False,
            )
        )
    await session.commit()
    await session.refresh(product)
    return product


# ── Orders ──────────────────────────────────────────────────────────────


@router.get("/slots", response_model=list[TourSlotRead])
async def my_tour_slots(
    workshop: Workshop = Depends(get_owned_workshop),
    session: AsyncSession = Depends(get_session),
):
    """UC-W: danh sách suất tour của xưởng (kể cả đã kín)."""
    from sqlalchemy import select

    from app.models.tour import TourSlot

    result = await session.execute(
        select(TourSlot)
        .where(TourSlot.workshop_id == workshop.id)
        .order_by(TourSlot.tour_date.desc(), TourSlot.start_time)
    )
    return result.scalars().all()


@router.get("/orders", response_model=list[OrderRead])
async def workshop_orders(
    status: str | None = None,
    workshop: Workshop = Depends(get_owned_workshop),
    session: AsyncSession = Depends(get_session),
):
    """UC-11: đơn hàng của xưởng."""
    query = select(Order).where(Order.workshop_id == workshop.id).order_by(Order.created_at.desc())
    if status:
        query = query.where(Order.status == status)
    result = await session.execute(query)
    return result.scalars().all()


@router.post("/orders/{order_id}/ship", response_model=OrderRead)
async def workshop_ship_order(
    order_id: uuid.UUID,
    workshop: Workshop = Depends(get_owned_workshop),
    session: AsyncSession = Depends(get_session),
):
    """UC-01 & UC-W3: xưởng xác nhận đã đóng gói & bàn giao vận chuyển -> shipping."""
    from app.enums.order_status import OrderStatus, can_transition

    order = await session.get(Order, order_id)
    if order is None or order.workshop_id != workshop.id:
        raise HTTPException(404, "Không tìm thấy đơn hàng")
    current = OrderStatus(order.status)
    if not can_transition(current, OrderStatus.shipping):
        raise HTTPException(400, "Đơn chưa sẵn sàng bàn giao (chuẩn bị trước đã)")
    order.status = OrderStatus.shipping.value
    from app.api.v1.notifications import create_notification

    create_notification(
        session,
        order.customer_id,
        f"Đơn hàng {order.code} đang giao",
        f"Xưởng gốm đã bàn giao {order.code} cho đơn vị vận chuyển. Theo dõi đơn tại mục Đơn hàng của bạn.",
        "order",
        order.id,
        "order",
    )
    await session.commit()
    await session.refresh(order)
    return order


# ── Revenue ─────────────────────────────────────────────────────────────


@router.get("/revenue", response_model=list[WorkshopRevenuePeriod])
async def revenue_report(
    workshop: Workshop = Depends(get_owned_workshop),
    session: AsyncSession = Depends(get_session),
):
    """UC-12: báo cáo doanh thu xưởng."""
    from app.models.voucher import RevenueRecord

    result = await session.execute(
        select(RevenueRecord)
        .where(RevenueRecord.workshop_id == workshop.id)
        .order_by(RevenueRecord.period.desc())
    )
    return result.scalars().all()


@router.get("/revenue/wallet", response_model=WorkshopWallet)
async def workshop_wallet(
    workshop: Workshop = Depends(get_owned_workshop),
    session: AsyncSession = Depends(get_session),
):
    """UC-04: ví đối soát doanh thu — tổng hợp + chi tiết theo kỳ cho xưởng."""
    from sqlalchemy import func

    from app.models.order import Order
    from app.models.voucher import RevenueRecord

    records_result = await session.execute(
        select(RevenueRecord)
        .where(RevenueRecord.workshop_id == workshop.id)
        .order_by(RevenueRecord.period.desc())
    )
    records = records_result.scalars().all()

    # Số đơn thành công (đã giao hoặc hoàn tất) của xưởng theo kỳ
    orders_result = await session.execute(
        select(
            func.date_trunc("month", Order.created_at).label("month"),
            func.count(Order.id).label("cnt"),
        )
        .where(
            Order.workshop_id == workshop.id,
            Order.status.in_(["shipping", "completed", "preparing"]),
        )
        .group_by("month")
        .order_by("month")
    )

    paid_by_period: dict[str, int | float] = {}
    for month, cnt in orders_result.all():
        from datetime import date

        if month is not None:
            key = date(month.year, month.month, 1).strftime("%Y-%m")
            paid_by_period[key] = int(cnt)

    periods = []
    total_gross = 0
    total_commission = 0
    total_payout = 0
    total_paid = 0
    for r in records:
        gross = int(r.gross_amount or 0)
        commission = int(r.commission_amount or 0)
        payout = int(r.payout_amount or 0)
        paid = int(paid_by_period.get(r.period, 0))
        total_gross += gross
        total_commission += commission
        total_payout += payout
        total_paid += paid
        periods.append(
            WorkshopWalletPeriod(
                period=r.period,
                gross_amount=gross,
                commission_amount=commission,
                payout_amount=payout,
                paid_orders=paid,
            )
        )

    return WorkshopWallet(
        total_gross=total_gross,
        total_commission=total_commission,
        total_payout=total_payout,
        total_paid_orders=total_paid,
        periods=periods,
    )
