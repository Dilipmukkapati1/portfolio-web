#!/usr/bin/env bash
# Deploy portfolio-web to Azure Static Web Apps (dev or prod).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=scripts/lib/terraform-outputs.sh
source "$ROOT/scripts/lib/terraform-outputs.sh"

DEPLOY_ENV=""
SKIP_BUILD=false
FORCE_BUILD=false
FORCE_INSTALL=false

usage() {
  cat <<'EOF'
Usage: scripts/deploy.sh <dev|prod> [--skip-build] [--build] [--install]

Deploy the web app to Azure Static Web Apps (same flow as CI).

Examples:
  npm run deploy:dev
  npm run deploy:prod
  npm run deploy -- dev --skip-build
  npm run deploy -- dev --build        # force rebuild
  npm run deploy -- dev --install      # force npm ci before build

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
      --build) FORCE_BUILD=true; shift ;;
      --install) FORCE_INSTALL=true; shift ;;
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
  # shellcheck source=scripts/lib/build-if-needed.sh
  source "$ROOT/scripts/lib/build-if-needed.sh"
  local force=0
  local force_install=0
  [[ "$FORCE_BUILD" == true ]] && force=1
  [[ "$FORCE_INSTALL" == true ]] && force_install=1
  build_web_if_needed "$ROOT" "$force" "$force_install"
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

  # Hybrid Next.js: deploy app root with .next/standalone (see next.config output: standalone).
  if [[ ! -d "$ROOT/.next/standalone" ]]; then
    echo "Missing .next/standalone. Run npm run build before deploy." >&2
    exit 1
  fi
  rm -rf "$ROOT/.swa-deploy"

  echo "Deploying to Static Web App (${DEPLOY_ENV})..."
  (
    cd "$ROOT"
    npx --yes @azure/static-web-apps-cli@2.0.9 deploy \
      --config swa-cli.config.json \
      --app-location . \
      --output-location "" \
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
