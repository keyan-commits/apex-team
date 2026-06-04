#!/usr/bin/env bash
# Symlink apex-team's project-scoped Claude Code subagents AND skills into
# ~/.claude/agents/ + ~/.claude/skills/ so they're available in every Claude
# Code session.
#
# Idempotent. Safe to re-run.
#
# Usage:
#   bash scripts/install-agents-user-scope.sh
#   bash scripts/install-agents-user-scope.sh --uninstall

set -euo pipefail
shopt -s nullglob

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
AGENTS_SRC_DIR="$REPO_ROOT/.claude/agents"
SKILLS_SRC_DIR="$REPO_ROOT/.claude/skills"
AGENTS_DST_DIR="$HOME/.claude/agents"
SKILLS_DST_DIR="$HOME/.claude/skills"

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

if [ ! -d "$AGENTS_SRC_DIR" ]; then
  log "error: agents source not found: $AGENTS_SRC_DIR"
  log "expected apex-team's .claude/agents/ relative to this script"
  exit 1
fi

mkdir -p "$AGENTS_DST_DIR"
mkdir -p "$SKILLS_DST_DIR"

# ---------------------------------------------------------------------------
# Uninstall — remove apex-team symlinks from agents/ and skills/
# ---------------------------------------------------------------------------

if [ "$uninstall" -eq 1 ]; then
  log "uninstalling agents: removing symlinks in $AGENTS_DST_DIR that point into $AGENTS_SRC_DIR"
  removed=0
  kept=0
  for link in "$AGENTS_DST_DIR"/*.md; do
    if [ ! -L "$link" ]; then
      kept=$((kept+1))
      continue
    fi
    target="$(readlink "$link")"
    case "$target" in
      "$AGENTS_SRC_DIR"/*)
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
  log "agents: $removed removed, $kept kept (non-apex-team)."

  if [ -d "$SKILLS_SRC_DIR" ]; then
    log "uninstalling skills: removing symlinks in $SKILLS_DST_DIR that point into $SKILLS_SRC_DIR"
    s_removed=0
    s_kept=0
    for link in "$SKILLS_DST_DIR"/*; do
      if [ ! -L "$link" ]; then
        s_kept=$((s_kept+1))
        continue
      fi
      target="$(readlink "$link")"
      case "$target" in
        "$SKILLS_SRC_DIR"/*)
          rm "$link"
          log "  removed   $(basename "$link")"
          s_removed=$((s_removed+1))
          ;;
        *)
          s_kept=$((s_kept+1))
          ;;
      esac
    done
    echo
    log "skills: $s_removed removed, $s_kept kept (non-apex-team)."
  fi
  exit 0
fi

# ---------------------------------------------------------------------------
# Install — symlink each agent .md file + each skill directory
# ---------------------------------------------------------------------------

log "agents source: $AGENTS_SRC_DIR"
log "agents target: $AGENTS_DST_DIR"

installed=0
refreshed=0
already=0
warned=0

for src in "$AGENTS_SRC_DIR"/*.md; do
  name="$(basename "$src")"
  dst="$AGENTS_DST_DIR/$name"
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
log "agents: $installed installed, $refreshed refreshed, $already already current, $warned warnings."

# Skills — one symlink per skill DIRECTORY (matches Claude Code's
# ~/.claude/skills/<name>/SKILL.md layout).
if [ -d "$SKILLS_SRC_DIR" ]; then
  log "skills source: $SKILLS_SRC_DIR"
  log "skills target: $SKILLS_DST_DIR"

  s_installed=0
  s_refreshed=0
  s_already=0
  s_warned=0

  for src in "$SKILLS_SRC_DIR"/*/; do
    src="${src%/}"  # strip trailing slash
    name="$(basename "$src")"
    dst="$SKILLS_DST_DIR/$name"
    if [ -L "$dst" ]; then
      current="$(readlink "$dst")"
      if [ "$current" = "$src" ]; then
        s_already=$((s_already+1))
        continue
      fi
      ln -sf "$src" "$dst"
      log "  refreshed $name (was → $current)"
      s_refreshed=$((s_refreshed+1))
    elif [ -e "$dst" ]; then
      log "  WARNING:  $name already exists at $dst as a real path; not overwriting"
      s_warned=$((s_warned+1))
    else
      ln -s "$src" "$dst"
      log "  installed $name"
      s_installed=$((s_installed+1))
    fi
  done

  echo
  log "skills: $s_installed installed, $s_refreshed refreshed, $s_already already current, $s_warned warnings."
fi

if [ "$installed" -gt 0 ] || [ "$refreshed" -gt 0 ] || [ "${s_installed:-0}" -gt 0 ] || [ "${s_refreshed:-0}" -gt 0 ]; then
  log "Restart Claude Code to pick them up."
fi
