"""add service reminders, job photos, and workshop reminder/digest settings

Revision ID: 0008
Revises: 0007
Create Date: 2026-06-13
"""

import sqlalchemy as sa
from alembic import op

revision = "0008"
down_revision = "0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "workshops",
        sa.Column(
            "reminder_interval_days",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
    )
    op.add_column(
        "workshops",
        sa.Column(
            "digest_enabled",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )

    op.create_table(
        "service_reminders",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "workshop_id",
            sa.String(36),
            sa.ForeignKey("workshops.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "job_card_id",
            sa.String(36),
            sa.ForeignKey("job_cards.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("customer_name", sa.String(200), nullable=False),
        sa.Column("customer_phone", sa.String(20), nullable=False),
        sa.Column("vehicle_number", sa.String(50), nullable=False),
        sa.Column("service_note", sa.String(300), nullable=True),
        sa.Column("due_date", sa.Date(), nullable=False),
        sa.Column("status", sa.String(12), nullable=False, server_default="pending"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_service_reminders_workshop_id", "service_reminders", ["workshop_id"])
    op.create_index("ix_service_reminders_due_date", "service_reminders", ["due_date"])
    op.create_index("ix_service_reminders_status", "service_reminders", ["status"])

    op.create_table(
        "job_photos",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "workshop_id",
            sa.String(36),
            sa.ForeignKey("workshops.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "job_card_id",
            sa.String(36),
            sa.ForeignKey("job_cards.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("object_key", sa.String(500), nullable=False),
        sa.Column("url", sa.String(1000), nullable=False),
        sa.Column("caption", sa.String(200), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_job_photos_workshop_id", "job_photos", ["workshop_id"])
    op.create_index("ix_job_photos_job_card_id", "job_photos", ["job_card_id"])


def downgrade() -> None:
    op.drop_index("ix_job_photos_job_card_id", table_name="job_photos")
    op.drop_index("ix_job_photos_workshop_id", table_name="job_photos")
    op.drop_table("job_photos")

    op.drop_index("ix_service_reminders_status", table_name="service_reminders")
    op.drop_index("ix_service_reminders_due_date", table_name="service_reminders")
    op.drop_index("ix_service_reminders_workshop_id", table_name="service_reminders")
    op.drop_table("service_reminders")

    op.drop_column("workshops", "digest_enabled")
    op.drop_column("workshops", "reminder_interval_days")
