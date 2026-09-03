import uuid
from datetime import date, datetime, time

from pydantic import BaseModel

from app.schemas.common import ORMModel


class TourSlotCreateIn(BaseModel):
    workshop_id: uuid.UUID
    tour_date: date
    start_time: time
    capacity: int
    price_per_guest: int


class TourSlotRead(ORMModel):
    id: uuid.UUID
    workshop_id: uuid.UUID
    tour_date: date
    start_time: time
    capacity: int
    slots_left: int
    price_per_guest: int


class TourBookingCreateIn(BaseModel):
    slot_id: uuid.UUID
    num_guests: int = 1


class TourBookingRead(ORMModel):
    id: uuid.UUID
    slot_id: uuid.UUID
    customer_id: uuid.UUID
    num_guests: int
    total_amount: int
    status: str
    voucher_issued: bool
    created_at: datetime


class TourBookingCreateOut(BaseModel):
    booking: TourBookingRead
    qr_url: str | None = None
    payment_id: uuid.UUID | None = None
