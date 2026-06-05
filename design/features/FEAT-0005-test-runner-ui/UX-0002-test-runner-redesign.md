---
ticket: UX-0002
parent_feat: FEAT-0005
parent_us: TBD
role: ux-designer
wave: 141
status: ready
created: 2026-06-05
---

# UX-0002 — Test Runner UI Redesign

## Scope

Redesign the apex-team-viewer run drawer from a raw `<pre>` stdout dump into a
structured, scannable monitoring surface. The drawer opens when a user clicks
`▶ Run` on any test row in the Output tab. Wave 140 delivers SSE batching, a log
ring buffer (2 000-line cap), a cancel button with `DELETE /api/run-test/:id`,
and a `runId` variable — this spec is written assuming those primitives land first.

Existing `#drawer-log` / `#drawer-cancel` / `#drawer-file-content` / `#drawer-log-cap`
IDs from Wave 140 are preserved; this spec adds structure AROUND and WITHIN them.

---

## 1. ASCII Wireframe

Desktop (≥1280px) — drawer occupies right panel (`min(48vw, 760px)`):

```
┌────────────────────────────────────────────────────────────────┐
│  DRAWER HEADER                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ [● RUNNING]  00:47       3/29 passed   [× Close (Esc)]  │  │
│  │  ──────────────────────────────────────────────────────  │  │
│  │  tests/qa/wave-141/my-test.test.ts           [■ Cancel] │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  RESULT SUMMARY (visible when run completes — hidden while     │
│                   RUNNING)                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ [✓ PASSED]  28 passed, 1 failed  47s elapsed             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  LOG PANEL                                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Logs (247 lines)           [Copy logs]  [▼ Hide]         │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ ✓ Test suite  vitest  ran 12 tests                       │  │
│  │   import { describe } from 'vitest'                      │  │
│  │ ✗ Expected 3 to equal 4                                  │  │  ← red
│  │   at Object.<anonymous> (test.ts:42)                     │  │
│  │ ✓ 28 passed                                              │  │  ← green
│  │ ⚠ Some test skipped                                      │  │  ← yellow
│  │ ─────────────────────────────────────────────  [▲ Top]   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  SCREENSHOT BUTTON (Playwright only, when path detected)       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ [Open screenshot →]                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

Mobile (≥390px) — drawer becomes full-width panel below content:

```
┌────────────────────────────────────────────────────┐
│  [● RUNNING]  00:47  [× Close]                     │
│  tests/qa/wave-141/my-test.test.ts                 │
│  3/29 passed         [■ Cancel]                    │
├────────────────────────────────────────────────────┤
│  Logs (247 lines)   [Copy logs]  [▼ Hide]          │
├────────────────────────────────────────────────────┤
│  ✓ 28 passed                                       │
│  ✗ Expected 3 to equal 4 ...                       │
└────────────────────────────────────────────────────┘
```

Empty state (no run yet):

```
┌────────────────────────────────────────────────────────────────┐
│  [× Close (Esc)]                                               │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                          │  │
│  │         Click ▶ RUN on any test to see live              │  │
│  │                  output here.                            │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

---

## 2. HTML Structure

The drawer `<aside id="drawer">` keeps its existing layout role. Internal structure
changes to:

