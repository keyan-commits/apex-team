# Business Rules

_Maintained by Business Analyst. Each rule has an ID, rule statement, source, confidence, and link to the US or sample that established it._

| ID | Rule | Source | Confidence | US / Sample |
|---|---|---|---|---|
| BR-001 | Every user task that contains a feature, bug, or change request MUST result in a GitHub issue filed on the active workspace repo before any implementer dispatch. PO is responsible (files on behalf of claude-code). If the workspace repo is not derivable, fall back to `keyan-commits/apex-team` with label `cross-repo-orphan`. Trivial ops (status checks, gate verdicts, clarifications) are exempt if explicitly declared in PO's HANDOFF. | User mandate verbatim 2026-06-01: "The PO should file in behalf of claude-code, and it should be mandatory to file feature/bugs/issues so it gets trackd into the dashboard." | verified | [[US-022]] / #145 |
| BR-002 | Lane A roles (PO + BA + Architect + UX Designer) MUST NEVER go idle while Lane B (UI Dev + BE Dev + QA + DevSecOps) is busy and the backlog has unworked waves. PO is the scheduler; the same turn that dispatches a Lane B implementer must also dispatch a Lane A triad for the next available wave. Idle Lane A + backlog > 0 = PO breach. | User mandate verbatim 2026-06-01 (reinforced twice): "PO, BA, ARCHITECT, and UI/UX Designer should work on the next tasks/stories while QA, the Devs and DevSecOps are busy implementing. please add that as skill" | verified | [[US-023]] / #146 |
| BR-003 | No agent role (PO, BA, Architect, UX Designer, UI Dev, BE Dev, QA, DevSecOps) may be IDLE while the apex-team backlog has open issues. PO is responsible for assigning fallback work to any idle agent using the zero-idle priority order (Lane B impl > gate dispatch > Lane A triad > self-improvement/domains > backlog triage > DevSecOps audit). The only legitimate idle state is when backlog = 0 AND no in-flight work exists. | User mandate verbatim 2026-06-01 (with screenshot of all 8 agents IDLE while backlog had 14+ issues): "PO should have a skill that makes sure no agent is IDLE if there are still backlog items" | verified | [[US-024]] / #148 |
| BR-004 | Every working role (Architect, UX Designer, UI Dev, BE Dev, QA, DevSecOps) MUST consult BA via `[[HANDOFF: business-analyst]]` BEFORE writing code, tests, or config when any acceptance criterion or business term in the assigned user story is unclear, ambiguous, or appears to contradict the codebase. Silent guessing on business intent is forbidden. BA replies with the clarification AND promotes it to a durable MD (Wave 65 promote-to-MD discipline), then HANDOFFs back to the asking role with permission to proceed. | User mandate verbatim 2026-06-01: "every working agent should consult the BA for the requirements if the user story is unclear, please make that as a skill." | verified | [[US-025]] / #149 |
| BR-005 | PO must continuously assign work while ANY non-clear signal exists in the team: open peer inbox item, open PR awaiting a gate, or any backlog issue eligible for an idle peer. Continuity is enforced server-side via the tick scheduler (Wave 71). Manual external ping by claude-code is a workaround, not the operating model. The tick scheduler is the runtime actuator for the zero-idle invariant (BR-003). | User mandate verbatim 2026-06-01: "Please prioritizing fixing the in ability of PO to assign continously" | verified | [[US-026]] / #153 |
| BR-006 | Latency optimizations (prompt caching, context trim, model-tier changes) MUST NOT regress gate-verdict correctness. Before promoting a lower model tier for any dispatch shape, replay ≥5 historical REVISE/FAIL verdicts at the proposed tier; require ≥80% same-verdict agreement. A tier that drops below 80% stays at the higher tier for that shape. Caching and context-trim changes are verdict-neutral by construction (same model, same decision inputs) and are exempt from replay, but MUST preserve the PO's full-visibility context. | User mandate verbatim 2026-06-01: "Why is every agent so slow?" — guardrail jointly agreed by Architect (wording) + BA (confirmed 2026-06-01). | verified | [[US-028]] |

## Rule template

```
| BR-NNN | <rule statement> | <user / SME / sample file> | verified / assumed | [[US-NNN]] or samples/<file> |
```

## Notes

- "Confidence: verified" means a user or SME confirmed the rule.
- "Confidence: assumed" means BA inferred the rule from observed behavior and it has not been confirmed.
- Every assumed rule should have a corresponding open question in `open-questions.md`.
