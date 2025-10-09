#!/usr/bin/env bash
set -euo pipefail

# Removes PR-specific preview Worker and D1 database.
# Required env vars:
#   PR_NUMBER             - Pull request number whose preview should be deleted
#   CLOUDFLARE_ACCOUNT_ID - Cloudflare account id
# Optional env vars:
#   PREVIEW_NAME_PREFIX   - Prefix used during deploy (default: life-admin)

PR_NUMBER="${PR_NUMBER:-}"
CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-}"
PREVIEW_NAME_PREFIX="${PREVIEW_NAME_PREFIX:-life-admin}"
BASE_CONFIG="wrangler.toml"

# Ensure local node_modules binaries (wrangler) are available in PATH.
export PATH="${PATH}:$(npm bin 2>/dev/null || printf './node_modules/.bin')"

if [[ -z "${PR_NUMBER}" ]]; then
  echo "PR_NUMBER is required" >&2
  exit 1
fi

if [[ -z "${CLOUDFLARE_ACCOUNT_ID}" ]]; then
  echo "CLOUDFLARE_ACCOUNT_ID is required" >&2
  exit 1
fi

WORKER_NAME="${PREVIEW_NAME_PREFIX}-pr-${PR_NUMBER}"
DB_NAME="${PREVIEW_NAME_PREFIX//-/}_pr_${PR_NUMBER}"

if [[ ! -f "${BASE_CONFIG}" ]]; then
  echo "Base wrangler config ${BASE_CONFIG} not found" >&2
  exit 1
fi

# Delete Worker (ignore errors if already gone)
wrangler \
  --config "${BASE_CONFIG}" \
  --account-id "${CLOUDFLARE_ACCOUNT_ID}" \
  delete "${WORKER_NAME}" || true

# Delete D1 database if it exists
DB_ENTRY=$(wrangler \
  --config "${BASE_CONFIG}" \
  --account-id "${CLOUDFLARE_ACCOUNT_ID}" \
  d1 list --output json | jq --arg name "${DB_NAME}" '.result[] | select(.name == $name)')

if [[ -n "${DB_ENTRY}" ]]; then
  DB_ID=$(echo "${DB_ENTRY}" | jq -r '.uuid // .id')
  if [[ -n "${DB_ID}" && "${DB_ID}" != "null" ]]; then
    wrangler \
      --config "${BASE_CONFIG}" \
      --account-id "${CLOUDFLARE_ACCOUNT_ID}" \
      d1 delete "${DB_ID}" || true
  fi
fi

echo "Preview resources for PR #${PR_NUMBER} removed"