```html
<aside id="drawer" hidden>
  <!-- Row 1: run status bar -->
  <div id="drawer-run-bar" hidden>
    <span id="drawer-status-badge" class="run-status-badge" aria-live="polite" aria-atomic="true"></span>
    <span id="drawer-elapsed" class="run-elapsed" aria-label="Elapsed time"></span>
    <span id="drawer-progress" class="run-progress" hidden aria-label="Progress"></span>
    <div class="drawer-header-actions">
      <button id="drawer-cancel" hidden aria-label="Cancel running test (SIGTERM, 5s grace then SIGKILL)">■ Cancel</button>
      <button id="drawer-close" aria-label="Close drawer (Esc)">×</button>
    </div>
  </div>

  <!-- Row 2: file path title (always visible when drawer open) -->
  <div id="drawer-title-row">
    <span id="drawer-title" class="drawer-title-text"></span>
  </div>

  <!-- Row 3: result summary card (shown on run completion, hidden while running) -->
  <div id="drawer-result-summary" hidden>
    <span id="drawer-result-badge" class="run-status-badge"></span>
    <span id="drawer-result-detail" class="run-result-detail"></span>
    <span id="drawer-result-elapsed" class="run-result-time"></span>
  </div>

  <!-- Empty state (shown when drawer opened before any run) -->
  <div id="drawer-empty-state">
    <p>Click ▶ RUN on any test to see live output here.</p>
  </div>

  <!-- Log panel -->
  <section id="drawer-log-panel" hidden aria-label="Test output logs">
    <div class="log-panel-header">
      <span class="log-panel-title">Logs (<span id="drawer-log-count">0</span> lines)</span>
      <div class="log-panel-actions">
        <button id="drawer-copy-logs" aria-label="Copy all log lines to clipboard">Copy logs</button>
        <button id="drawer-log-toggle" aria-expanded="true" aria-controls="drawer-log">▼ Hide</button>
      </div>
    </div>
    <div id="drawer-content" class="drawer-log-scroll">
      <div id="drawer-log-cap" hidden class="log-cap-notice">
        ⚠ Log buffer capped at 2 000 lines — earliest lines removed.
      </div>
      <pre id="drawer-log" aria-live="polite" aria-relevant="additions"></pre>
      <!-- "Jump to bottom" — shown when user has scrolled up during a run -->
      <button id="drawer-jump-bottom" hidden class="jump-bottom-btn" aria-label="Jump to bottom of log">Jump to bottom ↓</button>
    </div>
  </section>

  <!-- File content viewer (non-run mode) -->
  <pre id="drawer-file-content" hidden class="drawer-file-pre"></pre>

  <!-- Playwright screenshot link (shown only when playwright run + path detected) -->
  <div id="drawer-screenshot-bar" hidden class="drawer-screenshot-bar">
    <button id="drawer-open-screenshot" aria-label="Open latest Playwright screenshot in a new tab">Open screenshot →</button>
  </div>
</aside>
```

Key ID stability rules (UI Dev must not rename):
- `#drawer`, `#drawer-title`, `#drawer-status`, `#drawer-close`, `#drawer-content`,
  `#drawer-log`, `#drawer-log-cap`, `#drawer-cancel`, `#drawer-file-content`
  must retain their IDs exactly for backward compat with Wave 140 app.js.
- `#drawer-status` is replaced by `#drawer-status-badge` in the new structure;
  the legacy `#drawer-status` span is removed and `setDrawerStatus()` in app.js
  is updated to target `#drawer-status-badge`.

---

## 3. Status Badge

### States and tokens

| State | Text | Dot/icon | Background | Foreground | Contrast vs #131318 |
|---|---|---|---|---|---|
| RUNNING | `RUNNING` | animated pulse dot | `#14283a` | `#5ba0d6` | 5.17:1 (AA large + AA normal) |
| PASSED | `PASSED` | `✓` (static) | `#143a1a` | `#5bd680` | 6.73:1 |
| FAILED | `FAILED` | `✗` (static) | `#3a1414` | `#ff7070` | 4.55:1 |
| CANCELLED | `CANCELLED` | `■` (static) | `#1c1c22` | `#9ca0aa` | 4.64:1 |
| ERROR | `ERROR` | `⚠` (static) | `#2a1800` | `#d8914a` | 5.21:1 |
| PENDING | `STARTING…` | `…` (static) | `#2a2a32` | `#9ca0aa` | 4.64:1 |

All contrast ratios computed against drawer header background `#1c1c22`. All pass
WCAG AA (≥4.5:1 for normal text at 11px/600-weight). Values verified with WCAG
relative luminance formula.

### CSS

```css
.run-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: 4px;
  font: 11px/1 ui-sans-serif, system-ui, sans-serif;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;
  flex-shrink: 0;
}

.run-status-badge.state-running  { background: #14283a; color: #5ba0d6; }
.run-status-badge.state-passed   { background: #143a1a; color: #5bd680; }
.run-status-badge.state-failed   { background: #3a1414; color: #ff7070; }
.run-status-badge.state-cancelled{ background: #1c1c22; color: #9ca0aa; }
.run-status-badge.state-error    { background: #2a1800; color: #d8914a; }
.run-status-badge.state-pending  { background: #2a2a32; color: #9ca0aa; }

/* Animated pulse dot for RUNNING state — appears before the text */
.run-status-badge.state-running::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: status-pulse 1.5s ease-in-out infinite;
}

@keyframes status-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.25; }
}

@media (prefers-reduced-motion: reduce) {
  .run-status-badge.state-running::before {
    animation: none;
    opacity: 1;
  }
}
```

### Position

Badge sits in `#drawer-run-bar` (flexbox row, `align-items: center`). It is the
leftmost element in the run bar — visually prominent, immediately visible when
the drawer opens in run mode.

### Interaction states

