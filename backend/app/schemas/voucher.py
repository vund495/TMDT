from datetime import date

from pydantic import BaseModel


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
