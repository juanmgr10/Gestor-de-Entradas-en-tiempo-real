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

## Levantar el proyecto

```bash
cp .env.example .env
docker compose up -d
```

> Si cambias credenciales de Postgres después del primer arranque, borra el volumen:
> `docker compose down -v`.