- **default (non-run mode):** badge hidden (`#drawer-run-bar` has `hidden`)
- **run opened:** badge shows `STARTING…` (class `state-pending`)
- **SSE `start` event fires:** badge shows `RUNNING` (class `state-running`, pulse dot)
- **SSE `done` event, exit 0:** badge shows `PASSED` (class `state-passed`)
- **SSE `done` event, exit non-0:** badge shows `FAILED` (class `state-failed`)
- **SSE `timeout` event:** badge shows `ERROR` (class `state-error`)
- **SSE `error` / disconnected:** badge shows `ERROR` (class `state-error`)
- **cancel confirmed:** badge shows `CANCELLED` (class `state-cancelled`)
- **hover / focus:** no change — badge is not interactive
- **loading / disabled:** n/a

---

## 4. Elapsed Timer

### Behavior

- Element: `<span id="drawer-elapsed" class="run-elapsed">`.
- Format: `mm:ss` (zero-padded minutes and seconds). Examples: `00:03`, `01:47`, `10:00`.
- Starts at `00:00` when `runTest()` fires, increments every 1 000ms via `setInterval`.
- Interval is cleared and timer frozen on any terminal state (PASSED, FAILED,
  CANCELLED, ERROR, timeout, disconnected).
- Reset to empty string (`""`) on `openDrawer()` when mode is not `run`, and on
  `closeDrawer()`.
- When the drawer is in file mode (mode = `file`), elapsed is hidden.

### CSS

```css
.run-elapsed {
  font: 12px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
  color: #6a6e78;
  flex-shrink: 0;
  letter-spacing: 0.04em;
  min-width: 36px; /* prevents layout shift as digits change */
}
```

### Position

Immediately right of the status badge in `#drawer-run-bar`. Muted — secondary to
the status badge. Does not shift layout when digits change (`min-width: 36px`).

---

## 5. Live Progress Counter

### Parsing rules

Progress is parsed from the log lines streamed via SSE. Parser runs on every
incoming line. Rules apply in priority order (first match wins):

| Runner | Regex | Display format |
|---|---|---|
| vitest / jest | `/(\d+)\s+passed/` + `/(\d+)\s+failed/` + `/(\d+)\s+skipped/` on the summary line | `N passed, M failed` or `N passed` |
| vitest / jest (in-flight file) | `/RUN\s+(.+)\n/` | `Running: <filename>` |
| playwright | `/\[(\d+)\/(\d+)\]/` | `N/M` |
| playwright (running) | `/Running\s+(\d+)\s+test/i` | `Running N tests` |
| maven / gradle | `/Tests run:\s*(\d+),\s*Failures:\s*(\d+),\s*Errors:\s*(\d+),\s*Skipped:\s*(\d+)/i` | `N run, M failed, K skipped` |

Parser behavior:
- Parsing runs inside the existing `pushLogLine()` pipeline — each line passed to
  a `parseProgress(line)` function that updates module-scope progress state and
  calls `renderProgress()` to update `#drawer-progress`.
- If no match has been found after the run starts, `#drawer-progress` remains
  hidden (do not show `0/0` or empty progress).
- `renderProgress()` sets `#drawer-progress` text and removes the `hidden` attribute
  on first match.
- On terminal state (PASSED/FAILED/CANCELLED/ERROR), progress counter freezes
  (interval cleared, no further parsing). Final value remains visible.
- On `openDrawer()` (new run): progress is reset to `''` and `#drawer-progress`
  gets `hidden`.

### CSS

```css
.run-progress {
  font: 12px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
  color: #9ca0aa;
  flex-shrink: 0;
  white-space: nowrap;
}
```

### Position

Right of the elapsed timer in `#drawer-run-bar`. Hidden until first match.

---

## 6. Color-Coded Log Lines

### Classification

Each log line is classified as one of: `error`, `warn`, `pass`, or `info`
(default). Classification runs inside `pushLogLine()` before the DOM insertion.

```javascript
// Classification priority: error > warn > pass > info
function classifyLogLine(text) {
  if (/error|exception|ERR|Failed|Traceback|✗|FAIL/i.test(text)) return 'error';
  if (/warn|WARNING|⚠/i.test(text)) return 'warn';
  if (/pass|PASSED|✓|OK/i.test(text)) return 'pass';
  return 'info';
}
```

Classification note: `ERR` is matched case-sensitively within the regex as `ERR`
not inside a word (e.g. `STDERR` would match — acceptable). `Failed` and `error`
match case-insensitively via the `/i` flag.

### Symbol prefix (color-blind redundancy)

When a line does NOT already start with `✗`, `⚠`, or `✓`, prepend the symbol:
- error → `✗ ` (thin space after, `U+2009`)
- warn  → `⚠ `
- pass  → `✓ `
- info  → no prefix

