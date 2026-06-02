---
id: US-041
title: Wire dead protocols.ts constants into role prompts
slug: protocol-injection-wiring
status: accepted
owner: backend-developer
raised: 2026-06-02
closes: "#140"
---

# US-041 — Wire Dead `protocols.ts` Constants into Role Prompts

## Narrative

As an apex-team maintainer, I want all protocol constants defined in `protocols.ts` to be injected into the assembled system prompts via interpolation, so that edits to protocols automatically propagate to all agents and don't silently diverge through paraphrase.

## Acceptance Criteria

- **AC1:** `src/lib/roles.ts` — `ORCHESTRATOR_PROTOCOL` (approx. line 218) now interpolates `${REQUIREMENTS_PHASE_PROTOCOL}` in place of the abbreviated 2-line exception-tag summary. The full constant (~55 lines including exception-class table) is injected into the PO's system prompt.

- **AC2:** `src/lib/roles.ts` — `PHASED_WORKFLOW_DISCIPLINE` (approx. line 50) now interpolates `${REQUIREMENTS_PHASE_PROTOCOL}` in place of the prose reference "See REQUIREMENTS_PHASE_PROTOCOL for the seven narrow exception classes." All non-PO roles now see the full exception-class definitions.

- **AC3:** `src/lib/roles.ts` — `PEER_PROTOCOL` now includes `${CONSULTATION_PROTOCOL}` (4 lines: "Any role may HANDOFF to BA at any time…"). The statement is injected into all six non-PO role prompts.

- **AC4:** `src/lib/roles.ts` — The import block (lines 2–9) no longer imports `IMPLEMENTATION_PHASE_PROTOCOL`, `VERIFICATION_PHASE_PROTOCOL`, or `SKILLS_SELF_ENRICHMENT_PROTOCOL`. These three are deleted from the import list.

- **AC5:** `pnpm type-check` exits 0 (zero errors). The template literals are valid TypeScript; no unused-import ESLint warnings.

- **AC6:** `pnpm test:run` passes all tests without regression (all tests green after the change).

- **AC7:** The PO's assembled system prompt (observable in PO pane at `/`) includes the full `REQUIREMENTS_PHASE_PROTOCOL` exception-class table with all seven tags and per-class "when it applies" definitions. Confirm by reading the injected text in the prompt (not just the source code).

## Out of Scope

- Changes to `protocols.ts` itself (constants are already defined; this story wires them).
- Creating ADR-010 (the protocol-injection rule) — that's Architect's responsibility in parallel. This story implements the wiring; ADR-010 documents the rule.
- Dead-code cleanup in `skills/` files (e.g., `IMPLEMENTER_REFUSAL_CLAUSE` is live and used, so it stays).
- Prompt-size impact analysis — we accept the +~70 line increase as non-breaking (additive, no behavioral change).

## Technical Notes

_For implementer reference, not acceptance criteria._

- **Root cause of #140:** Five of six `protocols.ts` constants imported in `roles.ts` are **dead imports** — they are never interpolated into template strings. Only `WORKTREE_ISOLATION_PROTOCOL` is properly wired.

- **Highest-risk gap:** `REQUIREMENTS_PHASE_PROTOCOL`'s 7 exception-class definitions are absent from the PO's prompt (and from BA/Architect/UX/DevSecOps). The PO applies exception tags without seeing the per-class guardrails.

- **Why this matters:** When `protocols.ts` is updated (e.g., a new exception class is added), the change must propagate to all agents automatically. Paraphrasing breaks this — future edits to the source constant won't be seen by the agents.

- **Why not the other constants:** `IMPLEMENTATION_PHASE_PROTOCOL`, `VERIFICATION_PHASE_PROTOCOL`, `SKILLS_SELF_ENRICHMENT_PROTOCOL` are intentionally superseded:
  - Implementation details live in UI Dev / BE Dev workflow sections (co-located with the roles).
  - Verification details (Wave 64 rubric) live in `skills/qa.ts` independently (QA owns the gate).
  - Self-enrichment rule is replaced by `PHASED_WORKFLOW_DISCIPLINE` (comment in `roles.ts:118` acknowledges this).

## Links

_(Filled in during implementation)_

- impl: (pending)
- adr: (pending) architecture/decisions/ADR-010-protocol-injection-rule.md — Architect will author in parallel
- qa-pass-by: (pending)
