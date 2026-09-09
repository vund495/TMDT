"""UC-15/21/30: sinh QR VietQR, đối soát webhook, hoàn tiền, VNPay."""
import hashlib
import hmac
import uuid
from datetime import datetime
from urllib.parse import quote_plus
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
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
    """VietQR EMVCo payload tĩnh (không dùng API, chỉ cần config ngân hàng).

    Chỉ áp dụng cho số tài khoản thuần số (như tài khoản thường/ví cái).
    Nếu số tài khoản là VA chứa chữ cái (vd BIDV VA "96247P8RAY") thì dùng
    đường QR qua gateway https://vietqr.app/app/img ở qr_url_for_ref().
    """
    settings = get_settings()
    if not (settings.bank_bin and settings.account_no and settings.account_name):
        return None
    if not (settings.account_no.isdigit()):
        return None
    payload_detail = (
        "000201"
        "010212"
        # Merchant Account Information (EMVCo) - dùng biến thể QRIBFTTA
        + "26" + _len(_tlv("00", "QRIBFTTA") + _tlv("01", settings.account_no))
        + "52045802"
        + "5303704"
        + _tlv("54", str(amount))
        + "5802VN"
        + _tlv("59", settings.account_name)
        + _tlv("60", "HANOI")
        + "62" + _len(_tlv("08", "vietqr") + _tlv("01", "QRPUSH") + _tlv("03", code))
        + "6304"
    )
    return payload_detail + _crc16(payload_detail)


def _vietqr_gateway_image_url(amount: int, code: str) -> str | None:
    """URL ảnh QR VietQR qua gateway vietqr.app/app/img.

    Hỗ trợ cả số tài khoản VA chứa chữ cái mà EMVCo tĩnh không nhúng được.
    Des: nội dung chuyển khoản = mã đơn/tour để SePay đối soát.
    """
    settings = get_settings()
    if not (settings.bank_bin and settings.account_no and settings.account_name):
        return None
    from urllib.parse import quote

    return (
        f"https://qr.sepay.vn/img?acc={quote(settings.account_no)}"
        f"&bank={settings.bank_bin}&name={quote(settings.account_name)}"
        f"&amount={amount}&des={quote(code)}"
    )


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
    # VA/Số tk có chữ cái -> dùng ảnh QR gateway VietQR (hỗ trợ cả alphanumeric).
    gateway = _vietqr_gateway_image_url(amount, code)
    if gateway:
        return gateway
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


# ---------------------------------------------------------------------------
# VNPay (thanh toán cổng): build URL, kiểm tra checksum, xử lý IPN
# ---------------------------------------------------------------------------
VNPAY_RSP_MESSAGES = {
    "00": "Confirm Success",
    "01": "Order not found",
    "02": "Order already confirmed",
    "04": "Order not found",
    "13": "Invalid amount",
    "97": "Invalid signature",
    "99": "Unknown error",
}


def vnp_secure_hash(params: dict) -> str:
    """Checksum VNPay: sort key, ghép key=value (urlencode kiểu PHP), HMAC-SHA512."""
    fields = [
        f"{k}={quote_plus(str(v), safe='')}"
        for k, v in sorted(params.items())
        if k not in ("vnp_SecureHash", "vnp_SecureHashType")
    ]
    data = "&".join(fields)
    secret = get_settings().vnpay_hash_secret
    return hmac.new(secret.encode(), data.encode(), hashlib.sha512).hexdigest()


def _vnp_query(params: dict) -> str:
    fields = [
        f"{k}={quote_plus(str(v), safe='')}"
        for k, v in sorted(params.items())
        if k not in ("vnp_SecureHash", "vnp_SecureHashType")
    ]
    return "&".join(fields)


def build_vnpay_url(payment: Payment) -> str:
    settings = get_settings()
    now = datetime.now(ZoneInfo("Asia/Ho_Chi_Minh"))
    params = {
        "vnp_Version": "2.1.0",
        "vnp_Command": "pay",
        "vnp_TmnCode": settings.vnpay_tmn_code,
        "vnp_Amount": str(int(payment.amount) * 100),
        "vnp_CreateDate": now.strftime("%Y%m%d%H%M%S"),
        "vnp_CurrCode": "VND",
        "vnp_IpAddr": "127.0.0.1",
        "vnp_Locale": "vn",
        "vnp_OrderInfo": f"Thanh toan don {payment.id.hex[:12]}",
        "vnp_OrderType": "other",
        "vnp_ReturnUrl": settings.vnpay_return_url,
        "vnp_TxnRef": payment.id.hex,
    }
    query = _vnp_query(params)
    return f"{settings.vnpay_url}?{query}&vnp_SecureHash={vnp_secure_hash(params)}"


