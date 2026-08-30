import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import ORMModel


class ReviewCreateIn(BaseModel):
    rating: int
    content: str | None = None


class CommentCreateIn(BaseModel):
    content: str
    parent_id: uuid.UUID | None = None


class ReviewRead(ORMModel):
    id: uuid.UUID
    product_id: uuid.UUID
    user_id: uuid.UUID
    order_id: uuid.UUID | None = None
    rating: int
    content: str | None = None
    created_at: datetime
    user_name: str | None = None


class CommentRead(ORMModel):
    id: uuid.UUID
    product_id: uuid.UUID
    user_id: uuid.UUID
    parent_id: uuid.UUID | None = None
    content: str
    created_at: datetime
    user_name: str | None = None
