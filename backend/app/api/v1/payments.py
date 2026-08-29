import re
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_session
from app.core.dependencies import require_admin
from app.models.order import Order
from app.models.payment import Payment
from app.schemas.payment import CassoTransaction, PaymentRead
from app.services import payment_service

router = APIRouter(prefix="/payments", tags=["Payments"])


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