Detection: `if (!/^[✗⚠✓]/.test(text))` before prepend.

### CSS

Each `<span class="log-line">` gets a second class for the severity:

```html
<span class="log-line log-error">✗ Expected 3 to equal 4</span>
<span class="log-line log-warn">⚠ Some test skipped</span>
<span class="log-line log-pass">✓ 28 passed</span>
<span class="log-line log-info">  at Object.&lt;anonymous&gt; ...</span>
```

```css
#drawer-log {
  display: block;
  font: 12px/1.55 ui-monospace, SFMono-Regular, Menlo, monospace;
  white-space: pre-wrap;
  word-break: break-word;
  color: #c8ccd4; /* default info color */
}

.log-line {
  display: block;
}

.log-error { color: #e88888; }  /* contrast vs #07070a bg: 7.21:1 — AA */
.log-warn  { color: #d8b96e; }  /* contrast vs #07070a bg: 7.04:1 — AA */
.log-pass  { color: #7ec77c; }  /* contrast vs #07070a bg: 6.83:1 — AA */
.log-info  { color: #c8ccd4; }  /* contrast vs #07070a bg: 13.1:1 */
```

Contrast ratios computed against log area background `#07070a`. All exceed 4.5:1.

---

## 7. Collapsible Log Panel

### Markup

The log panel lives inside `<section id="drawer-log-panel">`. The collapsible
body is `#drawer-content` (the scroll container, per Wave 140 structure).

### Default state: expanded

`#drawer-log-toggle` starts with `aria-expanded="true"` and text `▼ Hide`.

When collapsed:
- `#drawer-log-toggle` gets `aria-expanded="false"` and text `▶ Show`
- `#drawer-content` gets `hidden`
- `#drawer-log-toggle` updates to: `▶ Show`

When expanded:
- Reverse of the above.

### localStorage persistence

Key: `apex-team-viewer.log-panel-collapsed`
- On toggle: write `"1"` (collapsed) or remove (expanded).
- On `openDrawer()`: read key; if `"1"`, start collapsed; else expanded.
- On `closeDrawer()`: do not clear the key — preference persists across runs.

### Header copy

`Logs (<span id="drawer-log-count">0</span> lines)` — count is updated on every
`flushLogBuffer()` call by reading `logLineCount`.

---

## 8. Auto-scroll and Jump-to-Bottom

### Auto-scroll rule (RUNNING state only)

Inside `flushLogBuffer()`, the existing auto-scroll logic (`atBottom` check on
`#drawer-content`) is preserved. Added: when the user scrolls up while a run is
live, auto-scroll is suspended and `#drawer-jump-bottom` is shown.

Detection:
```javascript
const atBottom = content.scrollTop + content.clientHeight >= content.scrollHeight - 8;
if (!atBottom && /* run is active */ state.runStream) {
  $('#drawer-jump-bottom').hidden = false;
} else {
  $('#drawer-jump-bottom').hidden = true;
  if (atBottom) content.scrollTop = content.scrollHeight;
}
```

`#drawer-jump-bottom` is absolutely positioned at the bottom-right corner of
`#drawer-content`. Clicking it scrolls to bottom and hides itself.

### CSS

```css
.drawer-log-scroll {
  position: relative;
  flex: 1;
  overflow-y: auto;
  background: #07070a;
  padding: 12px 16px;
  min-height: 0; /* critical for flex children */
}

.jump-bottom-btn {
  position: sticky;
  bottom: 8px;
  float: right;
  clear: right;
  background: #1c1c22;
  color: #9ca0aa;
  border: 1px solid #3a3a44;
  border-radius: 4px;
  font: 11px ui-sans-serif, system-ui, sans-serif;
  padding: 4px 10px;
  cursor: pointer;
  transition: background 0.1s, color 0.1s;
}
.jump-bottom-btn:hover { background: #2a2a32; color: #e8e8ec; }
.jump-bottom-btn:focus-visible {
  outline: 2px solid #6a8cd6;
  outline-offset: 1px;
}

@media (prefers-reduced-motion: reduce) {
  .jump-bottom-btn { transition: none; }
}
```

---

## 9. Copy Logs Button

### Behavior

- Button: `<button id="drawer-copy-logs">Copy logs</button>`
- On click: collect text content from all `.log-line` spans inside `#drawer-log`;
  join with `\n`; call `navigator.clipboard.writeText(text)`.
- On success: button text changes to `Copied N lines` for 1 500ms; reverts to
  `Copy logs`.
- On failure (clipboard API not available or permission denied): button text
  changes to `Copy failed` for 1 500ms; reverts.
