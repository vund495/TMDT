"""UC-29/30/31/36: quy trình Vỡ 1 đền 1."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.enums.order_status import OrderStatus, can_transition
from app.models.dispute import Dispute
from app.models.order import Order, OrderItem
from app.services.order_service import generate_order_code

REPLACEMENT_SHIPPING_FEE = 0
REPLACEMENT_DISCOUNT = 0


class DisputeError(Exception):
    def __init__(self, message: str, code: int = 400):
        super().__init__(message)
        self.message = message
        self.code = code


async def create_dispute(
    session: AsyncSession,
    customer_id: uuid.UUID,
    order_id: uuid.UUID,
    reason: str,
    evidence_urls: list[str] | None,
) -> Dispute:
    order = await session.get(Order, order_id)
    if order is None or order.customer_id != customer_id:
        raise DisputeError("Không tìm thấy đơn hàng", 404)

    existing = await session.execute(
        select(Dispute).where(Dispute.order_id == order_id, Dispute.status.in_(["open", "reviewing"]))
    )
    if existing.scalar_one_or_none() is not None:
        raise DisputeError("Đơn này đã có khiếu nại đang xử lý")

    dispute = Dispute(
        order_id=order_id,
        customer_id=customer_id,
        reason=reason,
        evidence_urls=evidence_urls,
        status="open",
    )
    # Đưa đơn về trạng thái tranh chấp
    order_status = OrderStatus(order.status)
    if can_transition(order_status, OrderStatus.disputing):
        order.status = OrderStatus.disputing.value
    session.add(dispute)
    await session.flush()
    return dispute


async def resolve_dispute(
    session: AsyncSession,
    dispute: Dispute,
    resolution: str,
    admin_note: str | None,
) -> Dispute:
    """resolution = approved (hoàn trả/refund) | reship (gửi SP thay thế) | rejected."""
    if dispute.status not in ("open", "reviewing"):
        raise DisputeError("Khiếu nại không ở trạng thái có thể phê duyệt")
    if resolution not in ("approved", "reship", "rejected"):
        raise DisputeError("Kết quả phải là approved, reship hoặc rejected")

    dispute.status = "resolved"
    dispute.resolution = resolution
    dispute.admin_note = admin_note
    dispute.resolved_at = datetime.now(timezone.utc)

    if resolution in ("approved", "reship"):
        order = await session.get(Order, dispute.order_id)
        if order is not None:
            order_status = OrderStatus(order.status)
            if resolution == "approved":
                # UC-30: hoàn trả & hoàn tiền
                if can_transition(order_status, OrderStatus.returned):
                    order.status = OrderStatus.returned.value
            else:
                # UC-31: gửi sản phẩm thay thế -> tạo đơn thay thế mới,
                # đơn thay thế trỏ về đơn gốc (replacement_of_id) và đơn gốc đóng lại.
                if order.replacement_of_id is None:
                    replacement = await _create_replacement_order(session, order)
                    await _notify_replacement(session, order, replacement)
                if can_transition(OrderStatus(order.status), OrderStatus.completed):
                    order.status = OrderStatus.completed.value
    await session.flush()
    return dispute


async def _create_replacement_order(session: AsyncSession, order: Order) -> Order:
    """UC-31: tạo đơn thay thế (miễn phí, cùng sản phẩm, tracking mới).

    replacement_of_id được gán trên đơn thay thế, trỏ về đơn gốc bị lỗi
    (đúng ngữ nghĩa: "đơn này là thay thế cho đơn X").
    """
    replacement = Order(
        code=generate_order_code().replace("TT-", "RC-"),
        customer_id=order.customer_id,
        workshop_id=order.workshop_id,
        status=OrderStatus.preparing.value,
        subtotal=0,
        discount_amount=0,
        shipping_fee=0,
        total=0,
        receiver_name=order.receiver_name,
        receiver_phone=order.receiver_phone,
        shipping_address=order.shipping_address,
        anti_shock_packed=order.anti_shock_packed,
        replacement_of_id=order.id,
    )
    session.add(replacement)
    await session.flush()

    items = await session.execute(
        select(OrderItem).where(OrderItem.order_id == order.id)
    )
    for item in items.scalars().all():
        session.add(
            OrderItem(
                order_id=replacement.id,
                product_id=item.product_id,
                product_name=item.product_name,
                unit_price=item.unit_price,
                quantity=item.quantity,
            )
        )
    return replacement


async def _notify_replacement(session: AsyncSession, order: Order, replacement: Order) -> None:
    from app.api.v1.notifications import create_notification

    create_notification(
        session,
        order.customer_id,
        f"Xưởng gửi hàng thay thế cho {order.code}",
        f"Khiếu nại đơn {order.code} đã được chấp thuận theo hướng gửi sản phẩm thay thế. "
        f"Đơn thay thế {replacement.code} đang được chuẩn bị và sẽ giao miễn phí tới bạn.",
        "order",
        replacement.id,
        "order",
    )
