from datetime import datetime, timezone
from decimal import Decimal

from app.services.analytics_service import AnalyticsService


class FakeRepository:
    def __init__(self, summary=None, movies=None, daily=None):
        self._summary = summary or {
            "total_revenue": 0, "tickets_sold": 0, "purchases": 0, "unique_customers": 0, "last_purchase_at": None,
        }
        self._movies = movies or []
        self._daily = daily or []

    async def summary(self):
        return self._summary

    async def by_movie(self, limit):
        return self._movies[:limit]

    async def daily(self, days):
        return self._daily


async def test_resumen_sin_ventas_tiene_promedio_cero():
    summary = await AnalyticsService(FakeRepository()).summary()
    assert summary.tickets_sold == 0
    assert summary.average_ticket_price == 0.0
    assert summary.last_purchase_at is None


async def test_resumen_calcula_precio_promedio():
    repo = FakeRepository(summary={
        "total_revenue": Decimal("71.50"), "tickets_sold": 6, "purchases": 3,
        "unique_customers": 2, "last_purchase_at": datetime(2026, 10, 21, tzinfo=timezone.utc),
    })
    summary = await AnalyticsService(repo).summary()
    assert summary.total_revenue == 71.5
    assert summary.average_ticket_price == 11.92


async def test_ventas_diarias_convierten_fecha_y_monto():
    repo = FakeRepository(daily=[
        {"day": datetime(2026, 10, 21, tzinfo=timezone.utc), "tickets_sold": 3, "revenue": Decimal("37.50")},
    ])
    [day] = await AnalyticsService(repo).daily_sales(7)
    assert str(day.day) == "2026-10-21"
    assert day.revenue == 37.5
