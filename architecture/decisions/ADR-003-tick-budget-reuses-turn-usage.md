# ADR-003 — Tick Budget Reuses `turn_usage`; No Separate Budget Table

**Date:** 2026-06-01
**Status:** Accepted
**Requirement:** US-026 (server-side PO tick scheduler) AC6 — TICK_BUDGET cap of 500K output tokens/thread/hour.

## Context

Wave 71 introduces a server-side tick scheduler that auto-continues a thread on a timer. To stay inside cost limits it must enforce a per-thread spend cap (`APEX_TEAM_TICK_BUDGET_PER_HOUR`, default 500K). The obvious-but-wrong implementation is a dedicated `tick_state` / `tick_budget` table that persists a running counter and a window start.

We have already paid for that mistake once: #140 documented schema drift caused by persisting ephemeral runtime state in its own table — the persisted counter diverges from reality on crash, restart, or concurrent write, and every new runtime field grows the schema and the drift surface.

Token spend per turn is **already recorded** in the `turn_usage` table (written on every `runTurn`). A budget check is a read over that existing data, not a new piece of state to maintain.

## Decision

The tick budget is enforced by **reading recorded spend from `turn_usage`** via a new query `getThreadSpendSince(threadId, sinceMs)` — sum of output tokens for the thread in the trailing window. No separate budget-counter table is created.

The only new table Wave 71 adds is `tick_log` — an **append-only audit** of tick fires (timestamp, tick number, action taken, signal summary). It is observability, not load-bearing state: losing it loses history, never correctness.

In-memory `TickState` (the setTimeout registry, no-op counter, cadence) lives in the scheduler singleton and is **not persisted** — v1 reconstructs it on first `talk_to_product_owner` after a restart.

## Consequences

**Positive:**
- No persisted counter to drift (#140 class of bug structurally impossible — the source of truth is the same row the turn already wrote).
- Budget math is auditable: it sums the same `turn_usage` rows the dashboard and pricing already read.
- Restart-safe: the budget window is derived from durable usage rows, not from in-memory counters that vanish on restart.

**Negative:**
- Budget check is an aggregate query per tick rather than an O(1) counter read. At tick cadence (20–120s) this is negligible; `turn_usage` is small and indexed by thread.
- In-memory `TickState` is lost on restart — accepted for v1; ticks re-arm on the next PO call. A future wave may persist `TickState` if cold-restart continuity becomes a requirement.

## Recurring rule

**Prefer recorded-spend-over-persisted-counter, and in-memory-v1-over-new-table, for any ephemeral runtime state.** Add a new table only when losing the data loses *correctness*, not merely history. Audit logs (`tick_log`) are fine; state counters are a drift trap. This rule generalizes to future tick-like features (auto-retry, cron-driven turns).

## Compatibility

ADR-002 (multi-phase workflow) unaffected. Complements ADR-004 (tick invokes `runTurnWithDispatches`).
