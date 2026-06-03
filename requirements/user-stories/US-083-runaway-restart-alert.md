---
name: US-083-runaway-restart-alert
description: Self-heal runaway-restart alerting — macOS osascript notification + dashboard banner + reset path when L2 cascade-protection enters manual-intervention mode; closes #320
metadata:
  type: user-story
  status: closed
  owner: DevSecOps (notification + state row) + UI Dev (banner + reset)
  issue: "#320"
  wave: pending-implementation
  last-modified: 2026-06-03
---

## Story

As an apex-team operator, when the L1 launchd + L2 stall-detector self-heal cycle has fired 3+ times in 5 minutes (i.e. the restart loop itself is broken), I want a macOS notification and a dashboard red banner surfaced immediately so I become aware of the unrecoverable condition before the cycle silently consumes CPU and battery, and I want a single-click reset path so I can clear the alert and resume normal operation after diagnosing the root cause.

## Acceptance criteria

1. **macOS notification trigger** — when L2's cascade-protection predicate fires (3+ `process.exit(1)` calls within 5 minutes, per US-080 AC3), the server executes:
   ```
   osascript -e 'display notification "Apex-team has entered manual-intervention mode after repeated restarts. Open dashboard to triage." with title "Apex-team self-heal halted" sound name "Funk"'
   ```
   This call is made ONCE per manual-mode entry.

2. **`agent_state` sticky row** — simultaneously with AC1, write a row to the `agent_state` table:
   - Key: `health.manual_mode`
   - Value (JSON-encoded): `{ "active": true, "since": <ISO-8601 timestamp>, "trigger_reason": "cascade: 3+ exits in 5 min", "exit_count": <N>, "window_minutes": 5 }`
   - This row persists until explicitly cleared by the user (AC4) — it survives server restarts.

3. **Dashboard red banner** — the dashboard reads `health.manual_mode` on load and after each turn; when `active=true`, renders a full-width red banner at the top of the page with:
   - Heading: "Self-heal halted — manual intervention required"
   - Body: `Since <formatted timestamp> · <exit_count> exits in <window_minutes> minutes`
   - A "Dismiss + reset" button (AC4).
   - The banner renders above the OrchestratorBar (highest visual priority) and is not dismissable except via the reset action.
   - Must meet WCAG 2.1 AA contrast (red background on dark theme) — reuse `--accent-err` or the contrast-tokens from PR #302.

4. **Reset path** — "Dismiss + reset" button:
   - Calls `DELETE /api/agent-state?key=health.manual_mode` (or equivalent idempotent endpoint).
   - On success: removes the banner from the UI, resets the cascade counter in `data/.exit-history.json` (clears the array), and resumes normal L2 stall-detection operation.
   - If the API call fails, shows an inline error inside the banner without dismissing it.

5. **Single-fire** — while `health.manual_mode.active=true`, subsequent L2 ticks do NOT re-trigger the osascript call or overwrite the `agent_state` row (prevents notification spam and timestamp stomping).

6. **Fallback (non-mac / CI)** — if `osascript` exits non-zero or is not in `$PATH`, catch the error, log `ERROR: osascript unavailable — manual-intervention banner written to dashboard instead`, and continue without crashing. The banner (AC3) still fires normally.

7. **Test coverage**:
   - Unit test for the trigger predicate: given mock `.exit-history.json` with 3 timestamps in 5 min, assert `isManualMode()` returns true.
   - Integration test: mock `osascript` (spy on the child-process call), trigger cascade, assert osascript called ONCE with the correct `-e` string; assert second trigger call while `active=true` does NOT call osascript again.
   - UI smoke: render the dashboard with `health.manual_mode` row active; assert banner renders with correct text; click "Dismiss + reset"; assert banner disappears and DELETE endpoint was called.

## Out of scope

- L1 launchd plist install and control scripts (US-079).
- L2 stall-detector logic, exit-history tracking, and the cascade-protection predicate itself (US-080).
- L3 DevSecOps auto-merge gate (US-081).
- SQLite migration crash-safety (US-082).
- Non-cascade alert modes (single crash, normal restart) — no banner in those cases.

## Dependencies

- **US-080 (L2)** must be merged before US-083 can be implemented — the `data/.exit-history.json` state file and cascade-protection predicate are US-080's outputs that US-083 reads.

## Open questions

- **OQ-320-001** (OPEN): The `agent_state` key schema (`health.manual_mode`) is referenced by US-080 (writer) and this story (reader/renderer). US-080 currently says "write a sticky banner state to `agent_state` for the dashboard" without locking down the exact JSON shape. Architect must confirm the schema in `data-sources.md` / `db.ts` before either implementer starts, to avoid write/read contract drift. Working assumption: schema as defined in AC2 of this story.

## Notes

- L2's `dev-supervisor.mjs` is the write-side; dashboard `AgentStatePanel` / a new `HealthBanner` component is the read-side.
- UX gate required — banner is a new visual surface with contrast + a11y requirements.
- Discovered during: 2026-06-03 apex_synthesize consultation on self-heal architecture (apex_synthesize flagged the "what if the loop itself breaks?" failure mode).
- Sibling stories: US-079 (L1), US-080 (L2), US-081 (L3), US-082 (SQLite crash-safety).
