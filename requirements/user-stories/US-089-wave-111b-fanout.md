# US-089 — Wave 111b Fan-out: Lessons-in-Bodies, UX Skills, Skill Proposals, ADR-018 Amendment, ADR-018 Cross-refs

**Status:** accepted
**Wave:** 111b
**Owner:** Architect (Phase 1, NFR gate) + 6 subagents (Phase 2 fan-out)
**Issues addressed:** #196 (partial), #199, #292, #293, #294, #295, #359, #361, #362, #363, #364, #365, #366, #368, #369; ADR-018 amendment (no issue — surfaced by Wave 111a self-application); AC6 of US-088 (deferred-landing from Wave 111a)

---

## Story

As the apex-team, I want skill additions + lessons sections + ADR-018
commit-time amendment + cross-refs landed across 7 subagent bodies, so
that drift-prone roles carry incident memory in their bodies and Wave 111c
CI checks can grep ADR-018 conformance.

---

## Acceptance criteria

### AC1 — Cluster 1: Lessons-in-bodies

`.claude/agents/devsecops.md`, `.claude/agents/qa.md`, and `.claude/agents/architect.md` each contain a `## Lessons from prior incidents` section with 3–5 bullets in the following format:

```
- **Date/Wave** — Rule: <one-line rule>. Why: <incident summary>. Apply: <how to use>.
```

Rationale: these three are the drift-prone gating roles (Wave 111a identified them as the top-3 from #196). Remaining 5 bodies are deferred to a future wave.

### AC2 — Cluster 2: UX skill ecosystem

`.claude/agents/ux-designer.md` body contains an evaluated subset of the 6 proposed community design skills:

- **Impeccable** (`impeccable`) — design quality review
- **figma-implement-design** — Figma-to-code
- **playwright-skill** — UI automation / visual regression
- **theme-factory** — design-token theming
- **accesslint** — accessibility linting
- **Excalidraw** — whiteboard / diagram

For each skill: either (a) an invocation pattern added to the body with a one-line rationale for adoption, or (b) a one-line rationale for deferral/rejection. No skill is silently omitted — every one of the 6 must be explicitly addressed.

Closes #199.

### AC3 — Cluster 3: Skill proposals (11 issues across 6 subagents)

Each of the following issues is addressed by either (a) new skill content in the relevant subagent body, or (b) the issue closed with a written rationale (e.g. already-covered by a prior wave):

| Issue | Subagent | Skill topic |
|---|---|---|
| #292 | business-analyst | Co-author BDD ACs with QA |
| #293 | business-analyst | Forward-traceability index |
| #294 | architect | Fitness functions in CI |
| #295 | architect | AI/agent architectural review |
| #359 | architect | STRIDE threat modeling |
| #361 | ui-developer | prefers-reduced-motion |
| #362 | ui-developer | View Transitions API |
| #363 | backend-developer | N+1 query discipline |
| #364 | backend-developer | Graceful shutdown |
| #365 | qa | Contract testing |
| #366 | qa | Mutation testing |
| #368 | devsecops | OIDC workload identity |
| #369 | devsecops | Policy-as-code gates |

Note: #294 may be closed as already-covered if Architect's review confirms Wave 108/110 fitness tests satisfy the intent — Architect's call, documented in the issue.

### AC4 — Cluster 6: ADR-018 commit-time amendment

`architecture/decisions/ADR-018-pass-verdict-format.md` is amended to document the commit-time placeholder pattern:

- Phase 1 (commit time): HANDOFF verdict block written with `sha: (pending)` placeholder.
- Phase 2 (post-merge): SHA backfilled — either via `git commit --amend` (if unpushed) or a single fixup commit; OR the actual SHA is recorded in the PR description as the durable anchor (Architect's decision on which approach is canonical).

Updated regex in the ADR must match both `sha: (pending)` and `sha: <40-hex>` as conforming.

`tests/qa/wave-111/pass-verdict-format.test.ts` is updated to accept the `(pending)` value in the `sha` field during pre-merge checks, so commit-time conformance is not broken by the two-phase backfill.

### AC5 — Cluster 7: ADR-018 cross-refs + Wave 111b completeness test

The bodies of the 4 gate-role agents cite ADR-018 inline:

- `.claude/agents/devsecops.md` — references ADR-018 in the PASS-verdict section
- `.claude/agents/architect.md` — references ADR-018 in the gate/review section
- `.claude/agents/ux-designer.md` — references ADR-018 in the gate/review section
- `.claude/agents/qa.md` — references ADR-018 in the gate/review section

A QA completeness test at `tests/qa/wave-111/wave-111b-completeness.test.ts` mechanically asserts:

- AC1: each of the 3 bodies contains `## Lessons from prior incidents` with ≥3 bullet entries matching the `Date/Wave — Rule:` prefix.
- AC2: `ux-designer.md` contains all 6 skill names (case-insensitive) with at least one of: invocation pattern keyword OR rejection rationale keyword.
- AC3: each of the 13 issues has either a matching skill keyword in the relevant subagent body OR is closed on GitHub (checked via `gh issue view`).
- AC4: `ADR-018` contains the string `(pending)` and the updated regex matches both `sha: (pending)` and a 40-hex SHA; `pass-verdict-format.test.ts` contains `pending` in its sha-validation logic.
- AC5: each of the 4 gate-role bodies contains `ADR-018`; `wave-111b-completeness.test.ts` exists at the canonical path.

---

## Out of scope

- Wave 111c (Cluster 4: CI/process discipline #240 #246 #301 #324)
- Skill proposals not in the 13-issue list above
- Body restructures unrelated to the assigned issues
- The remaining 5 subagent bodies for `## Lessons from prior incidents` (deferred per #196 partial scope)

---

## Issues addressed

### Cluster 1 — Lessons-in-bodies
- #196 (partial — top-3 drift-prone bodies: devsecops, qa, architect; remaining 5 deferred)

### Cluster 2 — UX skill ecosystem
- #199

### Cluster 3 — Skill proposals
- #292, #293 (business-analyst)
- #294, #295, #359 (architect)
- #361, #362 (ui-developer)
- #363, #364 (backend-developer)
- #365, #366 (qa)
- #368, #369 (devsecops)

### Cluster 6 — ADR-018 commit-time amendment
- (no issue — surfaced by Wave 111a self-application of PASS-verdict format)

### Cluster 7 — ADR-018 cross-refs
- AC6 of US-088 (deferred-landing option; this US completes it)

---

## Traceability

| Artifact | Location |
|---|---|
| ADR-018 (to amend) | `architecture/decisions/ADR-018-pass-verdict-format.md` |
| PASS-verdict test (to update) | `tests/qa/wave-111/pass-verdict-format.test.ts` |
| Completeness test (new) | `tests/qa/wave-111/wave-111b-completeness.test.ts` |
| 7 agent bodies (to edit) | `.claude/agents/{devsecops,qa,architect,ux-designer,business-analyst,ui-developer,backend-developer}.md` |

---

_Filed by BA, Wave 111b Phase 1, 2026-06-04._
