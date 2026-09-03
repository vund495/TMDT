"""UC-23/24: đặt tour, khóa slot chống race condition."""
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.enums.tour_status import TourBookingStatus
from app.models.tour import TourBooking, TourSlot
from app.models.user import User


class TourError(Exception):
    def __init__(self, message: str, code: int = 400):
        super().__init__(message)
        self.message = message
        self.code = code


async def book_slot(
    session: AsyncSession,
    customer: User,
    slot_id: uuid.UUID,
    num_guests: int,
) -> TourBooking:
    # UC-03: đoàn 20-50 người, khách lẻ 1-6 người
    if num_guests < 1 or num_guests > 50:
        raise TourError("Số lượng khách phải từ 1 đến 50")
    if 7 <= num_guests <= 19:
        raise TourError("Nhóm 7-19 người không hỗ trợ; đặt theo đoàn (20-50) hoặc lẻ (1-6)")

    # Khóa dòng slot để chống race condition khi nhiều người đặt cùng lúc
    slot_result = await session.execute(
        select(TourSlot).where(TourSlot.id == slot_id).with_for_update()
    )
    slot = slot_result.scalar_one_or_none()
    if slot is None:
        raise TourError("Không tìm thấy suất tour", 404)
    if slot.slots_left < num_guests:
        raise TourError(
            f"Chỉ còn {slot.slots_left} chỗ trống, không đủ cho {num_guests} người"
        )

    price = int(slot.price_per_guest)
    total = price * num_guests

    booking = TourBooking(
        slot_id=slot.id,
        customer_id=customer.id,
        num_guests=num_guests,
        total_amount=total,
        status=TourBookingStatus.pending_payment.value,
    )
    slot.slots_left -= num_guests
    session.add(booking)
    await session.flush()
    return booking


async def confirm_booking(session: AsyncSession, booking: TourBooking) -> None:
    if booking.status != TourBookingStatus.pending_payment.value:
        return
    booking.status = TourBookingStatus.confirmed.value


async def issue_voucher(session: AsyncSession, booking: TourBooking) -> None:
    booking.voucher_issued = True


async def cancel_booking(session: AsyncSession, booking: TourBooking) -> None:
    """UC-25: hủy vé, hoàn lại slot về suất."""
    if booking.status not in (
        TourBookingStatus.pending_payment.value,
        TourBookingStatus.confirmed.value,
    ):
        raise TourError("Vé này không thể hủy")
    slot = await session.get(TourSlot, booking.slot_id)
    if slot is None:
        raise TourError("Không tìm thấy suất tour", 404)

    # UC-03: enforce cancellation deadline (24 hours before tour start)
    tour_datetime = datetime.combine(slot.tour_date, slot.start_time)
    now = datetime.now(timezone.utc)
    time_until_tour = tour_datetime - now

    if time_until_tour < timedelta(hours=24):
        raise TourError("Không thể hủy tour khi đã ít hơn 24 giờ tới giờ xuất phát")

    if slot is not None:
        slot.slots_left += booking.num_guests
    booking.status = TourBookingStatus.cancelled.value


async def attend_booking(session: AsyncSession, booking: TourBooking) -> None:
    """UC-03: xác nhận khách đã tham dự (workshop)."""
    if booking.status != TourBookingStatus.confirmed.value:
        raise TourError("Chỉ vé đã thanh toán mới xác nhận tham dự", 400)
    booking.status = TourBookingStatus.attended.value
