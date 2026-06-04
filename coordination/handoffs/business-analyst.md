# business-analyst — HANDOFF

## NOW — 2026-06-04 — Wave 111c: US-090 issued

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
