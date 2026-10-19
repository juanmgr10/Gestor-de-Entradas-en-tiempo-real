from datetime import datetime
from decimal import Decimal

from sqlalchemy import ARRAY, BigInteger, DateTime, Index, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class PurchaseEvent(Base):
    """Compra confirmada recibida del evento purchase.confirmed."""

    __tablename__ = "purchase_events"
    __table_args__ = (
        Index("idx_purchase_events_movie", "movie_id"),
        Index("idx_purchase_events_purchased_at", "purchased_at"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    # Clave de idempotencia: un pago = una compra
    payment_id: Mapped[int] = mapped_column(BigInteger, unique=True, nullable=False)
    user_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    showtime_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    movie_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    movie_title: Mapped[str] = mapped_column(String(150), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    tickets_count: Mapped[int] = mapped_column(Integer, nullable=False)
    seat_ids: Mapped[list[str]] = mapped_column(ARRAY(String(5)), nullable=False)
    purchased_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
