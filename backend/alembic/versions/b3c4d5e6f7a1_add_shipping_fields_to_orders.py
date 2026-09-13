"""add shipping_method & shipping_province to orders

Revision ID: b3c4d5e6f7a1
Revises: a2b3c4d5e6f8
Create Date: 2026-09-13

Phí vận chuyển theo quy tắc: pickup (0đ), >= 500k (0đ),
Hà Nội / TP.Hồ Chí Minh (15.000đ), còn lại (35.000đ).
Lưu phương thức nhận hàng + tỉnh/thành để tính & đối soát phí.
"""
from alembic import op
import sqlalchemy as sa

revision = "b3c4d5e6f7a1"
down_revision = "a2b3c4d5e6f8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("orders", sa.Column("shipping_method", sa.String(length=20), nullable=False, server_default="delivery"))
    op.add_column("orders", sa.Column("shipping_province", sa.String(length=64), nullable=True))


def downgrade() -> None:
    op.drop_column("orders", "shipping_province")
    op.drop_column("orders", "shipping_method")