#!/bin/sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
cd "$ROOT_DIR"
if [ -f "$ROOT_DIR/.env" ]; then
  set -a
  . "$ROOT_DIR/.env"
  set +a
fi

mode="${1:-start}"
required() { eval "value=\${$1:-}"; [ -n "$value" ] || { echo "$1 is required" >&2; exit 1; }; }
configuration() {
  required DATABASE_URL
  required JWT_SECRET
  required JWT_ISSUER
  required JWT_AUDIENCE
  required CLINICAL_DATA_KEYS_JSON
  required CLINICAL_ACTIVE_KEY_VERSION
  required CLINICAL_POLICY_VERSION
  required OPENROUTER_API_KEY
  required OPENROUTER_MODEL
  [ "${OPENROUTER_BASE_URL:-}" = 'https://openrouter.ai/api/v1' ] || { echo 'OPENROUTER_BASE_URL must be https://openrouter.ai/api/v1' >&2; exit 1; }
  case "${BACKEND_PORT:-}" in ''|*[!0-9]*) echo 'BACKEND_PORT must be an explicit integer' >&2; exit 1 ;; esac
  case "${FRONTEND_PORT:-}" in ''|*[!0-9]*) echo 'FRONTEND_PORT must be an explicit integer' >&2; exit 1 ;; esac
  [ "$BACKEND_PORT" -ge 1024 ] && [ "$BACKEND_PORT" -le 65535 ] || { echo 'BACKEND_PORT must be between 1024 and 65535' >&2; exit 1; }
  [ "$FRONTEND_PORT" -ge 1024 ] && [ "$FRONTEND_PORT" -le 65535 ] || { echo 'FRONTEND_PORT must be between 1024 and 65535' >&2; exit 1; }
  [ "$BACKEND_PORT" != "$FRONTEND_PORT" ] || { echo 'BACKEND_PORT and FRONTEND_PORT must be different' >&2; exit 1; }
  [ "${#JWT_SECRET}" -ge 32 ] || { echo 'JWT_SECRET must be at least 32 characters' >&2; exit 1; }
  node -e 'const keys=JSON.parse(process.env.CLINICAL_DATA_KEYS_JSON);const key=keys[process.env.CLINICAL_ACTIVE_KEY_VERSION];if(!/^[0-9a-f]{64}$/i.test(key||""))throw new Error("active clinical data key must be 32-byte hex")'
}

case "$mode" in
  check)
    configuration
    ;;
  migrate)
    configuration
    [ "${ALLOW_SCHEMA_MIGRATION:-}" = 1 ] || { echo 'Set ALLOW_SCHEMA_MIGRATION=1 after backup and change approval' >&2; exit 1; }
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/db/migrations/001_governed_clinical.sql
    ;;
  start)
    configuration
    for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do
      lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1 && { echo "assigned port $port is occupied" >&2; exit 1; }
    done
    [ -d "$ROOT_DIR/backend/node_modules" ] || { echo 'backend dependencies missing; install explicitly' >&2; exit 1; }
    [ -d "$ROOT_DIR/frontend/node_modules" ] || { echo 'frontend dependencies missing; install explicitly' >&2; exit 1; }
    echo "Starting MedInsight API on $BACKEND_PORT and UI on $FRONTEND_PORT; persistent state is unchanged."
    exec node "$ROOT_DIR/runtime-launcher.js"
    ;;
  *) echo 'usage: ./start.sh check|migrate|start' >&2; exit 2 ;;
esac
