from fastapi import APIRouter, Depends

from app.core.security import get_current_user

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("")
async def create_order(current_user: dict = Depends(get_current_user)):
    """UC-15: tạo đơn từ giỏ hàng, sinh QR VietQR."""
    return {"order_code": "TT-PLACEHOLDER", "qr_url": None, "status": "pending_payment"}


@router.get("")
async def my_orders(current_user: dict = Depends(get_current_user)):
    """UC-18: danh sách đơn của khách."""
    return {"items": []}
