import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.models.product import Product
from app.models.product_passport import ProductPassport

router = APIRouter(prefix="/passport", tags=["Product Passport"])


@router.get("/{qr_code}")
async def get_passport(
    qr_code: str,
    session: AsyncSession = Depends(get_session),
):
    """UC-07/08: tra cứu Hộ chiếu sản phẩm (công khai), video chỉ mở khi unlocked."""
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

    unlocked = bool(pp.unlocked)
    # Chỉ người đã mua (unlocked) mới được xem video
    video_url = pp.video_url if unlocked else None

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
        "unlocked": unlocked,
        "video_url": video_url,
    }
