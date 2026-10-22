# Sistema de Reserva de Entradas en Tiempo Real

Sistema de reservas para cines con **microservicios orientados a eventos**, en un monorepo.
Los usuarios eligen butacas en un mapa en vivo: cuando alguien selecciona una, todos los demás la ven ocupada al instante. Al comprar, cada boleto se emite con un **código QR** verificable por el administrador.

## Inicio rápido

```bash
docker compose up -d
```

| Qué | Dónde |
|---|---|
| Aplicación | http://localhost:3000 |
| API Gateway | http://localhost:4000/api |
| Administrador | usuario `admin` · contraseña `admin` |

- No hace falta crear `.env`: `docker compose` usa los valores por defecto de `.env.example`. Para cambiarlos, `cp .env.example .env` y edítalo.
- El primer arranque compila las imágenes (unos minutos). Después, los 7 contenedores quedan `healthy` en ~1 min.
- Para reiniciar desde cero (borra los datos): `docker compose down -v && docker compose up -d`.

> `admin` / `admin` y el `JWT_SECRET` por defecto son solo para desarrollo.

---

## Arquitectura

```
                 navegador
                     │  HTTP + WebSocket
       ┌─────────────┴──────────────┐
       │                            │
  frontend :3000 ──────────▶ api-gateway :4000          ← únicos puertos publicados
   (Next.js)                 (Express + Socket.IO)
                                    │  red interna backend-net
         ┌──────────────────────────┼───────────────────────────┐
         │ HTTP                     │ HTTP + Pub/Sub            │ HTTP
   service-java :8080         service-go :8081           service-python :8000
   (Spring Boot)              (Gin)                      (FastAPI)
         │                          │                           │
   PostgreSQL                     Redis                     PostgreSQL
   reservas_tx           bloqueos · Pub/Sub · expiración    reservas_analytics
```

| Servicio | Stack | Responsabilidad | Datos (único dueño) |
|---|---|---|---|
| `frontend` | Next.js 14 · TypeScript | Cartelera, mapa de butacas en vivo, perfil y panel de administración | — |
| `api-gateway` | Express · Node 20 | Único punto de entrada: enrutamiento, autenticación JWT, orquestación de la compra y WebSockets | Redis (solo suscripción Pub/Sub) |
| `service-java` | Spring Boot 3 · Java 21 | Catálogo, cartelera, usuarios, pagos y emisión de boletos | PostgreSQL `reservas_tx` |
| `service-go` | Gin · Go 1.22 | Bloqueo temporal de butacas (5 min) y publicación de eventos | Redis |
| `service-python` | FastAPI · Python 3.12 | Analíticas de ventas | PostgreSQL `reservas_analytics` |

**Database per Service**: PostgreSQL tiene dos bases lógicas, cada una con su propio usuario. Un servicio no puede conectarse a la base del otro: Postgres lo rechaza con *"User does not have CONNECT privilege"*.

**Redes**:
- `backend-net` es `internal: true`: sin salida a internet y sin puertos publicados. Ahí viven las bases y los tres microservicios.
- `egress-net` da salida a internet solo a `service-java`, para enviar correos por SMTP.
- `frontend-net` es la red de borde. Solo `frontend` y `api-gateway` publican puertos; el gateway es el único en ambas redes.

## Flujos principales

### Registro con verificación del email

1. `POST /api/auth/register`: Java crea la cuenta **sin verificar** y envía al email un código de 4 dígitos (vence en 10 min). No se entrega token.
2. `POST /api/auth/verify-email` con `{username, code}`: si el código es correcto, el email queda verificado y el gateway devuelve `{token, user}`.
3. Hasta verificar, `POST /api/auth/login` responde `403` y el frontend muestra la pantalla del código.

- El código se guarda hasheado. Admite 5 intentos fallidos (luego `429`) y se puede reenviar cada 60 s con `POST /api/auth/resend-code`.
- Sin `MAIL_USERNAME` en `.env` no se envían correos: el código se escribe en el log (`docker compose logs service-java`).
- Los usuarios anteriores a la migración `V8` y el administrador quedan verificados.

### Concurrencia: seleccionar una butaca

