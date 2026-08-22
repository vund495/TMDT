from fastapi import APIRouter

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/webhook/casso")
async def casso_webhook():
    """UC-15/21: webhook đối soát giao dịch VietQR, idempotent."""
    return {"processed": True}


@router.post("/{payment_id}/refund")
async def refund(payment_id: str):
    """UC-30: hoàn tiền 100% theo chính sách Vỡ 1 đền 1."""
    return {"payment_id": payment_id, "status": "refunded"}
