"""add bank info to workshops and payout fields to revenue_records

Revision ID: a1b2c3d4e5f7
Revises: f6a7b8c9d1e2
Create Date: 2026-09-07 10:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f7'
down_revision: Union[str, None] = 'f6a7b8c9d1e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('workshops', sa.Column('bank_name', sa.String(length=64), nullable=True))
    op.add_column('workshops', sa.Column('bank_account_no', sa.String(length=64), nullable=True))
    op.add_column('workshops', sa.Column('bank_account_name', sa.String(length=255), nullable=True))
    op.add_column('revenue_records', sa.Column('payout_status', sa.String(length=16), server_default=sa.text("'pending'"), nullable=False))
    op.add_column('revenue_records', sa.Column('payout_date', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('revenue_records', 'payout_date')
    op.drop_column('revenue_records', 'payout_status')
    op.drop_column('workshops', 'bank_account_name')
    op.drop_column('workshops', 'bank_account_no')
    op.drop_column('workshops', 'bank_name')