1. El usuario toca una butaca → Next.js hace `POST /api/locks` al gateway.
2. El gateway le pide a Go que la bloquee.
3. Go la bloquea **atómicamente** en Redis con un script Lua (`lock:{función}:{butaca}`, TTL 5 min) y publica `seat.locked`. Si varios usuarios la piden a la vez, solo uno la obtiene (`201`); el resto recibe `409`.
4. El gateway, suscrito a Redis, emite el WebSocket `seat:locked` a la sala `showtime:{id}`. Todos los clientes de esa función la pintan en **rojo**.
5. Si el bloqueo vence, Redis notifica la expiración: Go publica `seat.released` y la butaca vuelve a quedar libre en todos los clientes.

### Compra

1. El **gateway** pide a **Go** que verifique que el usuario aún tiene bloqueadas las butacas; si no, responde `409`.
2. **Java** cobra (pago simulado) y emite un boleto por butaca en una transacción. La restricción `UNIQUE (función, butaca)` impide la doble venta aunque dos compras lleguen a la vez.
3. **Go** marca las butacas como vendidas y publica `seat.sold` y `purchase.confirmed`. El gateway reintenta este paso hasta 3 veces, porque es idempotente.
4. El **gateway** recibe los eventos de Redis:
   - `seat.sold`: lo reenvía por WebSocket y todos ven la butaca en **negro**.
   - `purchase.confirmed`: lo envía a **Python**, que registra la venta una sola vez por pago.

### Eventos

| Canal Redis | Publica | Lo recibe el gateway y… |
|---|---|---|
| `seat.locked` | Go | emite WebSocket `seat:locked` |
| `seat.released` | Go (liberación `cancelled` o expiración `expired`) | emite WebSocket `seat:released` |
| `seat.sold` | Go | emite WebSocket `seat:sold` |
| `purchase.confirmed` | Go | hace `POST /events/purchase-confirmed` a Python |

## Funcionalidades

| Página | Acceso | Contenido |
|---|---|---|
| `/` | Público | Cartelera con pósters |
| `/movies/{id}` | Público | Detalle de la película y selector de funciones: cuadros por día y, debajo, las horas de inicio |
| `/showtimes/{id}` | Público (reservar requiere sesión) | Mapa de butacas en vivo y compra |
| `/login` | Público | Iniciar sesión (usuario + contraseña) o crear cuenta (nombre, usuario, email, contraseña) |
| `/perfil` | Usuario | Datos de la cuenta e **información de compra**: historial con los boletos y sus QR |
| `/admin` | Administrador | Ingresos, películas más vendidas, ventas por día y verificación de boletos |
| `/admin/tickets/{code}` | Administrador | Resultado de verificar un boleto; es la URL que codifica el QR |

- **Sala**: una tabla con filas identificadas por letras (A, B, C…) y columnas por números (1, 2, 3…). Cada celda es un ícono de butaca.
  - Colores: **gris** disponible, **azul** tu selección, **rojo** reservada por otro, **negro** vendida.
  - El panel lateral muestra el total y la cuenta regresiva del bloqueo.
- **Cartelera siempre al día**: las funciones se generan desde horarios fijos por día de la semana (las horas cambian según el día).
  - Cubre hoy y los próximos 7 días, en hora de `America/Caracas`, y se regenera cada noche.
  - Las funciones pasadas desaparecen de la cartelera pero siguen en el historial de compras.
- **Menú de perfil**: con sesión iniciada, el ícono de perfil del header despliega *Mi perfil* y, debajo, *Cerrar sesión*.
- **Boletos con QR**: se muestran al confirmar la compra y quedan en el perfil. Al escanear un QR, el administrador ve si el boleto es válido, la película, la función, la butaca y el titular.

## Estructura del monorepo

```
sistema-reservas/
├── docker-compose.yml        Orquestación, redes, volúmenes y healthchecks
├── .env.example              Variables de entorno (valores por defecto)
├── postgres/init/            Creación de las dos bases y sus usuarios
├── scripts/smoke-test.sh     Prueba de humo de punta a punta
├── frontend/                 Next.js: src/app (páginas), src/components, src/hooks, src/lib
├── api-gateway/              Express: src/{routes,controllers,services,middlewares,realtime,validation,config}
├── service-java/             Spring Boot: controller → service → repository → entity (+ dto, exception, config)
│   └── src/main/resources/db/migration/   Migraciones Flyway V1…V7
├── service-go/               Gin: cmd/server + internal/{handler,service,repository,model,events,config}
└── service-python/           FastAPI: app/{api/routes,services,repositories,models,schemas,core,db}
```

