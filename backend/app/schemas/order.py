import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import ORMModel


class OrderItemIn(BaseModel):
    product_id: uuid.UUID
    quantity: int = 1


class OrderCreateIn(BaseModel):
    items: list[OrderItemIn]
    voucher_code: str | None = None
    receiver_name: str
    receiver_phone: str
    shipping_address: str
    anti_shock_packed: bool = False


class OrderItemRead(ORMModel):
    id: uuid.UUID
    product_id: uuid.UUID
    product_name: str
    unit_price: int
    quantity: int


class OrderRead(ORMModel):
    id: uuid.UUID
    code: str
    customer_id: uuid.UUID
    workshop_id: uuid.UUID
    status: str
    subtotal: int
    discount_amount: int
    shipping_fee: int
    total: int
    receiver_name: str
    receiver_phone: str
    shipping_address: str
    anti_shock_packed: bool
    created_at: datetime


class OrderDetail(OrderRead):
    items: list[OrderItemRead] = []


class OrderCreateOut(BaseModel):
    order: OrderRead
    qr_url: str | None = None
    payment_id: uuid.UUID | None = None


class ShipmentRead(ORMModel):
    id: uuid.UUID
    order_id: uuid.UUID
    carrier: str | None = None
    tracking_code: str | None = None
    status: str
    is_returned: bool
