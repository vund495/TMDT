import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    auth_id: str | None = None
    email: str
    full_name: str | None = None
    phone: str | None = None
    role: str
    created_at: datetime


class SyncProfileIn(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    role: str = "customer"


class RegisterIn(BaseModel):
    email: str
    password: str
    full_name: str | None = None
    phone: str | None = None
    role: str = "customer"


class LoginIn(BaseModel):
    email: str
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
