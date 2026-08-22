from fastapi import APIRouter, Depends

from app.core.security import get_current_user

router = APIRouter(prefix="/tours", tags=["O2O Tour"])


@router.get("/slots")
async def list_slots(workshop_id: str | None = None):
    """UC-22: lịch trống các xưởng."""
    return {"items": []}


@router.post("/bookings")
async def book_tour(current_user: dict = Depends(get_current_user)):
    """UC-23/24: đặt vé + trừ slot (SELECT ... FOR UPDATE)."""
    return {"booking_id": None, "status": "pending_payment"}


@router.get("/bookings")
async def my_bookings(current_user: dict = Depends(get_current_user)):
    """UC-26: vé đã đặt."""
    return {"items": []}
