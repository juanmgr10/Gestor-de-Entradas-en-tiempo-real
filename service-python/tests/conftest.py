import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_analytics_service
from app.main import app


class FakeAnalyticsService:
    """Servicio en memoria: evita depender de PostgreSQL en las pruebas de rutas."""

    def __init__(self):
        self.recorded: set[int] = set()

    async def record_purchase(self, event):
        created = event.payment_id not in self.recorded
        self.recorded.add(event.payment_id)
        return created


@pytest.fixture
def fake_service():
    return FakeAnalyticsService()


@pytest.fixture
def client(fake_service):
    # Sin "with": no se ejecuta el lifespan (create_all contra la base de datos)
    app.dependency_overrides[get_analytics_service] = lambda: fake_service
    yield TestClient(app)
    app.dependency_overrides.clear()
