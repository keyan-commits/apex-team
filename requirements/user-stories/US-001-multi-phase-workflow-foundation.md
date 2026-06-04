# US-001 — Mandatory Multi-Phase Workflow Foundation

**Status:** superseded
**Owner role:** multiple (Architect, BA, DevSecOps — cross-cutting foundation)
**Created:** 2026-05-31
**Superseded:** 2026-06-04
**Story ID:** US-001

## Resolution — superseded by Plan C cutover

ACs 2–4 reference `pnpm dev:test:ui`, `pnpm dev:test:be`, ports `:3110`/`:3120`, git worktrees for physical role isolation, and a separate SQLite DB per instance — all monolith-era constructs retired at Plan C cutover (main `ebc83c5`, PRs #373 + #374). Under the subagent runtime there is no dev server to spin up; isolation is provided by separate Claude Code subagent invocations, not worktrees + ports. The phased workflow discipline itself was absorbed into `.claude/agents/*.md` bodies during Wave 108 (PR #379).

---

## Narrative

As the user, I want every change to apex-team to flow through a mandatory phased workflow (Requirements → Implementation → Verification → Deployment), so that requirements are documented before any code is written, each implementer works in isolation, only tested and verified changes reach the live instance, and the team improves its own skills when gaps are identified.

## Acceptance Criteria

- **AC1:** Given a new feature request from the user, when the PO begins orchestration, then Architect + UX Designer + BA are dispatched in parallel BEFORE any implementer (UI Dev, BE Dev) receives a DISPATCH. _(No implementation wave starts without a BA user story in `requirements/user-stories/`.)_
- **AC2:** Given a BA user story exists for a feature, when UI Dev or BE Dev begins implementation, then each invokes `pnpm branch:start <role> <wave>-<short>` to create a git worktree at `../apex-team-<role>-<short>/` with a feature branch (`feature/<wave>-<short>`) checked out, and spins up their own isolated dev instance (`pnpm dev:test:ui` port 3110 or `pnpm dev:test:be` port 3120) with a separate SQLite DB. _(Worktree + isolated instances provisioned by DevSecOps Wave 9c `3d2a933`.)_
- **AC3:** Given an implementer has completed work and all local unit tests pass, when they hand off to QA, then: (a) if the change touches UI, UX Designer reviews first and returns PASS or REVISE against `design/INDEX.md`; (b) only after UX PASS (if applicable) does QA exercise the change on `:3100` against the story's ACs; (c) QA returns PASS or FAIL with evidence. _(Both gates required for UI changes; QA alone for non-UI.)_
- **AC4:** Given QA returns PASS (and UX returns PASS if UI), when the deploy handoff is triggered, then only DevSecOps merges the feature branch to main and pushes to `origin/main`. No other role merges or pushes directly. _(DevSecOps is the sole merge + push authority.)_
- **AC5:** Given any role identifies a missing skill or MCP tool, when they cannot fulfill their phase obligations with existing capabilities, then they file a `skill-proposal` or `mcp-proposal` GitHub issue (label: `skill-proposal`/`mcp-proposal`) and may search mcpmarket.com before the next wave. _(Self-enrichment protocol closes skill gaps without blocking the current turn.)_
- **AC6:** Given a peer role has a requirements question, when they HANDOFF to BA, then BA responds with a direct answer referencing the appropriate `requirements/` document, and updates the document if the answer resolves an ambiguity. _(BA is the consultation hub; `requirements/` is the durable source of truth.)_

## Out of Scope

- This story establishes the workflow protocol — it does not implement specific features. The protocol's effectiveness is measured over subsequent waves, not in this story alone.
- DevSecOps provisioning scripts (`pnpm dev:test:ui`, `pnpm dev:test:be`, `pnpm branch:start`) are tracked as part of this story's implementation but are a separate DevSecOps deliverable.
- Enforcement at the git level (branch protection rules, required status checks) — deferred; requires CI which requires `ANTHROPIC_API_KEY` (see OQ-001 re: isolation model).

## Open Questions

- **OQ-001**: ~~Feature branches vs git worktrees vs separate clones~~ — **RESOLVED**. User confirmed: feature branches for logical isolation + git worktrees for physical isolation. Implemented in DevSecOps Wave 9c (`3d2a933`). AC2 updated accordingly.

## Design Spec

- Not applicable. This story is process/protocol, not UI.

## Links

- impl: `2a81587` (Architect — `src/lib/protocols.ts`, `architecture/decisions/ADR-002-multi-phase-workflow.md`, `src/lib/roles.ts`)
- impl: `a8fab5d` (Architect — `DEPLOYMENT_GATES_PROTOCOL` predecessor, Wave 9a)
- impl: `5802292` (DevSecOps — per-role `dev:test:*` scripts + `pnpm branch:start` helper, Wave 9b)
- impl: `3d2a933` (DevSecOps — worktree-based isolation: `pnpm branch:start <role> <slug>` + `pnpm branch:cleanup`, Wave 9c)
- test: _(pending — DevSecOps script verification + QA smoke test for gate flow)_
- design-pass-by: N/A (non-UI)
- qa-pass-by: _(pending — Wave 9b QA gate)_
- deployed-by: _(pending — DevSecOps merge after QA PASS)_
