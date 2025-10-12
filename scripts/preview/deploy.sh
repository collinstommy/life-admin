#!/usr/bin/env bash
set -euo pipefail

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
export CLOUDFLARE_API_TOKEN

fetch_db_entry() {
  ${WRANGLER_BIN} d1 list --config "${BASE_CONFIG}" --json \
    | jq -cr --arg name "${DB_NAME}" 'map(select(.name == $name))[0] // empty'
}

DB_ENTRY=$(fetch_db_entry || true)

if [[ -z "${DB_ENTRY}" ]]; then
  if ! ${WRANGLER_BIN} d1 create "${DB_NAME}" --config "${BASE_CONFIG}"; then
    echo "wrangler d1 create ${DB_NAME} failed; checking if database already exists" >&2
  fi

  for attempt in 1 2 3 4 5; do
    DB_ENTRY=$(fetch_db_entry || true)
    [[ -n "${DB_ENTRY}" ]] && break
    sleep 2
  done
fi

if [[ -z "${DB_ENTRY}" ]]; then
  echo "Failed to create or locate D1 database ${DB_NAME}" >&2
  exit 1
fi

DATABASE_ID=$(echo "${DB_ENTRY}" | jq -r '.uuid // .id // .database_id // empty')
DATABASE_NAME=$(echo "${DB_ENTRY}" | jq -r '.name // empty')

if [[ -z "${DATABASE_ID}" ]]; then
  echo "Could not determine database id for ${DB_NAME}" >&2
  exit 1
fi

export PREVIEW_WORKER_NAME="${WORKER_NAME}"
export PREVIEW_DATABASE_NAME="${DATABASE_NAME}"
export PREVIEW_DATABASE_ID="${DATABASE_ID}"

# Build the project before deploying so we ship fresh assets.
npm run build

# Apply migrations to the preview database then deploy.
"${WRANGLER_BIN}" d1 migrations apply DB \
  --config "${BASE_CONFIG}" \
  --env preview \
  --remote

"${WRANGLER_BIN}" deploy \
  --config "${BASE_CONFIG}" \
  --env preview

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
