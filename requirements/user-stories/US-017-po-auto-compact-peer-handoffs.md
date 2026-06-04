---
name: US-017-po-auto-compact-peer-handoffs
description: PO automatically compacts peer HANDOFF docs exceeding 6000 chars (target ≤4000) before dispatching new work — prevents prompt bloat from degrading turn quality
metadata:
  type: user-story
  status: superseded
  owner: UI Dev (or BE Dev — pick idler at Wave 56 dispatch)
  closes: "#131"
  wave: Wave 56
---

## Resolution — superseded by Plan C cutover

All ACs target `src/lib/roles.ts` ORCHESTRATOR_PROTOCOL — a monolith file retired at Plan C cutover (main `ebc83c5`, PRs #373 + #374). Under the subagent runtime, HANDOFF docs are files at `coordination/handoffs/<role>.md`; compaction discipline is encoded directly in `.claude/agents/product-owner.md`. No equivalent of the 6000-char reactive trigger exists in the subagent runtime (subagent turns are single-turn; there is no pre-dispatch HANDOFF scan to implement).

## Story

As the user driving apex-team, I want PO to automatically compact peer HANDOFF docs that exceed 6000 chars before dispatching new work to that peer, so that prompt bloat doesn't degrade peer turn quality or hit token caps.

## Acceptance criteria

1. PO rule in `src/lib/roles.ts` (`ORCHESTRATOR_PROTOCOL` block, ~line 328) detects whether the target peer's HANDOFF doc exceeds **6000 chars** before each implementer dispatch; if so, emits a compaction DISPATCH first.
2. Compaction is **reactive** (checked only when dispatching that specific peer, not a per-turn full-team scan) — avoids paying the scan cost on every PO turn.
3. When the threshold is met, PO emits a compaction `[[DISPATCH: <role>]]` **before** the work `[[DISPATCH: <role>]]` for that peer; the compaction dispatch carries `[exception: housekeeping]` so the peer's refusal clause does not bounce it. Target post-compaction length: ≤4000 chars.
4. After emitting the compaction dispatch, PO writes `last_compacted: {<role>: <ISO-timestamp>}` in its own `[[NOTES]]` block.
5. Cooldown of ≤1 compaction per role per hour — PO checks `last_compacted` before firing; if the last compaction for that role is within 1h, skip and dispatch work directly (log a note in NOTES).
6. A regression-guard test in `tests/lib/roles.test.ts` asserts the compaction rule text exists in `src/lib/roles.ts`: `expect(orchestratorProtocol).toContain("exceeds 6000")` (or equivalent symbol targeting the PO prompt section).

## Out of scope

- Proactive / per-turn full-team HANDOFF scan (AC2 above explicitly excludes this — too costly).
- Dashboard indicator for "HANDOFF compacted" state — separate UI concern; file a follow-up issue if needed.
- Changing the compaction prompt template (existing per-role NOTES format is sufficient).

## Notes

- Observed: PO passively flags compaction via `last_compacted:` in NOTES today; it never fires automatically. Wave 56 makes it hard-automatic.
- Impact: long peer HANDOFF docs degrade turn quality silently (truncation, lower-quality reasoning). Active compaction keeps docs within the effective context range.
- Discovered during: Wave 55+ backlog drain (BA).
- Architect NFR decision (Wave 56 design): reactive, trigger=6000, target=4000. Rationale: trigger at 6000 avoids churn against docs that last compaction legitimately left near 6000; ≤4000 target buys headroom before the next trigger. The `[exception: housekeeping]` tag on the compaction DISPATCH is load-bearing — without it the peer's Wave 55 refusal clause bounces the dispatch.
- Implementation target: `src/lib/roles.ts` (PO role's `ORCHESTRATOR_PROTOCOL` block). There is no `src/lib/skills/product-owner.ts`.
