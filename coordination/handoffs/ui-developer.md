# ui-developer — HANDOFF

## ⏭️ NOW — 2026-06-04 — Wave 119: viewer workspace switcher (US-095 AC1-AC8)

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
