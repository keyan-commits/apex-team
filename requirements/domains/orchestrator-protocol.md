# Orchestrator Protocol — PO's Mandatory Triad and Dispatch Rules

## Mandatory requirements triad (Wave 55-roles, US-016)

Before any implementer (UI Dev, BE Dev, QA, DevSecOps) is dispatched on a **new feature or change**, PO MUST first run a **parallel triad**:

1. `[[DISPATCH: architect]]` — NFR/structural design
2. `[[DISPATCH: ux-designer]]` — UI-impact analysis (returns "no UI impact, skip UX gate" if N/A)
3. `[[DISPATCH: business-analyst]]` — write the US-NNN user story

Implementation dispatches are **blocked until all three return**. BA produces the US-NNN story; Architect specifies NFRs + design; UX declares UI impact or clears the UX gate.

## Seven exception tags

Dispatches bearing one of these tags bypass the mandatory triad and the implementer refusal clause:

| Tag | When to use |
|---|---|
| `[exception: trivial-ops]` | Clearly trivial — a typo fix, a constant rename, a comment |
| `[exception: gate-verdict]` | A code review or QA gate decision — not new work |
| `[exception: scout-issue]` | The issue body is already in user-story format (BA already wrote the story implicitly) |
| `[exception: housekeeping]` | Doc-only, HANDOFF compaction, INDEX updates, NOTES — no runtime code touched |
| `[exception: revise-redispatch]` | QA/UX issued a REVISE and the implementer is being re-dispatched with the correction |
| `[exception: emergency-rollback]` | Production is down — hotfix takes priority over process |
| `[exception: security-hotfix]` | CVE-class security fix — speed is safety |

## Implementer refusal clause

Implementers (UI Dev, BE Dev, QA) **refuse** any DISPATCH that lacks ALL of:
- A `US-NNN` reference, OR
- A user-story-format `Closes #NNN`, OR
- One of the seven exception tags above.

The refusal is enforced by the `IMPLEMENTER_REFUSAL_CLAUSE` constant interpolated into each implementer's skill prompt.

## PO HANDOFF compaction (Wave 56, US-017)

Before each implementer DISPATCH, PO checks the target peer's HANDOFF doc length. If > 6000 chars AND the role hasn't been compacted in the last hour, PO emits a compaction DISPATCH first (with `[exception: housekeeping]`), then the work DISPATCH. Compaction DISPATCHes must carry the housekeeping exception tag or the refusal clause bounces them.

## Lane A cadence — pipeline parallelism (Wave 68, US-023)

**Lane A** = PO + BA + Architect + UX Designer (requirements and design).
**Lane B** = UI Dev + BE Dev + QA + DevSecOps (implementation and verification).

The two lanes run concurrently. While Lane B implements Wave N, Lane A pre-stages Wave N+1's user story, NFR design, and UI spec so that when Wave N merges, Wave N+1 can dispatch immediately with no requirements wait.

**No-idle-Lane-A rule (BR-002):** Lane A idle + backlog > 0 = PO breach. Being busy implementing is not a justification for idle Lane A.

**Parallel-fire rule:** when PO dispatches a Lane B implementer, the SAME turn fires the next available wave's Lane A triad if backlog has waves remaining. Both an implementer DISPATCH and a triad DISPATCH land in one PO reply.

**Wave queue:** PO's HANDOFF NOTES include a `## Wave queue` section listing the next 2–3 waves with status (`triad-in-flight | impl-ready | impl-in-flight | gating | merged`) and dependency fields (`blocks` / `blocked-by`). Requirements work on blocked waves is allowed; impl dispatch waits for the blocking wave to merge.

**File-touch conflict avoidance:** when two Lane A waves touch the same skill file, they must be sequenced (first wave lands; second rebases and appends) or merged into one impl wave. Architect flags this during Lane A design.

## Zero-idle invariant (Wave 69, US-024)

**No agent may be IDLE while the backlog has open issues.** PO is the enforcer. This rule strengthens the Lane A cadence (above): pipeline parallelism keeps Lane A busy while Lane B implements; the zero-idle invariant keeps EVERY agent busy while ANY issues exist — including DevSecOps, QA, and implementers who have no current wave assigned.

**Turn-start audit:** PO's first action every turn is a zero-idle scan. Any IDLE agent with backlog > 0 gets an immediate fallback DISPATCH before PO processes the incoming message.

**Priority order for assignments:**
1. Lane B impl dispatch (wave is impl-ready)
2. Lane B gate dispatch (code review, QA gate, UX gate pending)
3. Lane A triad for next-in-queue wave
4. Self-improvement / `domains/` extension work (Lane A fallback)
5. Backlog triage (oldest issues, propose priority bumps)
6. DevSecOps ops audit (branch protection, CI, dependency review)
7. **Only** backlog = 0 AND no in-flight work → genuine idle; PO declares "confirming with user."

