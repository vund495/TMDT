"""UC-15/21/30: sinh QR VietQR, đối soát webhook, hoàn tiền."""
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.enums.order_status import OrderStatus
from app.enums.tour_status import TourBookingStatus
from app.models.order import Order, OrderItem
from app.models.payment import Payment
from app.models.product_passport import ProductPassport
from app.models.tour import TourBooking
from app.models.voucher import RevenueRecord

try:
    import qrcode
    from io import BytesIO
    import base64
    _HAS_QR = True
except Exception:  # pragma: no cover
    _HAS_QR = False


def _minh_money_uri(amount: int, code: str) -> str:
    """VietQR EMVCo payload tĩnh (không dùng API, chỉ cần config ngân hàng)."""
    settings = get_settings()
    if not (settings.bank_bin and settings.account_no and settings.account_name):
        return None
    if not (settings.account_no.isdigit()):
        return None
    payload_detail = (
        "000201"
        "010212"
        # Merchant Account Information (EMVCo) - dùng biến thể QRIBFTTA
        + "26" + "00" + _tlv("00", "QRIBFTTA") + _tlv("01", settings.account_no)
        + "52045802"
        + "5303704"
        + _tlv("54", str(amount))
        + "5802VN"
        + _tlv("59", settings.account_name)
        + _tlv("60", "HANOI")
        + "62" + _len(_tlv("08", "vietqr") + _tlv("01", "QRPUSH") + _tlv("03", code[:8]))
        + "6304"
    )
    return payload_detail + _crc16(payload_detail)


def _tlv(tag: str, value: str) -> str:
    return f"{tag}{len(value):02d}{value}"


def _len(value: str) -> str:
    return f"{len(value):02d}{value}"


def _crc16(data: str) -> str:
    crc = 0xFFFF
    for ch in data:
        crc ^= ord(ch) << 8
        for _ in range(8):
            if crc & 0x8000:
                crc = (crc << 1) ^ 0x1021
            else:
                crc <<= 1
            crc &= 0xFFFF
    return f"{crc:04X}"


def _png_data_uri(content: str) -> str | None:
    if not _HAS_QR:
        return None
    try:
        img = qrcode.make(content)
        buf = BytesIO()
        img.save(buf, format="PNG")
        return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()
    except Exception:
        return None


async def create_order_payment(session: AsyncSession, order: Order) -> Payment:
    payment = Payment(
        ref_type="order",
        ref_id=order.id,
        provider="vietqr",
        amount=order.total,
        status="pending",
    )
    session.add(payment)
    await session.flush()
    return payment


async def qr_url_for_ref(code: str, amount: int) -> str | None:
    payload = _minh_money_uri(amount, code)
    if not payload:
        return None
    data_uri = _png_data_uri(payload)
    return data_uri


async def create_tour_payment(
    session: AsyncSession, booking: TourBooking
) -> Payment:
    payment = Payment(
        ref_type="tour",
        tour_booking_id=booking.id,
        provider="vietqr",
        amount=int(booking.total_amount),
        status="pending",
    )
    session.add(payment)
    await session.flush()
    return payment


async def record_payment(
    session: AsyncSession,
    payment_id: uuid.UUID,
    transaction_ref: str,
) -> bool:
    """Idempotent: đánh dấu payment đã thanh toán, unlock passport, chốt doanh thu."""
    payment = await session.get(Payment, payment_id)
    if payment is None:
        return False
    if payment.status == "paid":
        return True  # idempotent
    payment.status = "paid"
    payment.transaction_ref = transaction_ref
    payment.paid_at = _now()
    await _on_paid(session, payment)
    return True


def _now():
    from datetime import datetime, timezone

    return datetime.now(timezone.utc)


