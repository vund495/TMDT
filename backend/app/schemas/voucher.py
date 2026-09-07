from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel

from app.schemas.common import ORMModel


class VoucherValidateOut(BaseModel):
    code: str
    valid: bool
    discount_percent: int = 0
    max_discount_amount: int | None = None
    message: str = ""


class VoucherCreateIn(BaseModel):
    code: str
    workshop_id: str | None = None
    discount_percent: int
    max_discount_amount: int | None = None
    valid_from: date
    valid_until: date
    usage_limit: int | None = None


class VoucherUpdateIn(BaseModel):
    discount_percent: int | None = None
    max_discount_amount: int | None = None
    valid_from: date | None = None
    valid_until: date | None = None
    usage_limit: int | None = None
    active: bool | None = None


class VoucherRead(BaseModel):
    id: str
    code: str
    workshop_id: str | None = None
    discount_percent: int
    max_discount_amount: int | None = None
    valid_from: date
    valid_until: date
    usage_limit: int | None = None
    used_count: int
    active: bool


class RevenueRecordRead(ORMModel):
    id: UUID
    period: str
    workshop_id: UUID | None = None
    gross_amount: int
    commission_amount: int
    payout_amount: int
    payout_status: str = "pending"
    payout_date: datetime | None = None
    generated_at: datetime
