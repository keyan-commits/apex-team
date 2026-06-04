# Architecture Index

Last updated: 2026-06-04 (Wave 111a — ADR-018 lands the canonical PASS-verdict format for gate-role HANDOFF docs; consumed by DevSecOps step 3, enforced by Wave 111c CI)

## Decision Records

| ADR | Title | Status |
|---|---|---|
| [ADR-001](decisions/ADR-001-role-skills-injection.md) | Role Skills Injection | Accepted |
| [ADR-002](decisions/ADR-002-multi-phase-workflow.md) | Mandatory Multi-Phase Workflow | Accepted |
| [ADR-003](decisions/ADR-003-tick-budget-reuses-turn-usage.md) | Tick Budget Reuses `turn_usage`; No Separate Budget Table | Accepted |
| [ADR-004](decisions/ADR-004-tick-invokes-run-turn-with-dispatches.md) | Tick MUST Invoke `runTurnWithDispatches`, Not Bare `runTurn` | Accepted |
| [ADR-005](decisions/ADR-005-po-state-externalization.md) | PO Orchestrator State Externalized into 4 Thread-Scoped DB Tables | Accepted |
| [ADR-006](decisions/ADR-006-handoff-auto-promote-and-rescue-sweep.md) | HANDOFF Auto-Promote + Tick Rescue Sweep (recovered stub — Wave 79) | Accepted |
| [ADR-007](decisions/ADR-007-server-side-stall-detector.md) | Server-Side Stall Detector | Accepted |
| [ADR-009](decisions/ADR-009-global-error-dynamic-export.md) | `force-dynamic` export on `global-error.tsx` | Superseded by ADR-010 |
| [ADR-010](decisions/ADR-010-build-dev-mode-prerender-bypass.md) | `pnpm build` prerender fix via dev-mode bundle (`next.config.ts`) | Accepted |
| [ADR-011](decisions/ADR-011-user-directive-supremacy.md) | User-Directive Supremacy as a Foundational Agentic Invariant | Accepted |
| [ADR-013](decisions/ADR-013-merge-train-conflict-resilience.md) | Merge-Train Conflict Resilience (`merge=union` + mergeable-state rescue, recovered stub — Wave 92) | Accepted |
| [ADR-014](decisions/ADR-014-handoff-fragment-pattern.md) | Towncrier-style HANDOFF Fragment Pattern (composes with ADR-013) | Superseded by ADR-017 (under subagent runtime) |
| [ADR-015](decisions/ADR-015-no-redis-mq.md) | No Redis / MQ — in-process SQLite + single-process suffices (+ tripwire) | Accepted |
| [ADR-016](decisions/ADR-016-mcp-client-rebind-strategy.md) | MCP client rebind strategy | Accepted |
| [ADR-017](decisions/ADR-017-subagent-body-rewrite-rules.md) | Subagent prompt body rewrite rules (Plan C runtime) — retires legacy monolith imperatives from `.claude/agents/*.md` bodies | Accepted |
| [ADR-018](decisions/ADR-018-pass-verdict-format.md) | Canonical PASS-verdict format for gate-role HANDOFF docs — heading-anchored block with `Wave-NNN PASS verdict — PR #N — SHA <40-char>` + 4 field lines; consumed by DevSecOps step 3, enforced by Wave 111c CI | Accepted |

## Flat docs

| File | Purpose | Status |
|---|---|---|
| [`workspace-conventions.md`](workspace-conventions.md) | Directory contract — single source of truth for where every deliverable lives under the Plan C subagent runtime. Every subagent reads this. | Ratified Wave 107 |
| [`nfr.md`](nfr.md) | Quantified non-functional requirements with measurement methods. | Created — NFR-A11Y-001, NFR-MOTION-001, NFR-MOTION-002 |
| `system-design.md` | Components, data flow, deployment topology. | Not yet created |
| `tech-stack.md` | Languages, frameworks, libraries with rationale. | Not yet created |
| `coding-standards.md` | Naming, layout, patterns the team must follow. | Not yet created — needs UI/UX review sub-step entry when drafted |
