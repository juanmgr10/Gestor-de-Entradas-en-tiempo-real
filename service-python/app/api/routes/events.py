from fastapi import APIRouter, Response, status

from app.api.deps import AnalyticsServiceDep
from app.schemas.purchase import EventAck, PurchaseConfirmedEvent

router = APIRouter(prefix="/events", tags=["events"])


@router.post(
    "/purchase-confirmed",
    response_model=EventAck,
    status_code=status.HTTP_201_CREATED,
    responses={200: {"model": EventAck, "description": "Evento duplicado, ya registrado"}},
)
async def purchase_confirmed(event: PurchaseConfirmedEvent, service: AnalyticsServiceDep, response: Response):
    """Endpoint interno: el API Gateway reenvía aquí el evento purchase.confirmed."""
    created = await service.record_purchase(event)
    if not created:
        response.status_code = status.HTTP_200_OK
    return EventAck(payment_id=event.payment_id, status="recorded" if created else "duplicate")
