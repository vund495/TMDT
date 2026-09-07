import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ProductPassport(Base):
    __tablename__ = "product_passports"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id"), unique=True)
    qr_code: Mapped[str | None] = mapped_column(String(500))
    video_url: Mapped[str | None] = mapped_column(String(500))
    unlocked: Mapped[bool] = mapped_column(Boolean, default=False)
    unlocked_by_order_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("orders.id"))


class ProductPassportView(Base):
    """UC-08: ví dụ per-user — ai từng thanh toán đơn có sản phẩm mới có view."""

    __tablename__ = "product_passport_views"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    passport_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("product_passports.id"))
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
