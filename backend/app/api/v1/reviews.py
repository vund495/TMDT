from fastapi import APIRouter

router = APIRouter(tags=["Reviews"])


@router.get("/products/{product_id}/reviews")
async def list_reviews(product_id: str):
    """UC-40: đánh giá sao + bình luận của sản phẩm."""
    return {"product_id": product_id, "reviews": [], "comments": []}


@router.post("/products/{product_id}/reviews")
async def create_review(product_id: str):
    """UC-40: tạo đánh giá (verified purchase) hoặc bình luận."""
    return {"product_id": product_id, "created": True}
