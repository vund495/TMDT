from fastapi import APIRouter, Depends

from app.core.security import get_current_user

router = APIRouter(prefix="/disputes", tags=["Disputes"])


@router.post("")
async def create_dispute(current_user: dict = Depends(get_current_user)):
    """UC-29: tạo yêu cầu đền bù (Vỡ 1 đền 1), đính kèm bằng chứng."""
    return {"created": True, "status": "open"}