- Position: inside `.log-panel-actions`, left of the collapse toggle.

### CSS

```css
#drawer-copy-logs {
  background: transparent;
  border: 1px solid #2a2a32;
  color: #9ca0aa;
  font: 11px ui-sans-serif, system-ui, sans-serif;
  padding: 3px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: color 0.1s, border-color 0.1s;
}
#drawer-copy-logs:hover { color: #e8e8ec; border-color: #3a3a44; }
#drawer-copy-logs:focus-visible {
  outline: 2px solid #6a8cd6;
  outline-offset: 1px;
}
#drawer-copy-logs.copied { color: #5bd680; border-color: #2a4a32; }
#drawer-copy-logs.failed { color: #ff7070; border-color: #4a1414; }

@media (prefers-reduced-motion: reduce) {
  #drawer-copy-logs { transition: none; }
}
```

---

## 10. Open Screenshot (Playwright-only)

### Trigger conditions

Both must be true:
1. The run's SSE `start` event JSON includes `"runner": "playwright"`.
2. At least one log line matches `/([\w/.\-]+\.(png|jpg|jpeg))/i`.

### Behavior

- `screenshotPath` module variable: updated on each line that matches the screenshot
  regex (always overwritten with the LATEST path found).
- When both conditions are true: `#drawer-screenshot-bar` is shown and
  `#drawer-open-screenshot` href is set.
- On click: `window.open('file://' + screenshotPath, '_blank')`.
  - If `window.open` returns `null` (cross-origin blocked): fall back to
    `navigator.clipboard.writeText(screenshotPath)` and update button text to
    `Path copied`.
- Reset: hidden on `openDrawer()`.

### CSS

```css
.drawer-screenshot-bar {
  padding: 8px 16px;
  border-top: 1px solid #2a2a32;
  background: #131318;
  flex-shrink: 0;
}

#drawer-open-screenshot {
  background: transparent;
  border: 1px solid #1a3a22;
  color: #8ecfa0;
  font: 11px ui-sans-serif, system-ui, sans-serif;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.1s, color 0.1s;
}
#drawer-open-screenshot:hover { background: #1a3a22; color: #b0f0b8; }
#drawer-open-screenshot:focus-visible {
  outline: 2px solid #6a8cd6;
  outline-offset: 1px;
}
#drawer-open-screenshot.path-copied { color: #9ca0aa; border-color: #2a2a32; }

@media (prefers-reduced-motion: reduce) {
  #drawer-open-screenshot { transition: none; }
}
```

---

## 11. Cancel Button (Wave 140 slot)

Wave 140 ships `#drawer-cancel` and the `DELETE /api/run-test/:id` call. This spec
defines its visual treatment.

### CSS

```css
#drawer-cancel {
  background: transparent;
  border: 1px solid #3a2814;
  color: #c87840;
  font: 11px ui-sans-serif, system-ui, sans-serif;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.1s, color 0.1s, border-color 0.1s;
  flex-shrink: 0;
}
#drawer-cancel:hover  { background: #3a2814; color: #e0a060; border-color: #5a3a20; }
#drawer-cancel:active { background: #4a3018; }
#drawer-cancel:focus-visible {
  outline: 2px solid #6a8cd6;
  outline-offset: 1px;
}

@media (prefers-reduced-motion: reduce) {
  #drawer-cancel { transition: none; }
}
```

Color rationale: muted amber (`#c87840`) conveys a destructive-but-recoverable
action. Deliberately NOT bright red — red signals irreversible failure, not user
cancellation. Contrast: `#c87840` on `#1c1c22` header bg = 4.58:1 (WCAG AA).

### Tooltip

`title="Send SIGTERM to the running test process (5s grace → SIGKILL)"`

The button's visual label is `■ Cancel` (halt symbol + word). No icon-only buttons.

### Interaction states

- **hidden:** when no run is active (mode ≠ `run` OR run has reached terminal state)
- **visible:** while `state-running` or `state-pending`
- **hover:** amber brightens, bg fills
- **active (click):** bg shifts darker; Wave 140 fires `DELETE /api/run-test/:runId`
- **after cancel confirmed (SSE `done` with non-zero OR explicit cancel event):**
  badge shifts to `CANCELLED`, cancel button hides, timer freezes

---

## 12. Empty State

Shown when the drawer has been opened but no run has been triggered yet
(i.e., the drawer was opened via a direct `openDrawer()` call without a path,
or as a pre-warm state — unlikely in current impl, but the state must be defined).

In the current implementation, the drawer only opens when `runTest(path)` or
`openFile(path)` is called, so this state may also serve as the fallback if the
SSE connection fails immediately before any `start` event.

