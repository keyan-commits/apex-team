---
id: US-041
title: Wire protocol constants into role prompts
slug: protocol-constants-wiring
status: accepted
owner: backend-developer
raised: 2026-06-02
closes: "#140"
wave: 88
---

# US-041 — Wire Protocol Constants into Role Prompts

## Narrative

As a team operator, I want `REQUIREMENTS_PHASE_PROTOCOL`, `ORCHESTRATOR_PROTOCOL`, and `CONSULTATION_PROTOCOL` to be live in agent system prompts, so that agents don't silently miss the exception-class table, the consultation rule, or the requirements triad mandate.

## Context

`src/lib/protocols.ts` defines several protocol constants that encode critical workflow rules — the exception-class table (`REQUIREMENTS_PHASE_PROTOCOL`), the orchestrator coordination rule (`ORCHESTRATOR_PROTOCOL`), and the peer-consultation rule (`CONSULTATION_PROTOCOL`). These constants were defined but **not interpolated** into the role prompts in `src/lib/roles.ts`, so agents never received them. This is the same "dead knowledge" anti-pattern addressed by ADR-010.

Three dead imports in `roles.ts` also existed: protocol constants imported but never used in the string templates. This story removes those and adds the correct wiring.

Issue #140 tracks this fix.

## Acceptance Criteria

- **AC1:** `src/lib/roles.ts` — the three previously dead imports (`REQUIREMENTS_PHASE_PROTOCOL`, `ORCHESTRATOR_PROTOCOL`, `CONSULTATION_PROTOCOL`) are now live: each is interpolated (not just imported) into at least one role's system prompt.

- **AC2:** `REQUIREMENTS_PHASE_PROTOCOL` is interpolated into `PHASED_WORKFLOW_DISCIPLINE` so every role's phased-workflow section includes the seven exception classes verbatim.

- **AC3:** `ORCHESTRATOR_PROTOCOL` and `CONSULTATION_PROTOCOL` are added to `PEER_PROTOCOL` so all peer roles receive the orchestrator coordination rule and the consultation trigger.

- **AC4:** No role prompt content is removed or replaced — this is additive only. Existing behavior of agents is unchanged for workflows where the constants' rules were already followed; agents now have the explicit text for edge cases.

- **AC5:** Five new tests in `tests/lib/roles.test.ts` verify: (a) `REQUIREMENTS_PHASE_PROTOCOL` text appears in relevant role prompts, (b) `ORCHESTRATOR_PROTOCOL` text appears in peer prompts, (c) `CONSULTATION_PROTOCOL` text appears in peer prompts, (d) no previously-working test regresses, (e) `pnpm type-check` exits 0.

- **AC6:** `pnpm type-check` exits 0. `pnpm test:run` passes 319/319 (or current total).

## Out of Scope

- Adding new protocol constants to `protocols.ts` (content fix only).
- Changing the wording of existing protocol constants.
- Removing or restructuring any existing role prompt sections.

## Technical Notes

_For implementer reference._

- The fix is in `src/lib/roles.ts` only. No other files need editing.
- "Dead imports" pattern: imports from `protocols.ts` appeared at the top of `roles.ts` but the imported names were never referenced in any template literal — TypeScript doesn't warn on unused imports in this project's config.
- ADR-010 (protocol injection / imports ≠ interpolation) documents this class of bug.

## Links

- impl: PR #197 (`feature/88-restore-ci-protocol`, Wave 88)
- adr: `architecture/decisions/ADR-010` (documents the import-vs-interpolation anti-pattern)
- qa-pass-by: (pending)
- deployed-by: (pending)
