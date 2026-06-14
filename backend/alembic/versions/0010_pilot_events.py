"""pilot_events table for product analytics

Revision ID: 0010
Revises: 0009
Create Date: 2026-06-14

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0010"
down_revision: str | None = "0009"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "pilot_events",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("workshop_id", sa.String(length=36), nullable=True),
        sa.Column("user_id", sa.String(length=36), nullable=True),
        sa.Column("event_name", sa.String(length=80), nullable=False),
        sa.Column("metadata_json", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["workshop_id"], ["workshops.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_pilot_events_workshop_id", "pilot_events", ["workshop_id"])
    op.create_index("ix_pilot_events_user_id", "pilot_events", ["user_id"])
    op.create_index("ix_pilot_events_event_name", "pilot_events", ["event_name"])
    op.create_index("ix_pilot_events_created_at", "pilot_events", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_pilot_events_created_at", table_name="pilot_events")
    op.drop_index("ix_pilot_events_event_name", table_name="pilot_events")
    op.drop_index("ix_pilot_events_user_id", table_name="pilot_events")
    op.drop_index("ix_pilot_events_workshop_id", table_name="pilot_events")
    op.drop_table("pilot_events")
