import uuid

from sqlalchemy import Boolean, ForeignKey, String
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
