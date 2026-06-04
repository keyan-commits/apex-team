# Forward-Traceability Index

_Maintained by Business Analyst. Updated whenever a US-NNN is drafted, a BR changes, or a test file ships._
_Discipline: see `## Skills > Forward-traceability index` in `.claude/agents/business-analyst.md`._

| US | Title (short) | Business Rules | Tests | Status |
|---|---|---|---|---|
| US-001 | Multi-phase workflow foundation | — | — | closed |
| US-002 | DevSecOps pipeline ownership | — | — | done |
| US-003 | Workspace-scoped issues | — | — | proposed |
| US-004 | MCP transport reliability | — | — | proposed |
| US-005 | Wave 11c carry-forwards | — | — | proposed |
| US-006 | Main-branch enforcement | — | — | proposed |
| US-007 | Portable workspace bootstrap | — | — | proposed |
| US-008 | Team page density | — | — | proposed |
| US-009 | Per-agent profile page | — | — | proposed |
| US-010 | Manual daily scout trigger | — | — | proposed |
| US-011 | Context saturation indicator | — | — | proposed |
| US-016 | Role boundary Architect vs UX | — | — | accepted |
| US-017 | PO auto-compact peer handoffs | — | — | accepted |
| US-018 | Scout OAuth no API key | — | — | accepted |
| US-019 | Mandatory dev smoke before PASS | — | — | accepted |
| US-020 | BA competency upgrade | — | — | accepted |
| US-021 | Issues panel adaptive | — | — | accepted |
| US-022 | PO file user requests as GH issues | BR-001 | — | accepted |
| US-023 | Lane A pipeline parallelism | BR-002 | — | accepted |
| US-024 | Zero-idle invariant | BR-003 | — | accepted |
| US-025 | Consult BA on unclear stories | BR-004 | — | accepted |
| US-026 | Server-side PO tick scheduler | BR-005 | — | accepted |
| US-027 | Externalize PO state | — | — | proposed |
| US-028 | Latency reduction | BR-006 | — | accepted |
| US-035 | Server stall detector | — | — | proposed |
| US-038 | listActiveTicksThreads try-catch | — | — | proposed |
| US-039 | Stall detector log spam | — | — | proposed |
| US-040 | pnpm build restore Next.js prerender | — | — | accepted |
| US-041 | Protocol constants wiring | — | — | accepted |
| US-046 | DevSecOps union merge playbook | — | — | proposed |
| US-047 | HANDOFF fragment pattern | — | — | proposed |
| US-048 | QA 9-skill upgrade | — | — | proposed |
| US-049 | Retire claude-opus-4-7 | — | — | proposed |
| US-050 | S10 mandatory unit test gate | — | — | proposed |
| US-051 | CI gitattributes defaultbranch fix | — | — | proposed |
| US-052 | Last-turn-at-idle indicator | — | — | proposed |
| US-053 | Max system prompt guard | — | — | proposed |
| US-054 | A11y responsive issues panel | — | — | proposed |
| US-055 | Dual-label idle pane | — | — | proposed |
| US-063 | Stall drawer motion cleanup | — | — | proposed |
| US-064 | MCP client rebind after restart | — | — | proposed |
| US-065 | RM a11y cluster | — | — | closed |
| US-066 | Focus-ring selected poll button | — | — | closed |
| US-078 | User-directive supremacy | — | — | accepted |
| US-079 | Self-heal L1 launchd agents | — | — | closed |
| US-080 | Self-heal L2 stall detector | — | — | closed |
| US-081 | Self-heal L3 auto-merge | — | — | closed |
| US-082 | SQLite migration crash safety | — | — | closed |
| US-083 | Runaway-restart alert | — | — | closed |
| US-084 | Apex-team self-instability hardening | — | — | closed |
| US-085 | QA disk artifacts | — | `tests/qa/wave-108/subagent-body-cleanliness.test.ts` | accepted |
| US-086 | Workspace conventions | — | — | accepted |
| US-087 | Subagent body rewrite | — | `tests/qa/wave-108/subagent-body-cleanliness.test.ts` | accepted |
| US-088 | PASS-verdict format | — | `tests/qa/wave-111/pass-verdict-format.test.ts` | accepted |
| US-089 | Wave 111b fan-out | — | `tests/qa/wave-110/subagent-body-completeness.test.ts`, `tests/qa/wave-111/pass-verdict-format.test.ts` | accepted |

## How to read this table

- **Business Rules** — comma-separated BR-NNN refs from `requirements/business-rules.md`. `—` means no business rule has been explicitly linked yet (does not mean none applies).
- **Tests** — file path(s) relative to repo root. `—` means no test file exists on disk yet for this story.
- **Status** — mirrors the `status:` field in the US-NNN file. Values: proposed | accepted | in-dev | done | deferred | closed.

## Change protocol

When a BR changes:
1. Find every row in this table that references that BR.
2. Mark each affected row "needs re-review" in this file.
3. Emit a `[[HANDOFF: qa]]` listing the impacted US IDs before any re-dispatch to implementers.

When a test file ships:
- Update the `Tests` cell for every US the test covers.

When a US is closed or deferred:
- Update the `Status` cell. Do NOT delete the row.
