from fastapi import APIRouter

router = APIRouter(prefix="/promotions", tags=["Promotions"])


@router.get("/vouchers/{code}")
async def validate_voucher(code: str):
    """UC-27/28: kiểm tra voucher hợp lệ khi checkout."""
    return {"code": code, "valid": False, "discount_percent": 0}
