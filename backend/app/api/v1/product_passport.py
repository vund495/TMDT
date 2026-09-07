import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.security import get_optional_user
from app.models.product import Product
from app.models.product_passport import ProductPassport, ProductPassportView

router = APIRouter(prefix="/passport", tags=["Product Passport"])


@router.get("/{qr_code}")
async def get_passport(
    qr_code: str,
    session: AsyncSession = Depends(get_session),
    current_user: dict | None = Depends(get_optional_user),
):
    """UC-07/08: tra cứu Hộ chiếu sản phẩm (công khai).

    Video nghệ nhân chỉ mở cho người đã mua (có product_passport_view).
    Admin và chủ xưởng sở hữu sản phẩm luôn được xem.
    """
    pp_result = await session.execute(
        select(ProductPassport).where(ProductPassport.qr_code == qr_code)
    )
    pp = pp_result.scalar_one_or_none()
    product = None
    if pp is not None:
        product = await session.get(Product, pp.product_id)

    if pp is None or product is None:
        return {
            "found": False,
            "message": "Không tìm thấy hộ chiếu sản phẩm",
        }

    uid = None
    if current_user is not None:
        try:
            uid = uuid.UUID(str(current_user["id"]))
        except (ValueError, TypeError):
            uid = None
    role = (current_user or {}).get("role")

    can_view = uid is not None and (
        role == "admin"
        or await _viewer_has_access(session, pp.id, uid, product.workshop_id)
    )
    return {
        "found": True,
        "qr_code": qr_code,
        "product_id": str(product.id),
        "product_name": product.name,
        "material": product.material,
        "firing_technique": product.firing_technique,
        "glaze": product.glaze,
        "theme": product.theme,
        "workshop_id": str(product.workshop_id),
        "unlocked": bool(can_view),
        "video_url": pp.video_url if can_view else None,
    }


async def _viewer_has_access(
    session: AsyncSession,
    passport_id: uuid.UUID,
    user_id: uuid.UUID,
    product_workshop_id: uuid.UUID,
) -> bool:
    """Có view (đã mua) hoặc là chủ xưởng của sản phẩm."""
    from app.models.user import User

    view_result = await session.execute(
        select(ProductPassportView).where(
            ProductPassportView.passport_id == passport_id,
            ProductPassportView.user_id == user_id,
        )
    )
    if view_result.scalar_one_or_none() is not None:
        return True
    user = await session.get(User, user_id)
    from app.models.workshop import Workshop

    if user is not None and user.role == "workshop_owner":
        workshop_result = await session.execute(
            select(Workshop).where(
                Workshop.owner_id == user_id, Workshop.id == product_workshop_id
            )
        )
        return workshop_result.scalar_one_or_none() is not None
    return False
