"""UC-29/30/31/36: quy trình Vỡ 1 đền 1."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.enums.order_status import OrderStatus, can_transition
from app.models.dispute import Dispute
from app.models.order import Order


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
                # UC-A2: gửi sản phẩm thay thế -> đưa về giai đoạn chuẩn bị
                order.status = OrderStatus.preparing.value
    await session.flush()
    return dispute
