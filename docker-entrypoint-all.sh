#!/usr/bin/env bash
set -euo pipefail

: "${PGDATA:=/var/lib/postgresql/data}"
: "${POSTGRES_USER:=postgres}"
: "${POSTGRES_PASSWORD:=postgres}"
: "${POSTGRES_DB:=act1}"

mkdir -p "$PGDATA"
chown -R postgres:postgres "$PGDATA"
chmod 700 "$PGDATA"

if [ ! -s "$PGDATA/PG_VERSION" ]; then
  echo "[entrypoint] Initializing Postgres cluster in $PGDATA..."
  PWFILE=$(mktemp)
  echo "$POSTGRES_PASSWORD" > "$PWFILE"
  chown postgres:postgres "$PWFILE"
  su-exec postgres initdb -D "$PGDATA" -U "$POSTGRES_USER" --pwfile="$PWFILE" >/dev/null
  rm -f "$PWFILE"
fi

echo "[entrypoint] Starting Postgres..."
su-exec postgres pg_ctl -D "$PGDATA" -l /tmp/pg.log \
  -o "-c listen_addresses=127.0.0.1 -c unix_socket_directories=/tmp" \
  -w start

# Ensure the app database exists (safe on re-runs).
if ! su-exec postgres psql -h /tmp -tAc "SELECT 1 FROM pg_database WHERE datname='$POSTGRES_DB'" | grep -q 1; then
  echo "[entrypoint] Creating database $POSTGRES_DB..."
  su-exec postgres psql -h /tmp -c "CREATE DATABASE \"$POSTGRES_DB\""
fi

echo "[entrypoint] Running migrations..."
cd /app/backend
node db/migrate.js
node db/seed.js

# Ensure Postgres shuts down cleanly when the container stops.
shutdown() {
  echo "[entrypoint] Stopping Postgres..."
  su-exec postgres pg_ctl -D "$PGDATA" -m fast -w stop || true
  exit 0
}
trap shutdown TERM INT

echo "[entrypoint] Starting backend on port ${PORT:-4000} (serves frontend from $FRONTEND_DIST)..."
node server.js &
BACKEND_PID=$!
wait "$BACKEND_PID"
