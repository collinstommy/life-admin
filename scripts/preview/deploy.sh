#!/usr/bin/env bash
set -euo pipefail

trap 'echo "[deploy] Command failed at \\${BASH_SOURCE[0]}:${LINENO}" >&2' ERR

# Deploys a PR-specific preview Worker and D1 database.
# Required env vars:
#   PR_NUMBER                 - Pull request number (used for naming resources)
#   CLOUDFLARE_ACCOUNT_ID     - Cloudflare account id for wrangler commands
#   CLOUDFLARE_API_TOKEN      - Token with Workers + D1 permissions (already used by wrangler)
#   CLOUDFLARE_WORKER_SUBDOMAIN - Workers.dev subdomain (for constructing the preview URL)
# Optional env vars:
#   PREVIEW_NAME_PREFIX       - Prefix for Worker and DB (default: life-admin)
#   PREVIEW_MIGRATIONS_DIR    - Directory with migrations (default: drizzle/migrations)
#   GITHUB_OUTPUT             - GitHub Actions output file (if present, script writes outputs here)

PR_NUMBER="${PR_NUMBER:-}"
CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-}"
CLOUDFLARE_WORKER_SUBDOMAIN="${CLOUDFLARE_WORKER_SUBDOMAIN:-}"
PREVIEW_NAME_PREFIX="${PREVIEW_NAME_PREFIX:-life-admin}"
PREVIEW_MIGRATIONS_DIR="${PREVIEW_MIGRATIONS_DIR:-drizzle/migrations}"
BASE_CONFIG="wrangler.toml"

# Resolve Wrangler CLI path from local dependencies or PATH.
NPM_BIN_DIR="$(pwd)/node_modules/.bin"
if [[ -x "${NPM_BIN_DIR}/wrangler" ]]; then
  WRANGLER_BIN="${NPM_BIN_DIR}/wrangler"
elif command -v wrangler >/dev/null 2>&1; then
  WRANGLER_BIN="$(command -v wrangler)"
else
  echo "Wrangler CLI not found (expected at ${NPM_BIN_DIR}/wrangler or in PATH). Did you run 'npm ci'?" >&2
  exit 1
fi

if [[ -z "${PR_NUMBER}" ]]; then
  echo "PR_NUMBER is required" >&2
  exit 1
fi

if [[ -z "${CLOUDFLARE_ACCOUNT_ID}" ]]; then
  echo "CLOUDFLARE_ACCOUNT_ID is required" >&2
  exit 1
fi

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "CLOUDFLARE_API_TOKEN is required" >&2
  exit 1
fi

if [[ -z "${CLOUDFLARE_WORKER_SUBDOMAIN}" ]]; then
  echo "CLOUDFLARE_WORKER_SUBDOMAIN is required" >&2
  exit 1
fi

if [[ ! -f "${BASE_CONFIG}" ]]; then
  echo "Base wrangler config ${BASE_CONFIG} not found" >&2
  exit 1
fi

if [[ ! -d "${PREVIEW_MIGRATIONS_DIR}" ]]; then
  echo "Migrations directory ${PREVIEW_MIGRATIONS_DIR} not found" >&2
  exit 1
fi

WORKER_NAME="${PREVIEW_NAME_PREFIX}-pr-${PR_NUMBER}"
DB_NAME="${PREVIEW_NAME_PREFIX//-/}_pr_${PR_NUMBER}"

export CLOUDFLARE_ACCOUNT_ID
export CF_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID}"
export CLOUDFLARE_API_TOKEN

