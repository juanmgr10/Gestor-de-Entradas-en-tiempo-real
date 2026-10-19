import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.router import api_router
from app.core.config import get_settings
from app.core.errors import register_exception_handlers
from app.db.base import Base
from app.db.session import engine
from app.models import purchase_event  # noqa: F401 - registra el modelo en Base.metadata

settings = get_settings()
logging.basicConfig(level=settings.log_level, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Crea las tablas si no existen (esquema simple y propio de este servicio)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(title="Motor de Analíticas", version="1.0.0", lifespan=lifespan)
register_exception_handlers(app)
app.include_router(api_router)
