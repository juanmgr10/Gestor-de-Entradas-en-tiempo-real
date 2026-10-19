from datetime import datetime, timedelta, timezone

from sqlalchemy import distinct, func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.purchase_event import PurchaseEvent


class PurchaseEventRepository:
    """Acceso a datos de eventos de compra y consultas agregadas."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def insert_if_absent(self, values: dict) -> bool:
        """Inserta el evento; retorna False si ya existía (mismo payment_id)."""
        stmt = (
            insert(PurchaseEvent)
            .values(**values)
            .on_conflict_do_nothing(index_elements=[PurchaseEvent.payment_id])
            .returning(PurchaseEvent.id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none() is not None

    async def summary(self) -> dict:
        stmt = select(
            func.coalesce(func.sum(PurchaseEvent.amount), 0).label("total_revenue"),
            func.coalesce(func.sum(PurchaseEvent.tickets_count), 0).label("tickets_sold"),
            func.count(PurchaseEvent.id).label("purchases"),
            func.count(distinct(PurchaseEvent.user_id)).label("unique_customers"),
            func.max(PurchaseEvent.purchased_at).label("last_purchase_at"),
        )
        return (await self.session.execute(stmt)).mappings().one()

    async def by_movie(self, limit: int) -> list[dict]:
        revenue = func.sum(PurchaseEvent.amount).label("revenue")
        stmt = (
            select(
                PurchaseEvent.movie_id,
                func.max(PurchaseEvent.movie_title).label("movie_title"),
                func.sum(PurchaseEvent.tickets_count).label("tickets_sold"),
                func.count(PurchaseEvent.id).label("purchases"),
                revenue,
            )
            .group_by(PurchaseEvent.movie_id)
            .order_by(revenue.desc())
            .limit(limit)
        )
        return list((await self.session.execute(stmt)).mappings().all())

    async def daily(self, days: int) -> list[dict]:
        day = func.date_trunc("day", PurchaseEvent.purchased_at).label("day")
        since = datetime.now(timezone.utc) - timedelta(days=days)
        stmt = (
            select(
                day,
                func.sum(PurchaseEvent.tickets_count).label("tickets_sold"),
                func.sum(PurchaseEvent.amount).label("revenue"),
            )
            .where(PurchaseEvent.purchased_at >= since)
            .group_by(day)
            .order_by(day)
        )
        return list((await self.session.execute(stmt)).mappings().all())
