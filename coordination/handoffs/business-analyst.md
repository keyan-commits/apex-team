# business-analyst — HANDOFF

## NOW — 2026-06-04 — Wave 126: US-102 + FEAT-0005 + INDEX updates authored

**Deliverables this turn (Wave 126 requirements phase):**

- `requirements/features/FEAT-0005-feat-backfill-command.md` — new FEAT-0005 file; status: **active**. Retroactive FEAT backfill command; cross-workspace capable; frontmatter injection only (no file moves); Wave 126.
- `requirements/user-stories/US-102-retroactive-feat-backfill-command.md` — new user story; status: **in-flight**. 13 ACs covering CLI shape, dry-run default, proposal report, dispatch-plan, role-scoped directory access, frontmatter-only mutation, PO reconciliation, --feat constraints, ungrouped bucket, idempotence, audit log, regression test (TEST-0005), and viewer smoke check. Cross-workspace clause embedded.
- `requirements/features/INDEX.md` — FEAT-0005 row added to Registry + allocation log. Wave 126 context note added.
- `requirements/INDEX.md` — US-102 row added; Wave 126 "Last updated" line prepended.
- `coordination/handoffs/business-analyst.md` — this file, Wave 126 NOW updated.

**Allocation verification:**
- FEAT-0004 confirmed as previous high water → FEAT-0005 allocated.
- US-101 confirmed as previous high water → US-102 allocated.
- TEST-0005 is the QA allocation (TEST-0004 is current high water per Wave 125).

**Scope calls:**
- AC13 is a smoke check (NOT a test) — requires a running viewer instance. Documented as user-facing acceptance, not automated.
- `--force` flag (overwrite existing `feat:` value) is explicitly out of scope; documented in AC10.
- File moves deferred to Wave 127+; explicit in Out-of-scope section of US-102.
- Viewer UI changes not in scope; viewer already renders FEAT cards.
- ARCH-0002 is the Architect ticket (next after ARCH-0001 from Wave 125); pending Wave 126 Architect lane.
- OPS-0001 is the DevSecOps ticket (first OPS ticket); pending Wave 126 implementation.
- UX impact TBD — CLI-only command; expect UX to return no-impact.

**Peer-edit boundary:** Only BA-owned files edited this turn. No peer HANDOFF files touched.

**Branch:** `feature/126-feat-backfill-command` off main `16f3fa0067537aeed4c21622df03e2c7296fe93b`. Staged but not committed (outer orchestrator batches triad before committing).

**PASS verdict (ADR-018 canonical format):**

### Wave-126 PASS verdict — PR #0 — SHA 9207be4d8270565f5ac510dbb324cfe1ef405724
- **Gate role:** business-analyst
- **Timestamp:** 2026-06-04T00:00:00Z
- **Notes:** Requirements phase — FEAT-0005 + US-102 authored; features/INDEX.md + requirements/INDEX.md updated with Wave 126 rows. 13 ACs specified; cross-workspace clause embedded in US-102. No code or architecture edits. Architecture gate does not fire (no `architecture/` edits). Peer-edit boundary respected. Branch `feature/126-feat-backfill-command` created off main `16f3fa0067537aeed4c21622df03e2c7296fe93b`. Staged, not committed — outer orchestrator batches triad. PR #0 placeholder per ADR-018 Wave 111b amendment; DevSecOps to backfill with real PR # + merge SHA post-merge.

**Architecture gate:** no `architecture/` edits. Gate doesn't fire.

**Last-processed user message:** Wave 126 BA dispatch (2026-06-04, main `16f3fa0`).

---

## PREV — 2026-06-04 — Wave 125: US-101 + FEAT-0004 + INDEX updates authored

**Deliverables this turn (Wave 125 requirements phase):**

