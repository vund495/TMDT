import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.security import get_current_user
from app.enums.order_status import OrderStatus
from app.models.order import Order, OrderItem, Shipment
from app.models.product import Product
from app.models.user import User
from app.schemas.order import (
    OrderCreateIn,
    OrderCreateOut,
    OrderDetail,
    OrderItemRead,
    OrderRead,
    ShipmentRead,
)
from app.services import order_service, payment_service
from app.services.order_service import OrderError

router = APIRouter(prefix="/orders", tags=["Orders"])


def _get_uid(current_user: dict) -> uuid.UUID:
    return uuid.UUID(str(current_user["id"]))


@router.post("", response_model=OrderCreateOut, status_code=201)
async def create_order(
    body: OrderCreateIn,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """UC-15: tạo đơn từ giỏ hàng, trừ kho, sinh QR VietQR."""
    uid = _get_uid(current_user)
    customer = await session.get(User, uid)
    if customer is None:
        raise HTTPException(401, "Người dùng không tồn tại")

    items = [{"product_id": i.product_id, "quantity": i.quantity} for i in body.items]
    receiver = {
        "name": body.receiver_name,
        "phone": body.receiver_phone,
        "address": body.shipping_address,
    }
    try:
        order = await order_service.build_order(
            session,
            customer,
            items,
            body.voucher_code,
            receiver,
            body.anti_shock_packed,
        )
        payment = await payment_service.create_order_payment(session, order)
    except OrderError as e:
        raise HTTPException(e.code, e.message)

    await order_service.clear_cart_for_order(
        session, uid, [i.product_id for i in body.items]
    )
    await session.commit()
    await session.refresh(order)

    qr_url = await payment_service.qr_url_for_ref(order.code, order.total)
    return OrderCreateOut(
        order=OrderRead.model_validate(order),
        qr_url=qr_url,
        payment_id=payment.id,
    )


@router.get("", response_model=list[OrderRead])
async def my_orders(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """UC-18: danh sách đơn của khách."""
    uid = _get_uid(current_user)
    result = await session.execute(
        select(Order)
        .where(Order.customer_id == uid)
        .order_by(Order.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{order_id}", response_model=OrderDetail)
async def order_detail(
    order_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """UC-17: chi tiết đơn + tracking."""
    uid = _get_uid(current_user)
    order = await session.get(Order, order_id)
    if order is None or order.customer_id != uid:
        raise HTTPException(404, "Không tìm thấy đơn hàng")
    items_result = await session.execute(
        select(OrderItem).where(OrderItem.order_id == order.id)
    )
    detail = OrderDetail.model_validate(order)
    detail.items = [OrderItemRead.model_validate(i) for i in items_result.scalars().all()]
    return detail


@router.post("/{order_id}/cancel", response_model=OrderRead)
async def cancel_order(
    order_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """UC: hủy đơn khi còn pending_payment — hoàn lại stock."""
    uid = _get_uid(current_user)
    order = await session.get(Order, order_id)
    if order is None or order.customer_id != uid:
        raise HTTPException(404, "Không tìm thấy đơn hàng")
    if order.status != OrderStatus.pending_payment.value:
        raise HTTPException(400, "Chỉ hủy được đơn chưa thanh toán")
    order.status = OrderStatus.returned.value

    items_result = await session.execute(
        select(OrderItem).where(OrderItem.order_id == order.id)
    )
    for item in items_result.scalars().all():
        product = await session.get(Product, item.product_id)
        if product:
            product.stock += item.quantity
    await session.commit()
    await session.refresh(order)
    return order


@router.get("/{order_id}/shipment", response_model=ShipmentRead | None)
async def shipment_of_order(
    order_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    uid = _get_uid(current_user)
    order = await session.get(Order, order_id)
    if order is None or order.customer_id != uid:
        raise HTTPException(404, "Không tìm thấy đơn hàng")
    result = await session.execute(select(Shipment).where(Shipment.order_id == order.id))
    shipment = result.scalar_one_or_none()
    return shipment


@router.post("/{order_id}/confirm-receipt", response_model=OrderRead)
async def confirm_receipt(
    order_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """UC-01/18: khách xác nhận đã nhận hàng nguyên vẹn -> đơn hoàn tất."""
    uid = _get_uid(current_user)
    order = await session.get(Order, order_id)
    if order is None or order.customer_id != uid:
        raise HTTPException(404, "Không tìm thấy đơn hàng")
    if order.status != OrderStatus.shipping.value:
        raise HTTPException(
            400, "Chỉ xác nhận nhận hàng khi đơn đang giao (shipping)"
        )
    order.status = OrderStatus.completed.value
    await session.commit()
    await session.refresh(order)
    return order
