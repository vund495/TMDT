import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.dependencies import get_current_user
from app.models.notification import Notification
from app.models.user import User
from app.schemas.common import ORMModel


class NotificationRead(ORMModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    message: str
    type: str
    related_entity_id: uuid.UUID | None = None
    related_entity_type: str | None = None
    is_read: bool
    created_at: datetime


router = APIRouter(prefix="/notifications", tags=["Notifications"])


NOTIFICATION_TYPES = ["order", "tour", "dispute", "system", "news"]


@router.get("", response_model=list[NotificationRead])
async def list_notifications(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Lấy danh sách thông báo của khách hàng."""
    uid = uuid.UUID(str(current_user["id"]))
    result = await session.execute(
        select(Notification).where(Notification.user_id == uid).order_by(Notification.created_at.desc())
    )
    return result.scalars().all()


@router.get("/news", response_model=list[NotificationRead])
async def list_news(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Lấy danh sách tin tức (news) của khách hàng."""
    uid = uuid.UUID(str(current_user["id"]))
    result = await session.execute(
        select(Notification).where(
            Notification.user_id == uid, Notification.type == "news"
        ).order_by(Notification.created_at.desc())
    )
    return result.scalars().all()


@router.post("/{notification_id}/read", response_model=NotificationRead)
async def mark_notification_read(
    notification_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Đánh dấu thông báo là đã đọc."""
    uid = uuid.UUID(str(current_user["id"]))
    notification = await session.get(Notification, notification_id)
    if notification is None or notification.user_id != uid:
        raise HTTPException(404, "Thông báo không tồn tại")
    notification.is_read = True
    await session.commit()
    await session.refresh(notification)
    return notification


def create_notification(
    session: AsyncSession,
    user_id: uuid.UUID,
    title: str,
    message: str,
    type: str,
    related_entity_id: uuid.UUID | None = None,
    related_entity_type: str | None = None,
) -> Notification:
    """Tạo thông báo mới."""
    if type not in NOTIFICATION_TYPES:
        raise ValueError(f"Loại thông báo không hợp lệ: {type}. Các loại hỗ trợ: {NOTIFICATION_TYPES}")
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=type,
        related_entity_id=related_entity_id,
        related_entity_type=related_entity_type,
    )
    session.add(notification)
    return notification