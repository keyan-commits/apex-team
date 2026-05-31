# ADR-002 — Mandatory Multi-Phase Workflow

**Date:** 2026-05-31
**Status:** Accepted
**Requirement:** User directive — "Mandatory PO process: PO should talk to Architect, UI/UX Designer, and BA FIRST to articulate the requirements and get inputs from those 3. The BA will document all the requirements and properly add user stories for the UI, Backend Developers and QA. The UI and Backend Developers will work on their own instance of the application and source code and do their own unit tests. Once they tested their work they will handover their deliverables to the QA (if UI is involved, add UI/UX designer). Everyone will test on their own environment. Once QA and UI/UX team is done, then they will ask the DevSecOps team to deploy to the live instance. Everyone should handover deployment tasks to DevSecOps."

## Context

Prior to this ADR, the PO could dispatch implementers (UI Dev, BE Dev) directly, before requirements were formally documented by BA or design specs were produced by UX Designer. In practice this led to:

- Implementation decisions made without a user-story acceptance criteria baseline.
- UI Dev implementing against personal interpretation rather than a UX spec.
- QA receiving code with no documented ACs to verify against.
- Push-to-main happening from any role (implementer or QA) without a formal merge gate.
- No isolation between an implementer's in-flight work and the shared dev instance.

The user also identified a self-improvement gap: if a role lacks the skills to do its job properly, there was no explicit protocol for acquiring them.

## Decision

A mandatory 4-phase model governs all feature and change work:

### Phase 1 — Requirements
PO dispatches **Architect + UX Designer + BA in parallel** for any new ask before dispatching implementers. BA writes the user story with acceptance criteria. Architect provides NFR + feasibility input. UX Designer reviews design approach. No implementation wave starts without a BA user story in `<workspace>/requirements/user-stories/`.

### Phase 2 — Implementation
UI Dev and BE Dev each work on a **feature branch** (`feature/<wave>-<short>`) from main. Each spins up their own **isolated dev instance** (`pnpm dev:test:ui` port 3110 / `pnpm dev:test:be` port 3120) with a separate DB. Each writes unit tests and runs `pnpm test:run` locally before any HANDOFF to QA.

### Phase 3 — Verification
For UI changes: **UX Designer reviews first** (against `<workspace>/design/` spec), returns PASS or REVISE. Only after UX PASS does **QA** exercise the change on `:3100` (`pnpm dev:test`) against BA's ACs. Both gates are required for UI; QA alone for non-UI.

### Phase 4 — Deployment
**DevSecOps is the sole agent authorized** to merge feature branches to main and push to `origin/main`. DevSecOps deploys to the user-facing instance (port 3000) only after receiving QA PASS + UX PASS (if UI) HANDOFFs.

### Consultation
Any role may HANDOFF to BA at any time for requirements clarification. BA's `<workspace>/requirements/` is the authoritative source of truth.

### Skills Self-Enrichment
If a role identifies a missing skill or MCP tool, they file a `skill-proposal` or `mcp-proposal` GitHub issue (label flow) and may search mcpmarket.com or the Anthropic skill marketplace.

## Per-role gate ownership

| Role | Phase | Gate |
|---|---|---|
| BA | Requirements | Produces user story; blocks implementation wave |
| Architect | Requirements + Post-impl | NFR/feasibility input in req phase; PASS-gates non-UI design post-impl |
| UX Designer | Requirements + Post-impl | Design feasibility in req phase; PASS-gates UI before QA |
| UI Dev | Implementation | Works on feature branch, isolated instance, local unit tests |
| BE Dev | Implementation | Works on feature branch, isolated instance, local unit tests |
| QA | Verification | PASS/FAIL gate on :3100 against BA ACs + UX spec |
| DevSecOps | Deployment | Sole merge + push + deploy authority |

## Consequences

**Positive:**
- Requirements are documented before any code is written — spec drift and "what should this do?" interruptions during implementation drop significantly.
- Isolated dev instances prevent in-flight work from contaminating the shared dashboard.
- Clear gate ownership: no ambiguity about who can push to main.
- Self-enrichment protocol closes the "missing skill" gap without blocking turns.

**Negative:**
- Requirements phase adds latency before implementation starts. For trivial 1-line fixes, this overhead may exceed the fix itself.
- Per-role isolated instances require DevSecOps to provision the `pnpm dev:test:ui` / `pnpm dev:test:be` scripts (tracked in Wave 9b DevSecOps HANDOFF).
- "Their own source code" was interpreted as **feature branches** (not git worktrees or separate clones). If the user intends stronger isolation (separate file-system clones), this ADR should be updated after clarification.

## Compatibility

ADR-001 (Role Skills Injection) stands unchanged. The skills injection mechanism is orthogonal to the workflow phases — skills are appended to system prompts regardless of phase.

The Wave 9a `DEPLOYMENT_GATES_PROTOCOL` (QA gate + UX gate before push) is superseded by the more complete Phase 3 + Phase 4 model in this ADR. The `DEPLOYMENT_GATES_PROTOCOL` constant is retained in `src/lib/roles.ts` for backward reference; `src/lib/protocols.ts` contains the canonical Phase definitions going forward.
