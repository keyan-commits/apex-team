# backend/features — BE ticket allocation log

BE ticket numbers are allocated monotonically by the Backend Developer.
This file is the single source of truth for BE-NNNN allocations in apex-team.

Mirror of `frontend/features/INDEX.md` (which tracks FE-NNNN allocations).
Both files coexist as separate allocation logs — neither supersedes the other.

| Ticket | Parent FEAT | Parent US | Wave | Status | Description |
|--------|-------------|-----------|------|--------|-------------|
| BE-0001 | TBD | US-095 | 119 | retro | Viewer workspace switcher API — registry, `/api/workspaces`, `/api/workspace/switch`, activeRoot threading |
| BE-0002 | TBD | US-097 | 121 | retro | Viewer auto-follow — `~/.claude/projects` JSONL mtime scan, 30 s poll, `/api/auto-follow/toggle` |
| BE-0003 | FEAT-0002 | US-099 | 123 | retro | Artifacts API FEAT-grouped response shape — frontmatter parser, `features[]`+`ungrouped[]` shape, FEAT title lookup |
| BE-0004 | FEAT-0002 | TBD | 132 | retro | Java/line-comment frontmatter parser extension — `//` + `#` prefix stripping, `runner` field surfaced |
| BE-0005 | TBD | TBD | 130 | retro | Polyglot runner resolver + SSE streaming — `lib/runner-resolver.mjs`, nested discovery, structured SSE frames |
| BE-0006 | TBD | TBD | 131 | retro | shell:true security fix — Gradle/Maven spawn hardened, injection regression tests |
| BE-0007 | TBD | TBD | 133 | retro | Scan-dir off-by-one fix — sibling workspace discovery corrected (`__dirname` → parent) |
| BE-0008 | TBD | TBD | 135 | retro | Cache-Control: no-cache on static asset responses |
| BE-0009 | TBD | TBD | 136 | retro | Playwright headed-mode toggle — `?headed=1` query param injects `--headed` into spawn args |
| BE-0010 | TBD | TBD | 140 | in-progress | Process registry + `DELETE /api/run-test/:id` cancel endpoint + concurrent-run cap |

## Allocation notes

- BE-0001 through BE-0009 allocated during Wave 137 retroactive backfill.
- All Wave 119–136 docs are `status: retro` — the actual implementation was
  authored in `keyan-commits/apex-team-viewer` under UI Dev's historical
  authorship. These docs retroactively credit the backend-shaped work.
- `parent_feat: TBD` entries await BA reconciliation to a real FEAT-NNNN. The
  `FEAT-tbd-*` directory names are placeholders — BA will create canonical
  `FEAT-NNNN-<slug>` directories when the relevant FEATs are formally allocated.

## Going-forward routing rule (Wave 137)

Any future change to `apex-team-viewer/server.mjs`, `lib/runner-resolver.mjs`,
or any other server-side file in the viewer repo MUST dispatch BE Dev in
parallel with UI Dev. Server-side code is BE Dev's lane. The historical pattern
of routing all viewer changes solely to UI Dev was the gap this backfill closes.

## Next available ticket

**BE-0011**
