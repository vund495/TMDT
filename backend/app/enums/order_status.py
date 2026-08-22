from enum import Enum


class OrderStatus(str, Enum):
    pending_payment = "pending_payment"
    preparing = "preparing"
    shipping = "shipping"
    completed = "completed"
    disputing = "disputing"
    returned = "returned"


VALID_TRANSITIONS: dict[OrderStatus, set[OrderStatus]] = {
    OrderStatus.pending_payment: {OrderStatus.preparing, OrderStatus.returned},
    OrderStatus.preparing: {OrderStatus.shipping, OrderStatus.disputing},
    OrderStatus.shipping: {OrderStatus.completed, OrderStatus.disputing, OrderStatus.returned},
    OrderStatus.completed: {OrderStatus.disputing},
    OrderStatus.disputing: {OrderStatus.completed, OrderStatus.returned},
    OrderStatus.returned: set(),
}


def can_transition(current: OrderStatus, target: OrderStatus) -> bool:
    return target in VALID_TRANSITIONS[current]
