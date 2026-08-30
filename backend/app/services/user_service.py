from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


async def get_or_create_by_auth_id(
    session: AsyncSession,
    auth_id: str,
    email: str,
    full_name: str | None = None,
    phone: str | None = None,
    role: str = "customer",
) -> User:
    result = await session.execute(select(User).where(User.auth_id == auth_id))
    user = result.scalar_one_or_none()
    if user is not None:
        if (full_name and not user.full_name) or (phone and not user.phone):
            user.full_name = user.full_name or full_name
            user.phone = user.phone or phone
            await session.commit()
            await session.refresh(user)
        return user
    user = User(
        auth_id=auth_id,
        email=email,
        full_name=full_name,
        phone=phone,
        role=role,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user
