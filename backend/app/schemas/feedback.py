import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import ORMModel


class ContactMessageIn(BaseModel):
    name: str
    email: str
    subject: str | None = None
    message: str


class ContactMessageRead(ORMModel):
    id: uuid.UUID
    name: str
    email: str
    subject: str | None = None
    message: str
    status: str
    reply_note: str | None = None
    created_at: datetime
