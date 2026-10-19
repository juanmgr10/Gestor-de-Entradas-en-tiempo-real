import logging

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.schemas.common import ErrorResponse

logger = logging.getLogger(__name__)


def _error(status_code: int, message: str, details: list[str] | None = None) -> JSONResponse:
    body = ErrorResponse(status=status_code, message=message, details=details or [])
    return JSONResponse(status_code=status_code, content=body.model_dump())


def register_exception_handlers(app: FastAPI) -> None:
    """Formato de error uniforme {status, message, details}, igual que los demás servicios."""

    @app.exception_handler(RequestValidationError)
    async def validation_handler(_: Request, exc: RequestValidationError):
        details = [f"{'.'.join(str(p) for p in e['loc'])}: {e['msg']}" for e in exc.errors()]
        return _error(status.HTTP_400_BAD_REQUEST, "Datos de entrada inválidos", details)

    @app.exception_handler(StarletteHTTPException)
    async def http_handler(_: Request, exc: StarletteHTTPException):
        message = "Ruta no encontrada" if exc.status_code == 404 else str(exc.detail)
        return _error(exc.status_code, message)

    @app.exception_handler(Exception)
    async def unexpected_handler(_: Request, exc: Exception):
        logger.exception("Error no controlado", exc_info=exc)
        return _error(status.HTTP_500_INTERNAL_SERVER_ERROR, "Error interno del servidor")
