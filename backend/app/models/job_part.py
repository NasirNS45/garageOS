import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.job_card import JobCard


class JobPart(Base):
    __tablename__ = "job_parts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_card_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("job_cards.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    quantity: Mapped[float] = mapped_column(Numeric(10, 3), nullable=False, default=1)
    unit_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    # line_total is app-computed (quantity * unit_price), NOT a DB generated column.
    # Stored to avoid recomputing on every read and to stay SQLite-compatible.
    line_total: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    job_card: Mapped["JobCard"] = relationship(back_populates="parts")

    def __repr__(self) -> str:
        return f"<JobPart id={self.id} name={self.name!r} line_total={self.line_total}>"
