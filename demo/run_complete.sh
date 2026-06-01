#!/usr/bin/env bash
#
# Turnkey runner for the normal-user course-completion demo.
#
#   ./demo/run_complete.sh             # headed (default)
#   HEADLESS=1 ./demo/run_complete.sh  # no visible browser
#   ./demo/run_complete.sh --setup     # (re)create the venv + browser, then run
#
# Prereqs (see demo/README.md): stack up, populate.py has seeded the `ua`
# realm + users, and live_demo.py has created a "Security Essentials (demo …)"
# course. Extra env vars (LEARNER_USER, COURSE_PREFIX, …) pass straight through.

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

echo "▶ Running course-completion demo against $WEB_URL"
exec "$PY" "$HERE/complete_course.py" "$@"
