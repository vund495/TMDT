import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.models.product import Product
from app.models.workshop import Workshop
from app.schemas.common import Page
from app.schemas.product import ProductDetail, ProductRead
from app.schemas.workshop import WorkshopRead

router = APIRouter(tags=["Marketplace"])

SORT_OPTIONS = {
    "newest": lambda c: c.created_at.desc(),
    "price_asc": lambda c: (func.coalesce(c.sale_price, c.original_price)).asc(),
    "price_desc": lambda c: (func.coalesce(c.sale_price, c.original_price)).desc(),
    "best_seller": lambda c: c.sold_count.desc(),
}


def _active_product_filter():
    return and_(Product.status.in_(["active", "approved"]), Product.is_deleted == False)


@router.get("/products", response_model=Page[ProductRead])
async def list_products(
    q: str | None = None,
    theme: str | None = None,
    workshop_id: uuid.UUID | None = None,
    min_price: int | None = None,
    max_price: int | None = None,
    sort: str = "newest",
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
):
    """UC-05/06: tìm kiếm, lọc theo chủ đề/giá, sắp xếp, phân trang sản phẩm."""
    conditions = [_active_product_filter()]

    if q:
        conditions.append(
            or_(Product.name.ilike(f"%{q}%"), Product.description.ilike(f"%{q}%"))
        )
    if theme:
        conditions.append(Product.theme == theme)
    if workshop_id:
        conditions.append(Product.workshop_id == workshop_id)
    if min_price is not None:
        conditions.append(func.coalesce(Product.sale_price, Product.original_price) >= min_price)
    if max_price is not None:
        conditions.append(func.coalesce(Product.sale_price, Product.original_price) <= max_price)

    order_by = SORT_OPTIONS.get(sort, SORT_OPTIONS["newest"])(Product)

    total_result = await session.execute(
        select(func.count()).select_from(Product).where(*conditions)
    )
    total = total_result.scalar_one()

    result = await session.execute(
        select(Product)
        .where(*conditions)
        .order_by(order_by)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    items = result.scalars().all()

    return Page(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@router.get("/products/{product_id}", response_model=ProductDetail)
async def get_product(
    product_id: uuid.UUID, session: AsyncSession = Depends(get_session)
):
    """UC-07: chi tiết sản phẩm kèm thông tin xưởng."""
    product = await session.get(Product, product_id)
    if product is None or product.status not in ("active", "approved") or product.is_deleted:
        raise HTTPException(404, "Không tìm thấy sản phẩm")

    workshop = await session.get(Workshop, product.workshop_id)
    detail = ProductDetail.model_validate(product)
    if workshop:
        detail.workshop_name = workshop.name
        detail.workshop_address = workshop.address
    return detail


@router.get("/workshops", response_model=list[WorkshopRead])
async def list_workshops(
    q: str | None = None, session: AsyncSession = Depends(get_session)
):
    """UC-09: danh sách gian hàng xưởng đã duyệt (kèm Google Maps)."""
    conditions = [Workshop.status == "approved"]
    if q:
        conditions.append(Workshop.name.ilike(f"%{q}%"))
    result = await session.execute(select(Workshop).where(*conditions))
    return result.scalars().all()


@router.get("/workshops/{workshop_id}", response_model=WorkshopRead)
async def get_workshop(
    workshop_id: uuid.UUID, session: AsyncSession = Depends(get_session)
):
    workshop = await session.get(Workshop, workshop_id)
    if workshop is None or workshop.status != "approved":
        raise HTTPException(404, "Không tìm thấy xưởng")
    return workshop
