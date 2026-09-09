import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel

from app.schemas.common import ORMModel


class PaymentRead(ORMModel):
    id: uuid.UUID
    ref_type: str
    ref_id: uuid.UUID | None = None
    tour_booking_id: uuid.UUID | None = None
    provider: str
    amount: int
    status: str
    transaction_ref: str | None = None
    gateway_response: str | None = None
    paid_at: datetime | None = None
    created_at: datetime


class PaymentQrIn(BaseModel):
    ref_type: Literal["order", "tour"]
    ref_id: uuid.UUID


class PaymentQrOut(BaseModel):
    qr_url: str | None = None
    code: str
    amount: int
    payment_id: uuid.UUID | None = None
    status: str = "pending"


class SePayTransaction(BaseModel):
    """Payload webhook SePay (1 giao dịch / request).

    Docs: https://docs.sepay.vn/tich-hop-webhooks.html#du-lieu
    """

    id: int | None = None
    gateway: str | None = None
    transactionDate: str | None = None
    accountNumber: str | None = None
    subAccount: str | None = None
    code: str | None = None
    content: str | None = None
    transferType: str | None = None
    description: str | None = None
    transferAmount: int | float | None = None
    accumulated: int | float | None = None
    referenceCode: str | None = None