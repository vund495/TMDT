from fastapi import APIRouter, Depends

from app.core.security import get_current_user

router = APIRouter(prefix="/cart", tags=["Cart"])


@router.get("")
async def get_cart(current_user: dict = Depends(get_current_user)):
    """UC-39: xem giỏ hàng."""
    return {"user_id": current_user["id"], "items": []}


@router.post("/items")
async def add_item(current_user: dict = Depends(get_current_user)):
    """UC-39: thêm sản phẩm vào giỏ."""
    return {"added": True}


@router.patch("/items/{item_id}")
async def update_quantity(item_id: str, quantity: int = 1):
    """UC-39: cập nhật số lượng."""
    return {"item_id": item_id, "quantity": quantity}


@router.delete("/items/{item_id}")
async def remove_item(item_id: str):
    """UC-39: xóa khỏi giỏ."""
    return {"removed": True}
