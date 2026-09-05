import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.dependencies import get_owned_workshop
from app.core.security import get_current_user
from app.models.tour import TourBooking, TourSlot
from app.models.user import User
from app.models.workshop import Workshop
from app.schemas.tour import (
    TourBookingCreateIn,
    TourBookingCreateOut,
    TourBookingRead,
    TourSlotRead,
    TourSlotCreateIn,
)
from app.services import payment_service, tour_service
from app.services.tour_service import TourError

router = APIRouter(prefix="/tours", tags=["O2O Tour"])


def _get_uid(current_user: dict) -> uuid.UUID:
    return uuid.UUID(str(current_user["id"]))


@router.get("/slots", response_model=list[TourSlotRead])
async def list_slots(
    workshop_id: uuid.UUID | None = None,
    tour_date: date | None = None,
    session: AsyncSession = Depends(get_session),
):
    """UC-22: lịch trống các xưởng."""
    query = select(TourSlot).order_by(TourSlot.tour_date, TourSlot.start_time)
    if workshop_id:
        query = query.where(TourSlot.workshop_id == workshop_id)
    if tour_date:
        query = query.where(TourSlot.tour_date == tour_date)
    query = query.where(TourSlot.slots_left > 0)
    result = await session.execute(query)
    return result.scalars().all()


@router.post("/slots", response_model=list[TourSlotRead], status_code=201)
async def create_slots(
    body: TourSlotCreateIn,
    workshop: Workshop = Depends(get_owned_workshop),
    session: AsyncSession = Depends(get_session),
):
    """Workshop tạo suất tour trống."""
    if body.workshop_id != workshop.id:
        raise HTTPException(403, "Bạn không có quyền tạo slot cho xưởng này")
    slot = TourSlot(
        workshop_id=workshop.id,
        tour_date=body.tour_date,
        start_time=body.start_time,
        capacity=body.capacity,
        slots_left=body.capacity,
        price_per_guest=body.price_per_guest,
    )
    session.add(slot)
    await session.commit()
    await session.refresh(slot)
    return [slot]


@router.post("/bookings", response_model=TourBookingCreateOut, status_code=201)
async def book_tour(
    body: TourBookingCreateIn,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """UC-23/24: đặt vé + trừ slot (SELECT ... FOR UPDATE)."""
    uid = _get_uid(current_user)
    customer = await session.get(User, uid)
    if customer is None:
        raise HTTPException(401, "Người dùng không tồn tại")
    try:
        booking = await tour_service.book_slot(session, customer, body.slot_id, body.num_guests)
        payment = await payment_service.create_tour_payment(session, booking)
    except TourError as e:
        raise HTTPException(e.code, e.message)
    await session.commit()
    await session.refresh(booking)

    qr_url = await payment_service.qr_url_for_ref(booking.id.hex[:8].upper(), int(booking.total_amount))
    return TourBookingCreateOut(
        booking=TourBookingRead.model_validate(booking),
        qr_url=qr_url,
        payment_id=payment.id,
    )


@router.get("/bookings", response_model=list[TourBookingRead])
async def my_bookings(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """UC-26: vé đã đặt."""
    uid = _get_uid(current_user)
    result = await session.execute(
        select(TourBooking).where(TourBooking.customer_id == uid).order_by(TourBooking.created_at.desc())
    )
    return result.scalars().all()


@router.get("/workshops/{workshop_id}/bookings", response_model=list[TourBookingRead])
async def workshop_bookings(
    workshop_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    user = await session.get(User, _get_uid(current_user))
    if user is None or user.role != "workshop_owner":
        raise HTTPException(403, "Bạn không có quyền")
    workshop = await session.get(Workshop, workshop_id)
    if workshop is None or workshop.owner_id != user.id:
        raise HTTPException(403, "Không thuộc xưởng của bạn")

    slot_ids_result = await session.execute(
        select(TourSlot.id).where(TourSlot.workshop_id == workshop_id)
    )
    slot_ids = [r for r in slot_ids_result.scalars().all()]
    if not slot_ids:
        return []
    result = await session.execute(
        select(TourBooking).where(TourBooking.slot_id.in_(slot_ids))
    )
    return result.scalars().all()


@router.post("/bookings/{booking_id}/cancel", response_model=TourBookingRead)
async def cancel_booking(
    booking_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """UC-25: khách hủy vé, hoàn slot + hoàn tiền nếu đã thanh toán."""
    from app.enums.tour_status import TourBookingStatus

    booking = await session.get(TourBooking, booking_id)
    if booking is None or booking.customer_id != _get_uid(current_user):
        raise HTTPException(404, "Không tìm thấy vé")
    if booking.status in (TourBookingStatus.cancelled.value, TourBookingStatus.attended.value):
        raise HTTPException(400, "Vé này không thể hủy")
    try:
        await tour_service.cancel_booking(session, booking)
        await payment_service.refund_tour(session, booking)
    except TourError as e:
        raise HTTPException(e.code, e.message)
    await session.commit()
    await session.refresh(booking)
    return booking


@router.post("/bookings/{booking_id}/attend", response_model=dict)
async def mark_attended(
    booking_id: uuid.UUID,
    workshop: Workshop = Depends(get_owned_workshop),
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user),
):
    """UC-03: workshop xác nhận khách đã tham dự -> phát voucher cross-sell."""
    from datetime import timedelta

    from app.models.voucher import Voucher

    booking = await session.get(TourBooking, booking_id)
    if booking is None:
        raise HTTPException(404, "Không tìm thấy vé")
    slot = await session.get(TourSlot, booking.slot_id)
    if slot is None or slot.workshop_id != workshop.id:
        raise HTTPException(403, "Bạn không có quyền với suất tour này")
    try:
        await tour_service.attend_booking(session, booking)
    except TourError as e:
        raise HTTPException(e.code, e.message)
    if not booking.voucher_issued:
        code = f"TOUR-{booking.id.hex[:6].upper()}"
        today = date.today()
        session.add(
            Voucher(
                code=code,
                workshop_id=slot.workshop_id,
                discount_percent=10,
                max_discount_amount=50000,
                valid_from=today,
                valid_until=today + timedelta(days=30),
                active=True,
            )
        )
        booking.voucher_issued = True
    await session.commit()
    return {"status": booking.status, "voucher_issued": booking.voucher_issued}
