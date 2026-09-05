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
from app.schemas.payment import CassoTransaction, PaymentRead
from app.services import payment_service

router = APIRouter(prefix="/payments", tags=["Payments"])


class VnpayCreateIn(BaseModel):
    payment_id: uuid.UUID


class VnpayCreateOut(BaseModel):
    pay_url: str
    txn_ref: str


def extract_order_code(description: str) -> str | None:
    match = re.search(r"TT-[A-Z0-9]{6,12}", description or "")
    return match.group(0) if match else None


def _verify_casso_signature(
    raw_body: bytes,
    headers: dict,
) -> bool:
    """Xác thực chữ ký webhook Casso (HMAC-SHA256, header X-Webhook-Signature).

    Nếu chưa cấu hình CASSO_WEBHOOK_SECRET trong .env thì trả True
    (chế độ dev/mock), ghi chú cho quản trị biết.
    """
    secret = get_settings().casso_webhook_secret
    if not secret:
        return True  # dev/mock: chưa cấu hình, chấp nhận

    import hashlib
    import hmac

    signature = headers.get("x-webhook-signature") or headers.get("validation")
    if not signature:
        return False
    expected = hmac.new(
        secret.encode(), raw_body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


@router.post("/webhook/casso")
async def casso_webhook(
    body: CassoTransaction,
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    """UC-15/21: webhook đối soát giao dịch VietQR, idempotent.

    Xác thực chữ ký HMAC-SHA256 theo CASSO_WEBHOOK_SECRET (nếu đã cấu hình).
    """
    raw_body = await request.body()
    if not _verify_casso_signature(raw_body, dict(request.headers)):
        raise HTTPException(401, "Chữ ký webhook không hợp lệ")

    if body.data is None:
        return {"processed": True, "matched": 0}

    matched = 0
    for tx in body.data:
        code = extract_order_code(tx.description or "")
        if not code:
            continue
        payment = await payment_service.find_payment_by_ref(session, code)
        if payment is None or int(payment.amount) != int(tx.amount):
            continue
        updated = await payment_service.record_payment(
            session, payment.id, str(tx.id)
        )
        if updated:
            matched += 1
    await session.commit()
    return {"processed": True, "matched": matched}


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
