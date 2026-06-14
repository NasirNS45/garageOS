import uuid
from datetime import datetime
from enum import StrEnum
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.job_part import JobPart


class JobStatus(StrEnum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"


class PaymentStatus(StrEnum):
    unpaid = "unpaid"
    paid = "paid"


class JobCard(Base):
    __tablename__ = "job_cards"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workshop_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("workshops.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    vehicle_number: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    vehicle_make: Mapped[str | None] = mapped_column(String(100), nullable=True)
    customer_name: Mapped[str] = mapped_column(String(200), nullable=False)
    customer_phone: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=JobStatus.pending, index=True
    )
    assigned_mechanic_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    description: Mapped[str | None] = mapped_column(Text)
    labour_charge: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    parts_charge: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    total_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    invoice_number: Mapped[str | None] = mapped_column(String(50), unique=True, nullable=True)
    payment_status: Mapped[str] = mapped_column(
        String(10), nullable=False, default=PaymentStatus.unpaid
    )
    collected_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    payment_method: Mapped[str | None] = mapped_column(String(30), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    parts: Mapped[list["JobPart"]] = relationship(
        "JobPart", back_populates="job_card", lazy="noload"
    )

    def __repr__(self) -> str:
        return f"<JobCard id={self.id} vehicle={self.vehicle_number!r} status={self.status!r}>"
