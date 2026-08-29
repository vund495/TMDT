from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import get_settings

bearer_scheme = HTTPBearer(auto_error=False)


# ── Password hashing (bcrypt) ──────────────────────────────────────────


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


# ── JWT local ───────────────────────────────────────────────────────────


def create_access_token(user_id: str, email: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=12)
    return jwt.encode(
        {"sub": user_id, "email": email, "role": role, "exp": expire},
        get_settings().secret_key,
        algorithm="HS256",
    )


# ── JWT verification (local HS256) ────────────────────────────────────


def _decode_local(token: str) -> dict | None:
    secret = get_settings().secret_key
    if not secret or secret == "DEV_SECRET_CHANGE_ME_IN_PRODUCTION":
        return None
    try:
        return jwt.decode(token, secret, algorithms=["HS256"])
    except jwt.InvalidTokenError:
        return None


def decode_token(token: str) -> dict:
    payload = _decode_local(token)
    if payload:
        return payload
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token không hợp lệ",
    )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Chưa đăng nhập")
    payload = decode_token(credentials.credentials)
    app_meta = payload.get("app_metadata") or {}
    return {
        "id": payload.get("sub"),
        "email": payload.get("email"),
        "role": payload.get("role") or app_meta.get("role", "customer"),
    }
