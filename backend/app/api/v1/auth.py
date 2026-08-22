from fastapi import APIRouter, Depends

from app.core.security import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    """UC-02/03: thông tin user từ JWT Supabase."""
    return current_user
