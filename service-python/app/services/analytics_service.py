import logging

from app.repositories.purchase_event_repository import PurchaseEventRepository
from app.schemas.purchase import PurchaseConfirmedEvent
from app.schemas.stats import DailyStats, MovieStats, StatsSummary

logger = logging.getLogger(__name__)


class AnalyticsService:
    """Registra compras confirmadas y calcula estadísticas de ventas."""

    def __init__(self, repository: PurchaseEventRepository) -> None:
        self.repository = repository

    async def record_purchase(self, event: PurchaseConfirmedEvent) -> bool:
        """Retorna True si se registró; False si era un duplicado (idempotencia)."""
        created = await self.repository.insert_if_absent(
            {
                "payment_id": event.payment_id,
                "user_id": event.user_id,
                "showtime_id": event.showtime_id,
                "movie_id": event.movie_id,
                "movie_title": event.movie_title,
                "amount": event.amount,
                "tickets_count": len(event.tickets),
                "seat_ids": [t.seat_id for t in event.tickets],
                "purchased_at": event.purchased_at,
            }
        )
        logger.info("purchase.confirmed pago=%s registrado=%s", event.payment_id, created)
        return created

    async def summary(self) -> StatsSummary:
        row = await self.repository.summary()
        tickets = int(row["tickets_sold"])
        revenue = float(row["total_revenue"])
        return StatsSummary(
            total_revenue=revenue,
            tickets_sold=tickets,
            purchases=row["purchases"],
            unique_customers=row["unique_customers"],
            average_ticket_price=round(revenue / tickets, 2) if tickets else 0.0,
            last_purchase_at=row["last_purchase_at"],
        )

    async def top_movies(self, limit: int) -> list[MovieStats]:
        return [MovieStats.model_validate(dict(r)) for r in await self.repository.by_movie(limit)]

    async def daily_sales(self, days: int) -> list[DailyStats]:
        rows = await self.repository.daily(days)
        return [
            DailyStats(day=r["day"].date(), tickets_sold=r["tickets_sold"], revenue=float(r["revenue"]))
            for r in rows
        ]
