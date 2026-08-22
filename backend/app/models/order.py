import uuid
from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.enums.order_status import OrderStatus


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(32), unique=True)
    customer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    workshop_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workshops.id"))
    status: Mapped[str] = mapped_column(String(32), default=OrderStatus.pending_payment.value)
    subtotal: Mapped[int] = mapped_column(BigInteger)
    discount_amount: Mapped[int] = mapped_column(BigInteger, default=0)
    shipping_fee: Mapped[int] = mapped_column(BigInteger, default=0)
    total: Mapped[int] = mapped_column(BigInteger)
    receiver_name: Mapped[str] = mapped_column(String(255))
    receiver_phone: Mapped[str] = mapped_column(String(32))
    shipping_address: Mapped[str] = mapped_column(String(500))
    anti_shock_packed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orders.id"))
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id"))
    product_name: Mapped[str] = mapped_column(String(255))
    unit_price: Mapped[int] = mapped_column(BigInteger)
    quantity: Mapped[int] = mapped_column(Integer)


class Shipment(Base):
    __tablename__ = "shipments"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orders.id"), unique=True)
    carrier: Mapped[str | None] = mapped_column(String(64))
    tracking_code: Mapped[str | None] = mapped_column(String(64))
    status: Mapped[str] = mapped_column(String(32), default="packing")
    is_returned: Mapped[bool] = mapped_column(Boolean, default=False)
