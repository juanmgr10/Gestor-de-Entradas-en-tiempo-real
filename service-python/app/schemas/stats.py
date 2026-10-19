from datetime import date, datetime

from app.schemas.common import CamelModel


class StatsSummary(CamelModel):
    total_revenue: float
    tickets_sold: int
    purchases: int
    unique_customers: int
    average_ticket_price: float
    last_purchase_at: datetime | None


class MovieStats(CamelModel):
    movie_id: int
    movie_title: str
    tickets_sold: int
    purchases: int
    revenue: float


class DailyStats(CamelModel):
    day: date
    tickets_sold: int
    revenue: float
