"""add reject_reason to products

Revision ID: a1b2c3d4e5f6
Revises: 5926e75eb0f7
Create Date: 2026-08-29 10:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '5926e75eb0f7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "products",
        sa.Column("reject_reason", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("products", "reject_reason")
