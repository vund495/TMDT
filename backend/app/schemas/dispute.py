import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import ORMModel


class DisputeCreateIn(BaseModel):
    order_id: uuid.UUID
    reason: str
    evidence_urls: list[str] | None = None


class DisputeResolveIn(BaseModel):
    resolution: str
    admin_note: str | None = None


class DisputeRead(ORMModel):
    id: uuid.UUID
    order_id: uuid.UUID
    customer_id: uuid.UUID
    reason: str
    evidence_urls: list | None = None
    status: str
    resolution: str | None = None
    admin_note: str | None = None
    resolved_at: datetime | None = None
    created_at: datetime
