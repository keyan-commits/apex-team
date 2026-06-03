#!/usr/bin/env bash
# Recover apex-team dev server from stale Next.js lockfile + dead PIDs.
#
# Used when /api/health returns 000 (server not responding) after a
# `.restart-trigger` bump or a crash leaves the .next/dev/ lockfile
# pointing at a dead PID. Idempotent — safe to run multiple times.
#
# What it does:
#   1. Reads any PIDs recorded in .next/dev/lock and kills them (if alive).
#   2. Kills any tsx/next-server processes attached to apex-team.
#   3. Removes the stale dev-supervisor child if it stopped respawning.
#   4. Deletes .next/dev/ (the lockfile lives here).
#   5. Starts `pnpm dev:supervised` detached, redirecting logs.
#   6. Polls /api/health for up to 60s, exits 0 on first 200 OR 1 on timeout.
#
# Usage: ./scripts/recover-dev-server.sh
# Filed against #270 (Wave 103) — the script is the workaround until the
# supervisor itself handles stale lockfile cleanup.

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 1

log() { printf "[recover] %s\n" "$*" >&2; }

# 1. Kill PIDs recorded in .next/dev/lock (if any)
if [ -f .next/dev/lock ]; then
  while IFS= read -r pid; do
    [ -n "$pid" ] || continue
    if [[ "$pid" =~ ^[0-9]+$ ]] && kill -0 "$pid" 2>/dev/null; then
      log "killing PID $pid from .next/dev/lock"
      kill "$pid" 2>/dev/null || true
    fi
  done <.next/dev/lock
fi

# 2. Kill all tsx server.ts / next-server / dev-supervisor processes for THIS repo
# (excluding our own pid and parent so we don't kill ourselves)
SELF_PID=$$
PARENT_PID=$PPID
for pat in "tsx server.ts" "next-server" "scripts/dev-supervisor.mjs"; do
  for pid in $(ps -e -o pid=,command= | grep -E "$pat" | grep "$ROOT" | awk '{print $1}'); do
    [ "$pid" = "$SELF_PID" ] && continue
    [ "$pid" = "$PARENT_PID" ] && continue
    if kill -0 "$pid" 2>/dev/null; then
      log "killing PID $pid (matched: $pat)"
      kill "$pid" 2>/dev/null || true
    fi
  done
done

# Give them a moment to exit cleanly
sleep 2

# 3. Force-kill anything still attached (SIGKILL)
for pat in "tsx server.ts" "next-server" "scripts/dev-supervisor.mjs"; do
  for pid in $(ps -e -o pid=,command= | grep -E "$pat" | grep "$ROOT" | awk '{print $1}'); do
    [ "$pid" = "$SELF_PID" ] && continue
    [ "$pid" = "$PARENT_PID" ] && continue
    if kill -0 "$pid" 2>/dev/null; then
      log "SIGKILL PID $pid (matched: $pat)"
      kill -9 "$pid" 2>/dev/null || true
    fi
  done
done

# 4. Delete the lockfile + dev cache
if [ -d .next/dev ]; then
  log "rm -rf .next/dev"
  rm -rf .next/dev
fi

# 5. Start the supervised dev server detached. nohup keeps it alive past
# this script's exit. Redirect output so the supervisor can run forever.
mkdir -p .recover-logs
LOGFILE=".recover-logs/dev-supervised-$(date +%Y%m%d-%H%M%S).log"
log "starting pnpm dev:supervised → $LOGFILE"
nohup pnpm dev:supervised >"$LOGFILE" 2>&1 &
SERVER_PID=$!
log "supervisor PID=$SERVER_PID"

# 6. Poll /api/health for up to 60s
log "waiting for /api/health to return 200…"
for i in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")
  if [ "$code" = "200" ]; then
    log "✓ server healthy (took ${i}×2s)"
    log "tail of log:"
    tail -5 "$LOGFILE" 2>/dev/null || true
    exit 0
  fi
  sleep 2
done

log "✗ server did not become healthy within 60s. tail of log:"
tail -30 "$LOGFILE" 2>/dev/null || true
exit 1
