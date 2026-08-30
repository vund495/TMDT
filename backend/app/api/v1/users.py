import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.user import SyncProfileIn, UserRead

router = APIRouter(prefix="/users", tags=["Users"])


def _get_uid(current_user: dict) -> uuid.UUID:
    return uuid.UUID(str(current_user["id"]))


@router.get("/profile", response_model=UserRead)
async def get_profile(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """UC-03: hồ sơ cá nhân."""
    user = await session.get(User, _get_uid(current_user))
    if user is None:
        raise HTTPException(404, "Không tìm thấy người dùng")
    return user


@router.patch("/profile", response_model=UserRead)
async def update_profile(
    body: SyncProfileIn,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """UC-03: cập nhật hồ sơ (không đổi role qua đây)."""
    user = await session.get(User, _get_uid(current_user))
    if user is None:
        raise HTTPException(404, "Không tìm thấy người dùng")
    if body.full_name is not None:
        user.full_name = body.full_name
    if body.phone is not None:
        user.phone = body.phone
    await session.commit()
    await session.refresh(user)
    return user
