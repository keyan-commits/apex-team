# Requirements Index

_Auto-maintained by Business Analyst. Last updated: 2026-06-01 (Wave 68 triad — US-023 + BR-002 + Lane A/B glossary + domain MD extensions)._

| File | Summary | Last Modified |
|------|---------|---------------|
| [scope.md](scope.md) | What's in / out / deferred + constraints (8 roles, MCP, phased workflow, single-user) | 2026-05-31 |
| [glossary.md](glossary.md) | 25 domain terms: AC, ADR, DISPATCH, FAIL, gate, HANDOFF, instance, Lane A, Lane B, NOTES, PASS, protocol, REVISE, skill, spec, story, turn, wave, worktree, workspace, WORKSPACE_REPO, and more | 2026-06-01 |
| [open-questions.md](open-questions.md) | OQ-001–OQ-002 RESOLVED; OQ-003 open (US-003 AC5); OQ-004 RESOLVED; OQ-005 open (SSE heartbeat, non-blocking); OQ-006–OQ-007 open (bootstrap consent); OQ-008 open (provenance format, US-009); OQ-009 open (scout trigger mechanism, US-010) | 2026-05-31 |
| [user-stories/_TEMPLATE.md](user-stories/_TEMPLATE.md) | Story template — copy this to create a new US-NNN file | 2026-05-31 |
| [user-stories/US-001-multi-phase-workflow-foundation.md](user-stories/US-001-multi-phase-workflow-foundation.md) | US-001: mandatory phased workflow — status in-dev; impl 2a81587 + 5802292 + 3d2a933 (worktrees) | 2026-05-31 |
| [user-stories/US-002-devsecops-pipeline-ownership.md](user-stories/US-002-devsecops-pipeline-ownership.md) | US-002: DevSecOps owns all pipeline/IaC/DevSecOps tasks — status done; shipped Wave 10b-d (88fd8d1 + 93015c7), merged 6eaab70 | 2026-05-31 |
| [user-stories/US-003-workspace-scoped-issues.md](user-stories/US-003-workspace-scoped-issues.md) | US-003: Issues panel shows issues from active workspace's GitHub repo, not hardcoded apex-team — status proposed; 5 ACs; OQ-003 + OQ-004 open | 2026-05-31 |
| [user-stories/US-004-mcp-transport-reliability.md](user-stories/US-004-mcp-transport-reliability.md) | US-004: MCP transport survives long agent turns without dropping — status proposed; 4 ACs; fixes #31; OQ-005 open (heartbeat, non-blocking) | 2026-05-31 |
| [user-stories/US-005-wave-11c-carry-forwards.md](user-stories/US-005-wave-11c-carry-forwards.md) | US-005: Issues panel polish — drop attribution prefix, per-repoStatus copy, :visited style fix, no stale-attribution flicker — status proposed; 4 ACs; owner UI Dev + BE Dev | 2026-05-31 |
| [user-stories/US-006-main-branch-enforcement.md](user-stories/US-006-main-branch-enforcement.md) | US-006: Main-branch enforcement for apex-team — GitHub branch protection + local pre-commit/pre-push hooks + CODEOWNERS advisory — status proposed; 6 ACs; owner DevSecOps | 2026-05-31 |
| [user-stories/US-007-portable-workspace-bootstrap.md](user-stories/US-007-portable-workspace-bootstrap.md) | US-007: Portable workflow bootstrap for external workspaces — single command installs hooks + CI stub + branch protection on any git repo — status proposed; 5 ACs; owner DevSecOps; depends on US-006 | 2026-05-31 |
| [user-stories/US-008-team-page-density.md](user-stories/US-008-team-page-density.md) | US-008: Team page density redesign — 4 surgical CSS/constant fixes: HANDOFF body max-height, messages area clamp, tighter bubble threshold, outbound bubbles collapsed by default — status proposed; 6 ACs; owner UI Dev | 2026-05-31 |
| [user-stories/US-009-per-agent-profile-page.md](user-stories/US-009-per-agent-profile-page.md) | US-009: Per-agent profile page at `/agents/[role]` — identity card, skills with provenance badges, open improvements list + file-issue form — status proposed; 6 ACs; owner UI Dev + BE Dev; OQ-008 open | 2026-05-31 |
| [user-stories/US-010-manual-daily-scout-trigger.md](user-stories/US-010-manual-daily-scout-trigger.md) | US-010: Manual Daily Scout trigger — "Run now" button on dashboard dispatches scout flow, spinner while running, counts update on completion — status proposed; 5 ACs; owner UI Dev + BE Dev; OQ-009 open | 2026-05-31 |
| [user-stories/US-011-context-saturation-indicator.md](user-stories/US-011-context-saturation-indicator.md) | US-011: Context saturation indicator — colour-coded fill bar or chip on agent panes (green/amber/red thresholds) + "Needs cleanup" badge at >80% — status proposed; 3 ACs (AC4 deferred); owner UI Dev + BE Dev | 2026-05-31 |
| [user-stories/US-016-role-boundary-architect-vs-ux.md](user-stories/US-016-role-boundary-architect-vs-ux.md) | US-016: Mandatory requirements phase + Architect-vs-UX-Designer routing — PO parallel triad (Architect+UX+BA) mandatory before implementers; implementer refusal clause; `REQUIREMENTS_PHASE_PROTOCOL` + `PHASED_WORKFLOW_DISCIPLINE` + MCP tool descriptions updated — status accepted; 8 ACs; owner UI Dev | 2026-06-01 |
| [user-stories/US-017-po-auto-compact-peer-handoffs.md](user-stories/US-017-po-auto-compact-peer-handoffs.md) | US-017: PO auto-compact oversized peer HANDOFF docs — reactive threshold (trigger >6000 chars, compact to ≤4000) before each implementer dispatch; compaction DISPATCH carries `[exception: housekeeping]`; 1h/role cooldown; impl target `roles.ts` — status accepted; 6 ACs; owner BE Dev or UI Dev (Wave 56); closes #131 | 2026-06-01 |
| [user-stories/US-018-scout-oauth-no-api-key.md](user-stories/US-018-scout-oauth-no-api-key.md) | US-018: Scout 'Run now' rewrites `skill-scout.mjs` onto Claude Agent SDK + apex-engine `web_search` MCP — replaces raw REST + web-search beta loop; web-search capability survives; clear "not logged in" error; 6 ACs; script rewrite, not one-line edit; owner BE Dev (Wave 57); closes #115 | 2026-06-01 |
| [user-stories/US-019-mandatory-dev-smoke-before-pass.md](user-stories/US-019-mandatory-dev-smoke-before-pass.md) | US-019: Mandatory TWO-LEG smoke before QA PASS — `pnpm build` (route-graph SWC compile) AND `pnpm dev:test`+`/api/health` 200 (server/MCP boot smoke); both required, neither sufficient alone; added to `VERIFICATION_PHASE_PROTOCOL` + QA rubric + CI workflow; Wave 64 incident response for `e7d4ba6` SWC parse error; 6 ACs; owner BE Dev + DevSecOps; closes #141 | 2026-06-01 |
| [user-stories/US-020-ba-competency-upgrade.md](user-stories/US-020-ba-competency-upgrade.md) | US-020: BA Competency Upgrade — workspace-discovery-first scan before answering; per-domain MDs (`domains/`, `business-rules.md`, `data-sources.md`, `samples/`); promote-to-MD discipline on every answer; cross-peer authority; onboarding scan on workspace change; glossary maintenance; intelligence-over-rote proactive gap flagging; 7 ACs; impl `business-analyst.ts` rewrite + small `architect.ts`; Wave 65; closes #143 | 2026-06-01 |
| [user-stories/US-021-issues-panel-adaptive.md](user-stories/US-021-issues-panel-adaptive.md) | US-021: Issues Panel + Recent Open adaptive to active workspace — dynamic `byLabel` from workspace repo; Recent Open always populated; empty-state copy; GH label colors; per-workspace refetch; Mac 2 lfm-b2b acceptance test; no regression on apex-team; 8 ACs; owner BE Dev + UI Dev; Wave 66; closes #144 | 2026-06-01 |
| [user-stories/US-022-po-file-user-requests-as-gh-issues.md](user-stories/US-022-po-file-user-requests-as-gh-issues.md) | US-022: MANDATORY — PO files feature/bug/issue on active workspace repo on behalf of claude-code; MANDATORY wording; WORKSPACE_REPO injection via `providers.ts` (cached); fallback to apex-team `cross-repo-orphan` (no roundtrip); dedup; trivial-ops carve-out declared in HANDOFF; `Source:` footer AC7; workspace PR owns `Closes #N` (different merge flow); Mac 2 15s verification AC; 10 ACs; impl `roles.ts` + `providers.ts` (NO `product-owner.ts`); Wave 67; closes #145 | 2026-06-01 |
| [user-stories/US-023-lane-a-pipeline-parallelism.md](user-stories/US-023-lane-a-pipeline-parallelism.md) | US-023: Lane A (PO+BA+Architect+UX) pipeline parallelism — Lane A pre-stages next wave's requirements/design while Lane B implements; no-idle-Lane-A rule (BR-002); same-turn parallel-fire rule for PO; Wave queue in HANDOFF NOTES; wave dependency declaration; file-touch conflict avoidance; LESSONS.md entry; 11 ACs; impl target `roles.ts` + 3 skill files (NO `product-owner.ts`); Wave 68; closes #146 | 2026-06-01 |