async def _on_paid(session: AsyncSession, payment: Payment) -> None:
    if payment.ref_type == "order" and payment.ref_id:
        order = await session.get(Order, payment.ref_id)
        if order and order.status == OrderStatus.pending_payment.value:
            order.status = OrderStatus.preparing.value
            await _record_revenue(session, order, payment.amount)
        await _unlock_passports(session, payment.ref_id)
    elif payment.ref_type == "tour" and payment.tour_booking_id:
        booking = await session.get(TourBooking, payment.tour_booking_id)
        if booking and booking.status == "pending_payment":
            booking.status = "confirmed"


async def _unlock_passports(session: AsyncSession, order_id: uuid.UUID) -> None:
    result = await session.execute(
        select(ProductPassport)
        .join(OrderItem, OrderItem.product_id == ProductPassport.product_id)
        .where(OrderItem.order_id == order_id)
    )
    for pp in result.scalars().all():
        pp.unlocked = True
        pp.unlocked_by_order_id = order_id


async def _record_revenue(session: AsyncSession, order: Order, amount: int) -> None:
    period = order.created_at.strftime("%Y-%m")
    commission = int(amount * 0.10)
    record = RevenueRecord(
        period=period,
        workshop_id=order.workshop_id,
        gross_amount=amount,
        commission_amount=commission,
        payout_amount=amount - commission,
    )
    session.add(record)


async def refund_order(session: AsyncSession, order: Order) -> Payment:
    """UC-30: hoàn tiền 100%. Chỉ cho đơn ở trạng thái returned, idempotent."""
    if order.status != OrderStatus.returned.value:
        raise ValueError("Chỉ hoàn tiền cho đơn ở trạng thái đã hoàn trả (returned)")

    # Idempotent: nếu đã có refund cho đơn này thì trả về bản cũ, không tạo mới
    existing_result = await session.execute(
        select(Payment).where(
            Payment.ref_type == "refund",
            Payment.ref_id == order.id,
            Payment.status == "refunded",
        )
    )
    existing = existing_result.scalars().first()
    if existing is not None:
        return existing

    refund = Payment(
        ref_type="refund",
        ref_id=order.id,
        provider="manual",
        amount=order.total,
        status="refunded",
        paid_at=_now(),
    )
    session.add(refund)
    await session.flush()
    return refund


async def refund_tour(
    session: AsyncSession, booking: TourBooking
) -> Payment | None:
    """UC-25: hủy tour -> hoàn tiền vé nếu đã thanh toán (confirmed)."""
    if booking.status == TourBookingStatus.pending_payment.value:
        return None
    existing_result = await session.execute(
        select(Payment).where(
            Payment.ref_type == "refund_tour",
            Payment.tour_booking_id == booking.id,
            Payment.status == "refunded",
        )
    )
    existing = existing_result.scalars().first()
    if existing is not None:
        return existing
    refund = Payment(
        ref_type="refund_tour",
        tour_booking_id=booking.id,
        provider="manual",
        amount=int(booking.total_amount),
        status="refunded",
        paid_at=_now(),
    )
    session.add(refund)
    await session.flush()
    return refund


async def find_payment_by_ref(session: AsyncSession, code: str) -> Payment | None:
    order_result = await session.execute(
        select(Order).where(Order.code == code)
    )
    order = order_result.scalar_one_or_none()
    if order is not None:
        pay_result = await session.execute(
            select(Payment).where(Payment.ref_type == "order", Payment.ref_id == order.id)
        )
        payment = pay_result.scalars().first()
        if payment is not None:
            return payment
    # UC-23/24: tour booking — QR dùng 8 ký tự đầu của booking id (in hoa)
    booking_result = await session.execute(
        select(TourBooking)
    )
    tour_code = code.upper()
    if tour_code.startswith("TT-"):
        tour_code = tour_code[3:]
    for booking in booking_result.scalars().all():
        if booking.id.hex[:8].upper() == tour_code:
            pay_result = await session.execute(
                select(Payment).where(
                    Payment.ref_type == "tour",
                    Payment.tour_booking_id == booking.id,
                )
            )
            return pay_result.scalars().first()
    return None
