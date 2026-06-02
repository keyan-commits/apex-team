---
id: US-055
title: Dual-label idle pane — "Last NOTES / Last turn"
status: accepted
owner: UI Developer
wave: post-US-054
depends-on: US-052, US-054
---

## Story

As a team observer, I want each agent pane to show both a "Last NOTES" timestamp (when the role last updated its HANDOFF doc) and a "Last turn" timestamp (when the role last ran any turn, from `lastTurnAt`), so that I can distinguish a genuinely-idle peer from one that is active-but-not-NOTES'ing — the false-idle signal that US-052's backend now disambiguates.

## Acceptance criteria

1. Each agent pane renders `lastTurnAt` (already exposed by `/api/agent-state` → `AgentState`) as a relative human label, e.g. "Last turn: 3m ago", alongside the existing NOTES timestamp label.
2. The "Last turn" label uses the same relative-time format as the existing NOTES label (e.g. "3m ago", "1h ago") — no raw ISO strings visible to the user.
3. Idle styling (e.g. dimmed pane border or chip) keys off `IDLE_THRESHOLD_MS` (15 min, already exported from `src/lib/db.ts`) applied to `lastTurnAt`, NOT the NOTES timestamp — a peer is considered idle only when their last turn is older than the threshold.
4. The dual label renders correctly when `lastTurnAt` is null (new agent, never ran a turn) — show "Last turn: —" or equivalent; no crash.
5. No new API endpoint, DB schema change, or migration is introduced — `lastTurnAt` is already present in the `AgentState` type and returned by the existing agent-state route.

## Out of scope

- Any backend or schema change (owned by US-052; already shipped in PR #232).
- Changes to the `peer_idle.is_idle` complementary signal in the DB — that field's semantics are unchanged.
- Animated indicators, push notifications, or server-sent updates beyond what US-054 already added.

## Implementation notes

- `lastTurnAt` is available on the `AgentState` object returned by `/api/agent-state`. No new fetch needed.
- `IDLE_THRESHOLD_MS` is exported from `src/lib/db.ts` — import it rather than hard-coding 15 min.
- Primary render site: `src/components/AgentPane.tsx` and/or `src/app/dashboard/page.tsx` (confirm which renders the timestamp row — defer to implementer).
- ~20 LOC delta expected; TINY tier.

## Dependencies / sequencing

- **Blocked behind US-054 (#231) landing.** Both touch the same dashboard pane component files (`dashboard/page.tsx`, `AgentPane.tsx`). Do not begin implementation until US-054 is merged to `main`.

## Linked artifacts

- US-052 (`last_turn_at` backend): `requirements/user-stories/US-052-last-turn-at-idle-indicator.md`
- US-054 (a11y + responsive Issues panel, same files): `requirements/user-stories/US-054-a11y-responsive-issues-panel.md`
- Deferred from: US-052 AC2, carved out explicitly to avoid collision with US-054 in-flight work