See [[BR-003]], [[US-024]], [[glossary#IDLE_INVARIANT]].

## Consult-BA invariant (Wave 70, US-025)

Every working role (Architect, UX Designer, UI Dev, BE Dev, QA, DevSecOps) MUST emit `[[HANDOFF: business-analyst]]` BEFORE writing code, tests, or configuration when any acceptance criterion or business term in the assigned user story is unclear, ambiguous, or contradicts the codebase. **Silent guessing on business intent is forbidden.**

The canonical sentence lands in 6 skill files (qa.ts + backend-developer.ts + ui-developer.ts + ux-designer.ts + architect.ts strengthened + devsecops.ts first touch). BA replies with: (a) the clarification, (b) it promoted to a durable MD, (c) a HANDOFF back to the asking role with permission to proceed.

**Compose-with-zero-idle:** a consult-BA HANDOFF counts as non-idle activity. PO's zero-idle scan MUST NOT double-dispatch over a role that has already emitted a consult-BA HANDOFF and is waiting for BA's reply.

See [[BR-004]], [[US-025]], [[glossary#CONSULT_BA]].

## Continuous assignment via server-side ticks (Wave 71, US-026)

**Root cause of merge-train stalls:** PO only runs when externally pinged via `talk_to_product_owner`. Between pings, peer replies accumulate in PO's queue but PO does not process them. Wave 69's zero-idle invariant (BR-003) defines the rule; Wave 71 is the runtime enforcement.

**Tick scheduler behavior:** `src/lib/tick-scheduler.ts` maintains a per-thread `setTimeout` chain. While any non-clear signal exists — peer inbox > 0, open PR, backlog > 0 — a tick fires every 15–30s. Each tick calls PO's turn handler with a synthetic `[[AUTO-CONTINUE: tick N | …]]` message. PO processes inbox items, advances gates, dispatches idle peers.

**Stop conditions (all three must be implemented):**
1. All signals clear (backlog = 0 AND inboxes = 0 AND no open PRs).
2. NO_OP_THROTTLE exceeded: 3 consecutive zero-DISPATCH ticks → scheduler pauses.
3. Explicit `pause_ticks(thread_id)` MCP call.

**Relationship to Wave 69 (zero-idle invariant):** Wave 69 is the protocol rule; Wave 71 is the actuator that enforces it without requiring human pings. Together they close the stall gap: the invariant says WHAT must not happen; the scheduler ensures PO sees and acts on every signal.

**Relationship to Wave 70 (consult-BA invariant):** AUTO-CONTINUE ticks do NOT override the consult-BA requirement. A peer dispatched via a tick still HANDOFFs to BA if the story is unclear. The tick is a scheduling mechanism, not a business-rules bypass.

**Budget cap (TICK_BUDGET):** 500K tokens/thread/hour by default. Ticks halt when exceeded, resume next hour. See [[glossary#TICK_BUDGET]], [[glossary#NO_OP_THROTTLE]], [[US-026]].

**US-026 AC cross-reference:**

| AC | What it specifies |
|---|---|
| AC1 | Scheduler core: `Map<threadId, TickState>` singleton, self-rescheduling `setTimeout` chain (NOT `setInterval`), adaptive 20–120s, injectable timer for tests |
| AC2 | AUTO-CONTINUE message format: `[[AUTO-CONTINUE tick=N inflight=<n> idle-peers=<csv> backlog=<n>]]`, kind:"user" |
| AC3 | NO_OP_THROTTLE: K=3, `delay = 20s * 2^(noOps-K)` capped at 120s; resets on ≥1 DISPATCH |
| AC4 | Per-thread async mutex in `src/lib/thread-lock.ts`; acquired by `talk_to_*` + tick path |
| AC5 | Three MCP tools: `pause_ticks`, `resume_ticks`, `get_tick_state` |
| AC6 | TICK_BUDGET: reuse `turn_usage` table via `getThreadSpendSince`; NO separate budget table |
| AC7 | Three stop conditions: signals-clear, no-op-throttle, explicit-pause |
| AC8 | Failure isolation: tick N throw → log + re-arm; SDK retries on 5xx/429 |
| AC9 | Tick path skips BA-seed (tools.ts:155); uses `runTurnWithDispatches` not bare `runTurn` |
| AC10 | `tick_log` audit table: append-only, one row per tick |
| AC11 | Tick log section in PO's HANDOFF NOTES block (observable in dashboard) |

## Source of truth

`src/lib/protocols.ts` — `REQUIREMENTS_PHASE_PROTOCOL`, `IMPLEMENTATION_PHASE_PROTOCOL`, `VERIFICATION_PHASE_PROTOCOL`, `IMPLEMENTER_REFUSAL_CLAUSE`; `src/lib/roles.ts` — `PHASED_WORKFLOW_DISCIPLINE`, `ORCHESTRATOR_PROTOCOL`.

## Related

- [[agents]] — who the triad roles are
- [[requirements-lifecycle]] — how a story flows through the triad to implementation
- [[handoff-flow]] — DISPATCH vs HANDOFF semantics
