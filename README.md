# Sistema de Reserva de Entradas en Tiempo Real

Monorepo de microservicios orientado a eventos para cines o teatros.

## Arquitectura

```
[Next.js :3000] --HTTP/WS--> [api-gateway :4000]   (único backend expuesto)
                                   |  red interna backend-net
          +------------------------+-------------------------+
     service-java:8080        service-go:8081         service-python:8000
          |                         |                         |
   postgres (reservas_tx)      redis:6379          postgres (reservas_analytics)
```

| Servicio | Stack | Responsabilidad | Datos |
|---|---|---|---|
| frontend | Next.js | Cartelera y mapa de asientos en vivo | — |
| api-gateway | Express | Enrutamiento HTTP y WebSockets | Redis (solo Pub/Sub) |
| service-java | Spring Boot | Catálogo, usuarios, pagos, boletos | PostgreSQL `reservas_tx` |
| service-go | Gin | Bloqueo temporal de asientos | Redis |
| service-python | FastAPI | Analíticas de ventas | PostgreSQL `reservas_analytics` |

## Levantar el proyecto

```bash
cd sistema-reservas
cp .env.example .env
docker-compose up -d
```

> Si cambias credenciales de Postgres después del primer arranque, borra el volumen:
> `docker-compose down -v`.

## Estado de fases

- [x] Fase 1 — Infraestructura base (Postgres + Redis, redes)
- [ ] Fase 2 — service-java
- [ ] Fase 3 — service-go
- [ ] Fase 4 — service-python
- [ ] Fase 5 — api-gateway
- [ ] Fase 6 — frontend
- [ ] Fase 7 — Integración y pruebas
