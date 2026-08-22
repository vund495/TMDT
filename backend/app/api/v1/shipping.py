from fastapi import APIRouter

router = APIRouter(prefix="/shipping", tags=["Shipping"])


@router.post("/webhook")
async def shipping_webhook():
    """UC-17/20: nhận cập nhật trạng thái giao hàng từ GHTK/J&T (mock)."""
    return {"received": True}
