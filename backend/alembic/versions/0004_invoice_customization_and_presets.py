"""invoice customization and service presets

Revision ID: 0004
Revises: 0003
Create Date: 2026-06-11
"""

from alembic import op
import sqlalchemy as sa

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add invoice customization columns to workshops
    op.add_column("workshops", sa.Column("invoice_footer", sa.Text(), nullable=True))
    op.add_column("workshops", sa.Column("bank_details", sa.Text(), nullable=True))

    # Create service_presets table
    op.create_table(
        "service_presets",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "workshop_id",
            sa.String(36),
            sa.ForeignKey("workshops.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "default_labour",
            sa.Numeric(10, 2),
            nullable=False,
            server_default="0",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_table("service_presets")
    op.drop_column("workshops", "bank_details")
    op.drop_column("workshops", "invoice_footer")
