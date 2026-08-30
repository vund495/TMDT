import uuid

from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.security import get_current_user
from app.models.user import User
from app.models.workshop import Workshop

ADMIN_ROLE = "admin"
WORKSHOP_OWNER_ROLE = "workshop_owner"
CUSTOMER_ROLE = "customer"


async def _load_user(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> User:
    try:
        uid = uuid.UUID(str(current_user["id"]))
    except (ValueError, TypeError):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token không hợp lệ")
    user = await session.get(User, uid)
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Người dùng không tồn tại")
    return user


def require_roles(*roles: str):
    async def dependency(user: User = Depends(_load_user)) -> User:
        if user.role not in roles:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN, "Bạn không có quyền thực hiện thao tác này"
            )
        return user

    return dependency


require_admin = require_roles(ADMIN_ROLE)
require_workshop_owner = require_roles(WORKSHOP_OWNER_ROLE)
require_customer = require_roles(CUSTOMER_ROLE)
require_any_authenticated = _load_user


async def get_owned_workshop(
    user: User = Depends(require_workshop_owner),
    session: AsyncSession = Depends(get_session),
) -> Workshop:
    result = await session.execute(
        select(Workshop).where(Workshop.owner_id == user.id, Workshop.status == "approved")
    )
    workshop = result.scalar_one_or_none()
    if workshop is None:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Xưởng của bạn chưa được duyệt hoặc chưa tạo xưởng",
        )
    return workshop
