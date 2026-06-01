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

## Source of truth

`src/lib/protocols.ts` — `REQUIREMENTS_PHASE_PROTOCOL`, `IMPLEMENTATION_PHASE_PROTOCOL`, `VERIFICATION_PHASE_PROTOCOL`, `IMPLEMENTER_REFUSAL_CLAUSE`; `src/lib/roles.ts` — `PHASED_WORKFLOW_DISCIPLINE`, `ORCHESTRATOR_PROTOCOL`.

## Related

- [[agents]] — who the triad roles are
- [[requirements-lifecycle]] — how a story flows through the triad to implementation
- [[handoff-flow]] — DISPATCH vs HANDOFF semantics