## Voided user stories

These story numbers were referenced in HANDOFF docs from prior sessions but were **never committed to disk**. They are voided as of 2026-06-01; their concerns are superseded by US-016 (mandatory requirements phase + role-boundary routing). See issue #135 for the tracking record.

| Story | Disposition |
|---|---|
| US-012 | Voided 2026-06-01 — referenced in prior HANDOFF history but never landed on disk. Concerns superseded by US-016. |
| US-013 | Voided 2026-06-01 — referenced in prior HANDOFF history but never landed on disk. Concerns superseded by US-016. |
| US-014 | Voided 2026-06-01 — referenced in prior HANDOFF history but never landed on disk. Concerns superseded by US-016. |
| US-015 | Voided 2026-06-01 — referenced in prior HANDOFF history but never landed on disk. Concerns superseded by US-016. |

**Session-continuity rule (AC2 of #135):** US files must be committed in the SAME PR where the wave referencing them ships. A user story referenced in a DISPATCH or HANDOFF that doesn't exist on disk is an audit-trail gap — never reference a story before it's committed.

## Domain knowledge (pre-seeded Wave 65)

| File | Summary | Last Modified |
|------|---------|---------------|
| [domains/agents.md](domains/agents.md) | 8 roles, ownership, authority model, escalation rules — BA-organized from CLAUDE.md | 2026-06-01 |
| [domains/handoff-flow.md](domains/handoff-flow.md) | `[[HANDOFF]]` vs `[[DISPATCH]]` vs `[[NOTES]]` — who emits what, auto-trigger semantics, common patterns | 2026-06-01 |
| [domains/orchestrator-protocol.md](domains/orchestrator-protocol.md) | PO's mandatory triad (US-016), 7 exception tags, IMPLEMENTER_REFUSAL_CLAUSE, HANDOFF compaction rule (US-017) | 2026-06-01 |
| [domains/verification-and-smoke.md](domains/verification-and-smoke.md) | Two-leg QA smoke: `pnpm build` (route-graph) + `:3100/api/health` (server/MCP boot) — full gate rubric per US-019 | 2026-06-01 |
| [domains/requirements-lifecycle.md](domains/requirements-lifecycle.md) | User request → US-NNN → triad → wave → PR → gates → merge; story status lifecycle; OQ-PREFIX-NNN convention | 2026-06-01 |
| [business-rules.md](business-rules.md) | BR-001: mandatory issue-filing (before any impl dispatch; fallback to apex-team `cross-repo-orphan`). BR-002: no-idle-Lane-A rule (Lane A idle + backlog > 0 = PO breach; same-turn parallel-fire). BR-NNN format: rule/source/confidence/established-by. | 2026-06-01 |
| [data-sources.md](data-sources.md) | External data surfaces: SQLite DB, GitHub Issues API, apex-engine MCP, Claude Agent SDK OAuth | 2026-06-01 |
| [samples/](samples/) | Screenshots, sample files, API response captures — referenced from domain MDs and business-rules.md | 2026-06-01 |