Todos los servicios siguen una **arquitectura por capas** (entrada HTTP → lógica de negocio → acceso a datos) y devuelven los errores con el mismo formato: `{status, message, details}`.

---

## API

### api-gateway — `http://localhost:4000`

🔒 requiere `Authorization: Bearer <token>` · 🛡️ requiere rol `ADMIN`

| Método | Ruta | Destino |
|---|---|---|
| POST | `/api/auth/register` | Crea la cuenta y envía el código → `201 {verificationRequired, user}` (sin token) |
| POST | `/api/auth/verify-email` | `{username, code}` → `{token, user}` · `422` código incorrecto o vencido · `429` demasiados intentos |
| POST | `/api/auth/resend-code` | `{username}` → `204` · `429` si no pasaron 60 s |
| POST | `/api/auth/login` | service-java valida y el gateway firma el JWT → `{token, user}` · `403` si el email no está verificado |
| GET | `/api/auth/me` 🔒 | Usuario actual |
| GET | `/api/movies` · `/api/movies/{id}` · `/api/movies/{id}/showtimes` | Catálogo y próximas funciones |
| GET | `/api/showtimes/{id}` | Detalle de la función |
| GET | `/api/showtimes/{id}/seats` | Mapa de butacas: vendidas (Java) + bloqueadas (Go) → `free` / `locked` / `sold` |
| POST | `/api/locks` 🔒 | Bloquear `{showtimeId, seatId}` |
| DELETE | `/api/locks/{showtimeId}/{seatId}` 🔒 | Liberar |
| POST | `/api/purchases` 🔒 | Compra orquestada `{showtimeId, seatIds, paymentMethod: CARD\|CASH\|TRANSFER}` |
| GET | `/api/me/purchases` 🔒 | Historial de compras |
| GET | `/api/stats/summary` · `/api/stats/movies?limit=` · `/api/stats/daily?days=` 🛡️ | Analíticas |
| GET | `/api/tickets/{code}` 🛡️ | Verificación de un boleto |
| GET | `/health` | Estado del gateway (suscriptor Redis conectado) |

- El `userId` de bloqueos y compras sale **siempre del token**; se ignora si viene en el cuerpo.
- WebSocket (Socket.IO): el cliente emite `showtime:join` / `showtime:leave` con `{showtimeId}` y recibe `seat:locked`, `seat:released` y `seat:sold`.
- Para ver los eventos en vivo desde la terminal: `cd api-gateway && npm install && npm run ws-test -- <showtimeId>`.

### Servicios internos (solo accesibles desde `backend-net`)

**service-java `:8080`**

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/movies`, `/movies/{id}`, `/movies/{id}/showtimes` | Catálogo y funciones futuras |
| GET | `/showtimes/{id}`, `/showtimes/{id}/sold-seats` | Función y butacas vendidas |
| POST | `/auth/register`, `/auth/login` | Registro y envío del código (`409` si el usuario o el email verificado existen) y validación de credenciales (`401`, `403` sin verificar) |
| POST | `/auth/verify-email`, `/auth/resend-code` | Verificación del código y reenvío |
| GET | `/users/{id}`, `/users/{id}/purchases` | Usuario e historial de compras |
| GET | `/tickets/{code}` | Verificación de boleto |
| POST | `/purchases` | Cobro y emisión de boletos (`409` vendida, `422` butaca inexistente o función iniciada) |
| GET | `/actuator/health` | Healthcheck |

Migraciones Flyway:

| Versión | Cambio |
|---|---|
| `V1`, `V2` | Esquema inicial y catálogo |
| `V3` | Contraseñas BCrypt y roles |
| `V4` | Horarios fijos y *Avengers: Doomsday* |
| `V5` | Horarios por día de la semana |
| `V6` | Nombre de usuario |
| `V7` | Limpia las funciones de ejemplo de `V2` |
| `V8` | Verificación del email (`email_verified` y códigos) |

Componentes que corren al iniciar:
- `ShowtimeScheduler`: genera la cartelera al iniciar y cada día a las 00:05; es idempotente.
- `AdminInitializer`: crea o actualiza al administrador según `.env`.

**service-go `:8081`**

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/locks` | Bloquear `{showtimeId, seatId, userId}` → `201` nuevo, `200` ya era suyo, `409` ocupada o vendida |
| DELETE | `/locks/{showtimeId}/{seatId}?userId=` | Liberar (solo el dueño) → `204` / `403` / `404` |
| GET | `/locks/{showtimeId}` | Bloqueos vigentes |
| POST | `/locks/verify` | ¿El usuario tiene todas estas butacas? → `200` o `409` con las faltantes |
| POST | `/seats/sold` | Marca vendidas y publica `seat.sold` + `purchase.confirmed` (idempotente) |
| GET | `/health` | Healthcheck (Redis) |

