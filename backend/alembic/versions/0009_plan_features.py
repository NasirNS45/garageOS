"""plan features: accent theme, partial payments, password reset tokens

Revision ID: 0009
Revises: 0008
Create Date: 2026-06-14
"""

import sqlalchemy as sa
from alembic import op

revision = "0009"
down_revision = "0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "workshops",
        sa.Column(
            "accent_theme",
            sa.String(20),
            nullable=False,
            server_default="blue",
        ),
    )

    op.add_column(
        "job_cards",
        sa.Column(
            "collected_amount",
            sa.Numeric(10, 2),
            nullable=False,
            server_default="0",
        ),
    )
    op.add_column(
        "job_cards",
        sa.Column("payment_method", sa.String(30), nullable=True),
    )

    op.create_table(
        "password_reset_tokens",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("token_hash", sa.String(64), nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_password_reset_tokens_user_id", "password_reset_tokens", ["user_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_password_reset_tokens_user_id", table_name="password_reset_tokens")
    op.drop_table("password_reset_tokens")

    op.drop_column("job_cards", "payment_method")
    op.drop_column("job_cards", "collected_amount")

    op.drop_column("workshops", "accent_theme")
