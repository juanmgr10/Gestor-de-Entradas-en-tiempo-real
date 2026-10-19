from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.repositories.purchase_event_repository import PurchaseEventRepository
from app.services.analytics_service import AnalyticsService

SessionDep = Annotated[AsyncSession, Depends(get_session)]


def get_analytics_service(session: SessionDep) -> AnalyticsService:
    return AnalyticsService(PurchaseEventRepository(session))


AnalyticsServiceDep = Annotated[AnalyticsService, Depends(get_analytics_service)]
