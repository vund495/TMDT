import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import ORMModel


class WorkshopRead(ORMModel):
    id: uuid.UUID
    owner_id: uuid.UUID
    name: str
    description: str | None = None
    address: str | None = None
    lat: float | None = None
    lng: float | None = None
    logo_url: str | None = None
    status: str
    rating_avg: float
    created_at: datetime


class WorkshopCreateIn(BaseModel):
    name: str
    description: str | None = None
    address: str | None = None
    lat: float | None = None
    lng: float | None = None
    logo_url: str | None = None


class WorkshopUpdateIn(BaseModel):
    name: str | None = None
    description: str | None = None
    address: str | None = None
    lat: float | None = None
    lng: float | None = None
    logo_url: str | None = None


class WorkshopRevenuePeriod(ORMModel):
    period: str
    gross_amount: int
    commission_amount: int
    payout_amount: int
