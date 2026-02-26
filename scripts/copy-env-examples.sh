#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

copied=0
while IFS= read -r -d '' example_file; do
  target_file="$(dirname "${example_file}")/.env"
  cp -f "${example_file}" "${target_file}"
  echo "Copied ${example_file} -> ${target_file}"
  copied=$((copied + 1))
done < <(find "${ROOT_DIR}" -type f -name ".env.example" -print0)

if [ "${copied}" -eq 0 ]; then
  echo "No .env.example files found."
  exit 1
fi

echo "Created ${copied} .env file(s) from .env.example."
