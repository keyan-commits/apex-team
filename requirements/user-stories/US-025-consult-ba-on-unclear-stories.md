# US-025 — Consult-BA on Unclear Stories

**Status:** superseded  
**Wave:** 70  
**Closes:** #149  

## Resolution — superseded by Plan C cutover

All ACs target `src/lib/skills/*.ts` (qa, backend-developer, ui-developer, ux-designer, architect, devsecops) and `src/lib/roles.ts` ORCHESTRATOR_PROTOCOL — all monolith files retired at Plan C cutover (main `ebc83c5`, PRs #373 + #374). The consult-BA discipline (BR-004) was absorbed into `.claude/agents/*.md` bodies during Wave 108 body rewrites (PR #379, `586ed8d`).

## Story

As a team peer (Architect, UX Designer, UI Dev, BE Dev, QA, DevSecOps), I want a clear protocol for escalating ambiguous acceptance criteria to the Business Analyst before writing code, so that I never silently guess on business intent.

## Background

Prior to Wave 70, peers would infer business rules from the codebase or prior chat context when a user story was unclear. This produced silent divergence between implementation and requirements — and BA couldn't track what had been assumed.

## Acceptance criteria

1. Every implementer (Architect, UX Designer, UI Dev, BE Dev, QA, DevSecOps) skill prompt includes the canonical sentence: "If any acceptance criterion or business term in your assigned user story is unclear, ambiguous, or contradicts the codebase, emit `[[HANDOFF: business-analyst]]` BEFORE writing code, tests, or config. Silent guessing on business intent is forbidden."
2. The canonical sentence is present in: `src/lib/skills/qa.ts`, `src/lib/skills/backend-developer.ts`, `src/lib/skills/ui-developer.ts`, `src/lib/skills/ux-designer.ts`, `src/lib/skills/architect.ts` (strengthened), `src/lib/skills/devsecops.ts` (first touch).
3. BA's reply to a consult-BA HANDOFF always includes: (a) the clarification, (b) promotion to a durable MD in `requirements/`, (c) a HANDOFF back to the asking role with explicit permission to proceed.
4. A consult-BA HANDOFF counts as non-idle activity for the IDLE_INVARIANT (US-024 AC5). PO's zero-idle scan must NOT double-dispatch a role waiting for BA's reply.
5. `ORCHESTRATOR_PROTOCOL` in `src/lib/roles.ts` documents the consult-BA invariant with explicit reference to the compose-with-zero-idle rule.
6. `requirements/domains/orchestrator-protocol.md` has a Consult-BA invariant section (Wave 70, US-025) cross-linked to BR-004.
7. `business-rules.md` BR-004 records: "A working role MUST emit a consult-BA HANDOFF before writing code when any AC or business term in the assigned story is unclear or ambiguous."
8. `glossary.md` CONSULT_BA entry describes the full protocol (emit before coding → BA clarifies + promotes + replies with proceed).
9. If BA cannot answer within the current turn, BA documents the question in `open-questions.md` as a blocking OQ and returns a working assumption that allows the peer to proceed with low risk.
10. The consult-BA protocol is exempt from the seven-exception bypass list — there is no exception that allows silent guessing.

## Implementation notes

- 6 skill files in `src/lib/skills/` each need the canonical sentence (AC2)
- `src/lib/roles.ts` → `ORCHESTRATOR_PROTOCOL` section (AC5)

## Related

- BR-004, US-024 (IDLE_INVARIANT interaction), US-026 (tick dispatches do NOT bypass consult-BA)