async def process_vnpay_payment(session: AsyncSession, params: dict) -> str:
    """Xác thực + ghi nhận giao dịch VNPay (dùng chung cho return & IPN).

    Trả về RspCode (00 = OK). Caller tự commit.
    """
    if not params or vnp_secure_hash(params) != params.get("vnp_SecureHash", ""):
        return "97"
    try:
        payment_id = uuid.UUID(str(params.get("vnp_TxnRef", "")))
    except ValueError:
        return "01"
    payment = await session.get(Payment, payment_id)
    if payment is None:
        return "01"
    try:
        vnp_amount = int(params.get("vnp_Amount", 0))
    except ValueError:
        return "13"
    if vnp_amount != int(payment.amount) * 100:
        return "13"
    if payment.status == "paid":
        return "00"  # idempotent — đã xử lý trước đó
    if params.get("vnp_TransactionStatus") == "00" and params.get("vnp_ResponseCode") == "00":
        await record_payment(
            session,
            payment.id,
            str(params.get("vnp_TransactionNo", "") or ""),
        )
        return "00"
    return "99"


async def _on_paid(session: AsyncSession, payment: Payment) -> None:
    from app.api.v1.notifications import create_notification

    if payment.ref_type == "order" and payment.ref_id:
        order = await session.get(Order, payment.ref_id)
        if order and order.status == OrderStatus.pending_payment.value:
            order.status = OrderStatus.preparing.value
            await _record_revenue(session, order, payment.amount)
            create_notification(
                session,
                order.customer_id,
                f"Đơn hàng {order.code} đã thanh toán thành công",
                f"Xưởng gốm đang chuẩn bị đóng gói và bàn giao đơn hàng {order.code}. Cảm ơn bạn đã mua sắm tại VietCraft Bát Tràng!",
                "order",
                order.id,
                "order",
            )
        await _unlock_passports(session, order)
    elif payment.ref_type == "tour" and payment.tour_booking_id:
        booking = await session.get(TourBooking, payment.tour_booking_id)
        if booking and booking.status == "pending_payment":
            booking.status = "confirmed"
            create_notification(
                session,
                booking.customer_id,
                "Đặt tour trải nghiệm thành công",
                f"Bạn đã thanh toán xong tour #{str(booking.id)[:8].upper()}. Hãy đến đúng lịch của xưởng để tham gia nhé!",
                "tour",
                None,
                "tour_booking",
            )


async def _unlock_passports(session: AsyncSession, order: Order) -> None:
    """UC-08: mở khóa video nghệ nhân cho riêng khách đã mua (per-user)."""
    from app.models.product_passport import ProductPassport, ProductPassportView

    result = await session.execute(
        select(ProductPassport)
        .join(OrderItem, OrderItem.product_id == ProductPassport.product_id)
        .where(OrderItem.order_id == order.id)
    )
    for pp in result.scalars().all():
        pp.unlocked = True
        pp.unlocked_by_order_id = order.id
        exists = await session.execute(
            select(ProductPassportView).where(
                ProductPassportView.passport_id == pp.id,
                ProductPassportView.user_id == order.customer_id,
            )
        )
        if exists.scalar_one_or_none() is None:
            session.add(
                ProductPassportView(
                    passport_id=pp.id,
                    user_id=order.customer_id,
                )
            )


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
    """UC-30: hoàn tiền 100%. Chỉ cho đơn ở trạng thái returned, idempotent.

    Nếu đơn từng thanh toán qua VNPay thì gọi refund API thật của VNPay
    (sandbox). Trường hợp còn lại (VietQR/thủ công) vẫn ghi nội bộ và note.
    """
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

    gateway_note = None
    original_result = await session.execute(
        select(Payment).where(
            Payment.ref_type == "order",
            Payment.ref_id == order.id,
            Payment.status == "paid",
        )
    )
    original_payment = original_result.scalars().first()

    # Thử gọi VNPay refund API khi đơn được thanh toán qua VNPay
    if original_payment is not None and original_payment.provider == "vnpay":
        gateway_note = await _call_vnpay_refund(session, order, original_payment)

    refund = Payment(
        ref_type="refund",
        ref_id=order.id,
        provider="vnpay" if (original_payment and original_payment.provider == "vnpay") else "manual",
        amount=order.total,
        status="refunded",
        paid_at=_now(),
        gateway_response=gateway_note,
    )
    session.add(refund)
    await _restock_order(session, order)
    await session.flush()
    return refund


