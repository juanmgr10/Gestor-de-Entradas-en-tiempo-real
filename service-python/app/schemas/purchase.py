from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import Field

from app.schemas.common import CamelModel


class TicketIn(CamelModel):
    id: int
    code: str
    seat_id: str = Field(pattern=r"^[A-Z][1-9][0-9]?$")


class PurchaseConfirmedEvent(CamelModel):
    """Payload de purchase.confirmed (respuesta de compra de service-java)."""

    payment_id: int = Field(gt=0)
    user_id: int = Field(gt=0)
    showtime_id: int = Field(gt=0)
    movie_id: int = Field(gt=0)
    movie_title: str = Field(min_length=1, max_length=150)
    amount: Decimal = Field(ge=0, max_digits=10, decimal_places=2)
    tickets: list[TicketIn] = Field(min_length=1)
    purchased_at: datetime


class EventAck(CamelModel):
    payment_id: int
    status: Literal["recorded", "duplicate"]
