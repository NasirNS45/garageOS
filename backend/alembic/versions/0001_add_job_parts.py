"""add job_parts table

Revision ID: 0001
Revises:
Create Date: 2026-06-10
"""

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "0001"
down_revision = "098bf38aa411"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "job_parts",
        sa.Column("id", sa.String(36), primary_key=True, nullable=False),
        sa.Column(
            "job_card_id",
            sa.String(36),
            sa.ForeignKey("job_cards.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column(
            "quantity",
            sa.Numeric(10, 3),
            nullable=False,
            server_default="1",
        ),
        sa.Column(
            "unit_price",
            sa.Numeric(10, 2),
            nullable=False,
            server_default="0",
        ),
        sa.Column(
            "line_total",
            sa.Numeric(10, 2),
            nullable=False,
            server_default="0",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index(
        "ix_job_parts_job_card_id", "job_parts", ["job_card_id"], unique=False
    )


def downgrade() -> None:
    op.drop_index("ix_job_parts_job_card_id", table_name="job_parts")
    op.drop_table("job_parts")
