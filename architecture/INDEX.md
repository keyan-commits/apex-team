# Architecture Index

Last updated: 2026-06-02 (Wave 93 — added ADR-014 fragment pattern; indexed ADR-013)

## Decision Records

| ADR | Title | Status |
|---|---|---|
| [ADR-001](decisions/ADR-001-role-skills-injection.md) | Role Skills Injection | Accepted |
| [ADR-002](decisions/ADR-002-multi-phase-workflow.md) | Mandatory Multi-Phase Workflow | Accepted |
| [ADR-003](decisions/ADR-003-tick-budget-reuses-turn-usage.md) | Tick Budget Reuses `turn_usage`; No Separate Budget Table | Accepted |
| [ADR-004](decisions/ADR-004-tick-invokes-run-turn-with-dispatches.md) | Tick MUST Invoke `runTurnWithDispatches`, Not Bare `runTurn` | Accepted |
| [ADR-005](decisions/ADR-005-po-state-externalization.md) | PO Orchestrator State Externalized into 4 Thread-Scoped DB Tables | Accepted |
| [ADR-006](decisions/ADR-006-handoff-auto-promote-and-rescue-sweep.md) | HANDOFF Auto-Promote + Rescue Sweep | Accepted |
| [ADR-008](decisions/ADR-008-server-start-rearm-sweep.md) | Server-Start Re-Arm Sweep | Accepted |
| [ADR-009](decisions/ADR-009-global-error-dynamic-export.md) | `force-dynamic` export on `global-error.tsx` | Superseded by ADR-010 |
| [ADR-010](decisions/ADR-010-build-dev-mode-prerender-bypass.md) | `pnpm build` prerender fix via dev-mode bundle (`next.config.ts`) | Accepted |
| [ADR-011](decisions/ADR-011-lessons-learned-skill-file-persistence.md) | Lessons-Learned Skill-File Persistence | Accepted |
| [ADR-013](decisions/ADR-013-merge-train-conflict-resilience.md) | Merge-Train Conflict Resilience (`merge=union` + mergeable-state rescue) | Proposed |
| [ADR-014](decisions/ADR-014-handoff-fragment-pattern.md) | Towncrier-style HANDOFF Fragment Pattern (composes with ADR-013) | Accepted |

## Pending docs

| File | Status |
|---|---|
| `nfr.md` | Not yet created |
| `system-design.md` | Not yet created |
| `tech-stack.md` | Not yet created |
| `coding-standards.md` | Not yet created — needs UI/UX review sub-step entry when drafted |
