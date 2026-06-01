#!/usr/bin/env bash
#
# Turnkey runner for the SecureLearning live demo.
#
#   ./demo/run.sh              # headed, paced for an audience (default)
#   HEADLESS=1 ./demo/run.sh   # no visible browser
#   ./demo/run.sh --setup      # (re)create the venv + browser, then run
#
# Any extra args/env vars are passed straight through to live_demo.py
# (WEB_URL, CM_USER, CM_PASS, SLOWMO, PACE — see live_demo.py header).

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
VENV="$HERE/.venv"
PY="$VENV/bin/python"
COMPOSE="$ROOT/deployment/docker-compose.dev.yml"
WEB_URL="${WEB_URL:-http://localhost:5173}"

# ── Optional: build the venv + browser from scratch ───────────────────────────
if [[ "${1:-}" == "--setup" || ! -x "$PY" ]]; then
  echo "▶ Setting up Python venv at $VENV"
  python3 -m venv "$VENV"
  "$VENV/bin/pip" install -q --upgrade pip
  "$VENV/bin/pip" install -q -r "$HERE/requirements.txt"
  "$PY" -m playwright install chromium
  [[ "${1:-}" == "--setup" ]] && shift
fi

# ── Preflight: is the app up? ─────────────────────────────────────────────────
if ! curl -sf -o /dev/null --max-time 5 "$WEB_URL"; then
  echo "✖ App not reachable at $WEB_URL"
  echo "  Start the stack first:"
  echo "    cp deployment/.env.dev.example deployment/.env   # once"
  echo "    docker compose -f $COMPOSE up -d"
  exit 1
fi

# ── Run ───────────────────────────────────────────────────────────────────────
echo "▶ Running live demo against $WEB_URL"
exec "$PY" "$HERE/live_demo.py" "$@"
