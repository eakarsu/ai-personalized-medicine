#!/bin/sh
set -eu
cd "$(dirname "$0")"
mode="${1:-check}"
if [ "${NODE_ENV:-}" = test ]; then
  export JWT_ISSUER="${JWT_ISSUER:-medinsight-runtime}"
  export JWT_AUDIENCE="${JWT_AUDIENCE:-medinsight-runtime-client}"
  export CLINICAL_ACTIVE_KEY_VERSION="${CLINICAL_ACTIVE_KEY_VERSION:-runtime-v1}"
  export CLINICAL_POLICY_VERSION="${CLINICAL_POLICY_VERSION:-runtime-policy}"
  if [ -z "${CLINICAL_DATA_KEYS_JSON:-}" ]; then
    CLINICAL_DATA_KEYS_JSON="$(node -e 'const crypto=require("node:crypto");const seed=process.env.MEMORY_ENCRYPTION_KEY_BASE64||process.env.JWT_SECRET;process.stdout.write(JSON.stringify({"runtime-v1":crypto.createHash("sha256").update(seed).digest("hex")}))')"
    export CLINICAL_DATA_KEYS_JSON
  fi
fi

required() { eval "value=\${$1:-}"; [ -n "$value" ] || { echo "$1 is required" >&2; exit 1; }; }
configuration() {
  required DATABASE_URL
  required JWT_SECRET
  required JWT_ISSUER
  required JWT_AUDIENCE
  required CLINICAL_DATA_KEYS_JSON
  required CLINICAL_ACTIVE_KEY_VERSION
  required CLINICAL_POLICY_VERSION
  [ "${#JWT_SECRET}" -ge 32 ] || { echo 'JWT_SECRET must be at least 32 characters' >&2; exit 1; }
  node -e 'const keys=JSON.parse(process.env.CLINICAL_DATA_KEYS_JSON);const key=keys[process.env.CLINICAL_ACTIVE_KEY_VERSION];if(!/^[0-9a-f]{64}$/i.test(key||""))throw new Error("active clinical data key must be 32-byte hex")'
  if [ "${NODE_ENV:-}" = production ]; then required CORS_ORIGIN; fi
}

case "$mode" in
  check)
    (cd backend && npm run check)
    (cd frontend && npm run build)
    ;;
  migrate)
    configuration
    [ "${ALLOW_SCHEMA_MIGRATION:-}" = 1 ] || { echo 'Set ALLOW_SCHEMA_MIGRATION=1 after backup and change approval' >&2; exit 1; }
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/db/migrations/001_governed_clinical.sql
    ;;
  start)
    configuration
    (cd backend && npm start)
    ;;
  *) echo 'usage: ./start.sh check|migrate|start' >&2; exit 2 ;;
esac
