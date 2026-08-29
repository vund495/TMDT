"""add video_url to products & failed_delivery_count to shipments & bad_history to users

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-08-29 11:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("products", sa.Column("video_url", sa.String(500), nullable=True))
    op.add_column("shipments", sa.Column("failed_delivery_count", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("users", sa.Column("bad_order_count", sa.Integer(), nullable=False, server_default="0"))


def downgrade() -> None:
    op.drop_column("users", "bad_order_count")
    op.drop_column("shipments", "failed_delivery_count")
    op.drop_column("products", "video_url")