async def _call_vnpay_refund(
    session: AsyncSession, order: Order, original: Payment
) -> str | None:
    """Gọi API refund VNPay. Trả về ghi chú lưu vào payments.gateway_response."""
    import json
    from datetime import datetime

    import httpx

    from app.core.config import get_settings

    settings = get_settings()
    if not (settings.vnpay_tmn_code and settings.vnpay_hash_secret):
        return "VNPay chưa cấu hình - giữ nội bộ"
    if not original.transaction_ref or not original.paid_at:
        return "Thiếu giao dịch gốc (transaction_ref/paid_at) - giữ nội bộ"

    create_date = _now().strftime("%Y%m%d%H%M%S")
    transaction_date = original.paid_at.strftime("%Y%m%d%H%M%S")
    params = {
        "vnp_RequestId": str(uuid.uuid4()).replace("-", "")[:32],
        "vnp_Version": "2.1.0",
        "vnp_Command": "refund",
        "vnp_TmnCode": settings.vnpay_tmn_code,
        "vnp_TxnRef": original.transaction_ref or original.id.hex,
        "vnp_Amount": str(int(original.amount) * 100),
        "vnp_OrderInfo": f"Hoan tien don {order.code}",
        "vnp_TransactionNo": original.transaction_ref,
        "vnp_TransactionDate": transaction_date,
        "vnp_CreateBy": "admin",
        "vnp_CreateDate": create_date,
        "vnp_IpAddr": "127.0.0.1",
    }
    params["vnp_SecureHash"] = vnp_secure_hash(params)
    try:
        resp = await httpx.AsyncClient(timeout=15).post(
            settings.vnpay_refund_url, json=params
        )
        data = resp.json()
    except Exception as e:  # pragma: no cover - mạng lỗi
        return f"Lỗi gọi VNPay refund API: {type(e).__name__}"
    code = data.get("vnp_ResponseCode", "99")
    message = data.get("vnp_Message", "")
    if code != "00":
        return f"VNPay refund fail ({code}): {message}"
    return f"VNPay refund OK ({code}): {message}"


async def _restock_order(session: AsyncSession, order: Order) -> None:
    """Trả lại tồn kho cho các sản phẩm của đơn hoàn hàng."""
    from app.models.product import Product

    items_result = await session.execute(
        select(OrderItem).where(OrderItem.order_id == order.id)
    )
    for item in items_result.scalars().all():
        product = await session.get(Product, item.product_id)
        if product is not None:
            product.stock = (product.stock or 0) + item.quantity


async def refund_tour(
    session: AsyncSession, booking: TourBooking
) -> Payment | None:
    """UC-25: hủy tour -> hoàn tiền vé nếu đã thanh toán (có payment đã thu)."""
    # Chỉ hoàn nếu khách đã thực sự đóng tiền (payment tour đạt trạng thái paid),
    # tránh tạo refund "ma" cho vé chưa từng thanh toán.
    paid_result = await session.execute(
        select(Payment).where(
            Payment.ref_type == "tour",
            Payment.tour_booking_id == booking.id,
            Payment.status == "paid",
        )
    )
    if paid_result.scalars().first() is None:
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
    # Ngân hàng có thể bỏ dấu '-' trong nội dung (MRB/TTB ...), nên so khớp chuẩn hóa.
    norm = (code or "").upper().replace("-", "")
    # 1) Đơn hàng: Order.code dạng "TT-XXXXXXXX". Chuẩn hóa 2 vế trước khi so.
    order_result = await session.execute(
        select(Order).where(func.upper(func.replace(Order.code, "-", "")) == norm)
    )
    order = order_result.scalar_one_or_none()
    if order is not None:
        pay_result = await session.execute(
            select(Payment).where(Payment.ref_type == "order", Payment.ref_id == order.id)
        )
        payment = pay_result.scalars().first()
        if payment is not None:
            return payment
    # 2) UC-23/24: tour booking — QR dùng 8 ký tự đầu của booking id (in hoa),
    #    có thể kèm prefix TT- (Hoặc TTTour...). Bỏ prefix rồi so với 8-hex.
    tour_code = norm[2:] if norm.startswith("TT") else norm
    booking_result = await session.execute(
        select(TourBooking)
    )
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


async def reconcile_revenue(session: AsyncSession) -> dict:
    """Đối soát doanh thu: kiểm tra tính nhất quán giữa payments và revenue_records."""
    from app.models.voucher import RevenueRecord
    from sqlalchemy import func
    
    # Lấy tổng doanh thu từ revenue_records
    total_revenue_result = await session.execute(
        select(func.coalesce(func.sum(RevenueRecord.gross_amount), 0))
    )
    total_revenue = float(total_revenue_result.scalar_one_or_none() or 0)
    
    # Lấy tổng doanh thu từ orders (chú ý: chỉ các order ở trạng thái completed)
    total_orders_result = await session.execute(
        select(func.coalesce(func.sum(Order.total), 0)).select_from(Order).where(Order.status == "completed")
    )
    total_orders_revenue = float(total_orders_result.scalar_one_or_none() or 0)
    
    # Đếm số lượng revenue records
    revenue_count_result = await session.execute(
        select(func.count()).select_from(RevenueRecord)
    )
    revenue_count = revenue_count_result.scalar_one_or_none() or 0
    
    return {
        "total_revenue": total_revenue,
        "total_orders_revenue": total_orders_revenue,
        "revenue_records_count": revenue_count,
        "consistent": abs(total_revenue - total_orders_revenue) < 1000,  # cho phép sai số nhỏ
    }
