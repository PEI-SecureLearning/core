#!/usr/bin/env bash
# =============================================================================
# sync-to-repos.sh — Push monorepo changes → split repos
# =============================================================================
# SOURCE OF TRUTH: the monorepo (core-securelearning).
# This script ALWAYS overwrites the split repos with monorepo content.
# Never edit files directly in the split repos — edit in the monorepo and sync.
#
# Run from the ROOT of the core-securelearning monorepo.
#
# Usage:
#   ./sync-to-repos.sh                       # sync all repos
#   ./sync-to-repos.sh platform-api          # sync a single repo
#   ./sync-to-repos.sh --dry-run             # preview without committing
#   ./sync-to-repos.sh platform-api --dry-run
# =============================================================================

set -euo pipefail

ORG="PEI-SecureLearning"
MONOREPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPOS_ROOT="$MONOREPO_ROOT/../pei-repos"
DRY_RUN=false

# Parse flags
TARGET=""
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --*)       echo "Unknown flag: $arg"; exit 1 ;;
    *)
      if [[ -n "$TARGET" ]]; then
        error "Multiple targets specified: '$TARGET' and '$arg'. Please provide at most one non-flag positional argument."
      fi
      TARGET="$arg"
      ;;
  esac
done

# Colors
GREEN='\033[0;32m'; BLUE='\033[0;34m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()    { echo -e "${BLUE}[INFO]${NC}  $1"; }
ok()     { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()   { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
banner() { echo -e "\n${BLUE}==> $1${NC}"; }
dryrun() { echo -e "${YELLOW}[DRY-RUN]${NC} $1"; }

# Commit message stamped with the current monorepo HEAD SHA
MONO_SHA=$(git -C "$MONOREPO_ROOT" rev-parse --short HEAD 2>/dev/null || echo "unknown")
COMMIT_MSG="chore: sync from monorepo @ $MONO_SHA"

# =============================================================================
# sync_subtree <repo-name> <monorepo-src-dir>
#
# Rsyncs <src-dir> into the split repo's working tree, then commits & pushes.
# The monorepo is ALWAYS the source of truth — no pull, no merge.
# =============================================================================
sync_subtree() {
  local REPO="$1"
  local SRC="$2"
  local DEST="$REPOS_ROOT/$REPO"

  banner "$REPO"

  # --- Guards ---
  [ -d "$SRC" ]       || { warn "Source not found: $SRC — skipping $REPO"; return; }
  [ -d "$DEST/.git" ] || { warn "Split repo not found: $DEST — clone it first"; return; }

  # Warn if the split repo has local changes (they will be overwritten)
  if ! git -C "$DEST" diff --quiet || ! git -C "$DEST" diff --cached --quiet; then
    warn "$REPO has uncommitted local changes — they will be overwritten by the sync."
  fi

  # Warn if the split repo has commits that aren't in remote
  # (means someone committed directly there — they should have used the monorepo)
  local UNPUSHED=0
  if git -C "$DEST" rev-parse --verify origin/main >/dev/null 2>&1; then
    UNPUSHED=$(git -C "$DEST" log origin/main..HEAD --oneline | wc -l | tr -d ' ')
  fi
  if [ "$UNPUSHED" -gt 0 ]; then
    warn "$REPO has $UNPUSHED commit(s) not on remote origin/main."
    warn "These came from direct commits to the split repo, NOT the monorepo."
    warn "The monorepo content will still overwrite them. Ctrl+C now to abort."
    sleep 3
  fi

  # --- Rsync: monorepo subtree → split repo working tree ---
  # --delete: removes files in dest that no longer exist in src
  # The trailing slash on SRC copies contents, not the dir itself
  log "Syncing $SRC → $DEST ..."
  rsync -a --delete \
    --exclude='.git/' \
    --exclude='__pycache__/' \
    --exclude='*.py[cod]' \
    --exclude='.venv/' \
    --exclude='node_modules/' \
    --exclude='dist/' \
    --exclude='.vite/' \
    --exclude='coverage/' \
    --exclude='playwright-report/' \
    --exclude='test-results/' \
    --exclude='.pytest_cache/' \
    --exclude='*.egg-info/' \
    --exclude='.env' \
    --exclude='.env.*' \
    "$SRC/" "$DEST/"

  # --- Commit & push ---
  git -C "$DEST" add -A

  if git -C "$DEST" diff --cached --quiet; then
    ok "$REPO — already up to date."
    return
  fi

  if $DRY_RUN; then
    dryrun "$REPO — changes staged but NOT committed (--dry-run):"
    git -C "$DEST" diff --cached --stat
    git -C "$DEST" reset HEAD -- . >/dev/null
    return
  fi

  git -C "$DEST" commit -m "$COMMIT_MSG"
  git -C "$DEST" push origin main
  ok "$REPO — pushed to github.com/$ORG/$REPO"
}

# =============================================================================
# sync_infrastructure
#
# platform-infrastructure is assembled from multiple monorepo subdirs:
#   deployment/  → root of the split repo (compose files, nginx)
#   db/          → db/
#   mongo/       → mongo/
#   rabbitmq/    → rabbitmq/
# Scripts (scripts/) are maintained directly in platform-infrastructure.
# =============================================================================
sync_infrastructure() {
  local REPO="platform-infrastructure"
  local DEST="$REPOS_ROOT/$REPO"

  banner "$REPO"

  [ -d "$DEST/.git" ] || { warn "Split repo not found: $DEST — clone it first"; return; }

  if ! git -C "$DEST" diff --quiet || ! git -C "$DEST" diff --cached --quiet; then
    warn "$REPO has uncommitted local changes — they will be overwritten."
  fi

  local UNPUSHED
  UNPUSHED=$(git -C "$DEST" log origin/main..HEAD --oneline 2>/dev/null | wc -l | tr -d ' ')
  if [ "$UNPUSHED" -gt 0 ]; then
    warn "$REPO has $UNPUSHED commit(s) not on remote. Monorepo content will overwrite. Ctrl+C to abort."
    sleep 3
  fi

  log "Syncing db/, mongo/, rabbitmq/ ..."
  rsync -a --delete --exclude='.git/' "$MONOREPO_ROOT/db/"       "$DEST/db/"
  rsync -a --delete --exclude='.git/' "$MONOREPO_ROOT/mongo/"    "$DEST/mongo/"
  rsync -a --delete --exclude='.git/' "$MONOREPO_ROOT/rabbitmq/" "$DEST/rabbitmq/"

  # Compose files & nginx from monorepo deployment/ (if that dir exists)
  local DEPLOY="$MONOREPO_ROOT/deployment"
  if [ -d "$DEPLOY" ]; then
    log "Syncing deployment/ files (docker-compose, nginx) ..."
    for f in docker-compose.yml docker-compose.dev.yml nginx.conf; do
      if [ -f "$DEPLOY/$f" ]; then
        rsync -a "$DEPLOY/$f" "$DEST/$f" && log "  synced $f"
      else
        if [ -f "$DEST/$f" ]; then
          rm -f "$DEST/$f"
          log "  removed $f (no longer present in monorepo/deployment)"
        fi
      fi
    done
  else
    # If deployment/ is absent in monorepo, ensure these files are not left stale.
    for f in docker-compose.yml docker-compose.dev.yml nginx.conf; do
      if [ -f "$DEST/$f" ]; then
        rm -f "$DEST/$f"
        log "  removed $f (deployment/ directory missing in monorepo)"
      fi
    done
  fi
  # NOTE: scripts/, .env.example, README.md in platform-infrastructure
  # are maintained directly in that repo — we don't touch them here.

  git -C "$DEST" add -A

  if git -C "$DEST" diff --cached --quiet; then
    ok "$REPO — already up to date."
    return
  fi

  if $DRY_RUN; then
    dryrun "$REPO — changes staged but NOT committed (--dry-run):"
    git -C "$DEST" diff --cached --stat
    git -C "$DEST" reset HEAD -- . >/dev/null
    return
  fi

  git -C "$DEST" commit -m "$COMMIT_MSG"
  git -C "$DEST" push origin main
  ok "$REPO — pushed to github.com/$ORG/$REPO"
}

# =============================================================================
# Main
# =============================================================================
$DRY_RUN && log "DRY-RUN mode — no commits or pushes will be made."

run_all() {
  sync_subtree      "platform-api"   "$MONOREPO_ROOT/api"
  sync_subtree      "platform-web"   "$MONOREPO_ROOT/web"
  sync_subtree      "platform-smtp"  "$MONOREPO_ROOT/smtp"
  sync_subtree      "platform-auth"  "$MONOREPO_ROOT/keycloak"
  sync_infrastructure
}

case "$TARGET" in
  "")                        run_all ;;
  "platform-api")            sync_subtree "platform-api"  "$MONOREPO_ROOT/api" ;;
  "platform-web")            sync_subtree "platform-web"  "$MONOREPO_ROOT/web" ;;
  "platform-smtp")           sync_subtree "platform-smtp" "$MONOREPO_ROOT/smtp" ;;
  "platform-auth")           sync_subtree "platform-auth" "$MONOREPO_ROOT/keycloak" ;;
  "platform-infrastructure") sync_infrastructure ;;
  *) error "Unknown repo '$TARGET'. Valid: platform-api, platform-web, platform-smtp, platform-auth, platform-infrastructure" ;;
esac

echo ""
$DRY_RUN && echo -e "${YELLOW}Dry-run complete — nothing was committed.${NC}" \
         || echo -e "${GREEN}Sync complete.${NC}"
