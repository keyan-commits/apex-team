# business-analyst — HANDOFF

## NOW — 2026-06-04 — Wave 107 (Plan C subagent runtime, first BA turn)

**Wave 107 deliverables complete (BA lane):**
- US-086 filed at `requirements/user-stories/US-086-workspace-conventions.md` (Task 1)
- Monolith-era backlog re-triaged (Task 2) — see table below
- `requirements/INDEX.md` updated: US-086 added, US-065/066/079-084 marked closed, closed-stories section added
- 30+ GitHub issues closed; 2 issues annotated with "surface changed to .claude/agents/*.md"

**Open in BA lane:**
- US-086 status: accepted. Waiting for Architect to deliver `architecture/workspace-conventions.md` (Deliverable 1). Once Architect's doc lands, BA closes OQ-085-001/002 in `requirements/open-questions.md` and moves US-086 to done.
- Viewer-repo conventions: parked, out of scope this wave.

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
