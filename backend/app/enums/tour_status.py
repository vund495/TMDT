from enum import Enum


class TourBookingStatus(str, Enum):
    pending_payment = "pending_payment"
    confirmed = "confirmed"
    cancelled = "cancelled"
    attended = "attended"
    no_show = "no_show"


VALID_TRANSITIONS: dict[TourBookingStatus, set[TourBookingStatus]] = {
    TourBookingStatus.pending_payment: {TourBookingStatus.confirmed, TourBookingStatus.cancelled},
    TourBookingStatus.confirmed: {TourBookingStatus.attended, TourBookingStatus.cancelled, TourBookingStatus.no_show},
    TourBookingStatus.attended: set(),
    TourBookingStatus.cancelled: set(),
    TourBookingStatus.no_show: set(),
}
