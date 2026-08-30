import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.security import get_current_user
from app.models.order import Order, OrderItem
from app.models.review import Comment, Review
from app.models.user import User
from app.schemas.review import CommentCreateIn, CommentRead, ReviewCreateIn, ReviewRead

router = APIRouter(tags=["Reviews"])


def _get_uid(current_user: dict) -> uuid.UUID:
    return uuid.UUID(str(current_user["id"]))


@router.get("/products/{product_id}/reviews", response_model=list[ReviewRead])
async def list_reviews(
    product_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
):
    """UC-40: đánh giá sao của sản phẩm."""
    result = await session.execute(
        select(Review).where(Review.product_id == product_id).order_by(Review.created_at.desc())
    )
    reviews = result.scalars().all()
    out = []
    for r in reviews:
        item = ReviewRead.model_validate(r)
        user = await session.get(User, r.user_id)
        item.user_name = user.full_name if user else None
        out.append(item)
    return out


@router.post("/products/{product_id}/reviews", response_model=ReviewRead, status_code=201)
async def create_review(
    product_id: uuid.UUID,
    body: ReviewCreateIn,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """UC-40: tạo đánh giá (bắt buộc đã mua - verified purchase)."""
    if body.rating < 1 or body.rating > 5:
        raise HTTPException(400, "Đánh giá từ 1 đến 5 sao")
    uid = _get_uid(current_user)

    # Kiểm tra người dùng đã mua sản phẩm này (đơn đã hoàn thành)
    order_result = await session.execute(
        select(Order)
        .join(OrderItem, OrderItem.order_id == Order.id)
        .where(
            Order.customer_id == uid,
            OrderItem.product_id == product_id,
            Order.status == "completed",
        )
    )
    completed_order = order_result.scalars().first()
    if completed_order is None:
        raise HTTPException(403, "Chỉ người đã mua sản phẩm mới được đánh giá")

    existing = await session.execute(
        select(Review).where(Review.product_id == product_id, Review.user_id == uid)
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(400, "Bạn đã đánh giá sản phẩm này rồi")

    review = Review(
        product_id=product_id,
        user_id=uid,
        order_id=completed_order.id,
        rating=body.rating,
        content=body.content,
    )
    session.add(review)
    await session.commit()
    await session.refresh(review)
    item = ReviewRead.model_validate(review)
    user = await session.get(User, uid)
    item.user_name = user.full_name if user else None
    return item


@router.get("/products/{product_id}/comments", response_model=list[CommentRead])
async def list_comments(
    product_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Comment).where(Comment.product_id == product_id).order_by(Comment.created_at.asc())
    )
    comments = result.scalars().all()
    out = []
    for c in comments:
        item = CommentRead.model_validate(c)
        user = await session.get(User, c.user_id)
        item.user_name = user.full_name if user else None
        out.append(item)
    return out


@router.post("/products/{product_id}/comments", response_model=CommentRead, status_code=201)
async def create_comment(
    product_id: uuid.UUID,
    body: CommentCreateIn,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    uid = _get_uid(current_user)
    comment = Comment(
        product_id=product_id,
        user_id=uid,
        parent_id=body.parent_id,
        content=body.content,
    )
    session.add(comment)
    await session.commit()
    await session.refresh(comment)
    item = CommentRead.model_validate(comment)
    user = await session.get(User, uid)
    item.user_name = user.full_name if user else None
    return item
