#!/usr/bin/env bash
#
# Turnkey runner for the demo playlist (ENTER advances to the next flow).
#
#   ./demo/run_play.sh              # headed, waits on ENTER between flows
#   AUTO=1 ./demo/run_play.sh       # play all flows with no pauses
#   ./demo/run_play.sh --setup      # (re)create the venv + browser, then run
#
# Prereqs (see demo/README.md): stack up, populate.py has seeded the `ua`
# realm + users.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
VENV="$HERE/.venv"
PY="$VENV/bin/python"
COMPOSE="$ROOT/deployment/docker-compose.dev.yml"
WEB_URL="${WEB_URL:-http://localhost:5173}"

if [[ "${1:-}" == "--setup" || ! -x "$PY" ]]; then
  echo "▶ Setting up Python venv at $VENV"
  python3 -m venv "$VENV"
  "$VENV/bin/pip" install -q --upgrade pip
  "$VENV/bin/pip" install -q -r "$HERE/requirements.txt"
  "$PY" -m playwright install chromium
  [[ "${1:-}" == "--setup" ]] && shift
fi

if ! curl -sf -o /dev/null --max-time 5 "$WEB_URL"; then
  echo "✖ App not reachable at $WEB_URL"
  echo "  Start the stack:  docker compose -f $COMPOSE up -d"
  exit 1
fi

echo "▶ Running demo playlist against $WEB_URL"
exec "$PY" "$HERE/play.py" "$@"
