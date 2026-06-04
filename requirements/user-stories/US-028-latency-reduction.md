# US-028 — Reduce per-turn latency: prompt caching + context-window trim + model-fit policy

**Status:** superseded
**Owner:** BE Dev (primary) + BA (spec)
**Target wave:** 73
**Closes:** TBD (GH issue to be filed by PO after wave 73 dispatch)
**Depends on:** Wave 71 (US-026 merged — tick scheduler provides the autonomous ticking context for which latency matters most)

---

## Resolution — superseded by Plan C cutover

All ACs target `src/lib/providers.ts` `augmentSystemPrompt()`, `src/lib/agents.ts`, and `src/lib/roles.ts` — all monolith files retired at Plan C cutover (main `ebc83c5`, PRs #373 + #374). Prompt caching, context trim, and model-fit policy are no longer applicable in the same form under the subagent runtime (the Claude Code SDK handles caching natively; there is no `augmentSystemPrompt` wrapper). Model selection is encoded in `.claude/agents/<role>.md` frontmatter.

## Story

As a **team operator** running apex-team in autonomous tick mode,
I want each agent turn to complete in ≤15s (non-PO) / ≤30s (PO),
so that the wave drain rate increases by ~10×, CI costs drop ~5×, and the
team feels responsive rather than glacially slow.

---

## Background

Current p50 latency per turn: **30–90s** (non-PO). Root causes:
1. **No prompt caching** — every turn re-sends 5–8 KB of static system prefix (roles.ts + skills/*.ts + protocols.ts) as uncached tokens. Anthropic charges and delays on each.
2. **Over-wide context** — non-PO peers receive 60-msg history + all 7 peer HANDOFF docs (~20–40 KB total per turn). Most of it is irrelevant; peers rarely need more than inbox + recent 10 messages.
3. **Model mis-fit** — gate verdicts and triage dispatches (majority of volume) use Sonnet or Opus when Haiku is sufficient and ~5× faster for those shapes.

---

## Acceptance Criteria

**AC1 — Prompt caching via static-prefix reorder**

Given the agent turn is assembled in `src/lib/providers.ts` (`augmentSystemPrompt`),
when `augmentSystemPrompt` composes the final system prompt,
then the static sections — `role.systemPrompt` + `role.skills` (the largest block, ~5-8 KB) — are placed FIRST (stable prefix), and volatile sections — cwd, HANDOFF doc, peer states, inbox — are appended AFTER.
_No SDK `cache_control` wiring needed: the `claude_code` preset already applies `cache_control: ephemeral`; the bug was volatile content placed before the static skills block, collapsing the cacheable prefix to section 1 alone. Reordering restores the full static block as the cache anchor._
_Verified: `cache_read_input_tokens > 0` in `usage` after the reorder proves cache hits. Architect confirmed this at ground (OQ-W73-001 closed)._

**AC2 — Context-window trim for non-PO peers**

Given a non-PO peer turn is being assembled in `src/lib/agents.ts`,
when the message history is fetched (`listMessages().slice(-N)`),
then non-PO peers receive at most the **10 most-recent messages** (`slice(-10)`, down from `slice(-60)`),
and the PO retains the full **60-message window** (`slice(-60)`) unchanged.
_No "on-demand peer HANDOFF" plumbing is needed: ground truth (`agents.ts:25-29`) shows non-PO peers already receive only their own HANDOFF + inbox — they never received 7 peer HANDOFFs. Only the PO gets all 7. The win here is purely the history-window trim (`-60→-10`). Architect verified at ground 2026-06-01._

**AC3 — Per-DISPATCH model-fit rubric in PO prompt**

Given the PO is emitting a `[[DISPATCH: role model:<model>]]` block,
when the PO uses the model-fit rubric (injected via `roles.ts` or `product-owner.ts`),
then the rubric prescribes:
- `claude-haiku-4-5-20251001` — gate verdicts (QA PASS/FAIL, UX PASS/REVISE), inbox triage, housekeeping dispatches, status-check dispatches
- `claude-sonnet-4-6` — implementation turns (BE Dev, UI Dev), BA story drafts, Architect review + non-trivial design questions
- `claude-opus-4-8` — novel architecture decisions, cross-cutting refactors, first design of a new subsystem; PO must justify Opus in NOTES
and the PO defaults to Haiku for all verdicts and triage unless a Sonnet/Opus exception applies.

**AC4 — p50 latency targets met**

Given a benchmark run across 5 dispatch types (gate verdict, inbox triage, impl turn, BA story draft, Architect review),
when all three fixes (AC1 + AC2 + AC3) are deployed to the live instance,
then measured p50 latency ≤ 15s for non-PO turns and ≤ 30s for PO turns,
and the benchmark baseline (pre-fix p50 per dispatch type) is recorded and committed to `docs/benchmarks/wave-73-latency-baseline.json` (or equivalent).

**AC5 — Benchmark harness**

Given a developer wants to measure turn latency before and after changes,
when they run the benchmark script (`pnpm bench` or equivalent),
then the script exercises 5 dispatch types (gate/triage/impl/story-draft/arch-review), records per-call start/end timestamps (sourced from the same per-turn log the tick scheduler uses — coordinate with Architect's methodology), computes p50 and p95 for each, and outputs a comparison table (baseline vs. after).

**AC6 — No regression to gate-verdict correctness (BR-006)**

Given a Haiku-tier model is used for gate-verdict dispatches,
when the same 5 historically-known REVISE verdicts are replayed through the lower-tier model,
then ≥ 80% of verdicts match the reference verdict (PASS/REVISE/FAIL),
and any mismatch is documented and escalated before Wave 73 ships.
_Ties to BR-006. BA coordinates exact wording with Architect._

**AC7 — Cache-hit-rate + per-turn latency surfaced in observability**

Given a turn completes,
when its usage and timing are persisted,
then `cache_read_input_tokens` and wall-clock duration are stored in `turn_usage` (or an extension of it),
and the dashboard (or `/api/turn-stats` endpoint) exposes cache-hit rate + p50 latency for the last N turns.

---

## Open Questions

| ID | Question | Working Assumption | Status |
|----|----------|-------------------|--------|
| OQ-W73-001 | Does `@anthropic-ai/claude-agent-sdk` expose `cache_control` on system messages, or must we drop to lower-level `@anthropic-ai/sdk`? | RESOLVED 2026-06-01: SDK preset already applies `cache_control`; fix is a pure section reorder, no SDK change. AC1 updated. | **closed** |
| OQ-W73-002 | Haiku verdict-correctness guardrail: is 80% sufficient or should the bar be higher for REVISE verdicts that block merges? | RESOLVED 2026-06-01: 80% floor adopted; caching/trim exempt as verdict-neutral-by-construction. BR-006 confirmed by Architect + BA. | **closed** |
| OQ-W73-003 | Context trim for Architect reviewing a large PR: what is the "on-demand" mechanism for requesting additional HANDOFF docs? | AC2 reworked — no on-demand HANDOFF plumbing; peers never received other-peer HANDOFFs. Only PO gets all 7. No mechanism needed. | **closed** |

---

## Notes

- **Staging:** US-028 + glossary updates + BR-006 + INDEX ride the Wave 73-impl PR. No separate BA PR.
- **Sequencing:** Wave 71 ships first (autonomy loop), then Wave 73 (each tick 3× faster), then Wave 72 (PO state cleaner). All three are independent file surfaces.
- **Cost impact:** prompt-caching alone expected ~5× token cost reduction on static prefix (Anthropic cache-read pricing is ~10% of base input). Combined with Haiku-bias, cost per autonomous hour drops dramatically.
