from fastapi import APIRouter, Depends

from app.core.security import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/workshops/pending")
async def pending_workshops(current_user: dict = Depends(get_current_user)):
    """UC-33: danh sách xưởng chờ duyệt."""
    return {"items": []}


@router.get("/stats")
async def platform_stats(current_user: dict = Depends(get_current_user)):
    """UC-38: thống kê doanh thu toàn sàn (từ REVENUE_RECORD)."""
    return {"total_revenue": 0, "orders_count": 0}
