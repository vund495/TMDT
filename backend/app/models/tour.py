import uuid
from datetime import date, datetime, time

from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric, String, Time, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.enums.tour_status import TourBookingStatus


class TourSlot(Base):
    __tablename__ = "tour_slots"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    workshop_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workshops.id"))
    tour_date: Mapped[date] = mapped_column(Date)
    start_time: Mapped[time] = mapped_column(Time)
    capacity: Mapped[int] = mapped_column(Integer)
    slots_left: Mapped[int] = mapped_column(Integer)
    price_per_guest: Mapped[int] = mapped_column(Numeric(12, 0))


class TourBooking(Base):
    __tablename__ = "tour_bookings"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    slot_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tour_slots.id"))
    customer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    num_guests: Mapped[int] = mapped_column(Integer)
    total_amount: Mapped[int] = mapped_column(Numeric(12, 0))
    status: Mapped[str] = mapped_column(String(32), default=TourBookingStatus.pending_payment.value)
    voucher_issued: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
