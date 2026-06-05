---
ticket: BE-0002
parent_feat: TBD
parent_us: US-097
wave: 121
role: backend-developer
status: retro
---

# BE-0002 — Viewer auto-follow polling (Wave 121 Retro)

**Wave:** 121
**Viewer PR:** keyan-commits/apex-team-viewer#4 (merged)
**Viewer commit:** 6d580c9e7a8b8f00e731a64aebbc583f571c0610

## Scope

Auto-follow: the viewer detects the most-recently-active Claude Code project by
scanning `~/.claude/projects/` JSONL files by mtime and automatically sets that
workspace as active. A background poll (every 30 s) keeps the viewer tracking
whichever project the user is currently working in.

Key deliverables:
- `~/.claude/projects/` scan as a 4th workspace-discovery source; mtime-ranked
  across all JSONL files; `mostRecent: boolean` field on registry entries.
- Startup resolution chain extended: env → most-recent → cwd → fallback.
- `APEX_TEAM_AUTO_FOLLOW=1` env enables the 30 s poll; manual workspace switch
  suppresses one tick to avoid fighting the user.
- `POST /api/auto-follow/toggle` endpoint — client calls this to enable/disable
  auto-follow at runtime.
- Workspace filter broadened: any `requirements/*` subdirectory (not only
  `requirements/user-stories/`) qualifies a directory as an apex-team workspace.
- Known limitation documented: naive `-` → `/` JSONL path decode fails for
  project names containing dashes; `existsSync` silently skips misses.

## Files touched (sibling viewer repo)

- `server.mjs` — +255 lines: `~/.claude/projects` scanner, mtime ranking,
  auto-follow poll loop, `/api/auto-follow/toggle` route, broadened workspace
  filter, extended startup resolution chain

## apex-team-side artifacts

- This summary doc
- Wave-121 HANDOFF block in `coordination/handoffs/ui-developer.md` (historical —
  UI Dev was the routed role for this wave)

## Notes

- Retro backfill — this BE-0002 doc was authored after the fact during Wave 137 to
  close the BE Dev artifact gap surfaced by the user during a viewer review. The
  actual implementation happened in the viewer repo under UI Dev's authorship; this
  doc retroactively credits the backend-shaped work.
- Pre-convention wave: Wave 121 predates the FEAT-XXXX grouping standard (Wave 122).
  `parent_feat` is TBD pending BA reconciliation.
