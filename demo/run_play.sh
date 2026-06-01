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
export HEADLESS="${HEADLESS:-0}"

# Parse arguments
DEMO_MODE=0
SETUP_MODE=0
CLEAN_ARGS=()

for arg in "$@"; do
  if [[ "$arg" == "--demo" ]]; then
    DEMO_MODE=1
  elif [[ "$arg" == "--setup" ]]; then
    SETUP_MODE=1
  else
    CLEAN_ARGS+=("$arg")
  fi
done

# If --demo is passed, export environment variables for smooth, automated presentation pacing
if [[ "$DEMO_MODE" -eq 1 ]]; then
  export AUTO=1
  export HEADLESS=0
  export SLOWMO=700
  export PACE=1.4
  echo "▶ Demo mode activated: Automated, headed play with premium slow-mo pacing!"
fi

# 1. Bring down the existing stack and prune volumes to start from a clean slate
echo "▶ Tearing down the Docker Compose environment and pruning volumes..."
docker compose -f "$COMPOSE" down -v

# 2. Build and start the stack
echo "▶ Building and starting the SecureLearning stack..."
docker compose -f "$COMPOSE" up -d --build

# 3. Wait for the web portal/frontend to become fully responsive
echo -n "▶ Waiting for the frontend to be ready at $WEB_URL..."
until curl -sf -o /dev/null --max-time 2 "$WEB_URL"; do
  echo -n "."
  sleep 2
done
echo " Ready!"

# 4. Perform Python venv setup for playwright if needed
if [[ "$SETUP_MODE" -eq 1 || ! -x "$PY" ]]; then
  echo "▶ Setting up Python venv at $VENV"
  python3 -m venv "$VENV"
  "$VENV/bin/pip" install -q --upgrade pip
  "$VENV/bin/pip" install -q -r "$HERE/requirements.txt"
  "$PY" -m playwright install chromium
fi

# 5. Populate/seed the database using populate.py
echo "▶ Running database population (populate.py)..."
(
  cd "$ROOT"
  if [[ -d "$ROOT/venv" ]]; then
    "$ROOT/venv/bin/python3" "$ROOT/populate.py"
  else
    python3 "$ROOT/populate.py"
  fi
)

# 5b. Wait for user to press Enter before starting tests (skipped in demo/auto mode)
if [[ "$DEMO_MODE" -eq 0 ]]; then
  echo ""
  read -r -p "▶ Database populated successfully! Press [Enter] to launch the Playwright playlist..."
fi

# 6. Run the Playwright playlist in order
echo "▶ Running demo playlist against $WEB_URL"
exec "$PY" "$HERE/play.py" "${CLEAN_ARGS[@]:-}"
