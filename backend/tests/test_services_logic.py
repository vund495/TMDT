import uuid
from datetime import date
from types import SimpleNamespace
from unittest.mock import patch

from app.enums.order_status import OrderStatus, can_transition
from app.enums.tour_status import VALID_TRANSITIONS as TOUR_TRANSITIONS
from app.enums.tour_status import TourBookingStatus
from app.services.order_service import generate_order_code
from app.services.payment_service import _crc16, _minh_money_uri, _tlv


def test_order_code_format():
    code = generate_order_code()
    assert code.startswith("TT-")
    assert len(code) == 11  # TT- + 8 chars


def test_order_state_transitions_valid():
    assert can_transition(OrderStatus.pending_payment, OrderStatus.preparing)
    assert can_transition(OrderStatus.preparing, OrderStatus.shipping)
    assert can_transition(OrderStatus.shipping, OrderStatus.completed)
    assert can_transition(OrderStatus.completed, OrderStatus.disputing)


def test_order_state_transitions_invalid():
    # Không thể quay ngược
    assert not can_transition(OrderStatus.completed, OrderStatus.pending_payment)
    assert not can_transition(OrderStatus.shipping, OrderStatus.pending_payment)
    # Terminal state
    assert not can_transition(OrderStatus.returned, OrderStatus.completed)


def test_tour_booking_state_transitions():
    assert TourBookingStatus.confirmed in TOUR_TRANSITIONS[TourBookingStatus.pending_payment]
    assert TourBookingStatus.attended in TOUR_TRANSITIONS[TourBookingStatus.confirmed]
    assert TourBookingStatus.attended not in TOUR_TRANSITIONS[TourBookingStatus.pending_payment]


def test_tlv_format():
    assert _tlv("54", "100000") == "5406100000"


def test_crc16_deterministic():
    assert _crc16("000201") == _crc16("000201")


def test_vietqr_payload_generated_with_config():
    fake_settings = SimpleNamespace(
        bank_bin="970422", account_no="9876543210", account_name="TMDT BAT TRANG"
    )
    with patch("app.services.payment_service.get_settings", return_value=fake_settings):
        payload = _minh_money_uri(200000, "TT-ABC12345")
    assert payload is not None
    assert payload.startswith("000201010212")
    # CRC tag nằm ngay trước 4 số CRC
    assert payload[-8:-4] == "6304"
    # CRC đúng
    assert payload[-4:] == _crc16(payload[:-4])
    # Số tiền xuất hiện (54 + length + 200000)
    assert "200000" in payload


def test_vietqr_payload_returns_none_without_config():
    fake_settings = SimpleNamespace(bank_bin="", account_no="", account_name="")
    with patch("app.services.payment_service.get_settings", return_value=fake_settings):
        assert _minh_money_uri(200000, "TT-ABC12345") is None
