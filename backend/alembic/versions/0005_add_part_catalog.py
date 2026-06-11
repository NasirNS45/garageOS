"""add part catalog

Revision ID: 0005
Revises: 0004
Create Date: 2026-06-11
"""

from alembic import op
import sqlalchemy as sa

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "part_catalog",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "workshop_id",
            sa.String(36),
            sa.ForeignKey("workshops.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column(
            "default_price",
            sa.Numeric(10, 2),
            nullable=False,
            server_default="0",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_part_catalog_workshop_id", "part_catalog", ["workshop_id"])


def downgrade() -> None:
    op.drop_index("ix_part_catalog_workshop_id", "part_catalog")
    op.drop_table("part_catalog")
