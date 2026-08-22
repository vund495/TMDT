from fastapi import APIRouter

router = APIRouter(prefix="/feedback", tags=["Feedback"])


@router.post("/contact")
async def create_contact_message():
    """UC-41: nhận form liên hệ/góp ý."""
    return {"received": True, "status": "new"}
