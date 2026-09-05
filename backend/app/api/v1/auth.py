import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.security import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.schemas.user import LoginIn, RegisterIn, TokenOut, UserRead

router = APIRouter(prefix="/auth", tags=["Auth"])

ALLOWED_SIGNUP_ROLES = {"customer", "workshop_owner"}


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterIn, session: AsyncSession = Depends(get_session)):
    """UC-01: đăng ký tài khoản local — bcrypt + JWT HS256 do backend cấp."""
    if body.role not in ALLOWED_SIGNUP_ROLES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Vai trò không hợp lệ")
    if len(body.password) < 6:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Mật khẩu tối thiểu 6 ký tự")

    email = body.email.strip().lower()
    existing = await session.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Email đã được sử dụng")

    user = User(
        email=email,
        password_hash=hash_password(body.password),
        full_name=body.full_name,
        phone=body.phone,
        role=body.role,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)

    token = create_access_token(str(user.id), user.email, user.role)
    return TokenOut(access_token=token, user=UserRead.model_validate(user))


@router.post("/login", response_model=TokenOut)
async def login(body: LoginIn, session: AsyncSession = Depends(get_session)):
    """UC-02: đăng nhập — so khớp bcrypt trong bảng users, cấp JWT local."""
    email = body.email.strip().lower()
    result = await session.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None or not user.password_hash or not verify_password(
        body.password, user.password_hash
    ):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Email hoặc mật khẩu không đúng")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Tài khoản đã bị khóa. Liên hệ quản trị viên")

    token = create_access_token(str(user.id), user.email, user.role)
    return TokenOut(access_token=token, user=UserRead.model_validate(user))


@router.get("/me", response_model=UserRead)
async def me(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """UC-03: thông tin user hiện tại từ JWT (đọc DB để lấy dữ liệu mới nhất)."""
    try:
        uid = uuid.UUID(str(current_user["id"]))
    except ValueError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token không hợp lệ")
    user = await session.get(User, uid)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Không tìm thấy người dùng")
    return user
