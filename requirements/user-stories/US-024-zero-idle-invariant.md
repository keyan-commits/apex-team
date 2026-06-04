# US-024 — Zero-Idle Invariant

**Status:** superseded  
**Wave:** 69  
**Closes:** #148  

## Resolution — superseded by Plan C cutover

All ACs target `src/lib/roles.ts` ORCHESTRATOR_PROTOCOL and `requirements/domains/orchestrator-protocol.md` (domain doc). The roles.ts file is a monolith file retired at Plan C cutover (main `ebc83c5`, PRs #373 + #374). Zero-idle invariant discipline (BR-003) was absorbed into `.claude/agents/product-owner.md` during Wave 108 body rewrites (PR #379, `586ed8d`).

## Story

As a Product Owner, I want every team agent assigned to meaningful work whenever the backlog has open issues, so that the team never stalls waiting for a human ping to assign the next task.

## Background

Prior to Wave 69, agents went idle between explicit PO dispatches. Lane B implementers finishing a wave had no automatic reassignment; Lane A (BA/Architect/UX) sat idle while waiting for an explicit dispatch even though backlog issues remained. This caused merge-train stalls and wasted capacity.

## Acceptance criteria

1. PO's first action every turn is a zero-idle scan: any agent with no in-progress work AND backlog > 0 receives an immediate fallback DISPATCH before PO processes the incoming message.
2. `ORCHESTRATOR_PROTOCOL` in `src/lib/roles.ts` encodes the zero-idle invariant with priority order: (1) Lane B impl, (2) Lane B gate, (3) Lane A triad, (4) domains/ extension, (5) backlog triage, (6) ops audit, (7) declare idle only if backlog = 0 AND no in-flight work.
3. Lane A (PO + BA + Architect + UX) MUST fire in parallel with Lane B implementation — not serially after Lane B completes.
4. PO fires the next Lane A triad at the same turn as a Lane B implementer DISPATCH when the backlog has remaining waves.
5. A role that has emitted a consult-BA HANDOFF and is waiting for BA's reply is NOT counted as idle by the zero-idle scan.
6. The invariant is documented in `requirements/domains/orchestrator-protocol.md` under the Zero-idle invariant section with reference to BR-003.
7. `business-rules.md` BR-003 records: "No agent may be idle while the apex-team backlog has open issues."
8. `glossary.md` IDLE_INVARIANT entry cross-links to BR-003 and US-026 (runtime enforcement via tick scheduler).
9. PO declares genuine idle ONLY when: backlog = 0 AND peer inboxes = 0 AND no open PRs — then confirms with user.

## Implementation notes

- `src/lib/roles.ts` → `ORCHESTRATOR_PROTOCOL` section
- Wave 71 (US-026) is the runtime enforcement: tick scheduler calls PO periodically so the invariant is enforced without human pings

## Related

- BR-003, US-026 (runtime enforcement), US-023 (Lane A cadence)
