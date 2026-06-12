"""add composite indexes for common query paths

Revision ID: 0006
Revises: 0005
Create Date: 2026-06-12
"""

from alembic import op

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        "ix_job_cards_workshop_status", "job_cards", ["workshop_id", "status"]
    )
    op.create_index(
        "ix_job_cards_workshop_completed_at", "job_cards", ["workshop_id", "completed_at"]
    )
    op.create_index("ix_users_workshop_role", "users", ["workshop_id", "role"])


def downgrade() -> None:
    op.drop_index("ix_users_workshop_role", table_name="users")
    op.drop_index("ix_job_cards_workshop_completed_at", table_name="job_cards")
    op.drop_index("ix_job_cards_workshop_status", table_name="job_cards")
