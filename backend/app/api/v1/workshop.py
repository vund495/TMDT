from fastapi import APIRouter, Depends

from app.core.security import get_current_user

router = APIRouter(prefix="/workshop", tags=["Workshop"])


@router.get("/products")
async def my_products(current_user: dict = Depends(get_current_user)):
    """UC-10/11: danh sách sản phẩm của xưởng."""
    return {"owner": current_user["id"], "items": []}


@router.post("/products")
async def create_product(current_user: dict = Depends(get_current_user)):
    """UC-11: đăng sản phẩm mới (ảnh/video lên Supabase Storage)."""
    return {"created": True}


@router.get("/revenue")
async def revenue_report(current_user: dict = Depends(get_current_user)):
    """UC-14: báo cáo doanh thu xưởng."""
    return {"periods": []}
