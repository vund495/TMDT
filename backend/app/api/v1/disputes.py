import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.dependencies import require_admin, require_customer
from app.core.security import get_current_user
from app.models.dispute import Dispute
from app.models.order import Order
from app.schemas.dispute import DisputeCreateIn, DisputeRead, DisputeResolveIn
from app.services import dispute_service, payment_service
from app.services.dispute_service import DisputeError

router = APIRouter(prefix="/disputes", tags=["Disputes"])


def _get_uid(current_user: dict) -> uuid.UUID:
    return uuid.UUID(str(current_user["id"]))


@router.post("", response_model=DisputeRead, status_code=201)
async def create_dispute(
    body: DisputeCreateIn,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """UC-29: tạo yêu cầu đền bù (Vỡ 1 đền 1), đính kèm bằng chứng."""
    try:
        dispute = await dispute_service.create_dispute(
            session, _get_uid(current_user), body.order_id, body.reason, body.evidence_urls
        )
    except DisputeError as e:
        raise HTTPException(e.code, e.message)
    await session.commit()
    await session.refresh(dispute)
    return dispute


@router.get("/mine", response_model=list[DisputeRead])
async def my_disputes(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    uid = _get_uid(current_user)
    result = await session.execute(
        select(Dispute).where(Dispute.customer_id == uid).order_by(Dispute.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{dispute_id}", response_model=DisputeRead)
async def get_dispute(
    dispute_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    uid = _get_uid(current_user)
    dispute = await session.get(Dispute, dispute_id)
    if dispute is None or dispute.customer_id != uid:
        raise HTTPException(404, "Không tìm thấy khiếu nại")
    return dispute


@router.post("/{dispute_id}/resolve", response_model=DisputeRead)
async def resolve_dispute(
    dispute_id: uuid.UUID,
    body: DisputeResolveIn,
    admin=Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    """UC-36: admin duyệt/hoàn tiền."""
    dispute = await session.get(Dispute, dispute_id)
    if dispute is None:
        raise HTTPException(404, "Không tìm thấy khiếu nại")
    try:
        dispute = await dispute_service.resolve_dispute(
            session, dispute, body.resolution, body.admin_note
        )
        if body.resolution == "approved":
            order = await session.get(Order, dispute.order_id)
            if order is not None:
                await payment_service.refund_order(session, order)
    except DisputeError as e:
        raise HTTPException(e.code, e.message)
    await session.commit()
    await session.refresh(dispute)
    return dispute
