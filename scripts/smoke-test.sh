#!/usr/bin/env bash
# Prueba de humo de punta a punta contra el API Gateway (con el sistema levantado).
# Recorre el flujo completo: registro -> bloqueo -> compra -> eventos -> perfil -> administración.
# Crea un usuario "smoke_<timestamp>" con una compra real.
#
# Uso: ./scripts/smoke-test.sh [URL_API]   (por defecto http://localhost:4000/api)
# Requiere: curl y python3. Variables opcionales: ADMIN_USERNAME, ADMIN_PASSWORD.
set -euo pipefail

API="${1:-http://localhost:4000/api}"
ADMIN_USERNAME="${ADMIN_USERNAME:-admin}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin}"
USERNAME="smoke_$(date +%s)"

pass() { printf '  \033[32m✓\033[0m %s\n' "$1"; }
fail() { printf '  \033[31m✗\033[0m %s\n' "$1"; exit 1; }
# Extrae un valor de un JSON leído por stdin con una expresión de Python sobre "d"
json() { python3 -c "import json,sys; d=json.load(sys.stdin); print($1)"; }

# request MÉTODO RUTA [TOKEN] [CUERPO] -> imprime el cuerpo; deja el código HTTP en $STATUS
request() {
  local method=$1 path=$2 token=${3:-} body=${4:-} out
  local args=(-s -X "$method" -w '\n%{http_code}' -H 'Content-Type: application/json')
  [[ -n $token ]] && args+=(-H "Authorization: Bearer $token")
  [[ -n $body ]] && args+=(-d "$body")
  out=$(curl "${args[@]}" "$API$path") || fail "sin conexión con $API"
  STATUS=${out##*$'\n'}
  RESPONSE=${out%$'\n'*}
}
expect() { [[ $STATUS == "$1" ]] || fail "$2 (HTTP $STATUS: $RESPONSE)"; pass "$2"; }

echo "Prueba de humo contra $API"

request GET /movies
expect 200 "cartelera disponible"
MOVIE_ID=$(echo "$RESPONSE" | json 'd[0]["id"]')

request GET "/movies/$MOVIE_ID/showtimes"
expect 200 "funciones de la película $MOVIE_ID"
SHOWTIME_ID=$(echo "$RESPONSE" | json 'd[0]["id"]')

request POST /auth/register "" "{\"name\":\"Smoke Test\",\"username\":\"$USERNAME\",\"email\":\"$USERNAME@test.local\",\"password\":\"smoke12345\"}"
expect 201 "registro de $USERNAME"
TOKEN=$(echo "$RESPONSE" | json 'd["token"]')

request POST /locks "" "{\"showtimeId\":$SHOWTIME_ID,\"seatId\":\"A1\"}"
expect 401 "bloquear sin sesión es rechazado"

request GET "/showtimes/$SHOWTIME_ID/seats"
SEAT=$(echo "$RESPONSE" | json 'next(s["seatId"] for s in d["seats"] if s["status"] == "free")')

request POST /locks "$TOKEN" "{\"showtimeId\":$SHOWTIME_ID,\"seatId\":\"$SEAT\"}"
expect 201 "bloqueo de la butaca $SEAT en la función $SHOWTIME_ID"

request GET "/showtimes/$SHOWTIME_ID/seats"
[[ $(echo "$RESPONSE" | json "next(s['status'] for s in d['seats'] if s['seatId'] == '$SEAT')") == locked ]] \
  && pass "el mapa muestra $SEAT bloqueada" || fail "el mapa no muestra $SEAT bloqueada"

request POST /purchases "$TOKEN" "{\"showtimeId\":$SHOWTIME_ID,\"seatIds\":[\"$SEAT\"],\"paymentMethod\":\"CARD\"}"
expect 201 "compra confirmada"
PAYMENT_ID=$(echo "$RESPONSE" | json 'd["paymentId"]')
TICKET_CODE=$(echo "$RESPONSE" | json 'd["tickets"][0]["code"]')

request GET "/showtimes/$SHOWTIME_ID/seats"
[[ $(echo "$RESPONSE" | json "next(s['status'] for s in d['seats'] if s['seatId'] == '$SEAT')") == sold ]] \
  && pass "el mapa muestra $SEAT vendida" || fail "el mapa no muestra $SEAT vendida"

request GET /me/purchases "$TOKEN"
[[ $(echo "$RESPONSE" | json "any(p['paymentId'] == $PAYMENT_ID for p in d)") == True ]] \
  && pass "la compra aparece en el perfil" || fail "la compra no aparece en el perfil"

request GET /stats/summary "$TOKEN"
expect 403 "un cliente no accede a estadísticas"

request POST /auth/login "" "{\"username\":\"$ADMIN_USERNAME\",\"password\":\"$ADMIN_PASSWORD\"}"
expect 200 "inicio de sesión del administrador"
ADMIN_TOKEN=$(echo "$RESPONSE" | json 'd["token"]')

request GET "/tickets/$TICKET_CODE" "$ADMIN_TOKEN"
expect 200 "verificación del boleto (QR)"

# purchase.confirmed llega a analíticas de forma asíncrona (Redis Pub/Sub -> gateway -> Python)
for _ in $(seq 1 10); do
  request GET /stats/summary "$ADMIN_TOKEN"
  [[ $(echo "$RESPONSE" | json 'd["purchases"]') -ge 1 ]] && break
  sleep 0.5
done
[[ $(echo "$RESPONSE" | json 'd["purchases"]') -ge 1 ]] \
  && pass "la venta llegó a analíticas" || fail "la venta no llegó a analíticas"

echo "Todo correcto. Datos creados: usuario $USERNAME, compra #$PAYMENT_ID."
