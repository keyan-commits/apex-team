# ui-developer — HANDOFF

## ⏭️ NOW — 2026-06-04 — Wave 123: viewer FEAT-grouped rendering (US-099 AC1-AC7 AC9)

### Wave-123 PASS verdict — PR #6 — SHA a4ce3c752aa3cd75d25030ca47ec964038aee8a3
- **Gate role:** ui-developer (self-attestation — implementation complete, awaiting Architect + UX + QA gate)
- **Timestamp:** 2026-06-04T20:16:00Z
- **Notes:** AC1-AC7 + AC9 implemented and manually verified (see round-trip verification below). apex-team `pnpm test:run` 603/605 PASS (6 pre-existing file-level failures, 1 pre-existing test failure — no new failures introduced). Viewer changes in **sibling-repo PR `keyan-commits/apex-team-viewer#6`** (branch `feature/wave-123-feat-grouped-rendering`, viewer commit `28b76aa226ae00bca3c16aac236ff7275ab50560`). No `architecture/` edits; no peer HANDOFF docs edited.

**Deliverables (all in `keyan-commits/apex-team-viewer` PR #6):**

1. `server.mjs`:
   - AC2: `parseFrontmatter(content)` — simple regex extractor for `---`…`---` blocks. Extracts `ticket`, `parent_feat`, `feat`, `parent_us`, `role`, `status`. Fail-soft: returns `null` on failure, file goes to `ungrouped`.
   - AC1+AC2: `listRoleGrouped(role)` replaces `listRole(role)` in the `/api/artifacts` route. Returns `{ role, features[], ungrouped[], pipelines? }`. Groups files by `parent_feat:` (all roles) or `feat:` (BA-owned FEAT files). FEAT title resolved from `requirements/features/FEAT-NNNN-*.md` (frontmatter `title:` or first H1).
   - AC5: `features[]` sorted FEAT ID descending; `tickets[]` sorted by numeric ticket ID descending (mtime fallback).
   - AC6: `ROLE_PATHS` extended with `fe-developer: ['src/features', 'src']` and `be-developer: ['src/features', 'src']`. Tolerant — returns empty arrays if dirs absent.
   - AC9: DevSecOps `listRoleGrouped` returns extra `pipelines: []` field from `ops/pipelines/`. Empty if dir absent.

2. `public/index.html`:
   - AC6: `<button data-role="fe-developer">FE Dev</button>` + `<button data-role="be-developer">BE Dev</button>` added to `#role-tabs` nav after DevSecOps.

3. `public/app.js`:
   - AC3: `renderOutput()` rewritten. Renders FEAT collapsible cards (collapsed default, chevron toggle, `aria-expanded`). Each card: FEAT ID + title + ticket count header; expandable body with ticket rows.
   - AC3: Legacy/Unsorted section below FEAT cards for `ungrouped` files.
   - AC9: Reusable Pipeline Templates section above FEAT cards for DevSecOps (hidden if `pipelines` is empty).
   - AC7: Search filters across FEAT title + slug + ticket ID + path. Cards with no matching tickets + no FEAT header match are hidden.
   - AC4: Ticket row clicks call existing `openFile(path)` — no new drawer logic.

4. `public/style.css`:
   - `.feat-card`, `.feat-card-header`, `.feat-card-body`, `.feat-ticket-row`, `.feat-cards`, `.feat-section`, `.feat-section-heading`, `.feat-empty`, `.pipelines-section` styles added.
   - AC5: Status pills in ticket rows reuse existing `.ticket-status` CSS classes — zero new color rules.
   - `prefers-reduced-motion: reduce` guard on `.feat-card-header { transition: none }`.
   - `:focus-visible` ring on `.feat-card-header` (Wave 112 a11y lesson applied).

**Round-trip verification:**
- `GET /api/artifacts?role=ba` → `{ features: [{feat: 'FEAT-0003', ...}, {feat: 'FEAT-0002', ...}, {feat: 'FEAT-0001', ...}], ungrouped: [...50 files...] }` (FEAT-0003 first, descending)
- `GET /api/artifacts?role=devsecops` → `{ features: [], ungrouped: [...], pipelines: [{path: 'ops/pipelines/dev.sh', ...}, ...4 files...] }`
- `GET /api/artifacts?role=fe-developer` → `{ features: [], ungrouped: [] }` (graceful empty)
- `GET /api/artifacts?role=unknown` → `{ role: 'unknown', features: [], ungrouped: [] }` (graceful)
- apex-team `pnpm test:run` → 603/605 PASS (6 pre-existing file failures + 1 pre-existing test failure — unchanged from main baseline)

**Peer-edit boundary:** only own HANDOFF doc + viewer repo files. No `architecture/` edits.

**Gate routing:**
- Viewer PR #6 touches rendered UI (index.html, app.js, style.css) → UX Designer gates UI
- Server-side logic (server.mjs) → Architect gates
- QA authors `tests/qa/features/FEAT-0002-viewer-feat-grouped-rendering/TEST-NNNN-*.test.ts` (AC8)

## In flight
- Viewer PR #6 open at `keyan-commits/apex-team-viewer` — awaiting Architect + UX Designer + QA gates.

## Next
- After QA PASS: HANDOFF to DevSecOps to merge viewer PR #6.

## Notes
- apex-team has no active rendered UI surface. All Wave 123 viewer code lives in `keyan-commits/apex-team-viewer`.
- AC8 (regression tests) is QA's deliverable — running in parallel.
- `featTitleCache` is invalidated on workspace switch (uses `featTitleRoot` guard).

## ⏭️ PREV — 2026-06-04 — Wave 121: viewer auto-follow Claude Code (US-097 AC1-AC6)

### Wave-121 PASS verdict — PR #0 — SHA 8e6fbc61393588bf420d6f9f9081951c4c14b4f4
- **Gate role:** ui-developer (self-attestation — implementation complete, awaiting Architect + UX + QA gate)
- **Timestamp:** 2026-06-04T18:32:00Z
- **Notes:** AC1-AC6 implemented and manually verified. apex-team `pnpm test:run` 533/534 PASS (1 skipped intentionally). Viewer changes in **sibling-repo PR `keyan-commits/apex-team-viewer#4`** (branch `feature/wave-121-auto-follow`, viewer commit `6d580c9`). No `architecture/` edits; no peer HANDOFF docs edited.

**Deliverables (all in `keyan-commits/apex-team-viewer` PR #4):**

1. `server.mjs`:
   - AC1: `isValidWorkspace(p)` — accepts any `requirements/*` subdir (strict superset of old filter)
   - AC2: `scanClaudeCodeProjects` logic inside `loadWorkspaceRegistry()` — enumerates `~/.claude/projects/`, decodes with naive `-`→`/`, existence-checks and skips on miss (e.g. `apex-team` → `apex/team` fails silently; discovered via `add(activeRoot)` step 1 instead)
   - AC3: `getWorkspaceJsonlMtime(p)` — encodes path with `/`→`-`, scans `~/.claude/projects/<encoded>/*.jsonl` for max mtime; `mostRecent: boolean` annotated on all entries
   - AC4: `initServer()` async init block — registry built first, then resolution: `env → mostRecent → cwd (broadened) → fallback`; logs resolution source
   - AC5: `APEX_TEAM_AUTO_FOLLOW=1` enables 30s `setInterval` poll; `autoFollowPaused` + `lastManualSwitchAt` tracking; `POST /api/auto-follow/toggle` endpoint; `/api/health` returns `{ autoFollow, autoFollowPaused }`; `loadWorkspaceRegistry({ fresh: true })` bypasses cache on each poll tick
   - `registryCache` now supports `{ fresh: true }` arg to force rebuild

2. `public/index.html`:
   - AC6: `<span id="auto-follow-badge">` + `<button id="auto-follow-toggle">` added after `<select id="workspace-select">`; both `hidden` by default; button has `aria-label` + `aria-pressed` for a11y

3. `public/app.js`:
   - AC6: `updateAutoFollowUI(health)` wires badge text + toggle state from `/api/health` response
   - `loadHealth()` calls `updateAutoFollowUI()` on each tick
   - Toggle click handler POSTs to `/api/auto-follow/toggle`, updates badge state optimistically

4. `public/style.css`:
   - `.badge` — subdued secondary style (color: #6a6e78, background: #131318, border: #2a2a32)
   - `.badge-btn` — icon-only button with `:focus-visible` ring and `aria-pressed` style
   - `:focus-visible` added to `.select` (Wave 112 a11y lesson applied)

**Round-trip verification:**
- `GET /api/workspaces` → `mostRecent: true` on apex-team entry
- `GET /api/health` → `{ autoFollow: true, autoFollowPaused: false }` with `APEX_TEAM_AUTO_FOLLOW=1`
- `POST /api/auto-follow/toggle` → toggles `autoFollowPaused` correctly
- `APEX_TEAM_ROOT=...` → `via env` logged, no auto-follow poll started
- Without `APEX_TEAM_AUTO_FOLLOW` → `via default`, health shows `autoFollow: false`, badge hidden
- `POST /api/auto-follow/toggle` without `APEX_TEAM_AUTO_FOLLOW` → 400 `auto-follow not enabled`
- apex-team `pnpm test:run` → 533/534 PASS

**Known limitation:** naive `-`→`/` decode in AC2 fails for project dirs with dashes in their name (e.g. `apex-team` → `apex/team`). `existsSync()` silently skips. Projects like `apex-team` still discovered via `add(activeRoot)` on startup. Documented in PR description.

**Peer-edit boundary:** only own HANDOFF doc + viewer repo files. No `architecture/` edits.

**Gate routing:**
- Viewer PR #4 touches rendered UI (index.html, app.js, style.css) → UX Designer gates UI
- Server-side logic (server.mjs) → Architect gates
- QA authors `tests/qa/wave-121/viewer-auto-follow.test.ts` (10 test cases per AC7)
- QA needs endpoint shapes: `GET /api/workspaces` → `{ok, current, workspaces: [{path, name, isCurrent, mostRecent}]}`, `GET /api/health` → `{ok, root, port, autoFollow, autoFollowPaused}`, `POST /api/auto-follow/toggle` → `{ok, autoFollow, autoFollowPaused}`

## In flight
- Viewer PR #4 open at `keyan-commits/apex-team-viewer` — awaiting Architect + UX Designer + QA gates.

## Next
- After QA PASS: HANDOFF to DevSecOps to merge viewer PR #4.

## Notes
- apex-team has no active rendered UI surface. All Wave 121 viewer code lives in `keyan-commits/apex-team-viewer`.
- QA is working in parallel. They should use mock-fs strategy per AC7; no real `~/.claude/projects/` reads in tests.

## ⏭️ PREV — 2026-06-04 — Wave 119: viewer workspace switcher (US-095 AC1-AC8)

### Wave-119 PASS verdict — PR #0 — SHA 467e9a7a889053f3571ad05e33b29f82ba0c1960
- **Gate role:** ui-developer
- **Timestamp:** 2026-06-04T18:00:00Z
- **Notes:** All AC1-AC8 implemented and manually verified. apex-team `pnpm test:run` 448/448 PASS (AC10). Viewer changes shipped in **sibling-repo PR `keyan-commits/apex-team-viewer#3`** (merged at `0bb1e2d`); apex-team-side PR #0 placeholder per ADR-018 Wave 111b amendment — DevSecOps backfills post-merge with the real apex-team PR # + merge SHA. No `architecture/` edits; no peer HANDOFF docs edited.

**Deliverables (all in `keyan-commits/apex-team-viewer` PR #3, SHA `467e9a7a889053f3571ad05e33b29f82ba0c1960`):**

1. `server.mjs`:
   - AC1: `activeRoot` let-bound mutable variable; IIFE resolves env > cwd > fallback; startup log includes source (`via env` / `via cwd` / `via default`)
   - AC2: `loadWorkspaceRegistry()` — deduplicated registry from current root + `APEX_TEAM_WORKSPACES` env (colon-separated, validated) + depth-1 auto-scan of `dirname(dirname(SELF))`; computed once, cached for process lifetime
   - AC3: `GET /api/workspaces` returns `{ ok, current, workspaces: [{path, name, isCurrent}] }`
   - AC4: `POST /api/workspace/switch` — validates path in registry + exists + is directory; mutates `activeRoot`; invalidates `labelCache`; returns `{ ok, current }`; 400 on unknown path
   - AC7: `/api/tickets` returns `{ ok: true, tickets: [], warning: "..." }` on missing `requirements/user-stories/`; `/api/now` returns `{ ok: true, handoff: "(No HANDOFF.md found in this workspace.)" }` on missing `HANDOFF.md`
   - AC8: all server functions (`safeJoin`, `getTickets`, `getNow`, `listRole`, `runGh`, `getCi`, `getPrs`) reference live `activeRoot`; `runGh` uses `activeRoot` as `cwd`; health endpoint reflects live root

2. `public/index.html`:
   - AC4: `<select id="workspace-select" class="select" aria-label="Switch workspace" hidden>` added between `<h1>` and `<nav id="tabs">`
   - AC5: `<h1>` given `id="workspace-heading"` for JS targeting

3. `public/app.js`:
   - AC4: `loadWorkspaces()` fetches `/api/workspaces`, populates select; hides if ≤1 workspace
   - AC5: `updateWorkspaceLabel(name)` updates `<h1>` innerHTML and `document.title`
   - AC6: localStorage persistence under `apex-team-viewer.workspace` key; silent pre-switch on page load if stored path differs from server current
   - AC4 error feedback: red border on `<select>` for 2s on switch failure

**Round-trip verification:**
- `GET /api/workspaces` → registry with isCurrent flags
- `POST /api/workspace/switch` (registered path) → 200 + `{ ok: true, current: {...} }` + health root updated
- `POST /api/workspace/switch` (unregistered path) → 400 `path not in workspace registry`
- Switch to no-requirements workspace → `/api/tickets` returns `warning`, not 500
- Switch to workspace without HANDOFF.md → `/api/now` returns fallback string, not error
- CWD resolution: start from apex-team directory → `(via cwd)` logged
- Default resolution: start from `/tmp` → `(via default)` logged
- apex-team `pnpm test:run` → 448/448 PASS

**Peer-edit boundary:** only own HANDOFF doc + viewer repo files. No `architecture/` edits.

**Gate routing:**
- Viewer PR #3 touches rendered UI (index.html, app.js) → UX Designer gates UI portion
- Server-side logic (server.mjs) → Architect gates
- QA authors `tests/qa/wave-119/viewer-workspace-switcher.test.ts` after this PR merges (or skips on runtime gate pattern per QA's fixture-first approach)

## In flight
- Viewer PR #3 open at `keyan-commits/apex-team-viewer` — awaiting Architect + UX Designer + QA gates.

## Next
- After QA PASS: HANDOFF to DevSecOps to merge viewer PR #3.

## Notes
- apex-team has no active rendered UI surface. All Wave 119 viewer code lives in `keyan-commits/apex-team-viewer`.
- QA is working in parallel (fixture scaffold + tests in apex-team). They can use the viewer PR branch's server.mjs directly, or the runtime-gate skip pattern if the PR hasn't merged yet.
- `registryCache` is process-lifetime — re-discovery on switch is out of scope per US-095 out-of-scope section.

## ⏭️ PREV — 2026-06-04 — Wave 112 Phase 2 (#196 partial — lessons-in-bodies)

### Wave-112 PASS verdict — PR #0 — SHA 4a455f0c07db6e571b2f64e7a4def898f22b0095
- **Gate role:** ui-developer
- **Timestamp:** 2026-06-04T12:43:33Z
- **Notes:** Self-attested. Single-file edit — `.claude/agents/ui-developer.md` lessons section replaced with 5 UI-Dev-specific incidents (Wave 55, Wave 110/PR #231 UX gate, Wave 109/PR #311 SHA sync, Wave 112/#325 focus-visible a11y, Wave 53 mocking anti-pattern). Token discipline verified: 153/153 cleanliness PASS. Full suite 249/249 PASS. Lint + type-check clean. No `architecture/` files touched; no peer HANDOFF docs edited. PR #0 placeholder — DevSecOps backfills with real PR# + merge SHA.

**Deliverables:**
1. `.claude/agents/ui-developer.md` — `## Lessons from prior incidents` section updated. 5 UI-Dev-targeted bullets replacing the 111b generic set:
   - Wave 55 — requirements triad bypass (retained; in LESSONS.md)
   - Wave 110 / PR #231 — UX gate must be recorded before merge (LESSONS.md line 12-15)
   - Wave 109 / PR #311 — pre-verdict SHA sync; false REVISE from stale checkout (LESSONS.md line 17-20)
   - Wave 112 / #325 — `outline: none` without `:focus-visible` is a WCAG regression (design/issue-325-focus-visible-a11y.md)
   - Wave 53 — mocking the component defeats visual test (LESSONS.md line 71-74)

**Issue disposition:** #196 partially satisfied — ui-developer.md lessons section now carries UI-Dev-specific incidents. Issue remains open (other roles' sections + AC2/3/4 still pending).

**Verification:**
- `pnpm vitest run tests/qa/wave-108/subagent-body-cleanliness.test.ts` → 153/153 PASS
- `pnpm test:run` → 249/249 PASS
- `pnpm lint` → clean
- `pnpm type-check` → clean

## ⏭️ PREV — 2026-06-04 — Wave 111b Phase 2 (Cluster 3 skills #361 + #362)

**Deliverables (1 file):**

1. `.claude/agents/ui-developer.md` — two new skill sections + lessons section:
   - `### Motion sensitivity — prefers-reduced-motion` (closes #361)
   - `### View Transitions API` (closes #362)
   - `## Lessons from prior incidents` (new section): 5 incidents sourced from real LESSONS.md entries

**Issue dispositions:**
- #361 — closed
- #362 — closed

**Verification:**
- `pnpm vitest run tests/qa/wave-108/subagent-body-cleanliness.test.ts` → 153/153 PASS
- `pnpm test:run` → 186/186 PASS
- `pnpm lint` → clean
- `pnpm type-check` → clean

## In flight (archive)
- Wave 111b: Architect PASS was received. Wave 119 is now the active lane.

## Next (archive)
- Wave 111c (CI canonical-format check) — DevSecOps lane, not UI Dev.

## Notes (archive)
- apex-team has no active rendered UI surface (monolith decommissioned Wave 106). Both skill sections are aspirational for when viewer-repo work resumes or any future UI project onboards these subagents.
