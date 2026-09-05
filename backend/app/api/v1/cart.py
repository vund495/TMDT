import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.security import get_current_user
from app.models.cart_item import CartItem
from app.models.product import Product
from app.schemas.cart import CartItemIn, CartItemRead, CartItemUpdateIn, CartRead

router = APIRouter(prefix="/cart", tags=["Cart"])


def _get_user_id(current_user: dict) -> uuid.UUID:
    return uuid.UUID(str(current_user["id"]))


@router.get("", response_model=CartRead)
async def get_cart(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """UC-39: xem giỏ hàng."""
    uid = _get_user_id(current_user)
    result = await session.execute(
        select(CartItem, Product)
        .join(Product, Product.id == CartItem.product_id)
        .where(CartItem.user_id == uid)
    )
    rows = result.all()
    items = []
    total = 0
    for cart_item, product in rows:
        price = product.sale_price if product.sale_price is not None else product.original_price
        subtotal = price * cart_item.quantity
        total += subtotal
        items.append(
            CartItemRead(
                id=cart_item.id,
                product_id=cart_item.product_id,
                quantity=cart_item.quantity,
                product_name=product.name,
                product_image=(product.images or [None])[0] if product.images else None,
                unit_price=price,
                subtotal=subtotal,
            )
        )
    return CartRead(items=items, total=total)


@router.post("/items", response_model=CartRead)
async def add_item(
    body: CartItemIn,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """UC-39: thêm sản phẩm vào giỏ (cộng dồn nếu đã có)."""
    uid = _get_user_id(current_user)
    product = await session.get(Product, body.product_id)
    if product is None or product.is_deleted:
        raise HTTPException(404, "Sản phẩm không tồn tại")
    if body.quantity < 1:
        raise HTTPException(400, "Số lượng tối thiểu là 1")

    existing = await session.execute(
        select(CartItem).where(
            CartItem.user_id == uid, CartItem.product_id == body.product_id
        )
    )
    cart_item = existing.scalar_one_or_none()
    if cart_item is None:
        cart_item = CartItem(user_id=uid, product_id=body.product_id, quantity=body.quantity)
        session.add(cart_item)
    else:
        cart_item.quantity += body.quantity
    await session.commit()
    return await get_cart(current_user, session)


@router.patch("/items/{item_id}", response_model=CartRead)
async def update_quantity(
    item_id: uuid.UUID,
    body: CartItemUpdateIn,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """UC-39: cập nhật số lượng."""
    uid = _get_user_id(current_user)
    cart_item = await session.get(CartItem, item_id)
    if cart_item is None or cart_item.user_id != uid:
        raise HTTPException(404, "Mục giỏ hàng không tồn tại")
    if body.quantity < 1:
        raise HTTPException(400, "Số lượng tối thiểu là 1")
    cart_item.quantity = body.quantity
    await session.commit()
    return await get_cart(current_user, session)


@router.delete("/items/{item_id}", response_model=CartRead)
async def remove_item(
    item_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """UC-39: xóa khỏi giỏ."""
    uid = _get_user_id(current_user)
    cart_item = await session.get(CartItem, item_id)
    if cart_item is None or cart_item.user_id != uid:
        raise HTTPException(404, "Mục giỏ hàng không tồn tại")
    await session.delete(cart_item)
    await session.commit()
    return await get_cart(current_user, session)
