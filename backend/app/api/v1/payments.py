import re
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse, RedirectResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_session
from app.core.dependencies import require_admin
from app.core.security import get_current_user
from app.models.order import Order
from app.models.payment import Payment
from app.models.tour import TourBooking
from app.schemas.payment import PaymentQrIn, PaymentQrOut, PaymentRead, SePayTransaction
from app.services import payment_service

router = APIRouter(prefix="/payments", tags=["Payments"])


class VnpayCreateIn(BaseModel):
    payment_id: uuid.UUID


class VnpayCreateOut(BaseModel):
    pay_url: str
    txn_ref: str


@router.post("/qr", response_model=PaymentQrOut)
async def get_payment_qr(
    body: PaymentQrIn,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Trả mã QR VietQR cho đơn/tour đang chờ thanh toán của chính khách."""
    uid = uuid.UUID(str(current_user["id"]))

    if body.ref_type == "order":
        order = await session.get(Order, body.ref_id)
        if order is None or order.customer_id != uid:
            raise HTTPException(404, "Không tìm thấy đơn hàng")
        code = order.code
        amount = int(order.total)
    else:
        booking = await session.get(TourBooking, body.ref_id)
        if booking is None or booking.customer_id != uid:
            raise HTTPException(404, "Không tìm thấy vé tour")
        code = booking.id.hex[:8].upper()
        amount = int(booking.total_amount)

    payment = await payment_service.find_payment_by_ref(session, code)
    if payment is None or payment.status == "paid":
        raise HTTPException(400, "Thanh toán đã hoàn tất hoặc không tồn tại")

    qr_url = await payment_service.qr_url_for_ref(code, amount)
    return PaymentQrOut(qr_url=qr_url, code=code, amount=amount, payment_id=payment.id)


def extract_order_code(text: str) -> str | None:
    """Trích mã đơn (TT-XXXXXXXX) hoặc mã tour (8 hex, booking id) từ nội dung CK.

    Ngân hàng có thể bỏ dấu '-' trong content (vd MRB bỏ dấu gạch trong
    "TT-OEVWLY0T" thành "TTOEVWLY0T"), nên cho phép TT có hoặc không dấu '-'.
    Ưu tiên pattern TT trước để tránh khớp nhầm dãy số dài trong content ngân hàng.
    """
    m = re.search(r"TT-?[A-Z0-9]{6,12}", text or "", re.IGNORECASE)
    if m:
        return m.group(0).upper()
    m = re.search(r"(?<![A-F0-9])[A-F0-9]{8}(?![A-F0-9])", text or "", re.IGNORECASE)
    return m.group(0).upper() if m else None


def _verify_sepay_auth(
    raw_body: bytes,
    headers: dict,
) -> bool:
    """Xác thực webhook SePay.

    Hỗ trợ 2 kiểu SePay gửi trong header:
    - API Key: `Authorization: Apikey <SEPAY_API_KEY>`
    - HMAC-SHA256: headers `X-SePay-Signature: sha256=<hex>` + `X-SePay-Timestamp`
      với chuỗi ký `{timestamp}.{raw_body}` theo SEPAy_WEBHOOK_SECRET.
    Nếu chưa cấu hình gì thì trả True (chế độ dev/mock).
    """
    import hashlib
    import hmac

    settings = get_settings()
    api_key = settings.sepay_api_key
    secret = settings.sepay_webhook_secret
    if not api_key and not secret:
        return True  # dev/mock: chưa cấu hình, chấp nhận

    if api_key:
        auth = headers.get("authorization") or headers.get("Authorization") or ""
        if not auth.startswith("Apikey "):
            return False
        provided = auth.removeprefix("Apikey ").strip()
        return hmac.compare_digest(provided, api_key)

    signature = headers.get("x-sepay-signature") or headers.get("X-SePay-Signature") or ""
    timestamp = headers.get("x-sepay-timestamp") or headers.get("X-SePay-Timestamp") or ""
    if not signature.startswith("sha256=") or not timestamp:
        return False
    expected = "sha256=" + hmac.new(
        secret.encode(), timestamp.encode() + b"." + raw_body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


@router.post("/webhook/sepay")
async def sepay_webhook(
    body: SePayTransaction,
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    """UC-15/21: webhook đối soát giao dịch VietQR, idempotent.

    Xác thực theo SEPAy_API_KEY/SEPAY_WEBHOOK_SECRET (nếu đã cấu hình).
    Chỉ xử lý giao dịch tiền vào (transferType = in), đối soát mã TT-.../mã tour
    theo field content/code. SePay retry tối đa 7 lần nên endpoint phải idempotent.
    """
    raw_body = await request.body()
    if not _verify_sepay_auth(raw_body, dict(request.headers)):
        raise HTTPException(401, "Chữ ký webhook không hợp lệ")

    if body.transferType and body.transferType.lower() != "in":
        return {"success": True, "processed": True, "matched": 0}

    code = extract_order_code(body.code) or extract_order_code(body.content)
    if not code:
        return {"success": True, "processed": True, "matched": 0}

    amount = int(body.transferAmount or 0)
    if amount <= 0:
        return {"success": True, "processed": True, "matched": 0}

    payment = await payment_service.find_payment_by_ref(session, code)
    if payment is None or int(payment.amount) != amount:
        return {"success": True, "processed": True, "matched": 0}

    updated = await payment_service.record_payment(
        session, payment.id, f"sepay:{body.id}"
    )
    await session.commit()
    return {"success": True, "processed": True, "matched": 1 if updated else 0}


@router.post("/status", response_model=PaymentQrOut)
async def get_payment_status(
    body: PaymentQrIn,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Trả trạng thái thanh toán hiện tại cho đơn/tour (để FE auto-refresh)."""
    uid = uuid.UUID(str(current_user["id"]))

    if body.ref_type == "order":
        order = await session.get(Order, body.ref_id)
        if order is None or order.customer_id != uid:
            raise HTTPException(404, "Không tìm thấy đơn hàng")
        code = order.code
        amount = int(order.total)
    else:
        booking = await session.get(TourBooking, body.ref_id)
        if booking is None or booking.customer_id != uid:
            raise HTTPException(404, "Không tìm thấy vé tour")
        code = booking.id.hex[:8].upper()
        amount = int(booking.total_amount)

    payment = await payment_service.find_payment_by_ref(session, code)
    status = payment.status if payment is not None else "missing"
    return PaymentQrOut(qr_url=None, code=code, amount=amount, payment_id=payment.id if payment else None, status=status)


@router.post("/vnpay/create", response_model=VnpayCreateOut)
async def create_vnpay_payment(
    body: VnpayCreateIn,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """UC-15/23: tạo URL thanh toán VNPay cho đơn hàng / tour."""
    settings = get_settings()
    if not (settings.vnpay_tmn_code and settings.vnpay_hash_secret):
        raise HTTPException(503, "VNPay chưa được cấu hình")

    payment = await session.get(Payment, body.payment_id)
    if payment is None:
        raise HTTPException(404, "Không tìm thấy khoản thanh toán")
    uid = uuid.UUID(str(current_user["id"]))

    owned = False
    target_code = str(payment.id)
    if payment.ref_type == "order" and payment.ref_id:
        order = await session.get(Order, payment.ref_id)
        if order is not None:
            owned = order.customer_id == uid
            target_code = order.code
    elif payment.ref_type == "tour" and payment.tour_booking_id:
        booking = await session.get(TourBooking, payment.tour_booking_id)
        if booking is not None:
            owned = booking.customer_id == uid
            target_code = f"TOUR-{booking.id.hex[:8].upper()}"
    if not owned:
        raise HTTPException(403, "Bạn không sở hữu khoản thanh toán này")
    if payment.status == "paid":
        raise HTTPException(400, f"Thanh toán {target_code} đã hoàn tất")

    pay_url = payment_service.build_vnpay_url(payment)
    return VnpayCreateOut(pay_url=pay_url, txn_ref=payment.id.hex)


@router.get("/vnpay/return", include_in_schema=False)
async def vnpay_return(
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    """VNPay redirect trình duyệt về đây sau khi xử lý thanh toán."""
    params = {k: v for k, v in request.query_params.items()}
    rsp = await payment_service.process_vnpay_payment(session, params)
    await session.commit()

    status = "success" if rsp == "00" else "failed"
    ref_param, type_param = "", "order"
    ref_id = uuid.UUID(str(params.get("vnp_TxnRef", ""))) if params.get("vnp_TxnRef") else None
    if ref_id:
        payment = await session.get(Payment, ref_id)
        if payment is not None and payment.ref_type == "tour":
            type_param = "tour"
            ref_param = str(payment.tour_booking_id)
        elif payment is not None and payment.ref_id:
            ref_param = str(payment.ref_id)

    redirect = (
        f"{get_settings().frontend_url}/vnpay/ket-qua"
        f"?vnp_status={status}&vnp_type={type_param}&vnp_ref={ref_param}"
        f"&vnp_rsp={params.get('vnp_ResponseCode', '')}"
    )
    return RedirectResponse(redirect)


@router.get("/vnpay/ipn", include_in_schema=False)
async def vnpay_ipn(
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    """IPN VNPay: xác nhận giao dịch từ cổng (không phụ thuộc trình duyệt)."""
    params = {k: v for k, v in request.query_params.items()}
    rsp = await payment_service.process_vnpay_payment(session, params)
    await session.commit()
    return JSONResponse(
        {"RspCode": rsp, "Message": payment_service.VNPAY_RSP_MESSAGES.get(rsp, "Unknown")},
        status_code=200,
    )


@router.post("/{payment_ref}/refund", response_model=PaymentRead)
async def refund(
    payment_ref: str,
    admin=Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    """UC-30: hoàn tiền theo chính sách Vỡ 1 đền 1 (chỉ admin).

    Đơn phải ở trạng thái returned. Luồng hợp lệ: admin duyệt khiếu nại
    -> đơn về returned -> bước này ghi nhận khoản hoàn tiền.
    """
    payment = await payment_service.find_payment_by_ref(session, payment_ref)
    if payment is None:
        raise HTTPException(404, "Không tìm thấy khoản thanh toán")
    order = await session.get(Order, payment.ref_id)
    if order is None:
        raise HTTPException(404, "Không tìm thấy đơn hàng")
    if order.status != "returned":
        raise HTTPException(
            409, "Chỉ hoàn tiền cho đơn ở trạng thái đã hoàn trả (returned)"
        )
    try:
        refund_payment = await payment_service.refund_order(session, order)
    except ValueError as e:
        raise HTTPException(409, str(e))
    await session.commit()
    await session.refresh(refund_payment)
    return refund_payment
