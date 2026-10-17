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

## Levantar el proyecto

```bash
cd sistema-reservas
cp .env.example .env
docker-compose up -d
```

> Si cambias credenciales de Postgres después del primer arranque, borra el volumen:
> `docker-compose down -v`.
