EVENT = {
    "paymentId": 1,
    "userId": 7,
    "showtimeId": 10,
    "movieId": 1,
    "movieTitle": "Dune: Parte Dos",
    "amount": 25.00,
    "tickets": [{"id": 1, "code": "abc", "seatId": "A1"}, {"id": 2, "code": "def", "seatId": "A2"}],
    "purchasedAt": "2026-10-21T18:00:00Z",
}


def test_registra_evento_nuevo(client):
    res = client.post("/events/purchase-confirmed", json=EVENT)
    assert res.status_code == 201
    assert res.json() == {"paymentId": 1, "status": "recorded"}


def test_evento_repetido_es_idempotente(client):
    client.post("/events/purchase-confirmed", json=EVENT)
    res = client.post("/events/purchase-confirmed", json=EVENT)
    assert res.status_code == 200
    assert res.json()["status"] == "duplicate"


def test_evento_invalido_responde_400_con_formato_comun(client):
    res = client.post("/events/purchase-confirmed", json={**EVENT, "paymentId": 0, "tickets": []})
    body = res.json()
    assert res.status_code == 400
    assert body["message"] == "Datos de entrada inválidos"
    assert any("paymentId" in d for d in body["details"])
    assert any("tickets" in d for d in body["details"])


def test_asiento_con_formato_invalido(client):
    event = {**EVENT, "tickets": [{"id": 1, "code": "abc", "seatId": "1A"}]}
    assert client.post("/events/purchase-confirmed", json=event).status_code == 400


def test_ruta_inexistente(client):
    res = client.get("/no-existe")
    assert res.status_code == 404
    assert res.json()["message"] == "Ruta no encontrada"