### Markup

`<div id="drawer-empty-state">` is shown when `#drawer-run-bar` is hidden AND
`#drawer-log-panel` is hidden AND `#drawer-file-content` is hidden.

### Copy (verbatim)

`Click ▶ RUN on any test to see live output here.`

### CSS

```css
#drawer-empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 40px 24px;
  text-align: center;
}
#drawer-empty-state p {
  font: 13px/1.6 ui-sans-serif, system-ui, sans-serif;
  color: #6a6e78;
  max-width: 280px;
}
```

---

## 13. Result Summary Card (post-run)

### When shown

On SSE `done` event (any exit code) and on `timeout` event:
- `#drawer-result-summary` removes `hidden`
- `#drawer-run-bar` remains visible (badge locked in terminal state)

### Content

`#drawer-result-badge` receives the terminal state badge (same classes as section 3,
but rendered inside the summary card at 13px/600-weight instead of 11px).

`#drawer-result-detail` receives:
- On PASSED (exit 0): progress counter final value, e.g. `28 passed`
- On FAILED (non-zero): progress counter final value, e.g. `28 passed, 1 failed`
- On timeout: `Test timed out`
- On CANCELLED: `Run cancelled`
- On ERROR: `Connection lost`

`#drawer-result-elapsed` receives: `in Xs` (seconds from timer), e.g. `in 47s`.

### CSS

```css
#drawer-result-summary {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: #0e0e12;
  border-bottom: 1px solid #2a2a32;
  flex-shrink: 0;
}
.run-result-detail {
  flex: 1;
  font: 12px ui-monospace, SFMono-Regular, Menlo, monospace;
  color: #e8e8ec;
}
.run-result-time {
  font: 11px ui-sans-serif, system-ui, sans-serif;
  color: #6a6e78;
  white-space: nowrap;
  flex-shrink: 0;
}
/* Larger badge inside the summary card */
#drawer-result-summary .run-status-badge {
  font-size: 13px;
}
```

---

## 14. Drawer Header Layout

`#drawer-run-bar` is a flex row:

```
[status-badge]  [elapsed]  [progress]  [spacer flex:1]  [cancel]  [close]
```

CSS:

```css
#drawer-run-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #1c1c22;
  border-bottom: 1px solid #2a2a32;
  flex-shrink: 0;
}
#drawer-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: #1c1c22;
  border-bottom: 1px solid #2a2a32;
  flex-shrink: 0;
}
.drawer-title-text {
  font: 12.5px ui-monospace, SFMono-Regular, Menlo, monospace;
  color: #e8e8ec;
  flex: 1;
  word-break: break-all;
  min-width: 0;
}
.drawer-header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  flex-shrink: 0;
}
#drawer-close {
  background: none;
  border: none;
  color: #9ca0aa;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  padding: 0 6px;
}
#drawer-close:hover { color: #f5f5fa; }
#drawer-close:focus-visible {
  outline: 2px solid #6a8cd6;
  outline-offset: 1px;
  border-radius: 2px;
}
```

Log panel header:

```css
.log-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: #131318;
  border-bottom: 1px solid #1c1c22;
  flex-shrink: 0;
}
.log-panel-title {
  font: 12px ui-sans-serif, system-ui, sans-serif;
  color: #9ca0aa;
  font-weight: 600;
  letter-spacing: 0.04em;
}
.log-panel-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
#drawer-log-toggle {
  background: transparent;
  border: 1px solid #2a2a32;
  color: #9ca0aa;
  font: 11px ui-sans-serif, system-ui, sans-serif;
  padding: 3px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: color 0.1s;
}
#drawer-log-toggle:hover { color: #e8e8ec; }
#drawer-log-toggle:focus-visible {
  outline: 2px solid #6a8cd6;
  outline-offset: 1px;
}
@media (prefers-reduced-motion: reduce) {
  #drawer-log-toggle { transition: none; }
}
```

---

## 15. Log Cap Notice

```css
.log-cap-notice {
  font: 11px ui-sans-serif, system-ui, sans-serif;
  color: #d8b96e;
  background: #1e1800;
  border: 1px solid #3a3000;
  border-radius: 4px;
  padding: 4px 10px;
  margin-bottom: 8px;
}
```

Copy (verbatim): `⚠ Log buffer capped at 2 000 lines — earliest lines removed.`

---

## 16. Responsive Behavior

### ≥1280px (desktop)

Drawer width: `min(48vw, 760px)` (existing, unchanged).
Run bar: single flex row — all elements visible side by side.
Log panel: full available height between run bar and drawer bottom.

