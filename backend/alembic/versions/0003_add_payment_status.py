"""add payment_status to job_cards

Revision ID: 0003
Revises: 0002
Create Date: 2026-06-11
"""

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "job_cards",
        sa.Column(
            "payment_status",
            sa.String(10),
            nullable=False,
            server_default="unpaid",
        ),
    )


def downgrade() -> None:
    op.drop_column("job_cards", "payment_status")
