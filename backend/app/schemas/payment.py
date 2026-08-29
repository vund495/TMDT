import uuid
from datetime import datetime
from typing import Any

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
    paid_at: datetime | None = None
    created_at: datetime


class CassoDataItem(BaseModel):
    id: int
    tid: int | None = None
    description: str | None = None
    amount: int
    when: str | None = None
    bank_sub_acc_id: str | None = None
    subAccId: str | None = None
    bankAccountId: int | None = None


class CassoTransaction(BaseModel):
    error: int | None = None
    data: list[CassoDataItem] | None = None
