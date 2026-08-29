from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.enums.order_status import OrderStatus
from app.models.order import Order, Shipment

router = APIRouter(prefix="/shipping", tags=["Shipping"])

CARRIER_EVENT_STATUS = {
    "picked_up": "shipping",
    "delivered": "completed",
    "returned": "returned",
}


@router.post("/webhook")
async def shipping_webhook(
    body: dict,
    session: AsyncSession = Depends(get_session),
):
    """UC-17/20: mock webhook GHTK/J&T cập nhật trạng thái giao hàng."""
    event = body.get("event") or body.get("status")
    tracking_code = body.get("tracking_code") or body.get("order_code")
    if not event or not tracking_code:
        raise HTTPException(400, "Thiếu event hoặc tracking_code")

    shipment_result = await session.execute(
        select(Shipment).where(Shipment.tracking_code == tracking_code)
    )
    shipment = shipment_result.scalar_one_or_none()

    if event == "created":
        order_code = body.get("order_code") or tracking_code
        order_result = await session.execute(select(Order).where(Order.code == order_code))
        order = order_result.scalar_one_or_none()
        if order is None:
            raise HTTPException(404, "Không tìm thấy đơn hàng")
        shipment = Shipment(
            order_id=order.id,
            carrier=body.get("carrier"),
            tracking_code=tracking_code,
            status="packing",
        )
        session.add(shipment)
    elif shipment is None:
        raise HTTPException(404, "Không tìm thấy shipment")

    # UC-S2: giao thất bại -> boom hàng sau 3 lần + ghi lịch sử xấu khách
    if event in ("attempt_failed", "failed"):
        if shipment is not None:
            shipment.failed_delivery_count = (shipment.failed_delivery_count or 0) + 1
            if shipment.failed_delivery_count >= 3:
                from app.models.user import User

                shipment.is_returned = True
                shipment.status = "returned"
                order = await session.get(Order, shipment.order_id)
                if order is not None:
                    order.status = OrderStatus.returned.value
                    customer = await session.get(User, order.customer_id)
                    if customer is not None:
                        customer.bad_order_count = (customer.bad_order_count or 0) + 1
        await session.commit()
        return {
            "received": True,
            "event": event,
            "tracking_code": tracking_code,
            "failed_delivery_count": shipment.failed_delivery_count if shipment else None,
            "returned": shipment.is_returned if shipment else False,
        }

    new_status = CARRIER_EVENT_STATUS.get(event)
    if new_status and shipment is not None:
        shipment.status = new_status
        order = await session.get(Order, shipment.order_id)
        if order is not None:
            order.status = new_status

    await session.commit()
    return {"received": True, "event": event, "tracking_code": tracking_code}
