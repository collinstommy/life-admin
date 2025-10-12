#!/usr/bin/env bash
set -euo pipefail

# Deploys a PR-specific preview Worker and D1 database.
# Required env vars:
#   PR_NUMBER                - Pull request number (used for naming resources)
#   CLOUDFLARE_ACCOUNT_ID    - Cloudflare account id for wrangler commands
#   CLOUDFLARE_API_TOKEN     - Token with Workers + D1 permissions (already used by wrangler)
#   CLOUDFLARE_WORKER_SUBDOMAIN - Workers.dev subdomain (for constructing the preview URL)
# Optional env vars:
#   PREVIEW_NAME_PREFIX      - Prefix for Worker and DB (default: life-admin)
#   PREVIEW_MIGRATIONS_DIR   - Directory with migrations (default: drizzle/migrations)
#   GITHUB_OUTPUT            - GitHub Actions output file (if present, script writes outputs here)

PR_NUMBER="${PR_NUMBER:-}"
CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-}"
CLOUDFLARE_WORKER_SUBDOMAIN="${CLOUDFLARE_WORKER_SUBDOMAIN:-}"
PREVIEW_NAME_PREFIX="${PREVIEW_NAME_PREFIX:-life-admin}"
PREVIEW_MIGRATIONS_DIR="${PREVIEW_MIGRATIONS_DIR:-drizzle/migrations}"
BASE_CONFIG="wrangler.toml"
TEMP_CONFIG="wrangler.preview.toml"

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

if [[ -z "${CLOUDFLARE_WORKER_SUBDOMAIN}" ]]; then
  echo "CLOUDFLARE_WORKER_SUBDOMAIN is required" >&2
  exit 1
fi

if [[ ! -f "${BASE_CONFIG}" ]]; then
  echo "Base wrangler config ${BASE_CONFIG} not found" >&2
  exit 1
fi

WORKER_NAME="${PREVIEW_NAME_PREFIX}-pr-${PR_NUMBER}"
DB_NAME="${PREVIEW_NAME_PREFIX//-/}_pr_${PR_NUMBER}"

cleanup() {
  rm -f "${TEMP_CONFIG}"
}
trap cleanup EXIT

mkdir -p "$(dirname "${TEMP_CONFIG}")"
cp "${BASE_CONFIG}" "${TEMP_CONFIG}"

# Ensure migrations directory exists before we proceed.
if [[ ! -d "${PREVIEW_MIGRATIONS_DIR}" ]]; then
  echo "Migrations directory ${PREVIEW_MIGRATIONS_DIR} not found" >&2
  exit 1
fi

# Create (or fetch existing) D1 database for this PR
CREATE_OUTPUT=$(${WRANGLER_BIN} \
  --config "${BASE_CONFIG}" \
  --account-id "${CLOUDFLARE_ACCOUNT_ID}" \
  d1 create "${DB_NAME}" --output json || true)

# If the DB already exists, wrangler exits 1 but still prints JSON in stderr; re-run list as fallback.
if [[ -z "${CREATE_OUTPUT}" ]]; then
  CREATE_OUTPUT=$(${WRANGLER_BIN} \
    --config "${BASE_CONFIG}" \
    --account-id "${CLOUDFLARE_ACCOUNT_ID}" \
    d1 list --output json | jq --arg name "${DB_NAME}" '.result[] | select(.name == $name)')
  if [[ -z "${CREATE_OUTPUT}" ]]; then
    echo "Failed to create or locate D1 database ${DB_NAME}" >&2
    exit 1
  fi
fi

DATABASE_ID=$(echo "${CREATE_OUTPUT}" | jq -r '.result.uuid // .uuid // .id')
DATABASE_NAME=$(echo "${CREATE_OUTPUT}" | jq -r '.result.name // .name')

if [[ -z "${DATABASE_ID}" || "${DATABASE_ID}" == "null" ]]; then
  echo "Could not determine database id for ${DB_NAME}" >&2
  exit 1
fi

cat <<EOF_CONFIG >> "${TEMP_CONFIG}"
[env.preview]
name = "${WORKER_NAME}"

[[env.preview.d1_databases]]
binding = "DB"
database_name = "${DATABASE_NAME}"
database_id = "${DATABASE_ID}"
migrations_dir = "${PREVIEW_MIGRATIONS_DIR}"
EOF_CONFIG

# Build the project before deploying so we ship fresh assets.
npm run build

# Apply migrations to the preview database then deploy.
"${WRANGLER_BIN}" \
  --config "${TEMP_CONFIG}" \
  --account-id "${CLOUDFLARE_ACCOUNT_ID}" \
  d1 migrations apply DB --remote --env preview

"${WRANGLER_BIN}" \
  --config "${TEMP_CONFIG}" \
  --account-id "${CLOUDFLARE_ACCOUNT_ID}" \
  deploy --env preview --name "${WORKER_NAME}"

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
