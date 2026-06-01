# Handoff Flow — Agent Communication Channels

## Three channels

### `[[HANDOFF: role]] … [[/HANDOFF]]`
Peer-to-peer async message. Lands in the target role's inbox. **Does NOT auto-trigger a turn.** Any role can emit. The target picks it up when PO next dispatches them or when the user invokes them directly. Used for: questions, review requests, forwarded tasks, feedback, clarifications.

### `[[DISPATCH: role]] … [[/DISPATCH]]`
Orchestrator-to-team. **Auto-triggers the target's turn immediately.** Emitted ONLY by the Product Owner. This is how PO starts work waves — the dispatched role runs a turn automatically. Peers cannot DISPATCH each other.

### `[[NOTES]] … [[/NOTES]]`
Each role's own persistent working state. Each role emits ONE `[[NOTES]]` block per turn that fully replaces their HANDOFF doc in the database. Not addressed to anyone — it's role-private state. The "current HANDOFF doc" shown in every agent's context is the last `[[NOTES]]` they emitted.

## Key rules

1. Only PO uses DISPATCH. A peer that uses DISPATCH-syntax in a message is misusing the protocol.
2. HANDOFF does not start work; DISPATCH does.
3. Inbox count > 0 → the role has unread peer messages. PO tracks this via `get_team_status`.
4. A peer can safely ignore inbox items if they've already been resolved by a parallel dispatch; inbox is idempotent not a queue.

## Common patterns

| Scenario | Channel |
|---|---|
| Asking BA a business-logic question | `[[HANDOFF: business-analyst]]` |
| Architect returning a code review PASS/REVISE | `[[HANDOFF: qa]]` |
| PO starting a new implementation wave | `[[DISPATCH: backend-developer]]` + parallel `[[DISPATCH: ui-developer]]` |
| BA forwarding a misrouted task | `[[HANDOFF: <correct-role>]]` |
| Role updating its own working state | `[[NOTES]]` block |

## Lane A cadence and parallel DISPATCHes

PO's same-turn parallel-fire rule (Wave 68, US-023) is the Lane A cadence in action: when PO dispatches a Lane B implementer, it also fires the next wave's Lane A triad in the same reply. A PO turn that dispatches `[[DISPATCH: backend-developer]]` without also dispatching a Lane A triad (when backlog has waves) is in breach of BR-002.

The parallel DISPATCH pattern — multiple `[[DISPATCH: role]]` blocks in one PO reply — is normal and expected. Each dispatched role runs its turn and lands in the conversation output. All DISPATCHes in a single PO reply auto-trigger concurrently (the runtime fires them sequentially for now, but they are logically parallel: none should depend on another's output from the same turn).

## Source of truth

`src/lib/orchestrator.ts` — HANDOFF/DISPATCH/NOTES block parsing; `src/lib/agents.ts` — inbox resolution; `CLAUDE.md` §"Two cross-agent channels".

## Related

- [[agents]] — who can emit which channel
- [[orchestrator-protocol]] — when PO dispatches and what triggers a DISPATCH
