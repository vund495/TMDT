from fastapi import APIRouter

router = APIRouter(tags=["Marketplace"])


@router.get("/products")
async def list_products(
    q: str | None = None,
    theme: str | None = None,
    min_price: int | None = None,
    max_price: int | None = None,
    sort: str = "newest",
    page: int = 1,
    page_size: int = 20,
):
    """UC-05/06: tìm kiếm, lọc, sắp xếp sản phẩm."""
    return {"items": [], "q": q, "theme": theme, "min_price": min_price, "max_price": max_price, "sort": sort}


@router.get("/workshops")
async def list_workshops():
    """UC-09: danh sách gian hàng xưởng (kèm Google Maps)."""
    return {"items": []}
