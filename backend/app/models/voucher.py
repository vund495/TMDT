import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Voucher(Base):
    __tablename__ = "vouchers"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(64), unique=True)
    workshop_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("workshops.id"))
    discount_percent: Mapped[int] = mapped_column(Integer)
    max_discount_amount: Mapped[int | None] = mapped_column(Integer)
    valid_from: Mapped[date] = mapped_column(Date)
    valid_until: Mapped[date] = mapped_column(Date)
    usage_limit: Mapped[int | None] = mapped_column(Integer)
    used_count: Mapped[int] = mapped_column(Integer, default=0)
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class RevenueRecord(Base):
    __tablename__ = "revenue_records"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    period: Mapped[str] = mapped_column(String(7))
    workshop_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("workshops.id"))
    gross_amount: Mapped[int] = mapped_column(default=0)
    commission_amount: Mapped[int] = mapped_column(default=0)
    payout_amount: Mapped[int] = mapped_column(default=0)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
