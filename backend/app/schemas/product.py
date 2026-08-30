import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import ORMModel


class ProductRead(ORMModel):
    id: uuid.UUID
    workshop_id: uuid.UUID
    name: str
    description: str | None = None
    theme: str | None = None
    material: str | None = None
    firing_technique: str | None = None
    glaze: str | None = None
    original_price: int
    sale_price: int | None = None
    stock: int
    sold_count: int
    images: list | None = None
    video_url: str | None = None
    status: str
    reject_reason: str | None = None
    created_at: datetime


class ProductDetail(ProductRead):
    workshop_name: str | None = None
    workshop_address: str | None = None


class ProductCreateIn(BaseModel):
    name: str
    description: str | None = None
    theme: str | None = None
    material: str | None = None
    firing_technique: str | None = None
    glaze: str | None = None
    original_price: int
    sale_price: int | None = None
    stock: int = 0
    images: list[str] | None = None
    video_url: str | None = None


class ProductUpdateIn(BaseModel):
    name: str | None = None
    description: str | None = None
    theme: str | None = None
    material: str | None = None
    firing_technique: str | None = None
    glaze: str | None = None
    original_price: int | None = None
    sale_price: int | None = None
    stock: int | None = None
    images: list[str] | None = None
    video_url: str | None = None


class ProductRejectIn(BaseModel):
    reason: str
