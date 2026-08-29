from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.dependencies import require_admin
from app.models.feedback import ContactMessage
from app.schemas.feedback import ContactMessageIn, ContactMessageRead

router = APIRouter(prefix="/feedback", tags=["Feedback"])


@router.post("/contact", response_model=ContactMessageRead, status_code=201)
async def create_contact_message(
    body: ContactMessageIn,
    session: AsyncSession = Depends(get_session),
):
    """UC-41: nhận form liên hệ/góp ý."""
    msg = ContactMessage(
        name=body.name,
        email=body.email,
        subject=body.subject,
        message=body.message,
        status="new",
    )
    session.add(msg)
    await session.commit()
    await session.refresh(msg)
    return msg


@router.get("/contact", response_model=list[ContactMessageRead])
async def list_contact_messages(
    admin=Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    from sqlalchemy import select

    result = await session.execute(
        select(ContactMessage).order_by(ContactMessage.created_at.desc())
    )
    return result.scalars().all()
