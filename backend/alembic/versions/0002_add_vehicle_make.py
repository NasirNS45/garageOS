"""add vehicle_make to job_cards

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-11
"""

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "job_cards",
        sa.Column("vehicle_make", sa.String(100), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("job_cards", "vehicle_make")
