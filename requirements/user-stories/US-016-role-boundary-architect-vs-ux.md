# US-016 — Mandatory requirements phase + Architect-vs-UX-Designer review routing

**Status:** superseded
**Owner role:** ui-developer (edits `product-owner.ts`, `architect.ts`, `ux-designer.ts`, `qa.ts`, `backend-developer.ts`, `ui-developer.ts`, `protocols.ts`, `mcp/tools.ts`, `LESSONS.md`)
**Created:** 2026-06-01
**Last updated:** 2026-06-01 (Wave 55 — supersedes narrow role-boundary version; expanded to full mandatory-triad mandate)
**Superseded:** 2026-06-04

## Resolution — superseded by Plan C cutover

All ACs target `src/lib/skills/*.ts`, `src/lib/roles.ts` (ORCHESTRATOR_PROTOCOL), `src/mcp/tools.ts` (`talk_to_product_owner`/`talk_to_role` descriptions), and `protocols.ts` constants — all monolith files retired at Plan C cutover (main `ebc83c5`, PRs #373 + #374). The mandatory requirements-phase triad discipline and role-boundary routing are now encoded in `.claude/agents/*.md` body files (Wave 108, PR #379, `586ed8d`). The `REQUIREMENTS_PHASE_PROTOCOL` constant text survives in the subagent role prompts verbatim.

---

## Story

As the user driving apex-team via MCP, I want every new task to enter through the PO who runs a mandatory parallel requirements phase (Architect + UX Designer + BA), so that QA, BE Dev, and UI Dev always have a concrete US-NNN spec to implement against and no work begins without design/NFR/UX inputs.

## Acceptance Criteria

**AC1 — PO parallel triad on every new task:**
`src/lib/skills/product-owner.ts` encodes: on receiving any new task via `talk_to_product_owner`, PO's FIRST action is parallel DISPATCH to `architect` + `ux-designer` + `business-analyst`. Implementer dispatch (QA/BE/UI Dev/DevSecOps) is blocked until all three return with: (a) BA: user story at `requirements/user-stories/US-NNN-<slug>.md` with `## Story` + `## Acceptance criteria` + `## Out of scope`; (b) Architect: NFR/structural/pattern guidance for the wave; (c) UX Designer: UX-impact analysis OR explicit "No UI impact, skip UX gate."
_Testable: `product-owner.ts` skill text contains "parallel" + "architect" + "ux-designer" + "business-analyst" in the requirements-phase section._

**AC2 — PO narrow exceptions documented:**
`src/lib/skills/product-owner.ts` documents the exception classes where the triad may be skipped: trivial ops-only requests (<1 LOC source change, zero new behavior — e.g. "merge PR #X", "restart server", "close stale branch"). PO must justify the exception explicitly in the HANDOFF. No silent bypasses.
_Testable: skill text contains "exception" + "ops-only" + "justify" (or equivalent)._

**AC3 — Implementer refusal clause:**
`src/lib/skills/qa.ts`, `src/lib/skills/backend-developer.ts`, and `src/lib/skills/ui-developer.ts` each contain a refusal clause: if a DISPATCH arrives without (a) a `requirements/user-stories/US-NNN-*.md` path, OR (b) a `Closes #NNN` reference to a user-story-format issue (per Wave 51), OR (c) an explicit PO exception declaration, reply "Requirements phase incomplete — HANDOFF back to PO to consult BA" and do not start work.
_Testable: each of the three skill files contains "Requirements phase incomplete" + "HANDOFF back to PO"._

**AC4 — Refusal-clause carve-outs (prevent misfires):**
The refusal clause from AC3 does NOT fire for: (a) verification/gate dispatches referencing a PR# whose upstream wave already has a US; (b) scout/self-improvement issue dispatches where the issue body is in user-story format (per Wave 51); (c) compaction/housekeeping dispatches with PO's explicit "ops-only, no US required" justification; (d) re-dispatch after REVISE verdict (the same US still applies — implementer is continuing work, not starting a new wave).
_Testable: each skill file's refusal clause text mentions at minimum one exception class keyword (e.g. "gate", "verification", "ops-only", "REVISE", or "carve-out")._

**AC5 — `REQUIREMENTS_PHASE_PROTOCOL` encodes the parallel-triad mandate:**
`src/lib/protocols.ts` `REQUIREMENTS_PHASE_PROTOCOL` names the parallel-triad rule, the three required outputs (BA user story / Architect NFR guidance / UX analysis-or-skip), the exception classes from AC2/AC4, and the rule that implementer dispatch is blocked until all three return.
_Testable: `REQUIREMENTS_PHASE_PROTOCOL` contains "parallel" + "architect" + "ux-designer" + "business-analyst" + at least one exception class keyword._

**AC6 — `PHASED_WORKFLOW_DISCIPLINE` Phase 1 + Phase 3 routing:**
`src/lib/protocols.ts` `PHASED_WORKFLOW_DISCIPLINE` Phase 1 (Requirements) explicitly names the parallel triad (Architect + UX Designer + BA). Phase 3 (Verification) encodes the routing rule: UI changes route to UX Designer; non-UI changes route to Architect; mixed PRs gate in parallel (neither blocks the other); QA always gates after both.
_Testable: `PHASED_WORKFLOW_DISCIPLINE` contains "UI changes route to UX Designer" AND "Architect" AND "QA"._

**AC7 — `talk_to_product_owner` MCP description is the canonical entry point:**
`src/mcp/tools.ts` `talk_to_product_owner` tool description explicitly states this is the canonical entry point, all new work goes here, and PO will run the requirements phase (Architect + UX + BA in parallel) before any implementer is dispatched.
_Testable: `talk_to_product_owner` description contains "canonical entry point" AND "requirements phase"._

**AC8 — `talk_to_role` MCP description reserves it for diagnostic/override use:**
`src/mcp/tools.ts` `talk_to_role` tool description states it is reserved for diagnostic or explicit-override use, and that new work must go through `talk_to_product_owner` so the requirements phase runs.
_Testable: `talk_to_role` description contains "diagnostic" OR "explicit-override" AND "talk_to_product_owner"._

_All ACs are independently testable via substring assertions: protocol/role strings in `tests/lib/roles.test.ts`; MCP descriptions in `tests/mcp/tools.test.ts`; skill-file strings in `tests/lib/skills.test.ts` (create if absent)._

## Out of Scope

- The actual skill-file edits — this story captures requirements; implementation is Wave 55-roles-impl (UI Dev edits the files after Architect + UX Designer return their design outputs).
- CI/GH-Actions gate that blocks merge without `ux-designer-pass` — tracked as Wave 54-ci (depends on US-013).
- UX Designer's proactive-scan amendment (Wave 54a-ux) — discipline rule, not a mandate enforcement mechanism; tracked separately.
- US-012/013/014/015 recovery — separate tracking issue filed by DevSecOps.
- Any LFM repo changes — this story only affects apex-team's skill/protocol/MCP files.

## Design Spec

Inputs locked in from requirements phase:
- **Architect (role-boundary + protocols):** `### Review-lane boundary` section + rubric cross-reference for `architect.ts` (returned Wave 55); separate protocols/refusal design pending (Wave 55 second dispatch).
- **UX Designer (role claim + proactive scan):** UI-claim paragraph + Bypass case in Gate verdict format (returned Wave 54a).
- **LESSONS.md entry:** "Wave 55 — orchestrator-of-orchestrator and PO both observed bypassing the requirements phase. Hard-encoded parallel-triad mandate so implementers refuse work without a US-NNN."

## Links

_(Filled in after Wave 55-roles-impl ships)_

- impl: (SHA-pending)
- test: `tests/lib/roles.test.ts`, `tests/mcp/tools.test.ts`, `tests/lib/skills.test.ts`
