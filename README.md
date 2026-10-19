# Sistema de Reserva de Entradas en Tiempo Real

Monorepo de microservicios orientado a eventos para cines o teatros.

## Infraestructura

| Componente | Imagen | Uso | Red |
|---|---|---|---|
| PostgreSQL | `postgres:16-alpine` | Bases `reservas_tx` (transaccional) y `reservas_analytics` (analíticas), cada una con su propio usuario | `backend-net` |
| Redis | `redis:7-alpine` | Bloqueos temporales de asientos y Pub/Sub (con notificaciones de expiración) | `backend-net` |

- `backend-net` es una red interna: sus contenedores no publican puertos al host.
- Las bases y usuarios se crean en `postgres/init/01-init.sh` en el primer arranque.
- Todas las variables están en `.env.example`.

## Servicios

### service-java (Spring Boot 3 · Java 21)
Core transaccional: catálogo, usuarios, pagos y emisión de boletos. Solo se conecta a `reservas_tx`.
Puerto interno `8080` (no expuesto al host). El esquema se gestiona con Flyway (`src/main/resources/db/migration`).

Capas: `controller` → `service` → `repository` → `entity`, con `dto` y `exception` (manejador global).

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/movies` | Cartelera |
| GET | `/movies/{id}` | Detalle de película |
| GET | `/movies/{id}/showtimes` | Funciones de una película |
| GET | `/showtimes/{id}` | Detalle de función (incluye filas y columnas de la sala) |
| GET | `/showtimes/{id}/sold-seats` | Asientos vendidos |
| POST | `/users` | Registra un usuario (idempotente por email) |
| GET | `/users/{id}` | Detalle de usuario |
| POST | `/purchases` | Cobra y emite boletos `{userId, showtimeId, seatIds: ["A1"], paymentMethod: CARD\|CASH\|TRANSFER}` |
| GET | `/actuator/health` | Healthcheck |

Errores: `400` validación, `404` no existe, `409` asiento ya vendido, `422` asiento fuera de la sala.
La restricción `UNIQUE (showtime_id, seat_id)` evita la doble venta aunque dos compras lleguen a la vez.

### service-go (Gin · Go 1.22)
Motor de concurrencia: bloquea asientos temporalmente y publica eventos. Solo se conecta a Redis.
Puerto interno `8081` (no expuesto al host).

Capas: `handler` → `service` → `repository` (Redis), con `model` y `events` (publicador y listener de expiraciones).

Llaves en Redis:
- `lock:{showtimeId}:{seatId}` → `userId`, con TTL de `LOCK_TTL_SECONDS` (300 s por defecto).
- `sold:{showtimeId}` → conjunto de asientos vendidos.

Bloquear y liberar se hace con scripts Lua, así cada operación es atómica: si varios usuarios piden el mismo asiento a la vez, solo uno lo obtiene.

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/locks` | Bloquea `{showtimeId, seatId, userId}` → `201` nuevo, `200` ya era suyo, `409` ocupado o vendido |
| DELETE | `/locks/{showtimeId}/{seatId}?userId=` | Libera (solo el dueño) → `204`, `403` otro dueño, `404` no existe |
| GET | `/locks/{showtimeId}` | Bloqueos vigentes de la función |
| POST | `/locks/verify` | Comprueba `{showtimeId, userId, seatIds}` antes de pagar → `200` o `409` con los asientos faltantes |
| POST | `/seats/sold` | Recibe la respuesta de compra de service-java, marca vendidos y publica eventos → `204` (idempotente) |
| GET | `/health` | Healthcheck (verifica Redis) |

Eventos publicados en Redis Pub/Sub:

| Canal | Cuándo | Payload |
|---|---|---|
| `seat.locked` | Se crea un bloqueo | `{showtimeId, seatId, userId, expiresAt}` |
| `seat.released` | Se libera (`cancelled`) o expira (`expired`) | `{showtimeId, seatId, reason}` |
| `seat.sold` | Compra confirmada | `{showtimeId, seatIds}` |
| `purchase.confirmed` | Compra confirmada | Respuesta de compra de service-java |

La expiración se detecta con las notificaciones de Redis (`__keyevent@0__:expired`).

## Levantar el proyecto

```bash
cp .env.example .env
docker compose up -d
```

> Si cambias credenciales de Postgres después del primer arranque, borra el volumen:
> `docker-compose down -v`.
