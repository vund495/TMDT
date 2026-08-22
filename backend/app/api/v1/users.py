from fastapi import APIRouter, Depends

from app.core.security import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    """UC-03: hồ sơ cá nhân/doanh nghiệp."""
    return {"user": current_user, "status": "placeholder"}
