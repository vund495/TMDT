from datetime import date

import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.dependencies import require_admin
from app.models.voucher import Voucher
from app.schemas.voucher import (
    VoucherCreateIn,
    VoucherRead,
    VoucherUpdateIn,
    VoucherValidateOut,
)

router = APIRouter(prefix="/promotions", tags=["Promotions"])


def _to_read(v: Voucher) -> VoucherRead:
    return VoucherRead(
        id=str(v.id),
        code=v.code,
        workshop_id=str(v.workshop_id) if v.workshop_id else None,
        discount_percent=v.discount_percent,
        max_discount_amount=v.max_discount_amount,
        valid_from=v.valid_from,
        valid_until=v.valid_until,
        usage_limit=v.usage_limit,
        used_count=v.used_count,
        active=v.active,
    )


@router.get("/vouchers", response_model=list[VoucherRead])
async def list_vouchers(
    admin=Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    """UC: admin xem danh sách tất cả voucher."""
    result = await session.execute(select(Voucher).order_by(Voucher.code))
    return [_to_read(v) for v in result.scalars().all()]


@router.post("/vouchers", response_model=VoucherRead, status_code=201)
async def create_voucher(
    body: VoucherCreateIn,
    admin=Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    """UC-27/28: admin tạo voucher giảm giá."""
    if body.discount_percent <= 0 or body.discount_percent > 100:
        raise HTTPException(400, "Phần trăm giảm phải từ 1 đến 100")
    if body.valid_until < body.valid_from:
        raise HTTPException(400, "Ngày hết hạn phải sau ngày bắt đầu")
    existing = await session.execute(select(Voucher).where(Voucher.code == body.code))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(409, "Mã voucher đã tồn tại")
    voucher = Voucher(
        code=body.code,
        workshop_id=uuid.UUID(body.workshop_id) if body.workshop_id else None,
        discount_percent=body.discount_percent,
        max_discount_amount=body.max_discount_amount,
        valid_from=body.valid_from,
        valid_until=body.valid_until,
        usage_limit=body.usage_limit,
    )
    session.add(voucher)
    await session.commit()
    await session.refresh(voucher)
    return _to_read(voucher)


@router.patch("/vouchers/{code}", response_model=VoucherRead)
async def update_voucher(
    code: str,
    body: VoucherUpdateIn,
    admin=Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    """UC: admin sửa / vô hiệu hóa voucher."""
    result = await session.execute(select(Voucher).where(Voucher.code == code))
    voucher = result.scalar_one_or_none()
    if voucher is None:
        raise HTTPException(404, "Không tìm thấy voucher")
    data = body.model_dump(exclude_none=True)
    if "discount_percent" in data and (
        data["discount_percent"] <= 0 or data["discount_percent"] > 100
    ):
        raise HTTPException(400, "Phần trăm giảm phải từ 1 đến 100")
    for field, value in data.items():
        setattr(voucher, field, value)
    await session.commit()
    await session.refresh(voucher)
    return _to_read(voucher)


@router.delete("/vouchers/{code}", status_code=204)
async def delete_voucher(
    code: str,
    admin=Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    """UC: admin xóa voucher."""
    result = await session.execute(select(Voucher).where(Voucher.code == code))
    voucher = result.scalar_one_or_none()
    if voucher is None:
        raise HTTPException(404, "Không tìm thấy voucher")
    await session.delete(voucher)
    await session.commit()
    return None


@router.get("/vouchers/{code}", response_model=VoucherValidateOut)
async def validate_voucher(
    code: str,
    session: AsyncSession = Depends(get_session),
):
    """UC-27/28: kiểm tra voucher hợp lệ khi checkout."""
    result = await session.execute(
        select(Voucher).where(Voucher.code == code, Voucher.active.is_(True))
    )
    voucher = result.scalar_one_or_none()
    if voucher is None:
        return VoucherValidateOut(code=code, valid=False, message="Mã giảm giá không tồn tại")
    today = date.today()
    if voucher.valid_from > today or voucher.valid_until < today:
        return VoucherValidateOut(code=code, valid=False, message="Mã giảm giá đã hết hạn")
    if voucher.usage_limit is not None and voucher.used_count >= voucher.usage_limit:
        return VoucherValidateOut(code=code, valid=False, message="Mã giảm giá đã hết lượt sử dụng")
    return VoucherValidateOut(
        code=code,
        valid=True,
        discount_percent=voucher.discount_percent,
        max_discount_amount=voucher.max_discount_amount,
        message="Mã giảm giá hợp lệ",
    )
