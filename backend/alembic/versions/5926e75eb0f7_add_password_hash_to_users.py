"""add password_hash to users

Revision ID: 5926e75eb0f7
Revises: 1ddc4b963bbd
Create Date: 2026-08-23 23:10:03.399280
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '5926e75eb0f7'
down_revision: Union[str, None] = '1ddc4b963bbd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("password_hash", sa.String(255), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "password_hash")
