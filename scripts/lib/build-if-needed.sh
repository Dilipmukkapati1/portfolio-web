#!/usr/bin/env bash
# Fast path for deploy: skip npm ci / next build when inputs are unchanged.

web_deploy_fingerprint() {
  local root="$1"
  {
    echo "next-public-api-url=${NEXT_PUBLIC_API_URL:-}"
    echo "next-public-app-env=${NEXT_PUBLIC_APP_ENV:-}"
    echo "next-public-household=${NEXT_PUBLIC_DEFAULT_HOUSEHOLD_ID:-}"
    cat "$root/package.json" "$root/package-lock.json" "$root/next.config.ts" 2>/dev/null
    if [[ -f "$root/../portfolio-contracts/package.json" ]]; then
      cat "$root/../portfolio-contracts/package.json"
      find "$root/../portfolio-contracts/src" -type f 2>/dev/null | sort | while read -r f; do
        shasum -a 256 "$f" 2>/dev/null
      done
    fi
    find "$root/src" -type f 2>/dev/null | sort | while read -r f; do
      shasum -a 256 "$f" 2>/dev/null
    done
  } | shasum -a 256 | awk '{print $1}'
}

ensure_web_deps() {
  local root="$1"
  local force_install="${2:-0}"
  if [[ "$force_install" == "1" ]] || [[ ! -d "$root/node_modules" ]]; then
    echo "Installing portfolio-web dependencies..."
    (cd "$root" && npm ci)
    return
  fi
  echo "Using existing node_modules (pass --install to force npm ci)"
}

ensure_contracts_built() {
  local contracts="$1/../portfolio-contracts"
  if [[ ! -f "$contracts/dist/index.js" ]]; then
    echo "Building portfolio-contracts..."
    (cd "$contracts" && npm run build)
  fi
}

build_web_if_needed() {
  local root="$1"
  local force="${2:-0}"
  local force_install="${3:-0}"
  local fp_file="$root/.local/deploy-fingerprint"
  local fp
  fp="$(web_deploy_fingerprint "$root")"

  mkdir -p "$root/.local"

  if [[ "$force" != "1" ]] && [[ -f "$fp_file" ]] && [[ "$(cat "$fp_file")" == "$fp" ]] \
    && [[ -d "$root/.next/standalone" ]]; then
    echo "Skipping build (sources and env unchanged — use --build to force)"
    return 0
  fi

  ensure_web_deps "$root" "$force_install"
  ensure_contracts_built "$root"

  echo "Building portfolio-web..."
  (cd "$root" && npm run build)

  echo "$fp" >"$fp_file"
}