- `requirements/features/FEAT-0004-viewer-a11y-polish.md` — new FEAT-0004 file; status: **active**. Bundles 4 viewer a11y issues (#5/#7/#8/#9) from Wave 123 UX gate into one focused wave.
- `requirements/user-stories/US-101-viewer-a11y-polish.md` — new user story; status: **in-flight**. 6 ACs: AC1 `.search:focus-visible` (#5); AC2 solid focus ring `.feat-card-header`+`.badge-btn` (#7); AC3 `.file-open` keyboard accessibility (#8); AC4 `.feat-card-body` landmark regions (#9); AC5 regression sweep; AC6 QA TEST-0004 static-parse test.
- `requirements/features/INDEX.md` — FEAT-0004 row added to Registry + allocation log. FEAT-0002 + FEAT-0003 rows also backfilled (were missing from Registry).
- `requirements/INDEX.md` — US-101 row added; Wave 125 "Last updated" line prepended.
- `coordination/handoffs/business-analyst.md` — this file, Wave 125 NOW updated.

**TEST-0004 correction (explicit):**
PO's Wave 125 HANDOFF draft referenced `TEST-0002` for the QA test. Correct allocation is
**TEST-0004** — the TEST ticket sequence is monotonically allocated per Wave 122 convention,
and TEST-0003 was the last allocated (Wave 123 for FEAT-0002). QA must use TEST-0004 when
authoring `tests/qa/features/FEAT-0004-viewer-a11y-polish/TEST-0004-viewer-a11y-polish.test.ts`.

**Scope calls:**
- AC1 canonical `:focus-visible` pattern (solid `#6a8cd6`, 2px, 1px offset) is in the US spec. UX-0001 will codify this pattern; UI Dev follows it.
- AC2 contrast: `#6a8cd6` vs `#131318` — ≥3:1 requirement called out explicitly; prior alpha version `#6a8cd640` was ~1.8:1.
- AC3 covers FEAT card rows, Tickets-tab rows, AND ungrouped rows — all three `.file-open` locations.
- AC4 requires `id="feat-header-${feat.feat}"` on the header element so the `aria-labelledby` reference resolves.
- AC6 is runtime-gated on `existsSync('../apex-team-viewer/public/style.css')` — matching Wave 123 TEST-0003 practice.

**Peer-edit boundary:** Only BA-owned files edited this turn: `requirements/features/FEAT-0004-viewer-a11y-polish.md`, `requirements/user-stories/US-101-viewer-a11y-polish.md`, `requirements/features/INDEX.md`, `requirements/INDEX.md`, `coordination/handoffs/business-analyst.md`. No peer HANDOFF files touched.

**PASS verdict (ADR-018 canonical format):**

### Wave-125 PASS verdict — PR #0 — SHA 9f9d53ee3c8f3e155a567197a489378318729c18
- **Gate role:** business-analyst
- **Timestamp:** 2026-06-04T00:00:00Z
- **Notes:** Requirements phase — FEAT-0004 + US-101 authored; features/INDEX.md + requirements/INDEX.md updated; TEST-0004 correction documented (PO draft had TEST-0002; correct monotonic allocation is TEST-0004, current high water TEST-0003). No code or architecture edits. Architecture gate does not fire (no `architecture/` edits). Peer-edit boundary respected. PR #0 placeholder per ADR-018 Wave 111b amendment; DevSecOps to backfill with real PR # + merge SHA post-merge.

**Architecture gate:** no `architecture/` edits. Gate doesn't fire.

**Branch:** `feature/125-viewer-a11y-polish` off main `9f9d53ee3c8f3e155a567197a489378318729c18`. Staged but not committed (outer orchestrator batches triad before committing).

**Last-processed user message:** Wave 125 BA dispatch (2026-06-04, main `9f9d53e`).

---

## PREV — 2026-06-04 — Wave 122 (amended): US-098 + FEAT-0001 + features/INDEX.md updated

**Deliverables this turn (original Wave 122 + amendment):**

- `requirements/user-stories/US-098-feat-grouping-convention.md` — amended; status: **accepted**
  - AC3 updated: per-role ticket prefix table with `Per-role INDEX` column; `ADR-NNNN` vs `ARCH-XXXX` distinction added
  - AC4 updated: new canonical column shape `FEAT | Slug | Status | ARCH | UX | TEST | FE | BE | OPS` (Wave + US-NNN refs columns removed from table; full context lives in FEAT file)
  - AC11 updated: mandatory frontmatter spec with per-role INDEX.md maintenance rule; valid `role:` values enumerated
  - AC12 updated (formerly "Autonomous role standard"): exact anchor phrase `### FEAT-XXXX feature grouping standard (Wave 122 — MANDATORY)` codified; 5 inline rules specified (prefix, dir layout, frontmatter, INDEX maintenance, cross-workspace applicability); byte-for-byte grep-stability required
  - AC13 updated (Regression): QA test must assert anchor phrase in all 8 bodies + role-specific prefix per body + FEAT-0001 file exists + features/INDEX.md column shape correct + all prior tests green
  - Out of scope: subagent body amendments promoted to IN scope for Wave 122 (Architect's lane, AC12)
- `requirements/features/FEAT-0001-feat-grouping-convention.md` — amended:
  - Per-role ticket prefix table added (ratified FEAT/ARCH/UX/TEST/FE/BE/OPS)
  - Mandatory frontmatter spec section added
  - Autonomous-standard amendment section added (exact anchor phrase documented)
  - Per-role artifact directories table updated with ticket column
  - AC checklist updated to 13 ACs; AC11 = mandatory frontmatter (done), AC12 = autonomous standard (pending Architect), AC13 = regression (pending QA)
  - Status history: amendment row added
- `requirements/features/INDEX.md` — updated to canonical column shape:
  - Columns: `FEAT | Slug | Status | ARCH | UX | TEST | FE | BE | OPS`
  - Per-role ticket prefix reference table added
  - Directive supersessions table: two rows documenting column-shape change + anchor phrase MANDATORY suffix
- `coordination/handoffs/business-analyst.md` — this file, Wave 122 NOW updated

**US-098 final AC summary (13 ACs):**
- AC1: FEAT-NNNN naming format
- AC2: FEAT frontmatter block spec (BA-owned YAML)
- AC3: Per-role ticket prefixes + directory layout + per-role INDEX.md (ratified)
- AC4: `requirements/features/INDEX.md` canonical column shape
- AC5: US-NNN Option B coexistence
- AC6: QA test-type decision discipline
- AC7: Reusable DevSecOps pipelines (deferred)
- AC8: `pnpm run qa:feat` script (deferred)
- AC9: Viewer FEAT-grouped cards (deferred US-099+)
- AC10: `architecture/workspace-conventions.md` FEAT section (Architect, pending)
- AC11: Mandatory deliverable frontmatter spec + per-role INDEX maintenance rule
- AC12: Autonomous standard — `### FEAT-XXXX feature grouping standard (Wave 122 — MANDATORY)` in all 8 subagent bodies (Architect, pending)
- AC13: Wave 122 regression test (QA, pending)

**PASS verdict (ADR-018 canonical format):**

### Wave-122 PASS verdict — PR #0 — SHA 0b4f7bdbf1c19ad101bd0d4b8387cc593558f127
- **Gate role:** business-analyst
- **Timestamp:** 2026-06-04T00:00:00Z
- **Notes:** Requirements phase + Wave 122 amendment — US-098 + FEAT-0001 + features/INDEX.md amended with per-role ticket prefixes, mandatory frontmatter spec, autonomous-standard AC (exact anchor phrase `### FEAT-XXXX feature grouping standard (Wave 122 — MANDATORY)`), and new features/INDEX.md column shape. No code or architecture edits. Architecture gate does not fire (no `architecture/` edits). Peer-edit boundary respected: only own HANDOFF + own US/FEAT/INDEX files (BA-owned) edited. PR #0 placeholder; DevSecOps to backfill with real PR # + merge SHA post-merge.

**Architecture gate:** no `architecture/` edits. Gate doesn't fire.

**Peer-edit boundary:** no peer HANDOFF edits. Only own HANDOFF + own US authoring + features/ dir + INDEX.md edited.

**Last-processed user message:** Wave 122 amendment dispatch (2026-06-04, main `0b4f7bdbf1c19ad101bd0d4b8387cc593558f127`).

---

## PREV — 2026-06-04 — Wave 120: US-096 authored (pre-commit verdict-format gate)

**Deliverables this turn:**

- `requirements/user-stories/US-096-pre-commit-verdict-format-gate.md` — authored, status: **accepted**
- `requirements/INDEX.md` — US-096 row added; Wave 120 timestamp header prepended

**US-096 summary:** 6 ACs covering the pre-commit verdict-format gate scope:
- AC1: `.githooks/pre-commit` extended with ADR-018 verdict-format step against staged `coordination/handoffs/*.md`
- AC2: same canonical regex as CI workflow (`pass-verdict-format-check.yml`); no local/CI drift; regex source: `ADR-018-pass-verdict-format.md`
- AC3: Wave-111+ enforcement, pre-Wave-111 grandfathered (same threshold as CI)
- AC4: `--no-verify` bypass works; hook prints bypass reminder on violation
- AC5: `tests/qa/wave-120/pre-commit-verdict-gate.test.ts` — bad/good/grandfathered case assertions
- AC6: body clause in all 8 role subagent files referencing the new pre-commit gate

**Trigger incidents:** 5+ repeated format violations (Waves 112, 115, 117, 118, 119) each costing a CI cycle. Local pre-commit has no verdict-format check.

**Dispatch routing (Wave 120 auto-routing clause):**
- HANDOFF to DevSecOps: implement AC1–AC4 (hook extension); own AC6 body edits for all 8 agents (or coordinate with Architect on the `architect.md` wording).
- HANDOFF to QA: author `tests/qa/wave-120/pre-commit-verdict-gate.test.ts` (AC5). Can start in parallel with DevSecOps.

**PASS verdict (ADR-018 canonical format):**

### Wave-120 PASS verdict — PR #0 — SHA 017145022ee78d2849356f9ef3d56ddb42adf577
- **Gate role:** business-analyst
- **Timestamp:** 2026-06-04T00:00:00Z
- **Notes:** Requirements phase only — US-096 authored + INDEX.md updated. No code or architecture edits. Architecture gate does not fire (no `architecture/` edits). Peer-edit boundary respected: only own HANDOFF + own US-096 file + INDEX.md (BA-owned) edited. PR #0 placeholder per ADR-018 Wave 111b amendment; DevSecOps to backfill with real PR # + merge SHA post-merge.

**Architecture gate:** no `architecture/` edits. Gate doesn't fire.

**Peer-edit boundary:** no peer HANDOFF edits. Only own HANDOFF + own US authoring + INDEX.md edited.

**Last-processed user message:** Wave 120 BA dispatch (2026-06-04, main `0171450`).

---

## PREV — 2026-06-04 — Wave 119: US-095 authored (viewer workspace switcher)

**Deliverables this turn:**

- `requirements/user-stories/US-095-viewer-workspace-switcher.md` — authored, status: **accepted**
- `requirements/INDEX.md` — US-095 row added; Wave 119 timestamp header prepended

**US-095 summary:** 10 ACs covering the viewer workspace-switcher scope:
- AC1: env-var > CWD > hardcoded-fallback resolution at server startup
- AC2: depth-1 auto-discovery of `~/Development/Study/*` + `APEX_TEAM_WORKSPACES` env list
- AC3: `GET /api/workspaces` endpoint returning registry + `isCurrent` flags
- AC4: in-header `<select id="workspace-select">` with `POST /api/workspace/switch` server mutation
- AC5: `<h1>` + `<title>` update to reflect active workspace name (no page reload)
- AC6: `localStorage` persistence of last selected workspace path (`apex-team-viewer.workspace` key)
- AC7: graceful fallback when workspace has no `requirements/user-stories/` (warning, not 500)
- AC8: all server-side reads + `gh` CWD updated on switch; label cache invalidated on switch
- AC9: QA fixture scaffold — 3 sample workspaces under `requirements/samples/wave-119-viewer-workspaces/` (happy path, no-requirements, malformed US)
- AC10: regression — all prior `pnpm test:run` tests green after wave ships

**Scope calls:**
- Manual config file (`~/.claude/apex-team-viewer-workspaces.json`) deferred — env var covers explicit-list case.
- Runtime workspace re-scan deferred.
- In-memory switch does NOT persist across server restarts (env-var > CWD > default rule applies on each restart).

**Dispatch routing (Wave 119 auto-routing clause):**
- HANDOFF to QA: author `tests/qa/wave-119/viewer-workspace-switcher.test.ts` (positive + negative + edge; iterate all 3 fixture workspaces from AC9).
- HANDOFF to UI Developer: implement AC1–AC8 in `../apex-team-viewer/server.mjs` + `public/index.html` + `public/app.js`.
- Implementation is in the `apex-team-viewer` repo (sibling at `../apex-team-viewer/`), not in apex-team itself.

**PASS verdict (ADR-018 canonical format):**

### Wave-119 PASS verdict — PR #0 — SHA c795ab5174eea6ff29bfffa5ffc8af58b675955f
- **Gate role:** business-analyst
- **Timestamp:** 2026-06-04T00:00:00Z
- **Notes:** Requirements phase only — US-095 authored + INDEX.md updated. No code or architecture edits. Architecture gate does not fire (no `architecture/` edits). Peer-edit boundary respected: only own HANDOFF + own US-095 file + INDEX.md (BA-owned) edited. PR #0 placeholder per ADR-018 Wave 111b amendment; DevSecOps to backfill with real PR # + merge SHA post-merge.

**Architecture gate:** no `architecture/` edits. Gate doesn't fire.

**Peer-edit boundary:** no peer HANDOFF edits. Only own HANDOFF + own US authoring + INDEX.md edited.

**Last-processed user message:** Wave 119 BA dispatch (2026-06-04, main `c795ab5`).

---

## PREV — 2026-06-04 — Wave 118: US-094 authored (QA comprehensive coverage)

**Deliverables this turn:**

- `requirements/user-stories/US-094-qa-comprehensive-coverage.md` — authored, status: **in-flight**
- `requirements/INDEX.md` — US-094 row added; Wave 118 timestamp header prepended

**US-094 summary:** 5 ACs covering QA comprehensive-coverage scope:
- AC1: `tests/qa/wave-118/comprehensive-coverage.test.ts` asserts skill exists with correct frontmatter (a), `qa.md` contains Architect-ratified anchor phrase (b), per-clause co-presence anchors all present (c), `architecture/workspace-conventions.md` contains "Comprehensive testing (Wave 118)" section (d), all prior-wave regression tests green (e)
- AC2: `.claude/skills/comprehensive-testing/SKILL.md` — skill content: positive/negative/edge-case rule + enumerate every known sample in `requirements/samples/` + any project-specific sample directory disclosed in `data-sources.md` or `domains/*.md`
- AC3: hard-rule clause in `qa.md` body — Architect must ratify anchor phrase in Wave 118 NOW before body edits land
- AC4: `architecture/workspace-conventions.md` "Comprehensive testing (Wave 118)" section; Wave 117 requirements-first section gains cross-reference
- AC5: `scripts/install-agents-user-scope.sh` updated to symlink new skill

**Trigger incident:** LFM Add-PO project — QA tested date-fix against 1 of 9 sample files (ISO `20260524`), missed slash-format `5/27/2026`, feature shipped + failed production, required second hot-fix.

**Blocking dependency:** Architect must ratify canonical anchor phrase (AC1b, AC1c) in `coordination/handoffs/architect.md` Wave 118 NOW before `qa.md` body edits land. BA is not blocked from filing the story; body edits wait on ratification.

**PASS verdict (ADR-018 canonical format):**

### Wave-118 PASS verdict — PR #0 — SHA 7c994a1c8b835266049e20c835dab926ad875f1e
- **Gate role:** business-analyst
- **Timestamp:** 2026-06-04T00:00:00Z
- **Notes:** Requirements phase only — US-094 authored + INDEX.md updated. No code or architecture edits. Architecture gate does not fire (no `architecture/` edits). Peer-edit boundary respected: only own HANDOFF + own US-094 file + INDEX.md (BA-owned) edited. PR #0 placeholder per ADR-018 Wave 111b amendment; DevSecOps to backfill with real PR # + merge SHA post-merge.

**Architecture gate:** no `architecture/` edits. Gate doesn't fire.

**Peer-edit boundary:** no peer HANDOFF edits. Only own HANDOFF + own US authoring + INDEX.md edited.

**Last-processed user message:** Wave 118 BA dispatch (2026-06-04, main `7c994a1`).

---

## PREV — 2026-06-04 — Wave 117: US-093 authored (requirements-first enforcement)

**Deliverables this turn:**

- `requirements/user-stories/US-093-requirements-first-enforcement.md` — authored, status: **in-flight**
- `requirements/INDEX.md` — US-093 row added; Wave 117 timestamp header added

**US-093 summary:** 5 ACs covering the requirements-first enforcement scope:
- AC1: `tests/qa/wave-117/requirements-first.test.ts` asserts skill exists + symlinked, 4 implementer bodies contain hard-refusal anchor, BA body contains auto-routing anchor, all regression tests green
- AC2: `.claude/skills/requirements-first/SKILL.md` — skill content: no-code-without-US rule, BA-routing, QA-parallel-scaffold routing, exception tags
- AC3: hard-refusal clause in 4 implementer bodies (BE Dev, UI Dev, QA, DevSecOps) — exact wording ratified by Architect in Wave 117 NOW before body edits land
- AC4: auto-routing clause in BA body — author US on any implementation request, then HANDOFF to QA + PO
- AC5: `scripts/install-agents-user-scope.sh` updated to symlink `.claude/skills/requirements-first/SKILL.md` → `~/.claude/skills/requirements-first/SKILL.md`

**Trigger incident:** downstream Mac bypassed BA and went straight to BE Dev without a US. Existing REQUIREMENTS_PHASE_PROTOCOL in PO body was advisory-only; no mechanical hard-stop existed in implementer bodies.

**Blocking dependency:** Architect must ratify the canonical anchor phrases (AC1b for implementers, AC1c for BA) in `coordination/handoffs/architect.md` Wave 117 NOW before body edits land. BA is not blocked from filing the story; body edits wait on Architect's ratification.

**PASS verdict (ADR-018 canonical format):**

### Wave-117 PASS verdict — PR #0 — SHA 7c994a1c8b835266049e20c835dab926ad875f1e
- **Gate role:** business-analyst
- **Timestamp:** 2026-06-04T00:00:00Z
- **Notes:** Requirements phase only — US-093 authored + INDEX.md updated. No code or architecture edits. Architecture gate does not fire (no `architecture/` edits). Peer-edit boundary respected: only own HANDOFF + own US-093 file + INDEX.md (BA-owned) edited. PR #0 placeholder per ADR-018 Wave 111b amendment; DevSecOps to backfill with real PR # + merge SHA post-merge.

**Architecture gate:** no `architecture/` edits. Gate doesn't fire.

**Peer-edit boundary:** no peer HANDOFF edits. Only own HANDOFF + own US authoring + INDEX.md edited.

**Last-processed user message:** Wave 117 BA dispatch (2026-06-04, main `7c994a1`).

---

## PREV — 2026-06-04 — Wave 115: US triage close-sweep (39 pending stories classified)

**Deliverables this turn:** 39 user-story files status-updated; `requirements/INDEX.md` rows updated to match; Wave 115 triage table below. No code edits. No architecture/ edits. No peer HANDOFF edits.

**Triage table — all 39 pending US-NNN files as of Wave 115:**

| US | Old Status | New Status | Reason |
|---|---|---|---|
| US-001 | in-dev | superseded | Monolith-coupled: ACs 2-4 target pnpm dev:test:ui/be, worktrees, SQLite; discipline absorbed Wave 108 PR #379 |
| US-008 | proposed | superseded | Monolith-coupled: targets AgentPane.tsx, MessageBubble.tsx, dashboard; re-file against viewer repo |
| US-009 | proposed | superseded | Monolith-coupled: targets /agents/[role], src/lib/skills/*.ts; re-file against viewer repo |
| US-010 | proposed | superseded | Monolith-coupled: targets /dashboard, /api/scout/trigger, skill-scout.mjs |
| US-011 | proposed | superseded | Monolith-coupled: targets dashboard agent panes, /api/team-status; re-file against viewer repo |
| US-016 | accepted | superseded | Monolith-coupled: targets src/lib/skills/*.ts, roles.ts, mcp/tools.ts; discipline absorbed Wave 108 PR #379 |
| US-017 | accepted | superseded | Monolith-coupled: targets src/lib/roles.ts ORCHESTRATOR_PROTOCOL; no equivalent reactive scan in subagent runtime |
| US-018 | accepted | superseded | Monolith-coupled: targets scripts/skill-scout.mjs, api/scout/trigger/route.ts |
| US-019 | accepted | superseded | Monolith-coupled: targets protocols.ts, skills/qa.ts, pnpm dev:test, :3100; QA discipline absorbed Wave 108 |
| US-020 | accepted | superseded | Monolith-coupled: targets src/lib/skills/business-analyst.ts; discipline absorbed Wave 108 PR #379 |
| US-021 | accepted | superseded | Monolith-coupled: targets /api/team-status, dashboard page.tsx; re-file against viewer repo |
| US-022 | accepted | superseded | Monolith-coupled: targets roles.ts, providers.ts; discipline absorbed Wave 108 |
| US-023 | accepted | superseded | Monolith-coupled: targets roles.ts, skills/*.ts; discipline absorbed Wave 108 PR #379 |
| US-024 | accepted | superseded | Monolith-coupled: targets roles.ts ORCHESTRATOR_PROTOCOL; BR-003 absorbed Wave 108 |
| US-025 | accepted | superseded | Monolith-coupled: targets src/lib/skills/*.ts; BR-004 absorbed Wave 108 PR #379 |
| US-026 | accepted | superseded | Monolith-coupled: targets tick-scheduler.ts, SQLite tick_log, MCP server; no persistent server in subagent runtime |
| US-027 | draft | superseded | Monolith-coupled draft: targets SQLite tables, src/lib/db.ts; SQLite retired at Plan C cutover; never reached accepted |
| US-028 | accepted | superseded | Monolith-coupled: targets providers.ts, agents.ts, roles.ts; model selection now in .claude/agents/*.md frontmatter |
| US-035 | accepted | superseded | Monolith-coupled: targets stall-detector.ts, tick-scheduler.ts, SQLite stall_event table; no persistent server |
| US-038 | accepted | superseded | Monolith-coupled: targets src/lib/db.ts; SQLite retired at Plan C cutover |
| US-039 | accepted | superseded | Monolith-coupled: targets src/lib/tick-scheduler.ts; tick scheduler retired at Plan C cutover |
| US-040 (global-error) | accepted | superseded | Monolith-coupled: targets src/app/global-error.tsx, Next.js pnpm build; no Next.js app in subagent runtime |
| US-040 (pnpm-build) | accepted | superseded | Monolith-coupled: targets src/app/global-error.tsx, next.config.ts; no Next.js app in subagent runtime |
| US-041 (protocol-constants) | accepted | superseded | Monolith-coupled: targets src/lib/roles.ts, src/lib/protocols.ts; subagent prompts carry text inline |
| US-041 (protocol-injection) | accepted | superseded | Monolith-coupled: targets src/lib/roles.ts dead imports; file retired at Plan C cutover |
| US-046 | in-dev | superseded | Monolith-coupled: targets src/lib/skills/devsecops.ts; also superseded by Wave 112 fragment-pattern retirement |
| US-047 | accepted | superseded | Introduced then retired: _handoff-pending/ deleted Wave 112 PR #392 8ba1bbb; fold-handoff.ts deleted |
| US-048 | accepted | superseded | Monolith-coupled: targets src/lib/skills/qa.ts; S1-S9 discipline absorbed Wave 108 PR #379 |
| US-054 | in-dev | superseded | Monolith-coupled: targets dashboard/page.tsx, ActiveWaveCard.tsx; dashboard retired at Plan C cutover |
| US-055 | accepted | superseded | Monolith-coupled: targets AgentPane.tsx, dashboard/page.tsx, db.ts IDLE_THRESHOLD_MS |
| US-063 | accepted | superseded | Monolith-coupled: targets StallSettingsDrawer.tsx CSS; component retired at Plan C cutover |
| US-064 | accepted | superseded | Monolith-coupled: targets src/mcp/handler.ts, .restart-trigger, talk_to_product_owner MCP; MCP server retired |
| US-086 | accepted | done | Shipped Wave 107 PR #377 (`a80273d`) |
| US-087 | accepted | done | Shipped Wave 108 PR #379 (`586ed8d`/merge `79edd1e`) |
| US-088 | accepted | done | Shipped Wave 111a PR #386 (`e37b29b`/merge `a16c924`) |
| US-089 | accepted | done | Shipped Wave 111b PR #387 (`133e182`/merge `ba0905f`) |
| US-090 | accepted | done | Shipped Wave 111c PR #388 (`10c002b`/merge `39298fb`) |
| US-091 | accepted | done | Shipped Wave 112 PR #393 (`68202c3`/merge `75266d3`) |
| US-092 | in-flight | done | Shipped Wave 113 PRs #394+#395 (`23d4f76`+`075d102`/main `9e490bb`) |

**Summary:** 32 stories marked superseded (monolith-coupled: Plan C cutover PR #374 / `ebc83c5`). 7 stories promoted to done (confirmed shipped Waves 107–113). INDEX.md rows updated to match. US-064 row was missing from INDEX.md — added.

**PASS verdict (ADR-018 canonical format):**

### Wave-115 PASS verdict — PR #0 — SHA d58a350126e7d546db051451800bbfdbd8e9e9f9
- **Gate role:** business-analyst
- **Timestamp:** 2026-06-04T15:00:00Z
- **Notes:** Docs-only close-sweep. 39 US files updated (32 superseded, 7 done). INDEX.md rows updated. No code edits, no architecture/ edits, no peer HANDOFF edits. Peer-edit boundary respected. PR #0 + SHA (pending) per ADR-018 Wave 111b amendment; DevSecOps to backfill with real PR # + merge SHA post-merge.

**Architecture gate:** no `architecture/` edits. Gate doesn't fire.

**Peer-edit boundary:** no peer HANDOFF edits. Only own HANDOFF edited.

**Last-processed user message:** Wave 115 BA dispatch (2026-06-04, main `5b56c82`).

---

## PREV — 2026-06-04 — Wave 114: close-sweep complete (backlog zeroed)

**Deliverables this turn:** `coordination/handoffs/business-analyst.md` Wave 114 NOW section (this file). No code edits. No new US-NNN. No architecture/ edits.

**Triage table — all open issues as of Wave 114:**

| Issue | Title (short) | Verdict | Action | Replacement |
|---|---|---|---|---|
| #205 | Supply-chain: pin community UX skills | close: moot | `gh issue close 205` executed | None — no skills adopted in Wave 111b; nothing to pin. `.claude/agents/ux-designer.md` '## Design tools' carries the evaluation record. |
| #381 | LESSONS.md stale `_handoff-pending/` refs | close: absorbed | `gh issue close 381` executed | None — PR #385 (Wave 110, cae4a77) rewrote the Wave 93 entry; current LESSONS.md lines 40-43 correctly reference `coordination/handoffs/<role-id>.md`. |

**Verification:**

- `#205` rationale: Wave 111b (PR #387) evaluated all 6 skills (Impeccable, figma-implement-design, playwright-skill, theme-factory, accesslint, Excalidraw). Outcome: 3 Reject, 3 Defer — none adopted. Supply-chain pinning only applies to adopted dependencies. Nothing to pin. Issue is structurally moot.
- `#381` rationale: LESSONS.md line 40 (`### Wave 93 → Wave 108`) currently reads "The earlier `_handoff-pending/<wave>-<role>.md` fragment + `pnpm fold-handoff` step were retired in PR #374 (commit `ebc83c5`)". The stale reference was fully replaced by Architect's Wave 110 rewrite. No further edit needed.
- Post-close `gh issue list --state open --limit 100` → `[]`. Backlog is at zero.

**Wave 115 candidates:** None. Both open issues were clean closes (moot + absorbed). No substantive items surfaced requiring a new wave.

**PASS verdict (ADR-018 canonical format):**

### Wave-114 PASS verdict — PR #0 — SHA 9e490bb5544a62108547467cde6a8c34b06e6c4c
- **Gate role:** business-analyst
- **Timestamp:** 2026-06-04T14:00:00Z
- **Notes:** Docs-only close-sweep. No code edits, no new US-NNN, no architecture/ edits, no peer HANDOFF edits. Two `gh issue close` actions executed (#205, #381). Backlog zeroed. Peer-edit boundary respected. PR #0 + last-known SHA placeholder per ADR-018 Wave 111b amendment; DevSecOps to backfill with real PR # + merge SHA post-merge.

**Architecture gate:** no `architecture/` edits. Gate doesn't fire.

**Peer-edit boundary:** no peer HANDOFF edits. Only own HANDOFF edited.

**Last-processed user message:** Wave 114 BA dispatch (2026-06-04, main 9e490bb).

---

## PREV — 2026-06-04 — Wave 113: US-092 authored (backfill enforcement)

**Deliverables this turn:**

- `requirements/user-stories/US-092-backfill-enforcement.md` — authored, status: **in-flight**
- `requirements/INDEX.md` — US-092 row added; Wave 113 timestamp header added

**US-092 summary:** 4 ACs covering Wave 113 full scope:
- AC1: nightly cron trigger (`0 6 * * *` UTC) in `pass-verdict-format-check.yml` running TTL check only (not format check)
- AC2: `push: branches: [main]` trigger running TTL check only
- AC3: soft-fail semantics preserved on all triggers (cron, push, PR) — TTL check never becomes hard-fail
- AC4: `tests/qa/wave-113/backfill-enforcement.test.ts` asserting AC1–AC3 against workflow YAML structure

**Incident background:** Wave 112 QA catch — DevSecOps's Wave 111c `PR #0` placeholder in `coordination/handoffs/qa.md` was missed post-merge because no subsequent PR touched `coordination/handoffs/**`. The existing TTL check fires only on `pull_request` events. This story closes the surveillance gap.

**Scope calls recorded in story:**
- #205 (supply-chain UX skill pin): deferred to Wave 114.
- #332 positional bound: closed wont-fix in Wave 113 (Architect's Wave 112 scoping call).
- Option B (verdicts in PR descriptions): deferred indefinitely (ADR-018 invariant).

**PASS verdict (ADR-018 canonical format):**

### Wave-113 PASS verdict — PR #0 — SHA 9e490bb5544a62108547467cde6a8c34b06e6c4c
- **Gate role:** business-analyst
- **Timestamp:** 2026-06-04T13:00:00Z
- **Notes:** BA requirements phase only — US-092 authored + INDEX.md updated. No code or architecture edits. Architecture gate does not fire (no `architecture/` edits). Peer-edit boundary respected: only own HANDOFF + own US authoring.

**Architecture gate:** no `architecture/` edits. Gate doesn't fire.

**Peer-edit boundary:** no peer HANDOFF edits. Only own US file + own HANDOFF + INDEX.md (BA-owned) edited.

**Deferred to Wave 114:** #205 (supply-chain UX skill pin). #381 (LESSONS.md stale reference) — parked for DevSecOps.

**Last-processed user message:** Wave 113 BA dispatch (2026-06-04, main 75266d3).

---

## PREV — 2026-06-04 — Wave 112 Phase 2: #196 partial (BA body self-edit)

**Deliverables this turn:**

- `.claude/agents/business-analyst.md` — `## Lessons from prior incidents` section tail-appended at end of `## Skills` section. 5 incidents selected:
  1. Wave 65 / #143 — promote-to-MD discipline (repeated business-logic questions)
  2. Wave 55 — US-NNN traceability (implementers dispatched without a story)
  3. Wave 321 — directive-vs-plan conflict: BA's conflict-tracking had no mandatory workflow
  4. Wave 109 — `Closes #N` discipline: retain-vs-close decisions need rationale
  5. Wave 111b — self-application: test-bearing waves need a US even when they feel "docs-only"

**Gate verification:**
- `pnpm vitest run tests/qa/wave-108/subagent-body-cleanliness.test.ts` → 153/153 PASS
- `pnpm vitest run tests/qa/wave-110/subagent-body-completeness.test.ts` → 12/12 PASS
- `pnpm test:run` → 249/249 PASS
- `pnpm lint` → clean
- `pnpm type-check` → clean

**Token discipline:** no ADR-017 denylisted tokens introduced. Described pattern classes rather than naming literal retired tokens verbatim.

**Issue partial-close:** #196 (BA body done). Remaining bodies for full close: ui-developer, backend-developer, ux-designer, product-owner — not BA's lane.

**PASS verdict (ADR-018 canonical format):**

### Wave-112 PASS verdict — PR #0 — SHA 9e490bb5544a62108547467cde6a8c34b06e6c4c
- **Gate role:** business-analyst
- **Timestamp:** 2026-06-04T12:42:30Z
- **Notes:** BA self-edit only — tail-appended `## Lessons from prior incidents` to `.claude/agents/business-analyst.md`. Region-disjoint from Architect's Phase 1 mid-file boundary clauses. All 249 tests pass. Token discipline preserved (Wave 108 cleanliness test 153/153). PR #0 + last-known SHA placeholder per ADR-018 Wave 111b amendment; DevSecOps to backfill with real PR # + merge SHA post-merge.

**Architecture gate:** no `architecture/` edits. Gate doesn't fire.

**Peer-edit boundary:** no peer HANDOFF edits. Only own body + own HANDOFF edited.

**Last-processed user message:** Wave 112 Phase 2 dispatch (2026-06-04).

---

## PREV — 2026-06-04 — Wave 112 Phase 1: US-091 issued

**Deliverables this turn:**

- `requirements/user-stories/US-091-wave-112-cluster-cleanup.md` — authored, status: **accepted**
- `requirements/INDEX.md` — US-091 row added; Wave 112 timestamp header added

**US-091 summary:** 6 ACs covering Wave 112 full scope:
- AC1 (#389): `_handoff-pending/` directory deleted; `.githooks/pre-commit` rewritten to check `coordination/handoffs/*.md`
- AC2 (#390): Python heredoc extracted from `pass-verdict-format-check.yml` to `scripts/check-placeholder-ttl.py`
- AC3 (#391): Peer-edit protocol section in `architecture/workspace-conventions.md`; architect.md rubric flags peer-HANDOFF edits as FAIL; all 8 agent bodies gain "no peer HANDOFF writes" boundary clause
- AC4: actionlint job (or grep equivalent) in `.github/workflows/` catching `${{ github.event.* }}` inline-shell anti-pattern
- AC5 (#196 partial): `## Lessons from prior incidents` in 5 remaining agent bodies (business-analyst, ui-developer, backend-developer, ux-designer, product-owner); closes #196 fully combined with Wave 111b
- AC6 (#332 #333): `tests/qa/wave-112/wave-112-completeness.test.ts` — mechanical AC1–AC5 checks + positional directive-supremacy check in first ~600 chars post-frontmatter of all 8 agent bodies

**Phase 2 parked:** BA's own `## Lessons from prior incidents` self-edit to `.claude/agents/business-analyst.md` happens Phase 2 after Architect's #391 edits land. Not done this turn.

**Architecture gate:** no `architecture/` edits this turn. Gate doesn't fire.

**Peer-edit boundary:** no peer HANDOFF edits. Files-on-disk only.

**Last-processed user message:** Wave 112 Phase 1 dispatch (2026-06-04, main 39298fb).

**PASS verdict placeholder:** PR #0 (pending — to be updated at commit time).

---

## PREV — 2026-06-04 — Wave 111c: US-090 issued

**Deliverables this turn:**

- `requirements/user-stories/US-090-wave-111c-ci-process-discipline.md` — authored, status: **accepted**
- `requirements/INDEX.md` — US-090 row added; Wave 111c timestamp header added

**US-090 summary:** 5 ACs covering Wave 111c Cluster 4 CI/process discipline scope:
- AC1 (#240): `gh pr checks` step in devsecops.md merge protocol
- AC2 (#246): CI job gating PRs touching UI-relevant paths against UX PASS verdict (ADR-018 regex)
- AC3 (#301): `gh pr merge --delete-branch` anomalous-closure playbook in devsecops.md + LESSONS.md entry
- AC4 (#324): `pnpm outdated` deps verification; bump or close #324 with rationale
- AC5: ADR-018 CI regex enforcement + PR#0 placeholder flag; Wave 111a (PR #386, SHA a16c924) and Wave 111b (PR #387, SHA ba0905f) PASS-verdict backfill in qa.md

**Architecture gate:** no `architecture/` edits. Gate doesn't fire.

**Last-processed user message:** Wave 111c dispatch (2026-06-04, main ba0905f).

---

## PREV — 2026-06-04 — Wave 111b Phase 2: #292 + #293 absorbed (Cluster 3)

**Deliverables this turn:**

- `.claude/agents/business-analyst.md` — new `## Skills` section added at end of body with two subsections:
  - `### BDD acceptance criteria — co-authorship with QA` — mandatory Given/When/Then AC workflow with QA testability gate before `accepted` status (closes #292)
  - `### Forward-traceability index (US → BR → test)` — maintenance discipline for `requirements/traceability.md` cross-reference; BR-change impact protocol; test-cell update rule (closes #293)
- `requirements/traceability.md` — new file (BA-owned); 55-row US→BR→test table covering all stories from US-001 through US-089; change protocol section

**Gate verification:**
- `pnpm vitest run tests/qa/wave-108/subagent-body-cleanliness.test.ts` → 153/153 PASS
- `pnpm vitest run tests/qa/wave-110/subagent-body-completeness.test.ts` → 12/12 PASS
- `pnpm vitest run tests/qa/wave-111/pass-verdict-format.test.ts` → 21/21 PASS
- `pnpm lint` → clean
- `pnpm type-check` → clean

**Issues closed:**
- #292 closed: "Absorbed into business-analyst.md `## Skills > BDD acceptance criteria — co-authorship with QA` (Wave 111b)."
- #293 closed: "Absorbed into business-analyst.md `## Skills > Forward-traceability index` + materialized as `requirements/traceability.md` (Wave 111b)."

**Token discipline:** no ADR-017 denylisted tokens introduced. Cluster 3 guidance from Architect HANDOFF followed — described classes rather than naming literal tokens.

**Last-processed user message:** Wave 111b Phase 2 dispatch (2026-06-04).

---

## PREV — 2026-06-04 — Wave 111b Phase 1: US-089 issued

**Deliverables this turn:**
- `requirements/user-stories/US-089-wave-111b-fanout.md` — authored, status: **accepted**
- `requirements/INDEX.md` — US-089 row added; header timestamp updated

**US-089 summary:** 5 ACs covering the full Wave 111b fan-out scope:
- AC1 (Cluster 1): `## Lessons from prior incidents` in devsecops/qa/architect bodies (3–5 bullets, Date/Wave/Rule/Why/Apply format)
- AC2 (Cluster 2): UX skill ecosystem — 6 skills evaluated (Impeccable, figma-implement-design, playwright-skill, theme-factory, accesslint, Excalidraw); each adopted or explicitly deferred
- AC3 (Cluster 3): 13 skill-proposal issues across 6 subagents — each addressed by skill content or closed with rationale
- AC4 (Cluster 6): ADR-018 amended with commit-time `(pending)` placeholder pattern; `pass-verdict-format.test.ts` updated
- AC5 (Cluster 7): ADR-018 cross-refs in 4 gate bodies; `wave-111b-completeness.test.ts` asserts all AC1–AC5

**Phase shape:** Architect gates first (NFR review + ADR-018 amendment decision); then 6-subagent fan-out for body edits + QA completeness test. One PR.

**Peer context:**
- Architect: owns ADR-018 amendment decision (two-phase backfill vs PR-description anchor — both options in AC4 spec). Must deliver before QA writes updated test.
- QA: update `pass-verdict-format.test.ts` (AC4 pending-sha allowance) + new `wave-111b-completeness.test.ts` (AC5).
- 6 subagent bodies touched: devsecops, qa, architect, ux-designer, business-analyst, ui-developer, backend-developer.

**Last-processed user message:** Wave 111b Phase 1 dispatch prompt (2026-06-04).

---

## PREV — 2026-06-04 — Wave 111a: US-088 issued

**Deliverables:**
- `requirements/user-stories/US-088-pass-verdict-format.md` — authored, status: **accepted**
- `requirements/INDEX.md` — US-088 row added; header timestamp updated

**US-088 summary:** PASS-verdict format for `coordination/handoffs/<role>.md`. 6 ACs: ADR-018 existence (AC1, Architect-owned), required fields spec (AC2), REVISE/FAIL counterpart (AC3), grep-able anchor regex (AC4), QA conformance test (AC5), cross-refs in 4 agent files (AC6 — deferred-landing option to 111b noted explicitly in story). AC6 completed by US-089 AC5.

**Last-processed user message:** Wave 111a dispatch prompt (2026-06-04).

---

## PREV — 2026-06-04 — Wave 110 triad confirmation

**Verdict: no US-088.**
Wave 110 deliverables are docs/rules-only (devsecops.md prose edit, LESSONS.md correction, ops/README.md rewrite, QA presence test). The QA test asserts presence of already-shipped rules — it does not introduce new behavioral user-facing surface. Wave 109 precedent confirmed: docs/rules-only = skip US. Wave 108 precedent (US-087) was for a full subagent body-rewrite bundle + new test discipline; Wave 110 is a narrower prose-correction + presence-assertion wave, not comparable scope.

**INDEX.md check:**
`grep -E '#380|#381' requirements/INDEX.md` → no output. Neither issue is referenced in any active US row. The new merge-protocol issue Architect files this wave will likewise require no INDEX.md US row (same docs-only rationale). Verified for #380 and #381; will confirm Architect's new issue number as advisory after it is filed — no INDEX.md action expected.

**Last-processed user message:** Wave 110 triad confirmation prompt (2026-06-04).

---

## PREV — 2026-06-04 — Wave 109 close-sweep complete

**Wave 109 deliverables:**

### A. 6 issues closed
- **#322** closed: "ADR-016 listed at architecture/INDEX.md:22-23 since Wave 108 (PR #379, merge 79edd1e). Closing as absorbed." — https://github.com/keyan-commits/apex-team/issues/322
- **#217** closed: "S1-S9 skill rubric live in .claude/agents/qa.md body post-Wave-108 rewrites (PR #379, merge 79edd1e). Closing as absorbed." — https://github.com/keyan-commits/apex-team/issues/217
- **#211** closed: "Documented in .claude/agents/devsecops.md lines 372-389 post-Wave-108 (PR #379, merge 79edd1e). Closing as absorbed." — https://github.com/keyan-commits/apex-team/issues/211
- **#289** closed: "Dashboard surface retired in monolith decommission (PR #374, merge ebc83c5). Design doc is moot." — https://github.com/keyan-commits/apex-team/issues/289
- **#126** closed: "Route /agents/qa retired with monolith (PR #374, merge ebc83c5). Viewer-repo discovery is the new surface (separate codebase; file a fresh issue against apex-team-viewer if needed)." — https://github.com/keyan-commits/apex-team/issues/126
- **#194** closed: "src/ removed in monolith decommission (PR #374, merge ebc83c5). Lint rule has no TypeScript surface to catch on. Re-file against apex-team-viewer if applicable there." — https://github.com/keyan-commits/apex-team/issues/194

### B. 2 new issues filed
- **#380**: `bug(docs): ops/README.md describes retired monolith infrastructure` — https://github.com/keyan-commits/apex-team/issues/380
- **#381**: `bug(docs): LESSONS.md lines 17-19 reference retired _handoff-pending/ pattern` — https://github.com/keyan-commits/apex-team/issues/381

### C. INDEX.md check
No `Closes #N` rows in requirements/INDEX.md US entries for any of the 6 closed issues. No status updates required.

**Last-processed user message:** Wave 109 close-sweep prompt (2026-06-04, main 79edd1e).

---

## PREV — 2026-06-04 — Wave 109 prep (retained backlog triage + priority menu)

**Wave 109 deliverable:** read-only diagnostic. Retained 31 issues re-triaged against live repo state (post-Wave 108 body rewrites). Menu produced below.

**Key findings from live scan:**
- Wave 108 body rewrites absorbed #211 (merge=union local rebase discipline is in devsecops.md lines 372-389). Issue can be closed.
- #332/#333 reference `tests/lib/user-directive-supremacy.test.ts` which was deleted with the monolith. The gap is real but the tests need to be re-imagined for the subagent runtime (grep-based, not SDK-based). Keeping open — different form needed.
- #126 (/agents/qa surface tests) is fully monolith-dashboard-dependent; web UI retired. Propose closure.
- #289 (US-062 design doc) targets a retired dashboard component. Propose closure.
- LESSONS.md entry on merge=union (lines 17-19) references `_handoff-pending` + `pnpm fold-handoff` (both retired). New docs-integrity gap; should be filed.
- ops/README.md is stale monolith content (:3100/:3110, pnpm dev:test, .restart-trigger). Docs-integrity concern.
- CI (ci.yml) already runs `pnpm lint --max-warnings 0` — #240's core CI ask is satisfied. Remaining gap: explicit "CI green confirmed" in devsecops.md merge evidence + `gh pr merge --auto` adoption.
- #196 (durable cross-user learning) — "Lessons learned" per-role section not yet encoded in agent bodies. Gap is real.
- #335 (architecture/ co-authorship) — AC2 not in architect.md code-review rubric. Gap is real.

**Last-processed user message:** Wave 109 prep prompt (this turn).

---

## Wave 109 menu — retained backlog (BA-prioritized)

See bottom section for full menu text (returned as subagent reply).

---

## Previous wave context — Wave 108 triad (archived)

**Wave 108 triad deliverable complete (BA lane):**
- US-087 filed at `requirements/user-stories/US-087-subagent-body-rewrite.md` (status: accepted)
- `requirements/INDEX.md` updated: US-087 row added

**For Architect (Wave 108 ADR cross-link):**
- US-087 is the traceability wrapper for Wave 108 subagent body rewrite.
- The ADR (ADR-NNN) Architect writes must reference US-087 as the driving story.
- `architecture/workspace-conventions.md` must be cross-linked from the ADR per AC2 of US-087.
- Forbidden-pattern enumeration in the ADR must cover at minimum: `pnpm dev:test*`, `pnpm dev:supervised`, `/api/health` (as verification step), `.restart-trigger`, `agent_state` (SQLite), `mcp__apex-team__*`, `talk_to_product_owner`, `talk_to_role`, `:3100` test instance references. Allowlist: `mcp__apex-engine__*` (still live).
- Adapter-header decision (keep / remove / condense) must be ratified in the ADR.

**Open in BA lane:**
- US-086 status: accepted. Waiting for Architect to deliver `architecture/workspace-conventions.md` (Deliverable 1, Wave 107). Once Architect's doc lands, BA closes OQ-085-001/002 and moves US-086 to done.
- US-087 status: accepted. Waiting for Architect (ADR) + implementers (body edits) + QA (regression test).
- Viewer-repo conventions: parked, out of scope.

---

## Previous wave context — Wave 107 (archived below)

**Wave 107 deliverables complete (BA lane):**
- US-086 filed at `requirements/user-stories/US-086-workspace-conventions.md` (Task 1)
- Monolith-era backlog re-triaged (Task 2) — see table below
- `requirements/INDEX.md` updated: US-086 added, US-065/066/079-084 marked closed, closed-stories section added
- 30+ GitHub issues closed; 2 issues annotated with "surface changed to .claude/agents/*.md"

---

## Wave 107 Re-triage Table

| Issue / US | Title (short) | Verdict | Action taken | Replacement / note |
|---|---|---|---|---|
| #316 | self-heal L1 launchd | already closed pre-wave | — | US-079 status → closed |
| #317 | self-heal L2 stall detector | already closed pre-wave | — | US-080 status → closed |
| #318 | self-heal L3 auto-merge | already closed pre-wave | — | US-081 status → closed |
| #319 | SQLite migration crash-safety | already closed pre-wave | — | US-082 status → closed |
| #320 | runaway-restart alert | already closed pre-wave | — | US-083 status → closed |
| US-079 | Self-heal L1 | close: monolith-coupled | `status → closed` in file + INDEX | — |
| US-080 | Self-heal L2 | close: monolith-coupled | `status → closed` in file + INDEX | — |
| US-081 | Self-heal L3 | close: monolith-coupled | `status → closed` in file + INDEX | Core auto-merge discipline may be re-filed for subagent runtime (future wave) |
| US-082 | SQLite migration crash-safety | close: monolith-coupled | `status → closed` in file + INDEX | — |
| US-083 | Runaway-restart alert | close: monolith-coupled | `status → closed` in file + INDEX | — |
| US-084 | Self-instability hardening | close: monolith-coupled (all ACs) | `status → closed` in file + INDEX | AC1 PR #367 closed unmerged; AC2–AC5 target retired dev-supervisor |
| US-065 | RM-transition trio | close: monolith-coupled | `status → closed` in file + INDEX | Re-file against viewer repo when built |
| US-066 | Focus-ring contrast poll btn | close: monolith-coupled | `status → closed` in file + INDEX | Re-file against viewer repo when built |
| #370 | dev-supervisor fs.watch macOS-only | close: monolith-coupled | `gh issue close 370` executed | — |
| #371 | dev-supervisor stale pidfile on exit | close: monolith-coupled | `gh issue close 371` executed | — |
| #372 | dev-supervisor PID reuse false-positive | close: monolith-coupled | `gh issue close 372` executed | — |
| #355 | /api/health mcpMounted hardcoded lie | close: MCP server retired | `gh issue close 355` executed | — |
| #275 | AUTO-CONTINUE tick gap | close: tick scheduler retired | `gh issue close 275` executed | — |
| #260 | ADR: MCP session-ID enforcement | close: MCP server retired | `gh issue close 260` executed | — |
| #152 | outer-orchestrator auto-loop | close: replaced by subagent runtime | `gh issue close 152` executed | — |
| #97 | verify Waves 40b/43/44 | close: monolith waves, moot | `gh issue close 97` executed | — |
| #354 | MessageBubble focus-visible CSS | close: component retired | `gh issue close 354` executed | Re-file against viewer repo when built |
| #353 | AgentStatePanel focus ring | close: component retired | `gh issue close 353` executed | Re-file against viewer repo when built |
| #207 | browser_evaluate blocks dashboard localStorage | close: dashboard retired | `gh issue close 207` executed | — |
| #233 | a11y RM responsive transitions | close: dashboard retired | `gh issue close 233` executed | Covered by US-065 (now closed) |
| #329 | StallSettingsDrawer a11y | close: component retired | `gh issue close 329` executed | Re-file against viewer repo when built |
| #330 | a11y minor polish (touch targets etc.) | close: dashboard components retired | `gh issue close 330` executed | Re-file against viewer repo when built |
| #327 | MessageBubble keyboard handler | close: component retired | `gh issue close 327` executed | Re-file against viewer repo when built |
| #326 | OrchestratorBar button role | close: component retired | `gh issue close 326` executed | Re-file against viewer repo when built |
| #328 | dim text contrast (ActivityLog etc.) | close: dashboard components retired | `gh issue close 328` executed | Re-file against viewer repo when built |
| #249 | Done-last-24h panel bug | close: panel retired | `gh issue close 249` executed | — |
| #254 | chip-strip variable naming | close: dashboard component retired | `gh issue close 254` executed | — |
| #186 | Wave 83 worktree protocol miss | close: historical, moot | `gh issue close 186` executed | — |
| #155 | misattributed root cause in protocols.ts | close: historical analysis, moot | `gh issue close 155` executed | — |
| #200 | Pin NODE_ENV in pnpm build | close: monolith build retired | `gh issue close 200` executed | — |
| #315 | retroactive design spec US-070 | close: dashboard density component retired | `gh issue close 315` executed | — |
| #114 | drag-drop reorder Issues panel | close: dashboard feature retired | `gh issue close 114` executed | Re-file against viewer repo when built |
| #116 | surface user requests in dashboard | close: dashboard feature retired | `gh issue close 116` executed | Re-file against viewer repo when built |
| #139 | search in list panels | close: dashboard feature retired | `gh issue close 139` executed | Re-file against viewer repo when built |
| #128 | devsecops show environments | close: dashboard feature retired | `gh issue close 128` executed | Re-file against viewer repo when built |
| #145 | PO files issues on user's behalf | close: superseded by US-022 + absorbed into .claude/agents/product-owner.md | `gh issue close 145` executed | — |
| #352 | DISPATCH stall sites | close: DISPATCH auto-trigger mechanism retired | `gh issue close 352` executed | Subagent stall behavior is a fresh concern; file new issue if observed under Plan C |
| #188 | Issues panel responsive layout | close: dashboard component retired | `gh issue close 188` executed | Re-file against viewer repo when built |
| #305 | ActiveWaveCard CSS tests self-referential | close: component retired | `gh issue close 305` executed | — |
| #304 | ActiveWaveCard RM guard co-location | close: component retired | `gh issue close 304` executed | — |
| #297 | McpRebindBanner tests weak | close: component retired | `gh issue close 297` executed | — |
| #356 | [skill:ba] BDD ACs | close: duplicate of #292 | `gh issue close 356` executed | Keeping #292 open |
| #357 | [skill:ba] forward-traceability | close: duplicate of #293 | `gh issue close 357` executed | Keeping #293 open |
| #358 | [skill:architect] fitness functions | close: duplicate of #294 | `gh issue close 358` executed | Keeping #294 open |
| **RETAINED** | | | | |
| #375 | pr-hygiene.yml shell injection | keep open | — | In progress (DevSecOps Wave 107 deliverable 3) |
| #335 | architecture/ changes co-authored by Architect | keep open | — | Role protocol, still valid under subagent runtime |
| #333 | rename mutation guard test | keep open | — | Unit tests still in repo |
| #332 | tighten user-directive-supremacy test | keep open | — | Unit tests still in repo |
| #322 | ADR-016 missing from architecture/INDEX.md | keep open | — | Docs integrity issue, still valid |
| #314 | gate re-review must hard-sync to PR HEAD | keep open | — | Gate review discipline, still valid |
| #301 | gh pr merge anomalous closure incident | keep open | — | Process/workflow lesson, still valid |
| #289 | commit orphaned US-062 design doc | keep open | — | Doc hygiene, still valid |
| #246 | UX gate bypass on PR #231 | keep open | — | Process incident, still valid |
| #240 | merge train let lint error onto main | keep open | — | CI discipline, still valid |
| #324 | deps bump (9 patches) | keep open | — | Still applicable |
| #217 | QA 9-skill upgrade | keep open + annotated | commented: target .claude/agents/qa.md | Skill upgrade still needed; surface changed |
| #196 | durable cross-user learning via skill prompts | keep open + annotated | commented: target .claude/agents/*.md | Still valid; surface changed from src/lib/ to .claude/agents/ |
| #211 | devsecops local rebase merge=union | keep open | — | Git workflow, still valid |
| #205 | supply-chain pin community UX skills | keep open | — | Still valid for subagent skills |
| #199 | ux-designer design-skill ecosystem | keep open | — | Relevant to .claude/agents/ux-designer.md |
| #194 | ESLint no-unused-vars to error | keep open | — | CI/lint, still valid |
| #292 | [skill:ba] co-author BDD ACs with QA | keep open | — | Still valid for subagent BA |
| #293 | [skill:ba] forward-traceability index | keep open | — | Still valid for subagent BA |
| #294 | [skill:architect] fitness functions in CI | keep open | — | Still valid for subagent Architect |
| #295 | [skill:architect] AI/agent architectural review | keep open | — | Still valid for subagent Architect |
| #359 | [skill:architect] STRIDE threat modeling | keep open | — | Still valid for subagent Architect |
| #361 | [skill:ui-developer] prefers-reduced-motion | keep open | — | Still valid for subagent UI Dev |
| #362 | [skill:ui-developer] View Transitions API | keep open | — | Still valid for subagent UI Dev |
| #363 | [skill:backend-developer] N+1 query discipline | keep open | — | Still valid for subagent BE Dev |
| #364 | [skill:backend-developer] graceful shutdown | keep open | — | Still valid for subagent BE Dev |
| #365 | [skill:qa] contract testing | keep open | — | Still valid for subagent QA |
| #366 | [skill:qa] mutation testing | keep open | — | Still valid for subagent QA |
| #368 | [skill:devsecops] OIDC workload identity | keep open | — | Still valid for subagent DevSecOps |
| #369 | [skill:devsecops] policy-as-code gates | keep open | — | Still valid for subagent DevSecOps |
| #126 | surface QA tests in viewer | keep open | — | Still valid; viewer TBD |

---

## Parked

- Viewer-repo conventions: out of scope Wave 107. File as a separate story when viewer repo is created.
- US-081 core DevSecOps auto-merge discipline may apply to subagent runtime (outer Claude Code session merging PRs). Flag for Wave 108+ if PO wants to re-scope.
- OQ-085-001 + OQ-085-002: formally resolved by US-086 ACs. Close in open-questions.md once Architect delivers `architecture/workspace-conventions.md`.

## Workspace inventory

apex-team repo at `ebc83c5` (post-Plan-C-cutover). Monolith (server.ts, src/, Next.js, SQLite, MCP) retired. Active surface: `.claude/agents/*.md` (8 subagent prompts), `coordination/handoffs/` (per-role HANDOFF docs), `requirements/` (BA-owned specs), `architecture/` (Architect-owned), `design/` (UX-owned). GitHub Actions still active (`pr-hygiene.yml` et al). No running dev server; subagents run as Claude Code subagents.
