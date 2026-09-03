import uuid
import re
from datetime import datetime

from pydantic import BaseModel, field_validator

from app.schemas.common import ORMModel


YOUTUBE_REGEX = re.compile(
    r"^(https?\://)?(www\.)?(youtube\.com/watch\?v=|youtu\.be/)([\w-]{11})$"
)


def is_youtube_url(url: str | None) -> bool:
    if not url:
        return True
    return bool(YOUTUBE_REGEX.match(url))


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

    @field_validator("video_url")
    @classmethod
    def validate_youtube_url(cls, v: str | None) -> str | None:
        if v is not None and not is_youtube_url(v):
            raise ValueError("video_url phải là URL YouTube hợp lệ (youtube.com/watch?v=ID hoặc youtu.be/ID)")
        return v


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

    @field_validator("video_url")
    @classmethod
    def validate_youtube_url(cls, v: str | None) -> str | None:
        if v is not None and not is_youtube_url(v):
            raise ValueError("video_url phải là URL YouTube hợp lệ (youtube.com/watch?v=ID hoặc youtu.be/ID)")
        return v


class ProductRejectIn(BaseModel):
    reason: str