fetch_db_entry() {
  echo "[deploy] Fetching D1 database listing to find ${DB_NAME}"
  local list_output list_status
  list_output=$(${WRANGLER_BIN} d1 list --config "${BASE_CONFIG}" --json 2>&1)
  list_status=$?

  if [[ ${list_status} -ne 0 ]]; then
    echo "[deploy] wrangler d1 list failed (status ${list_status}):" >&2
    echo "${list_output}" >&2
    echo "[deploy] Environment diagnostics:" >&2
    echo "  CF_ACCOUNT_ID=${CF_ACCOUNT_ID:-<unset>}" >&2
    echo "  CLOUDFLARE_ACCOUNT_ID=${CLOUDFLARE_ACCOUNT_ID:-<unset>}" >&2
    echo "  wrangler version: $(${WRANGLER_BIN} --version 2>/dev/null || echo 'unknown')" >&2
    return 1
  fi

  echo "[deploy] wrangler d1 list succeeded"

  local db_entry jq_status
  set +e
  db_entry=$(printf '%s' "${list_output}" | jq -cr --arg name "${DB_NAME}" '
        if type == "array" then
          (map(select(.name == $name))[0] // empty)
        elif type == "object" and (.result? | type == "array") then
          (.result | map(select(.name == $name))[0] // empty)
        else empty end
      ')
  jq_status=$?
  set -e

  if [[ ${jq_status} -ne 0 ]]; then
    echo "[deploy] Failed to parse wrangler d1 list output (jq status ${jq_status}):" >&2
    echo "${db_entry}" >&2
    echo "[deploy] Raw response: ${list_output}" >&2
    return 1
  fi

  printf '%s' "${db_entry}"
}

DB_ENTRY=$(fetch_db_entry || true)

if [[ -z "${DB_ENTRY}" ]]; then
  echo "[deploy] No existing database found; creating ${DB_NAME}"
  if ! create_output=$(${WRANGLER_BIN} d1 create "${DB_NAME}" --config "${BASE_CONFIG}" 2>&1); then
    echo "[deploy] wrangler d1 create ${DB_NAME} failed; checking if database already exists" >&2
    echo "${create_output}" >&2
  fi

  for attempt in 1 2 3 4 5; do
    DB_ENTRY=$(fetch_db_entry || true)
    [[ -n "${DB_ENTRY}" ]] && break
    sleep 2
  done
fi

if [[ -z "${DB_ENTRY}" ]]; then
  echo "[deploy] Failed to create or locate D1 database ${DB_NAME}" >&2
  exit 1
fi

DATABASE_ID=$(echo "${DB_ENTRY}" | jq -r '.uuid // .id // .database_id // empty')
DATABASE_NAME=$(echo "${DB_ENTRY}" | jq -r '.name // empty')

if [[ -z "${DATABASE_ID}" ]]; then
  echo "[deploy] Could not determine database id for ${DB_NAME}" >&2
  exit 1
fi

export PREVIEW_WORKER_NAME="${WORKER_NAME}"
export PREVIEW_DATABASE_NAME="${DATABASE_NAME}"
export PREVIEW_DATABASE_ID="${DATABASE_ID}"

# Build the project before deploying so we ship fresh assets.
echo "[deploy] Building project"
npm run build

# Apply migrations to the preview database then deploy.
echo "[deploy] Applying migrations to preview database ${DATABASE_NAME} (${DATABASE_ID})"
"${WRANGLER_BIN}" d1 migrations apply DB \
  --config "${BASE_CONFIG}" \
  --env preview \
  --remote

echo "[deploy] Deploying worker ${WORKER_NAME}"
"${WRANGLER_BIN}" deploy \
  --config "${BASE_CONFIG}" \
  --env preview \
  --name "${WORKER_NAME}"

PREVIEW_URL="https://${WORKER_NAME}.${CLOUDFLARE_WORKER_SUBDOMAIN}.workers.dev"
DB_DASHBOARD_URL="https://dash.cloudflare.com/${CLOUDFLARE_ACCOUNT_ID}/d1/${DATABASE_ID}"

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  {
    echo "preview_url=${PREVIEW_URL}"
    echo "preview_worker=${WORKER_NAME}"
    echo "preview_db_name=${DATABASE_NAME}"
    echo "preview_db_id=${DATABASE_ID}"
    echo "preview_db_url=${DB_DASHBOARD_URL}"
  } >> "${GITHUB_OUTPUT}"
fi

echo "Preview deployed: ${PREVIEW_URL}"
echo "D1 database: ${DATABASE_NAME} (${DATABASE_ID})"
echo "Dashboard: ${DB_DASHBOARD_URL}"
