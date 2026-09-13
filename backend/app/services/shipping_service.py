"""Phí vận chuyển theo quy tắc nghiệp vụ:

1. Miễn phí khi khách TỰ ĐẾN LẤY hoặc tổng tiền đơn >= 500.000đ.
2. Giao nội vùng (Hà Nội / TP.Hồ Chí Minh): 15.000đ.
3. Các tỉnh còn lại (liên miền/ngoại tỉnh): 35.000đ.
"""

FEE_PICKUP = 0
FEE_INTRA = 15_000
FEE_CROSS = 35_000
FREE_SHIPPING_THRESHOLD = 500_000

INTRA_PROVINCES_RAW = {"Hà Nội", "TP.Hồ Chí Minh", "TP. Hồ Chí Minh"}
INTRA_PROVINCE_ALIASES = {
    "hà nội": "Hà Nội",
    "hanoi": "Hà Nội",
    "ha noi": "Hà Nội",
    "hồ chí minh": "TP.Hồ Chí Minh",
    "tphồchíminh": "TP.Hồ Chí Minh",
    "tp.hồchíminh": "TP.Hồ Chí Minh",
    "tp.hồ chí minh": "TP.Hồ Chí Minh",
    "hồchíminhcity": "TP.Hồ Chí Minh",
    "hcm": "TP.Hồ Chí Minh",
    "hcmc": "TP.Hồ Chí Minh",
    "tphcm": "TP.Hồ Chí Minh",
    "tp.hcm": "TP.Hồ Chí Minh",
    "tp hcm": "TP.Hồ Chí Minh",
    "ho chi minh": "TP.Hồ Chí Minh",
    "hochiminh": "TP.Hồ Chí Minh",
    "ho chi minh city": "TP.Hồ Chí Minh",
    "hochiminhcity": "TP.Hồ Chí Minh",
}


def _normalize(text: str) -> str:
    return "".join(text.strip().lower().split())


def normalize_province(province: str | None) -> str | None:
    """Đưa chuỗi tỉnh về dạng chuẩn để so khớp (chống trôi dữ liệu người gõ)."""
    if not province or not province.strip():
        return None
    raw = province.strip()
    for alias, canonical in INTRA_PROVINCE_ALIASES.items():
        if _normalize(raw) == _normalize(alias):
            return canonical
    return raw


def is_intra(province: str | None) -> bool:
    """True nếu tỉnh thuộc khu vực tính phí nội vùng."""
    norm = normalize_province(province)
    return norm in INTRA_PROVINCES_RAW


def compute_shipping(method: str, province: str | None, subtotal: int) -> int:
    """Tính phí vận chuyển theo 3 quy tắc.

    method: "pickup" (tự đến lấy) | "delivery" (giao tận nơi).
    """
    if method == "pickup":
        return FEE_PICKUP
    if method == "delivery" and subtotal >= FREE_SHIPPING_THRESHOLD:
        return FEE_PICKUP
    if is_intra(province):
        return FEE_INTRA
    return FEE_CROSS