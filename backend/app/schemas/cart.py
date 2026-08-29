import uuid

from pydantic import BaseModel

from app.schemas.common import ORMModel


class CartItemIn(BaseModel):
    product_id: uuid.UUID
    quantity: int = 1


class CartItemUpdateIn(BaseModel):
    quantity: int


class CartItemRead(ORMModel):
    id: uuid.UUID
    product_id: uuid.UUID
    quantity: int
    product_name: str | None = None
    product_image: str | None = None
    unit_price: int | None = None
    subtotal: int | None = None


class CartRead(BaseModel):
    items: list[CartItemRead]
    total: int
