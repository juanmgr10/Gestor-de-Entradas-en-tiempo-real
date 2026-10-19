from fastapi import APIRouter
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.api.deps import SessionDep

router = APIRouter(tags=["health"])


@router.get("/health")
async def health(session: SessionDep):
    try:
        await session.execute(text("SELECT 1"))
    except Exception as exc:  # noqa: BLE001 - cualquier fallo de BD = servicio no disponible
        return JSONResponse(status_code=503, content={"status": "DOWN", "database": str(exc)})
    return {"status": "UP"}
