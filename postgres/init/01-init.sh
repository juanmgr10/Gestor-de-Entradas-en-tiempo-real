#!/bin/bash
# Crea las dos bases lógicas y un usuario dueño por cada una (Database per Service).
# Se ejecuta solo la primera vez que se inicializa el volumen de Postgres.
set -euo pipefail

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<-EOSQL
  -- Base transaccional: solo accesible por service-java
  CREATE USER ${TX_USER} WITH PASSWORD '${TX_PASSWORD}';
  CREATE DATABASE ${TX_DB} OWNER ${TX_USER};
  REVOKE ALL ON DATABASE ${TX_DB} FROM PUBLIC;

  -- Base analítica: solo accesible por service-python
  CREATE USER ${ANALYTICS_USER} WITH PASSWORD '${ANALYTICS_PASSWORD}';
  CREATE DATABASE ${ANALYTICS_DB} OWNER ${ANALYTICS_USER};
  REVOKE ALL ON DATABASE ${ANALYTICS_DB} FROM PUBLIC;
EOSQL
