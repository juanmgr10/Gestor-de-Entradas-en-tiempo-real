from fastapi import APIRouter, Query

from app.api.deps import AnalyticsServiceDep
from app.schemas.stats import DailyStats, MovieStats, StatsSummary

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/summary", response_model=StatsSummary)
async def summary(service: AnalyticsServiceDep):
    return await service.summary()


@router.get("/movies", response_model=list[MovieStats])
async def top_movies(service: AnalyticsServiceDep, limit: int = Query(10, ge=1, le=50)):
    return await service.top_movies(limit)


@router.get("/daily", response_model=list[DailyStats])
async def daily_sales(service: AnalyticsServiceDep, days: int = Query(7, ge=1, le=90)):
    return await service.daily_sales(days)
