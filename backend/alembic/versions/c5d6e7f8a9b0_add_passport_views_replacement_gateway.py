"""add per-user passport views, replacement orders and refund gateway response

Revision ID: c5d6e7f8a9b0
Revises: a1b2c3d4e5f7
Create Date: 2026-09-07 11:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c5d6e7f8a9b0'
down_revision: Union[str, None] = 'a1b2c3d4e5f7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # UC-08: per-user unlock - ai đã mua sản phẩm (có view) mới xem được video
    op.create_table(
        'product_passport_views',
        sa.Column('id', sa.Uuid(), primary_key=True),
        sa.Column('passport_id', sa.Uuid(), sa.ForeignKey('product_passports.id'), nullable=False),
        sa.Column('user_id', sa.Uuid(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_product_passport_views_passport_id', 'product_passport_views', ['passport_id'])
    op.create_index('ix_product_passport_views_user_id', 'product_passport_views', ['user_id'])

    # UC-31: đơn thay thế - link về đơn gốc bị lỗi
    op.add_column('orders', sa.Column('replacement_of_id', sa.Uuid(), sa.ForeignKey('orders.id'), nullable=True))

    # UC-30: lưu phản hồi từ gateway khi hoàn tiền
    op.add_column('payments', sa.Column('gateway_response', sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column('payments', 'gateway_response')
    op.drop_column('orders', 'replacement_of_id')
    op.drop_index('ix_product_passport_views_user_id', table_name='product_passport_views')
    op.drop_index('ix_product_passport_views_passport_id', table_name='product_passport_views')
    op.drop_table('product_passport_views')