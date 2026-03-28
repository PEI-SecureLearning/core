#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

usage() {
  cat <<'EOF'
Usage:
  scripts/import-prod-example-secrets.sh [--repo owner/name] [--dry-run] [--env-file path ...]

Description:
  Reads variable names from deployment/.env.prod.example and uploads matching
  values to GitHub Actions secrets.

Value resolution order:
  1. Current shell environment
  2. Variables loaded from --env-file entries
  3. Variables loaded from deployment/.env, if it exists

Requirements:
  - gh CLI installed and authenticated
  - Repository access to set GitHub secrets

Examples:
  scripts/import-prod-example-secrets.sh
  scripts/import-prod-example-secrets.sh --dry-run
  scripts/import-prod-example-secrets.sh --repo PEI-SecureLearning/Core
  scripts/import-prod-example-secrets.sh --env-file deployment/.env
EOF
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

trim() {
  local value="$1"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  printf '%s' "$value"
}

strip_quotes() {
  local value="$1"
  if [[ "$value" == \"*\" && "$value" == *\" ]]; then
    value="${value:1:${#value}-2}"
  elif [[ "$value" == \'*\' && "$value" == *\' ]]; then
    value="${value:1:${#value}-2}"
  fi
  printf '%s' "$value"
}

parse_env_file() {
  local env_file="$1"
  [[ -f "$env_file" ]] || return 0

  while IFS= read -r raw_line || [[ -n "$raw_line" ]]; do
    local line
    line="$(trim "$raw_line")"

    [[ -n "$line" ]] || continue
    [[ "$line" =~ ^# ]] && continue
    [[ "$line" == export\ * ]] && line="${line#export }"
    [[ "$line" == *=* ]] || continue

    local key="${line%%=*}"
    local value="${line#*=}"
    key="$(trim "$key")"
    value="$(trim "$value")"
    value="$(strip_quotes "$value")"

    [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue
    FILE_VALUES["$key"]="$value"
  done < "$env_file"
}

resolve_repo() {
  if [[ -n "$REPO" ]]; then
    printf '%s' "$REPO"
    return 0
  fi

  local remote_url
  remote_url="$(git -C "$ROOT_DIR" remote get-url origin 2>/dev/null || true)"

  if [[ "$remote_url" =~ github\.com[:/]([^/]+/[^/.]+)(\.git)?$ ]]; then
    printf '%s' "${BASH_REMATCH[1]}"
    return 0
  fi

  echo "Could not determine GitHub repository from origin remote. Pass --repo owner/name." >&2
  exit 1
}

REPO=""
DRY_RUN="false"
declare -a ENV_FILES=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo)
      REPO="${2:-}"
      shift 2
      ;;
    --env-file)
      ENV_FILES+=("${2:-}")
      shift 2
      ;;
    --dry-run)
      DRY_RUN="true"
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

require_cmd git
require_cmd gh

if [[ ${#ENV_FILES[@]} -eq 0 ]]; then
  [[ -f "$ROOT_DIR/deployment/.env" ]] && ENV_FILES+=("$ROOT_DIR/deployment/.env")
fi

declare -A FILE_VALUES=()
declare -A PROD_KEYS=()

for env_file in "${ENV_FILES[@]}"; do
  parse_env_file "$env_file"
done

EXAMPLE_FILE="$ROOT_DIR/deployment/.env.prod.example"

if [[ ! -f "$EXAMPLE_FILE" ]]; then
  echo "Missing $EXAMPLE_FILE" >&2
  exit 1
fi

while IFS= read -r raw_line || [[ -n "$raw_line" ]]; do
  line="$(trim "$raw_line")"
  [[ -n "$line" ]] || continue
  [[ "$line" =~ ^# ]] && continue
  [[ "$line" == export\ * ]] && line="${line#export }"
  [[ "$line" == *=* ]] || continue

  key="${line%%=*}"
  key="$(trim "$key")"
  [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue
  PROD_KEYS["$key"]=1
done < "$EXAMPLE_FILE"

if [[ ${#PROD_KEYS[@]} -eq 0 ]]; then
  echo "No secret keys found in $EXAMPLE_FILE" >&2
  exit 1
fi

REPO="$(resolve_repo)"

declare -a uploaded=()
declare -a missing=()

while IFS= read -r key; do
  value="${!key-}"
  if [[ -z "${value}" && -v FILE_VALUES["$key"] ]]; then
    value="${FILE_VALUES[$key]}"
  fi

  if [[ -z "${value}" ]]; then
    missing+=("$key")
    continue
  fi

  if [[ "$DRY_RUN" == "true" ]]; then
    echo "[dry-run] would set secret $key in $REPO"
  else
    gh secret set "$key" --repo "$REPO" --body "$value"
    echo "Set secret $key in $REPO"
  fi
  uploaded+=("$key")
done < <(printf '%s\n' "${!PROD_KEYS[@]}" | sort)

echo
echo "Processed ${#PROD_KEYS[@]} secret name(s)."
echo "Uploaded ${#uploaded[@]} secret(s)."

if [[ ${#missing[@]} -gt 0 ]]; then
  echo "Skipped ${#missing[@]} missing value(s):"
  printf '  %s\n' "${missing[@]}"
fi