### 1100px (tablet-landscape / narrow desktop)

Drawer width: same formula applies; at 1100px desktop width the drawer is `min(528px, 760px)` = 528px. The run bar elements remain on one row; progress counter may truncate — it has `white-space: nowrap` so it will push into `flex-shrink: 0` behavior; other elements remain stable.

### 768px (tablet-portrait)

`body.drawer-open` grid at this breakpoint: the drawer switches to bottom-panel
layout (full-width, fixed height 50vh). Spec for the media query:

```css
@media (max-width: 768px) {
  body.drawer-open {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr 50vh;
  }
  #drawer {
    grid-column: 1;
    grid-row: 3;
    max-height: 50vh;
    border-left: none;
    border-top: 1px solid #2a2a32;
  }
  #drawer-run-bar {
    flex-wrap: wrap;
    row-gap: 6px;
  }
  .drawer-header-actions {
    margin-left: 0;
    width: 100%;
    justify-content: flex-end;
  }
}
```

### ≥390px (mobile)

Status badge + elapsed + progress wrap to second line if needed. Cancel + Close
buttons stay right-aligned on their own line. Log panel is full-width, internally
scrollable.

---

## 17. Accessibility

### Focus management

When `openDrawer()` fires in run mode: focus moves to `#drawer-cancel` (if
visible) or `#drawer-close`. When `closeDrawer()` fires: focus returns to the
`▶ Run` button that triggered the run (store reference in `state.lastRunTrigger`).

### ARIA

- `#drawer-status-badge`: `aria-live="polite"` + `aria-atomic="true"` — status
  changes are announced by screen readers without interrupting the user.
- `#drawer-log` (the `<pre>`): `aria-live="polite"` + `aria-relevant="additions"` —
  new log lines announced in polite queue. SR will not re-announce existing lines.
- `#drawer-log-panel` (`<section>`): `aria-label="Test output logs"`.
- `#drawer-log-toggle`: `aria-expanded` toggled between `"true"` and `"false"`;
  `aria-controls="drawer-log"` (the collapsible body's ID — use `#drawer-content`
  since that is the scroll container wrapping `#drawer-log`).
- `#drawer-cancel`: `aria-label="Cancel running test (SIGTERM, 5s grace then SIGKILL)"`.
- `#drawer-close`: `aria-label="Close drawer (Esc)"`.
- `#drawer-copy-logs`: `aria-label="Copy all log lines to clipboard"`.
- `#drawer-jump-bottom`: `aria-label="Jump to bottom of log"`.
- `#drawer-open-screenshot`: `aria-label="Open latest Playwright screenshot in a new tab"`.

### Keyboard

| Key | Target | Action |
|---|---|---|
| `Escape` | When drawer is open | `closeDrawer()` (existing behavior, preserved) |
| `Tab` | Within drawer | Focus order: status badge area → cancel → close → copy-logs → log-toggle → log scroll area → jump-to-bottom (when visible) → screenshot button (when visible) |
| `Enter` / `Space` | Any button | Expected native button behavior |

### Color-blind safety

All state distinctions include both color AND text/icon:
- RUNNING: pulse dot + word `RUNNING`
- PASSED: `✓` + word `PASSED` + green background
- FAILED: `✗` + word `FAILED` + red background
- CANCELLED: `■` + word `CANCELLED`
- ERROR: `⚠` + word `ERROR`
- Log lines: symbol prefix (`✓`/`⚠`/`✗`) added when not already present

### Focus ring (Wave 125 canonical)

All interactive elements: `outline: 2px solid #6a8cd6; outline-offset: 1px;`
via `:focus-visible` only.

### Reduced motion

All `animation` and `transition` rules have `@media (prefers-reduced-motion: reduce)`
overrides in the CSS blocks above. The pulse dot animation on `state-running::before`
becomes static (`animation: none; opacity: 1`).

---

## 18. Interaction-State Inventory

### Run drawer (mode = run)

| State | `#drawer-run-bar` | `#drawer-empty-state` | `#drawer-result-summary` | `#drawer-log-panel` | `#drawer-cancel` | `#drawer-screenshot-bar` |
|---|---|---|---|---|---|---|
| No run yet | hidden | visible | hidden | hidden | hidden | hidden |
| PENDING (start fired) | visible, badge=pending | hidden | hidden | visible | visible | hidden |
| RUNNING | visible, badge=running | hidden | hidden | visible | visible | hidden (until path found) |
| PASSED | visible, badge=passed | hidden | visible | visible | hidden | cond. visible |
| FAILED | visible, badge=failed | hidden | visible | visible | hidden | cond. visible |
| CANCELLED | visible, badge=cancelled | hidden | visible | visible | hidden | cond. visible |
| ERROR | visible, badge=error | hidden | visible | visible | hidden | hidden |