**service-python `:8000`**

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/events/purchase-confirmed` | Registra la venta → `201` nueva, `200` duplicada (idempotente por `paymentId`) |
| GET | `/stats/summary`, `/stats/movies?limit=`, `/stats/daily?days=` | Resumen, ranking de películas y ventas diarias |
| GET | `/health` | Healthcheck (base de datos) |

## Configuración

Todas las variables están en `.env.example`, que sirve de documentación y de valores por defecto.

| Variable | Por defecto | Uso |
|---|---|---|
| `POSTGRES_*`, `TX_*`, `ANALYTICS_*` | — | Superusuario y usuario/contraseña de cada base |
| `REDIS_PASSWORD` | `redis_secret` | Contraseña de Redis |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | valor de desarrollo, `8h` | Firma y duración de las sesiones |
| `ADMIN_NAME`, `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | `admin` / `admin` | Cuenta de administrador; se sincroniza al iniciar |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM` | `smtp.gmail.com`, `587`, vacíos | SMTP para el código de verificación. Gmail: contraseña de aplicación. Vacío = el código va al log |
| `LOCK_TTL_SECONDS` | `300` | Duración del bloqueo de una butaca |
| `APP_TIMEZONE`, `APP_SCHEDULE_DAYS_AHEAD` | `America/Caracas`, `7` | Zona horaria de la cartelera y días generados |
| `GATEWAY_PORT`, `FRONTEND_PORT` | `4000`, `3000` | Puertos publicados |
| `CORS_ORIGIN`, `PUBLIC_API_URL`, `PUBLIC_WS_URL` | `localhost` | Orígenes permitidos y URLs que usa el navegador. Las dos últimas se incrustan al compilar el frontend |

> Si cambias las credenciales de Postgres después del primer arranque, borra el volumen con `docker compose down -v`.

## Pruebas

| Servicio | Comando | Qué cubre |
|---|---|---|
| service-java | `cd service-java && mvn test` | Compra (precio, butaca vendida, función iniciada), validación de butacas, registro e inicio de sesión |
| service-go | `cd service-go && go test ./...` | Reglas de bloqueo y eventos, verificación previa al pago, llaves de Redis y validación HTTP |
| service-python | `cd service-python && pip install -r requirements-dev.txt && pytest` | Registro idempotente de eventos, validación y cálculo de estadísticas |
| api-gateway | `cd api-gateway && npm install && npm test` | Orquestación de la compra, mapa de butacas, JWT y control de roles |
| frontend | `cd frontend && npm install && npm run typecheck` | Verificación de tipos de toda la aplicación |
| Sistema completo | `./scripts/smoke-test.sh` | Registro → verificación del email → bloqueo → compra → perfil → permisos → QR → analíticas, contra el sistema levantado |

`smoke-test.sh` crea un usuario `smoke_<timestamp>` con una compra real.

## Limitaciones conocidas

- **Pagos simulados**: siempre se aprueban. Para producción haría falta integrar una pasarela real.
- **Redis sin persistencia**: si se reinicia, se pierden los bloqueos en curso, que de todas formas son temporales. Las ventas no corren riesgo: su fuente de verdad es PostgreSQL.
- **Una sola instancia del gateway**: con varias réplicas, cada una reenviaría `purchase.confirmed` a analíticas. Python lo tolera porque es idempotente, pero lo correcto sería usar Redis Streams con grupos de consumidores.
- **Esquema de analíticas sin migraciones**: la tabla se crea al iniciar (`create_all`); si crece, conviene agregar Alembic.
