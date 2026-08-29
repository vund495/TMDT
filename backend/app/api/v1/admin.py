from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.core.database import get_session
from app.core.dependencies import require_admin
from app.models.dispute import Dispute
from app.models.order import Order
from app.models.product import Product
from app.models.user import User
from app.models.workshop import Workshop
from app.schemas.dispute import DisputeRead
from app.schemas.product import ProductRead, ProductRejectIn
from app.schemas.user import UserRead
from app.schemas.workshop import WorkshopRead

router = APIRouter(prefix="/admin", tags=["Admin"])


def _generate_passport_qr(product_id: uuid.UUID) -> str:
    """Sinh mã QR hộ chiếu sản phẩm duy nhất từ id sản phẩm."""
    return "PP-" + product_id.hex[:12].upper()


# ── Workshop approval ───────────────────────────────────────────────────


@router.get("/workshops/pending", response_model=list[WorkshopRead])
async def pending_workshops(
    admin=Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    """UC-33: danh sách xưởng chờ duyệt."""
    result = await session.execute(
        select(Workshop).where(Workshop.status == "pending").order_by(Workshop.created_at)
    )
    return result.scalars().all()


@router.post("/workshops/{workshop_id}/approve", response_model=WorkshopRead)
async def approve_workshop(
    workshop_id: str,
    admin=Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    workshop = await session.get(Workshop, uuid.UUID(workshop_id))
    if workshop is None:
        raise HTTPException(404, "Không tìm thấy xưởng")
    workshop.status = "approved"
    await session.commit()
    await session.refresh(workshop)
    return workshop


@router.post("/workshops/{workshop_id}/reject", response_model=WorkshopRead)
async def reject_workshop(
    workshop_id: str,
    admin=Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    workshop = await session.get(Workshop, uuid.UUID(workshop_id))
    if workshop is None:
        raise HTTPException(404, "Không tìm thấy xưởng")
    workshop.status = "rejected"
    await session.commit()
    await session.refresh(workshop)
    return workshop


# ── Product approval ────────────────────────────────────────────────────


@router.get("/products/pending", response_model=list[ProductRead])
async def pending_products(
    admin=Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Product).where(Product.status == "draft").order_by(Product.created_at)
    )
    return result.scalars().all()


@router.post("/products/{product_id}/approve", response_model=ProductRead)
async def approve_product(
    product_id: str,
    admin=Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    from app.models.product_passport import ProductPassport

    product = await session.get(Product, uuid.UUID(product_id))
    if product is None:
        raise HTTPException(404, "Không tìm thấy sản phẩm")
    product.status = "active"
    product.reject_reason = None
    # UC-02 bước 4: hệ thống tự tạo Product Passport (QR) cho sản phẩm được duyệt
    existing = await session.execute(
        select(ProductPassport).where(ProductPassport.product_id == product.id)
    )
    if existing.scalar_one_or_none() is None:
        qr_code = _generate_passport_qr(product.id)
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


@router.post("/products/{product_id}/reject", response_model=ProductRead)
async def reject_product(
    product_id: str,
    body: ProductRejectIn,
    admin=Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    """UC-02 rẽ nhánh 2: admin từ chối SP -> trả về bản nháp kèm ghi chú."""
    product = await session.get(Product, uuid.UUID(product_id))
    if product is None:
        raise HTTPException(404, "Không tìm thấy sản phẩm")
    product.status = "draft"
    product.reject_reason = body.reason
    await session.commit()
    await session.refresh(product)
    return product


# ── Disputes ────────────────────────────────────────────────────────────


@router.get("/disputes", response_model=list[DisputeRead])
async def list_disputes(
    admin=Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Dispute).order_by(Dispute.created_at.desc())
    )
    return result.scalars().all()


# ── Stats ───────────────────────────────────────────────────────────────


@router.get("/tours/bookings")
async def all_tour_bookings(
    admin=Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    """UC-A4: admin xem toàn bộ lịch đặt tour của tất cả xưởng."""
    from app.models.tour import TourBooking, TourSlot

    result = await session.execute(
        select(TourBooking, TourSlot).join(TourSlot, TourBooking.slot_id == TourSlot.id)
        .order_by(TourSlot.tour_date.desc(), TourSlot.start_time.desc())
    )
    rows = []
    for booking, slot in result.all():
        rows.append(
            {
                "booking_id": str(booking.id),
                "customer_id": str(booking.customer_id),
                "workshop_id": str(slot.workshop_id),
                "tour_date": str(slot.tour_date),
                "start_time": str(slot.start_time),
                "num_guests": booking.num_guests,
                "total_amount": int(booking.total_amount),
                "status": booking.status,
                "voucher_issued": booking.voucher_issued,
            }
        )
    return rows


# ── Stats ───────────────────────────────────────────────────────────────


@router.get("/stats")
async def platform_stats(
    admin=Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    """UC-38: thống kê doanh thu toàn sàn."""
    from app.models.voucher import RevenueRecord

    total_revenue = (
        await session.execute(select(func.coalesce(func.sum(RevenueRecord.gross_amount), 0)))
    ).scalar()
    orders_count = (
        await session.execute(select(func.count()).select_from(Order))
    ).scalar_one()
    workshops_count = (
        await session.execute(select(func.count()).select_from(Workshop))
    ).scalar_one()
    customers_count = (
        await session.execute(
            select(func.count()).select_from(User).where(User.role == "customer")
        )
    ).scalar_one()
    disputes_pending = (
        await session.execute(
            select(func.count()).select_from(Dispute).where(Dispute.status.in_(["open", "reviewing"]))
        )
    ).scalar_one()
    return {
        "total_revenue": int(total_revenue or 0),
        "orders_count": orders_count,
        "workshops_count": workshops_count,
        "customers_count": customers_count,
        "disputes_pending": disputes_pending,
    }
