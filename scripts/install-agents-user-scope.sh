#!/usr/bin/env bash
# Symlink apex-team's project-scoped Claude Code subagents into
# ~/.claude/agents/ so they're available in every Claude Code session.
#
# Idempotent. Safe to re-run.
#
# Usage:
#   bash scripts/install-agents-user-scope.sh
#   bash scripts/install-agents-user-scope.sh --uninstall

set -euo pipefail
shopt -s nullglob

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SRC_DIR="$(cd "$SCRIPT_DIR/.." && pwd)/.claude/agents"
DST_DIR="$HOME/.claude/agents"

uninstall=0
case "${1:-}" in
  --uninstall) uninstall=1 ;;
  --help|-h)
    echo "Usage: $0 [--uninstall]"
    exit 0
    ;;
  "") ;;
  *)
    echo "Unknown arg: $1 (try --help)" >&2
    exit 2
    ;;
esac

log() { printf "[install-agents] %s\n" "$*"; }

if [ ! -d "$SRC_DIR" ]; then
  log "error: source not found: $SRC_DIR"
  log "expected apex-team's .claude/agents/ relative to this script"
  exit 1
fi

mkdir -p "$DST_DIR"

if [ "$uninstall" -eq 1 ]; then
  log "uninstalling: removing symlinks in $DST_DIR that point into $SRC_DIR"
  removed=0
  kept=0
  for link in "$DST_DIR"/*.md; do
    if [ ! -L "$link" ]; then
      kept=$((kept+1))
      continue
    fi
    target="$(readlink "$link")"
    case "$target" in
      "$SRC_DIR"/*)
        rm "$link"
        log "  removed   $(basename "$link")"
        removed=$((removed+1))
        ;;
      *)
        kept=$((kept+1))
        ;;
    esac
  done
  echo
  log "$removed removed, $kept kept (non-apex-team)."
  exit 0
fi

log "source: $SRC_DIR"
log "target: $DST_DIR"

installed=0
refreshed=0
already=0
warned=0

for src in "$SRC_DIR"/*.md; do
  name="$(basename "$src")"
  dst="$DST_DIR/$name"
  if [ -L "$dst" ]; then
    current="$(readlink "$dst")"
    if [ "$current" = "$src" ]; then
      already=$((already+1))
      continue
    fi
    ln -sf "$src" "$dst"
    log "  refreshed $name (was → $current)"
    refreshed=$((refreshed+1))
  elif [ -e "$dst" ]; then
    log "  WARNING:  $name already exists at $dst as a real file; not overwriting"
    warned=$((warned+1))
  else
    ln -s "$src" "$dst"
    log "  installed $name"
    installed=$((installed+1))
  fi
done

echo
log "$installed installed, $refreshed refreshed, $already already current, $warned warnings."
if [ "$installed" -gt 0 ] || [ "$refreshed" -gt 0 ]; then
  log "Restart Claude Code to pick them up."
fi
