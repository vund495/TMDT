"""add used_by_user_id to vouchers

Revision ID: a2b3c4d5e6f8
Revises: c5d6e7f8a9b0
Create Date: 2026-09-10

Fix model/migration drift: Voucher.used_by_user_id existed in ORM but never
added to the vouchers table, breaking my-vouchers / validate / UC-27 tour voucher.
"""
from alembic import op
import sqlalchemy as sa

revision = "a2b3c4d5e6f8"
down_revision = "c5d6e7f8a9b0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("vouchers", sa.Column("used_by_user_id", sa.Uuid(), nullable=True))
    op.create_foreign_key(
        "fk_vouchers_used_by_user", "vouchers", "users",
        ["used_by_user_id"], ["id"],
    )
    op.create_index("ix_vouchers_used_by_user_id", "vouchers", ["used_by_user_id"])


def downgrade() -> None:
    op.drop_index("ix_vouchers_used_by_user_id", table_name="vouchers")
    op.drop_constraint("fk_vouchers_used_by_user", "vouchers", type_="foreignkey")
    op.drop_column("vouchers", "used_by_user_id")