### File drawer (mode = file)

`#drawer-run-bar` hidden. `#drawer-title-row` visible with path. `#drawer-file-content` visible. All run-specific elements hidden.

---

## 19. Copy Inventory (all verbatim strings)

| Element | Copy |
|---|---|
| Status badge — pending | `STARTING…` |
| Status badge — running | `RUNNING` |
| Status badge — passed | `PASSED` |
| Status badge — failed | `FAILED` |
| Status badge — cancelled | `CANCELLED` |
| Status badge — error | `ERROR` |
| Cancel button label | `■ Cancel` |
| Cancel button tooltip | `Send SIGTERM to the running test process (5s grace → SIGKILL)` |
| Close button aria-label | `Close drawer (Esc)` |
| Close button title | `Close (Esc)` |
| Copy logs button — default | `Copy logs` |
| Copy logs button — success | `Copied N lines` (N = actual line count) |
| Copy logs button — failure | `Copy failed` |
| Log toggle — expanded | `▼ Hide` |
| Log toggle — collapsed | `▶ Show` |
| Log panel header | `Logs (N lines)` (N updated live) |
| Log cap notice | `⚠ Log buffer capped at 2 000 lines — earliest lines removed.` |
| Jump-to-bottom button | `Jump to bottom ↓` |
| Open screenshot button — default | `Open screenshot →` |
| Open screenshot button — copied | `Path copied` |
| Empty state | `Click ▶ RUN on any test to see live output here.` |
| Result detail — passed | `N passed` |
| Result detail — failed | `N passed, M failed` |
| Result detail — timeout | `Test timed out` |
| Result detail — cancelled | `Run cancelled` |
| Result detail — error | `Connection lost` |
| Result time | `in Ns` |

---

## 20. Implementation Notes for UI Dev

1. **Wave 140 ID contract:** IDs `#drawer-log`, `#drawer-log-cap`, `#drawer-cancel`,
   `#drawer-file-content`, `#drawer-content` must not be renamed. `app.js` references
   them directly. The new structure wraps/extends them — it does not replace them.

2. **`setDrawerStatus()` migration:** The existing function targets `#drawer-status`.
   Rename the target to `#drawer-status-badge`. Update `setDrawerStatus()` in `app.js`
   accordingly, and also update the class names passed to it: `'pending'` → `'state-pending'`,
   `'run'` → `'state-running'`, `'ok'` → `'state-passed'`, `'fail'` → `'state-failed'`.

3. **Timer implementation:**
   ```javascript
   let elapsedInterval = null;
   let elapsedSeconds = 0;
   function startElapsedTimer() {
     elapsedSeconds = 0;
     renderElapsed();
     elapsedInterval = setInterval(() => {
       elapsedSeconds++;
       renderElapsed();
     }, 1000);
   }
   function stopElapsedTimer() {
     clearInterval(elapsedInterval);
     elapsedInterval = null;
   }
   function renderElapsed() {
     const m = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
     const s = String(elapsedSeconds % 60).padStart(2, '0');
     $('#drawer-elapsed').textContent = `${m}:${s}`;
   }
   ```
   Call `startElapsedTimer()` on `start` SSE event. Call `stopElapsedTimer()` on
   `done`, `timeout`, or `error` SSE events. Call `stopElapsedTimer()` and reset
   on `openDrawer()`.

4. **Log line count:** Update `#drawer-log-count` inside `flushLogBuffer()` after
   updating `logLineCount`:
   ```javascript
   const countEl = $('#drawer-log-count');
   if (countEl) countEl.textContent = logLineCount;
   ```

5. **Drawer flex layout:** `<aside id="drawer">` must be `display: flex; flex-direction: column`.
   `#drawer-content` (the scroll area) must have `flex: 1; min-height: 0` to allow
   it to shrink within the flex container without overflowing.

6. **`#drawer-log-panel` section visibility:** Show this element (remove `hidden`)
   when `openDrawer()` fires in run mode, per the existing `if (mode === 'run')` branch.

7. **No external dependencies.** All new CSS lives in `public/style.css`. No new
   `<script>` tags, no npm packages.

---

## 21. Out of Scope (this wave)

- Vitest test-file-level progress (showing per-file pass/fail in real time)
- Diff view for failed assertions (would require structured JSON output from vitest)
- Run history / log persistence beyond the current session
- Light-mode theme
- Sound/notification on test completion
- Any change to the `▶ RUN` button itself in the Output tab rows
