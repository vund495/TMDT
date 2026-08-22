from fastapi import APIRouter

router = APIRouter(prefix="/passport", tags=["Product Passport"])


@router.get("/{qr_code}")
async def get_passport(qr_code: str):
    """UC-07/08: tra cứu Hộ chiếu sản phẩm, video chỉ mở khi unlocked."""
    return {"qr_code": qr_code, "unlocked": False, "video_url": None}
