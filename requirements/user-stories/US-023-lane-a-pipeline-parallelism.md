---
id: US-023
slug: lane-a-pipeline-parallelism
status: accepted
wave: 68
closes: "#146"
owner: UI Dev or BE Dev (pick idler at impl time)
impl-targets:
  - src/lib/roles.ts (ORCHESTRATOR_PROTOCOL — PO Lane A section; NO product-owner.ts)
  - src/lib/skills/business-analyst.ts
  - src/lib/skills/architect.ts
  - src/lib/skills/ux-designer.ts
  - LESSONS.md
  - tests/lib/roles.test.ts
sequencing: rides Wave 68-impl PR; Wave 68-impl rebases on Wave 65's landed business-analyst.ts + architect.ts and appends the Lane A section beneath existing content
---

# US-023 — Lane A Pipeline Parallelism

## Story

As the user watching the team execute the backlog, I want **PO + BA + Architect + UX Designer to start work on the NEXT wave's requirements/design while QA + BE Dev + UI Dev + DevSecOps are still implementing the current wave**, so that **wave throughput increases — when an implementer finishes a PR, the next wave's user story + design is already done and they can dispatch immediately, no idle time waiting on requirements**.

## User mandate (verbatim, 2026-06-01, reinforced twice)

> "PO, BA, ARCHITECT, and UI/UX Designer should work on the next tasks/stories while QA, the Devs and DevSecOps are busy implementing."

> "PO, BA, ARCHITECT, and UI/UX Designer should work on the next tasks/stories while QA, the Devs and DevSecOps are busy implementing. please add that as skill"

"please add that as skill" = permanent prompt amendment in all four Lane A skill files.

## Acceptance criteria

**AC1 — PO Lane A skill amendment (`src/lib/roles.ts` ORCHESTRATOR_PROTOCOL, NOT `src/lib/skills/product-owner.ts` which does not exist):**
New section "Pipeline parallelism — Lane A vs. Lane B." PO maintains a `Wave queue` section in its HANDOFF NOTES listing next 2–3 waves with `status` field (`triad-in-flight | impl-ready | impl-in-flight | gating | merged`). The section includes:
- The same-turn parallel-fire rule: when PO dispatches a Lane B implementer, the SAME reply fires the next available wave's Lane A triad if backlog has waves remaining. Idle Lane A peers while implementers are working is declared a workflow failure.
- Wave dependency declaration (`blocks` / `blocked-by`) in the wave queue.
- File-touch conflict avoidance guidance for parallel Lane A waves (if two waves touch the same skill file, they must be sequenced or merged into one impl wave).
- The no-idle-Lane-A guard: Lane A idle + backlog > 0 = PO breach.

**AC2 — BA skill amendment (`src/lib/skills/business-analyst.ts`):**
New section "Lane A discipline — work ahead." BA accepts triad asks even mid-Lane-B; never goes idle while Lane B is busy and backlog exists. Idle-time canonical activities: extending `domains/` MDs, `business-rules.md`, `glossary.md`, and `data-sources.md` per the Wave 65 BA competency upgrade. Explicitly cross-references Wave 65's competency upgrade as the source of Lane A idle activities.

**AC3 — Architect skill amendment (`src/lib/skills/architect.ts`):**
New section "Lane A discipline — work ahead." Architect designs Wave N+1 NFR/structural specs while Wave N is being implemented; can still mid-wave gate review if a gate dispatch arrives. Idle-time activities: (a) NFR doc drafts for parked waves, (b) reviewing `protocols.ts`/`roles.ts` corpus for #140-class drift traps, (c) authoring ADRs for accepted-but-unimplemented decisions.

**AC4 — UX Designer skill amendment (`src/lib/skills/ux-designer.ts`):**
New section "Lane A discipline — work ahead." UX Designer designs Wave N+1 UI/UX specs while Wave N is being implemented; can still mid-wave UI gate when a gate dispatch arrives. Idle-time activities: (a) design specs for pre-staged waves before triad returns, (b) reviewing prior-wave PASS evidence for completeness, (c) a11y/density audits across the dashboard.

**AC5 — PO HANDOFF "Wave queue" section:**
When PO emits NOTES this turn and on every subsequent turn, its HANDOFF doc includes a `## Wave queue` section listing the next 2–3 waves with status per wave. User-visible: the user can read PO's HANDOFF doc to see pipeline depth without asking.

**AC6 — Same-turn parallel-fire rule in action:**
Every PR that includes PO dispatching an implementer (Lane B) must include evidence that PO also dispatched a Lane A triad (or documented why backlog has no remaining waves). This is enforceable by reading PO's turn output.

**AC7 — No-idle-Lane-A guard:**
If Architect/BA/UX peer has inbox = 0 AND HANDOFF shows idle status AND backlog has > 0 issues, PO is in breach. The skill amendment makes this explicit — being "busy" implementing is not a justification for idle Lane A.

**AC8 — Wave dependency declaration:**
PO's wave queue in HANDOFF NOTES includes `blocks` and `blocked-by` fields so Lane A triads can be staged for blocked waves without waiting for unblocking waves to merge (requirements are sequencing-independent; impl dispatch is sequencing-dependent).

**AC9 — File-touch conflict avoidance:**
When two Lane A waves touch the same skill file (e.g. Wave 65 + Wave 68 both edit `business-analyst.ts`), the implementer either sequences them (Wave 65-impl lands first; Wave 68-impl rebases and appends) or merges them into one impl wave. Architect flags this during Lane A design.

**AC10 — LESSONS.md entry:**
Wave 68 retro entry: "Lane A (requirements/design) and Lane B (impl/verify) run in parallel; idle Lane A while Lane B is busy is a workflow failure. Throughput is bounded by Lane A pre-staging depth, not Lane B speed."

**AC11 — Gate compliance:**
Wave 68-impl passes the Wave 64 two-leg smoke gate (`pnpm build` + `:3100/api/health` 200) and the Wave 67 mandatory-issue-filing rule (GH issue filed before impl dispatch). Self-dogfoods both gates on its own PR before QA PASS.

## Out of scope

- Mid-wave requirements changes (new user input mid-wave goes to Wave N+1, never replaces N's spec).
- Parallelism within Lane B (already supported via parallel impl dispatches).
- Auto-prioritization of which Wave N+1 to design next (PO picks from backlog using existing priority signals).

## Links

- Closes: #146
- Related: [[US-020]] (Wave 65 BA competency — BA's Lane A idle activities)
- Related: [[US-022]] (Wave 67 mandatory issue filing — PO's first action before Lane A triad)
- Domain: [[orchestrator-protocol]] (Lane A cadence section), [[requirements-lifecycle]]
- Business rule: [[BR-002]] (no-idle-Lane-A rule)
