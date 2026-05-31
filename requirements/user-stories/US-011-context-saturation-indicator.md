# US-011 — Context-saturation indicator on agent panes

**Status:** proposed
**Owner role:** ui-developer, backend-developer
**Created:** 2026-05-31
**Story ID:** US-011

---

## Narrative

As a user monitoring the apex-team during agent work, I want each agent pane to show a visual context-saturation indicator, so that I can immediately see which agents are approaching their context limit and take action before quality degrades.

## Acceptance Criteria

- **AC1:** Given an agent pane (on `/` and CONTEXT badge on `/dashboard`), when rendered, then it shows a visual saturation indicator — either a horizontal fill bar or a colour-coded chip — displaying context usage as a percentage. The percentage is calculated as `handoff_char_count / CONTEXT_MAX_CHARS * 100` where `CONTEXT_MAX_CHARS` defaults to `8000`. The constant is defined once and tuneable without a code rebuild.

- **AC2:** Given the saturation indicator, when displayed, then it applies three colour states: green for <50%, amber for 50–80%, red for >80%. Thresholds are defined as named constants (`CONTEXT_AMBER_THRESHOLD = 0.5`, `CONTEXT_RED_THRESHOLD = 0.8`) in the component or a shared constants file, not hardcoded inline.

- **AC3:** Given an agent whose context saturation exceeds 80%, when the pane or CONTEXT badge renders, then it shows a "Needs cleanup" label or badge alongside the indicator (in addition to the colour change from AC2). The existing `needsCleanup` boolean from `/api/team-status` is the data source — no new API field is required.

- **AC4 (deferred):** Given the CONTEXT panel on `/dashboard`, when an agent shows `needsCleanup = true`, then a "Compact HANDOFF" button dispatches PO with a context-compaction instruction for that agent. — _Deferred to follow-up story (US-011b) if scope balloons. Do not implement in this wave._

## Out of Scope

- **AC4** per above — compaction dispatch is deferred.
- Counting token usage against the model's actual context window (that requires per-provider tokeniser APIs and is a separate story). The char-count heuristic in AC1 is the entire implementation scope here.
- Per-message context attribution (which messages consume how many chars).
- Historical saturation trending or charting.

## Design Spec

- TBD — UX Designer to create `design/US-011-context-saturation.md` before implementation begins (or confirm the existing pane layout accommodates the indicator without a separate spec).

## Links

_(Filled in during and after implementation)_

- impl: _(pending)_
- test: _(pending)_
- design-pass-by: _(pending)_
- qa-pass-by: _(pending)_
- deployed-by: _(pending)_
