"""UC-15: state machine + tạo đơn từ giỏ hàng."""
import random
import string
import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.enums.order_status import OrderStatus, can_transition
from app.models.cart_item import CartItem
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.user import User
from app.models.voucher import Voucher
from app.models.workshop import Workshop

SHIPPING_FEE = 20000
MIN_FREE_SHIPPING = 500000
COMMISSION_RATE = 0.10


class OrderError(Exception):
    def __init__(self, message: str, code: int = 400):
        super().__init__(message)
        self.message = message
        self.code = code


def generate_order_code() -> str:
    return "TT-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=8))


def _decode_price(price) -> int:
    return int(price)


async def apply_voucher(
    session: AsyncSession, voucher_code: str | None, subtotal: int
) -> tuple[int, Voucher | None]:
    if not voucher_code:
        return 0, None
    result = await session.execute(
        select(Voucher).where(Voucher.code == voucher_code, Voucher.active.is_(True))
    )
    voucher = result.scalar_one_or_none()
    now = datetime.now().date()
    if voucher is None:
        raise OrderError("Mã giảm giá không hợp lệ")
    if voucher.valid_from > now or voucher.valid_until < now:
        raise OrderError("Mã giảm giá đã hết hạn")
    if voucher.usage_limit is not None and voucher.used_count >= voucher.usage_limit:
        raise OrderError("Mã giảm giá đã hết lượt sử dụng")
    discount = subtotal * voucher.discount_percent // 100
    if voucher.max_discount_amount is not None:
        discount = min(discount, voucher.max_discount_amount)
    return discount, voucher


async def _compute_shipping(workshop: Workshop, subtotal: int) -> int:
    return SHIPPING_FEE


async def build_order(
    session: AsyncSession,
    customer: User,
    items: list[dict],
    voucher_code: str | None,
    receiver: dict,
    anti_shock_packed: bool,
) -> Order:
    """items: list of {"product_id": UUID, "quantity": int}"""
    if not items:
        raise OrderError("Giỏ hàng trống", 400)

    product_ids = [i["product_id"] for i in items]
    products_result = await session.execute(
        select(Product).where(Product.id.in_(product_ids))
    )
    products = {p.id: p for p in products_result.scalars().all()}

    workshop_ids = {p.workshop_id for p in products.values()}
    if len(workshop_ids) != 1:
        raise OrderError("Chỉ đặt hàng từ 1 xưởng trong mỗi đơn")
    workshop_id = next(iter(workshop_ids))

    order_items = []
    subtotal = 0
    for item in items:
        product = products.get(item["product_id"])
        if product is None or product.status not in ("active", "approved"):
            raise OrderError("Sản phẩm không tồn tại")
        if product.stock < item["quantity"]:
            raise OrderError(f"Sản phẩm '{product.name}' không đủ hàng")
        price = product.sale_price if product.sale_price is not None else product.original_price
        line_total = _decode_price(price) * item["quantity"]
        subtotal += line_total
        order_items.append((product, price, line_total, item["quantity"]))

    discount, voucher = await apply_voucher(session, voucher_code, subtotal)
    shipping_fee = await _compute_shipping(workshop_id, subtotal)
    total = subtotal - discount + shipping_fee
    if total < 0:
        total = 0

    order = Order(
        code=generate_order_code(),
        customer_id=customer.id,
        workshop_id=workshop_id,
        status=OrderStatus.pending_payment.value,
        subtotal=subtotal,
        discount_amount=discount,
        shipping_fee=shipping_fee,
        total=total,
        receiver_name=receiver["name"],
        receiver_phone=receiver["phone"],
        shipping_address=receiver["address"],
        anti_shock_packed=anti_shock_packed,
    )
    session.add(order)
    await session.flush()

    for product, price, line_total, qty in order_items:
        session.add(
            OrderItem(
                order_id=order.id,
                product_id=product.id,
                product_name=product.name,
                unit_price=price,
                quantity=qty,
            )
        )
        product.stock -= qty

    if voucher is not None:
        voucher.used_count += 1

    return order


async def clear_cart_for_order(
    session: AsyncSession, customer_id: uuid.UUID, product_ids: list[uuid.UUID]
) -> None:
    result = await session.execute(
        select(CartItem).where(
            CartItem.user_id == customer_id, CartItem.product_id.in_(product_ids)
        )
    )
    for cart_item in result.scalars().all():
        await session.delete(cart_item)


def transition_order(order: Order, target: OrderStatus) -> None:
    current = OrderStatus(order.status)
    if not can_transition(current, target):
        raise OrderError(
            f"Không thể chuyển đơn từ '{current.value}' sang '{target.value}'"
        )
    order.status = target.value
