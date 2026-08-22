import uuid
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    ref_type: Mapped[str] = mapped_column(String(32))
    ref_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("orders.id", use_alter=True))
    tour_booking_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("tour_bookings.id"))
    provider: Mapped[str] = mapped_column(String(32), default="vietqr")
    amount: Mapped[int] = mapped_column(BigInteger)
    status: Mapped[str] = mapped_column(String(32), default="pending")
    transaction_ref: Mapped[str | None] = mapped_column(String(255))
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
