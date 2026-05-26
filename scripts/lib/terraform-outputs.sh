# Shared helpers for reading portfolio-infra Terraform outputs.
# Source from other scripts: source "$(dirname "$0")/lib/terraform-outputs.sh"

_tf_outputs_lib_dir() {
  cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd
}

portfolio_web_resolve_infra_tf_dir() {
  local web_root
  web_root="$(_tf_outputs_lib_dir)"
  local infra_tf="${PORTFOLIO_INFRA_TF_DIR:-$web_root/../portfolio-infra/terraform}"
  cd "$infra_tf" && pwd
}

require_terraform_outputs() {
  if ! command -v terraform >/dev/null 2>&1; then
    echo "terraform is required on PATH." >&2
    exit 1
  fi
  if ! command -v jq >/dev/null 2>&1; then
    echo "jq is required. Install with: brew install jq" >&2
    exit 1
  fi
  local tf_dir
  tf_dir="$(portfolio_web_resolve_infra_tf_dir)"
  if [[ ! -d "$tf_dir" ]]; then
    echo "portfolio-infra/terraform not found at: $tf_dir" >&2
    echo "Clone portfolio-infra as a sibling of portfolio-web." >&2
    exit 1
  fi
  export PORTFOLIO_INFRA_TF_DIR="$tf_dir"
}

tf_output_raw() {
  local name="$1"
  terraform -chdir="${PORTFOLIO_INFRA_TF_DIR}" output -raw "$name"
}

tf_output_raw_optional() {
  local name="$1"
  tf_output_raw "$name" 2>/dev/null || true
}

require_tf_output() {
  local name="$1"
  local hint="${2:-Run: cd portfolio-infra && make apply-dev}"
  if ! tf_output_raw "$name" >/dev/null 2>&1; then
    echo "Terraform output '$name' not found. $hint" >&2
    exit 1
  fi
}

validate_deploy_env() {
  local env="$1"
  case "$env" in
    dev|prod) return 0 ;;
    *)
      echo "Invalid environment '$env'. Use: dev or prod" >&2
      return 1
      ;;
  esac
}

tf_resource_group_name() {
  local rg
  rg="$(tf_output_raw_optional resource_group_name)"
  if [[ -n "$rg" ]]; then
    echo "$rg"
    return
  fi
  echo "rg-portfolio"
}

tf_function_app_url() {
  local env="$1"
  validate_deploy_env "$env"
  require_tf_output "${env}_function_app_url" "Run: cd portfolio-infra && make apply-${env}"
  tf_output_raw "${env}_function_app_url"
}

tf_static_web_app_name() {
  local env="$1"
  validate_deploy_env "$env"
  require_tf_output "${env}_static_web_app_name" "Run: cd portfolio-infra && make apply-${env}"
  tf_output_raw "${env}_static_web_app_name"
}

tf_static_web_app_hostname() {
  local env="$1"
  validate_deploy_env "$env"
  require_tf_output "${env}_static_web_app_hostname" "Run: cd portfolio-infra && make apply-${env}"
  tf_output_raw "${env}_static_web_app_hostname"
}
