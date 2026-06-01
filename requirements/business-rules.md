# Business Rules

_Maintained by Business Analyst. Each rule has an ID, rule statement, source, confidence, and link to the US or sample that established it._

| ID | Rule | Source | Confidence | US / Sample |
|---|---|---|---|---|
| BR-001 | Every user task that contains a feature, bug, or change request MUST result in a GitHub issue filed on the active workspace repo before any implementer dispatch. PO is responsible (files on behalf of claude-code). If the workspace repo is not derivable, fall back to `keyan-commits/apex-team` with label `cross-repo-orphan`. Trivial ops (status checks, gate verdicts, clarifications) are exempt if explicitly declared in PO's HANDOFF. | User mandate verbatim 2026-06-01: "The PO should file in behalf of claude-code, and it should be mandatory to file feature/bugs/issues so it gets trackd into the dashboard." | verified | [[US-022]] / #145 |
| BR-002 | Lane A roles (PO + BA + Architect + UX Designer) MUST NEVER go idle while Lane B (UI Dev + BE Dev + QA + DevSecOps) is busy and the backlog has unworked waves. PO is the scheduler; the same turn that dispatches a Lane B implementer must also dispatch a Lane A triad for the next available wave. Idle Lane A + backlog > 0 = PO breach. | User mandate verbatim 2026-06-01 (reinforced twice): "PO, BA, ARCHITECT, and UI/UX Designer should work on the next tasks/stories while QA, the Devs and DevSecOps are busy implementing. please add that as skill" | verified | [[US-023]] / #146 |

## Rule template

```
| BR-NNN | <rule statement> | <user / SME / sample file> | verified / assumed | [[US-NNN]] or samples/<file> |
```

## Notes

- "Confidence: verified" means a user or SME confirmed the rule.
- "Confidence: assumed" means BA inferred the rule from observed behavior and it has not been confirmed.
- Every assumed rule should have a corresponding open question in `open-questions.md`.
