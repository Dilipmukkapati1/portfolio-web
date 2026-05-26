#!/usr/bin/env bash
# Deploy portfolio-web to Azure Static Web Apps (dev or prod).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=scripts/lib/terraform-outputs.sh
source "$ROOT/scripts/lib/terraform-outputs.sh"

DEPLOY_ENV=""
SKIP_BUILD=false
STAGING_DIR=""

usage() {
  cat <<'EOF'
Usage: scripts/deploy.sh <dev|prod> [--skip-build]

Deploy the web app to Azure Static Web Apps (same flow as CI).

Examples:
  npm run deploy:dev
  npm run deploy:prod
  npm run deploy -- dev --skip-build

Prerequisites:
  az login, terraform outputs (portfolio-infra applied), Node 20+
EOF
  exit 1
}

confirm_prod_deploy() {
  local confirm=""
  read -r -p "Type 'prod' to deploy to production: " confirm
  if [[ "$confirm" != "prod" ]]; then
    echo "Aborted: production deploy not confirmed." >&2
    exit 1
  fi
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      dev|prod)
        DEPLOY_ENV="$1"
        shift
        ;;
      --skip-build) SKIP_BUILD=true; shift ;;
      -h|--help) usage ;;
      *)
        echo "Unknown argument: $1" >&2
        usage
        ;;
    esac
  done
  if [[ -z "$DEPLOY_ENV" ]]; then
    echo "Environment required: dev or prod" >&2
    usage
  fi
}

require_az_cli() {
  if ! command -v az >/dev/null 2>&1; then
    echo "Azure CLI (az) is required. Install and run: az login" >&2
    exit 1
  fi
  if ! az account show >/dev/null 2>&1; then
    echo "Not logged in to Azure. Run: az login" >&2
    exit 1
  fi
}

set_next_public_env() {
  local api_url
  api_url="$(tf_function_app_url "$DEPLOY_ENV")"

  export NEXT_PUBLIC_API_URL="${api_url}/api"

  if [[ "$DEPLOY_ENV" == "prod" ]]; then
    export NEXT_PUBLIC_APP_ENV=production
    export NEXT_PUBLIC_DEFAULT_HOUSEHOLD_ID=prod-household
  else
    export NEXT_PUBLIC_APP_ENV=development
    export NEXT_PUBLIC_DEFAULT_HOUSEHOLD_ID=dev-household
  fi

  echo "Build env:"
  echo "  NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}"
  echo "  NEXT_PUBLIC_APP_ENV=${NEXT_PUBLIC_APP_ENV}"
  echo "  NEXT_PUBLIC_DEFAULT_HOUSEHOLD_ID=${NEXT_PUBLIC_DEFAULT_HOUSEHOLD_ID}"
}

build_web() {
  echo "Building portfolio-web..."
  (cd "$ROOT" && npm ci && npm run build)
}

fetch_swa_deployment_token() {
  local rg swa_name
  rg="$(tf_resource_group_name)"
  swa_name="$(tf_static_web_app_name "$DEPLOY_ENV")"

  az staticwebapp secrets list \
    --name "$swa_name" \
    -g "$rg" \
    --query properties.apiKey \
    -o tsv
}

deploy_static_web_app() {
  local token hostname
  token="$(fetch_swa_deployment_token)"
  if [[ -z "$token" ]]; then
    echo "Failed to fetch Static Web Apps deployment token." >&2
    exit 1
  fi

  # SWA CLI fails when cwd is inside the app folder (artifact path conflict).
  # Deploy from a temp parent directory via symlink (same layout as CI upload).
  STAGING_DIR="$(mktemp -d "${TMPDIR:-/tmp}/ppm-swa-deploy.XXXXXX")"
  cleanup_staging() {
    if [[ -n "$STAGING_DIR" ]]; then
      rm -rf "$STAGING_DIR"
    fi
  }
  trap cleanup_staging EXIT
  ln -sf "$ROOT" "$STAGING_DIR/web"

  echo "Deploying to Static Web App (${DEPLOY_ENV})..."
  (
    cd "$STAGING_DIR"
    npx --yes @azure/static-web-apps-cli deploy \
      --app-location web \
      --env production \
      --deployment-token "$token"
  )

  hostname="$(tf_static_web_app_hostname "$DEPLOY_ENV")"
  echo ""
  echo "Deploy complete."
  echo "  Site: https://${hostname}"
}

main() {
  parse_args "$@"

  if [[ "$DEPLOY_ENV" == "prod" ]]; then
    confirm_prod_deploy
  fi

  require_az_cli
  require_terraform_outputs
  set_next_public_env

  if [[ "$SKIP_BUILD" != true ]]; then
    build_web
  fi

  deploy_static_web_app
}

main "$@"
