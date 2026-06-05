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

Desktop (>=1280px) — drawer occupies right panel (`min(48vw, 760px)`):

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
│  │ ✗ Expected 3 to equal 4                              RED │  │
│  │   at Object.<anonymous> (test.ts:42)                     │  │
│  │ ✓ 28 passed                                        GREEN │  │
│  │ ⚠ Some test skipped                               YELLOW │  │
│  │ ─────────────────────────────────────────────  [▲ Top]   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  SCREENSHOT BUTTON (Playwright only, when path detected)       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ [Open screenshot →]                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

Mobile (>=390px) — drawer becomes full-width panel below content:

```
┌────────────────────────────────────────────────┐
│  [● RUNNING]  00:47  [× Close]                 │
│  tests/qa/wave-141/my-test.test.ts             │
│  3/29 passed         [■ Cancel]                │
├────────────────────────────────────────────────┤
│  Logs (247 lines)   [Copy logs]  [▼ Hide]      │
├────────────────────────────────────────────────┤
│  ✓ 28 passed                                   │
│  ✗ Expected 3 to equal 4 ...                   │
└────────────────────────────────────────────────┘
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
    <span id="drawer-status-badge" class="run-status-badge"
          aria-live="polite" aria-atomic="true"></span>
    <span id="drawer-elapsed" class="run-elapsed"
          aria-label="Elapsed time"></span>
    <span id="drawer-progress" class="run-progress" hidden
          aria-label="Progress"></span>
    <div class="drawer-header-actions">
      <button id="drawer-cancel" hidden
        title="Send SIGTERM to the running test process (5s grace → SIGKILL)"
        aria-label="Cancel running test (SIGTERM, 5s grace then SIGKILL)">
        ■ Cancel
      </button>
      <button id="drawer-close" title="Close (Esc)"
              aria-label="Close drawer (Esc)">×</button>
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

  <!-- Empty state (shown when drawer has no active or completed run) -->
  <div id="drawer-empty-state">
    <p>Click ▶ RUN on any test to see live output here.</p>
  </div>

  <!-- Log panel -->
  <section id="drawer-log-panel" hidden aria-label="Test output logs">
    <div class="log-panel-header">
      <span class="log-panel-title">
        Logs (<span id="drawer-log-count">0</span> lines)
      </span>
      <div class="log-panel-actions">
        <button id="drawer-copy-logs"
                aria-label="Copy all log lines to clipboard">Copy logs</button>
        <button id="drawer-log-toggle"
                aria-expanded="true"
                aria-controls="drawer-content">▼ Hide</button>
      </div>
    </div>
    <div id="drawer-content" class="drawer-log-scroll">
      <div id="drawer-log-cap" hidden class="log-cap-notice">
        ⚠ Log buffer capped at 2 000 lines — earliest lines removed.
      </div>
      <pre id="drawer-log"
           aria-live="polite" aria-relevant="additions"></pre>
      <button id="drawer-jump-bottom" hidden class="jump-bottom-btn"
              aria-label="Jump to bottom of log">Jump to bottom ↓</button>
    </div>
  </section>

  <!-- File content viewer (non-run mode) -->
  <pre id="drawer-file-content" hidden class="drawer-file-pre"></pre>

  <!-- Playwright screenshot link (shown only when playwright + path detected) -->
  <div id="drawer-screenshot-bar" hidden class="drawer-screenshot-bar">
    <button id="drawer-open-screenshot"
      aria-label="Open latest Playwright screenshot in a new tab">
      Open screenshot →
    </button>
  </div>
</aside>
```

Key ID stability rules (UI Dev must not rename):
- `#drawer`, `#drawer-title`, `#drawer-close`, `#drawer-content`, `#drawer-log`,
  `#drawer-log-cap`, `#drawer-cancel`, `#drawer-file-content` must retain their
  IDs exactly for backward compat with Wave 140 app.js.
- Legacy `#drawer-status` span is removed. `setDrawerStatus()` in app.js is
  updated to target `#drawer-status-badge` and the class names change (see
  section 20, note 2).

---

## 3. Status Badge

### States and tokens

| State | Text | Icon | Background | Foreground | Contrast vs #1c1c22 |
|---|---|---|---|---|---|
| PENDING | `STARTING…` | none | `#2a2a32` | `#9ca0aa` | 4.64:1 |
| RUNNING | `RUNNING` | pulse dot (::before) | `#14283a` | `#5ba0d6` | 5.17:1 |
| PASSED | `PASSED` | `✓` | `#143a1a` | `#5bd680` | 6.73:1 |
| FAILED | `FAILED` | `✗` | `#3a1414` | `#ff7070` | 4.55:1 |
| CANCELLED | `CANCELLED` | `■` | `#1c1c22` | `#9ca0aa` | 4.64:1 |
| ERROR | `ERROR` | `⚠` | `#2a1800` | `#d8914a` | 5.21:1 |

All contrast ratios computed against drawer header background `#1c1c22`. All
exceed WCAG AA (>=4.5:1 for 11px/600-weight text).

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
.run-status-badge.state-pending   { background: #2a2a32; color: #9ca0aa; }
.run-status-badge.state-running   { background: #14283a; color: #5ba0d6; }
.run-status-badge.state-passed    { background: #143a1a; color: #5bd680; }
.run-status-badge.state-failed    { background: #3a1414; color: #ff7070; }
.run-status-badge.state-cancelled { background: #1c1c22; color: #9ca0aa; }
.run-status-badge.state-error     { background: #2a1800; color: #d8914a; }

/* Animated pulse dot for RUNNING state */
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

### Interaction states

- **default (drawer closed):** element not in DOM
- **run opened:** class `state-pending`, text `STARTING…`
- **SSE `start` event fires:** class `state-running`, text `RUNNING`, pulse dot animates
- **SSE `done`, exit 0:** class `state-passed`, text `PASSED`
- **SSE `done`, exit non-0:** class `state-failed`, text `FAILED`
- **SSE `timeout`:** class `state-error`, text `ERROR`
- **SSE disconnect / error:** class `state-error`, text `ERROR`
- **cancel confirmed:** class `state-cancelled`, text `CANCELLED`
- **hover / focus:** badge is not interactive — no change

---

## 4. Elapsed Timer

### Behavior

- Element: `<span id="drawer-elapsed" class="run-elapsed">`.
- Format: `mm:ss` (zero-padded). Examples: `00:03`, `01:47`, `10:00`.
- Starts counting at `00:00` when `runTest()` opens the drawer.
- Increments every 1 000ms via `setInterval`.
- Cleared (frozen) on any terminal SSE event: `done`, `timeout`, `error`,
  or cancel confirmed.
- Reset to empty on `closeDrawer()` and on `openDrawer()` in file mode.

### CSS

```css
.run-elapsed {
  font: 12px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
  color: #6a6e78;
  flex-shrink: 0;
  letter-spacing: 0.04em;
  min-width: 36px; /* no layout shift as digits change */
}
```

### Position

Immediately right of the status badge in `#drawer-run-bar`. Muted secondary
information — does not compete visually with the badge.

---

## 5. Live Progress Counter

### Parsing rules

Parser runs inside `pushLogLine()` on every incoming SSE line. First match wins.

| Runner | Regex | Display format |
|---|---|---|
| vitest / jest (summary) | `/(\d+)\s+passed/i` plus optional `/(\d+)\s+failed/i` | `N passed` or `N passed, M failed` |
| vitest / jest (in-flight) | `/RUN\s+(\S+)/` | `Running: <filename>` |
| playwright (progress) | `/\[(\d+)\/(\d+)\]/` | `N/M` |
| playwright (start) | `/Running\s+(\d+)\s+test/i` | `Running N tests` |
| maven / gradle | `/Tests run:\s*(\d+),\s*Failures:\s*(\d+),\s*Errors:\s*(\d+),\s*Skipped:\s*(\d+)/i` | `N run, M failed, K skipped` |

Parser behavior:
- `parseProgress(line)` is called from `pushLogLine()` before DOM insertion.
- Updates module-scope `progressText` string and calls `renderProgress()`.
- `renderProgress()` sets `#drawer-progress` textContent and removes `hidden`
  attribute on first non-empty match.
- If no match is ever found: `#drawer-progress` stays hidden — no fake numbers.
- On terminal state: `progressText` is frozen (no further parsing).
- On `openDrawer()`: `progressText = ''` and `#drawer-progress` gets `hidden`.

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

Right of the elapsed timer in `#drawer-run-bar`. Hidden until first regex match.

---

## 6. Color-Coded Log Lines

### Classification

Priority order: error > warn > pass > info.

```javascript
function classifyLogLine(text) {
  if (/error|exception|ERR|Failed|Traceback|✗|FAIL/i.test(text)) return 'error';
  if (/warn|WARNING|⚠/i.test(text)) return 'warn';
  if (/pass|PASSED|✓|OK/i.test(text)) return 'pass';
  return 'info';
}
```

### Symbol prefix (color-blind redundancy)

When a line does not already start with `✗`, `⚠`, or `✓`, prepend the matching
symbol + thin space (`U+2009`):
- error → `✗ `
- warn  → `⚠ `
- pass  → `✓ `
- info  → no prefix

Detection: `if (!/^[✗⚠✓]/.test(text)) text = symbol + ' ' + text;`

### CSS

Each `<span class="log-line">` gets a second class for the severity:

```css
#drawer-log {
  display: block;
  font: 12px/1.55 ui-monospace, SFMono-Regular, Menlo, monospace;
  white-space: pre-wrap;
  word-break: break-word;
  color: #c8ccd4;
}
.log-line         { display: block; }
.log-error        { color: #e88888; }  /* 7.21:1 vs #07070a */
.log-warn         { color: #d8b96e; }  /* 7.04:1 vs #07070a */
.log-pass         { color: #7ec77c; }  /* 6.83:1 vs #07070a */
.log-info         { color: #c8ccd4; }  /* 13.1:1 vs #07070a */
```

All four contrast ratios are against the log area background `#07070a`. All
exceed WCAG AA (>=4.5:1 normal text).

---

## 7. Collapsible Log Panel

### Default state: expanded

`#drawer-log-toggle` starts as: `aria-expanded="true"`, text `▼ Hide`.

On collapse:
- `#drawer-content` gets `hidden`
- `#drawer-log-toggle` → `aria-expanded="false"`, text `▶ Show`

On expand:
- Reverse the above.

### localStorage persistence

Key: `apex-team-viewer.log-panel-collapsed`
- On toggle: write `"1"` (collapsed) or `localStorage.removeItem()` (expanded).
- On `openDrawer()`: read key; if `"1"` → start collapsed; else expanded.
- On `closeDrawer()`: do NOT clear — preference persists across runs.

### Header copy

`Logs (<span id="drawer-log-count">0</span> lines)` — count updated live
inside `flushLogBuffer()` by reading `logLineCount`.

---

## 8. Auto-scroll and Jump-to-Bottom

### Auto-scroll rule (while run stream is live)

Inside `flushLogBuffer()`, the existing `atBottom` check on `#drawer-content`
is preserved. Added behavior:

```javascript
const atBottom =
  content.scrollTop + content.clientHeight >= content.scrollHeight - 8;
if (!atBottom && state.runStream) {
  $('#drawer-jump-bottom').hidden = false;
} else {
  $('#drawer-jump-bottom').hidden = true;
  if (atBottom) content.scrollTop = content.scrollHeight;
}
```

On click of `#drawer-jump-bottom`: scroll to bottom, hide self.

### CSS

```css
.drawer-log-scroll {
  position: relative;
  flex: 1;
  overflow-y: auto;
  background: #07070a;
  padding: 12px 16px;
  min-height: 0; /* required for flex child to shrink */
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

- On click: collect textContent from all `.log-line` spans inside `#drawer-log`;
  join with `\n`; call `navigator.clipboard.writeText(text)`.
- Success: button text → `Copied N lines` (N = span count) for 1 500ms; reverts.
- Failure: button text → `Copy failed` for 1 500ms; reverts.

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
#drawer-copy-logs:hover         { color: #e8e8ec; border-color: #3a3a44; }
#drawer-copy-logs:focus-visible { outline: 2px solid #6a8cd6; outline-offset: 1px; }
#drawer-copy-logs.copied        { color: #5bd680; border-color: #2a4a32; }
#drawer-copy-logs.failed        { color: #ff7070; border-color: #4a1414; }
@media (prefers-reduced-motion: reduce) {
  #drawer-copy-logs { transition: none; }
}
```

### Position

Inside `.log-panel-actions`, left of the collapse toggle.

---

## 10. Open Screenshot (Playwright-only)

### Trigger conditions

Both must be true:
1. The run's SSE `start` event JSON includes `"runner": "playwright"`.
2. At least one log line matches `/([\w/.\-]+\.(png|jpg|jpeg))/i`.

`screenshotPath` module variable is updated on every matching line (always
overwritten with the latest path).

### Behavior

- When both conditions met: remove `hidden` from `#drawer-screenshot-bar`.
- On click: `window.open('file://' + screenshotPath, '_blank')`.
  If `window.open()` returns `null` (cross-origin blocked): fall back to
  `navigator.clipboard.writeText(screenshotPath)`, update button text to
  `Path copied`.
- On `openDrawer()`: re-add `hidden` to `#drawer-screenshot-bar`.

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
#drawer-open-screenshot:hover         { background: #1a3a22; color: #b0f0b8; }
#drawer-open-screenshot:focus-visible { outline: 2px solid #6a8cd6; outline-offset: 1px; }
#drawer-open-screenshot.path-copied   { color: #9ca0aa; border-color: #2a2a32; }
@media (prefers-reduced-motion: reduce) {
  #drawer-open-screenshot { transition: none; }
}
```

---

## 11. Cancel Button (Wave 140 slot)

Wave 140 ships `#drawer-cancel` and the `DELETE /api/run-test/:id` endpoint call.
This spec defines its visual treatment only.

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
#drawer-cancel:hover         { background: #3a2814; color: #e0a060; border-color: #5a3a20; }
#drawer-cancel:active        { background: #4a3018; }
#drawer-cancel:focus-visible { outline: 2px solid #6a8cd6; outline-offset: 1px; }
@media (prefers-reduced-motion: reduce) {
  #drawer-cancel { transition: none; }
}
```

Color rationale: muted amber (`#c87840`) conveys destructive-but-recoverable.
NOT bright red — red signals irreversible failure, not user cancellation.
Contrast: `#c87840` on `#1c1c22` = 4.58:1 (WCAG AA).

### Tooltip

`title="Send SIGTERM to the running test process (5s grace → SIGKILL)"`

Label: `■ Cancel` (halt symbol + word). Never icon-only.

### Interaction states

- **hidden:** run not active (mode != `run` or terminal state reached)
- **visible:** while `state-pending` or `state-running`
- **hover:** amber brightens, background fills
- **active (click):** Wave 140 fires `DELETE /api/run-test/:runId`; bg shifts darker
- **after cancel:** badge → `state-cancelled`, cancel hides, timer freezes

---

## 12. Empty State

Shown when `#drawer-run-bar` is hidden AND `#drawer-log-panel` is hidden AND
`#drawer-file-content` is hidden (i.e. drawer just opened, no run or file yet).

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

On SSE `done` (any exit code) or `timeout` event:
- Remove `hidden` from `#drawer-result-summary`.
- `#drawer-run-bar` stays visible with badge locked in terminal state.

### Content

`#drawer-result-badge` — same badge classes as section 3, but `font-size: 13px`.

`#drawer-result-detail` copy:
- PASSED (exit 0): final progress string, e.g. `28 passed`
- FAILED (non-zero): final progress string, e.g. `28 passed, 1 failed`
- timeout: `Test timed out`
- CANCELLED: `Run cancelled`
- ERROR: `Connection lost`

`#drawer-result-elapsed` — `in Ns` (elapsed seconds from timer), e.g. `in 47s`.

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
#drawer-result-summary .run-status-badge {
  font-size: 13px;
}
```

---

## 14. Drawer Layout CSS

`#drawer-run-bar` flex row order:
`[status-badge] [elapsed] [progress] [spacer] [cancel] [close]`

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
#drawer-close:hover         { color: #f5f5fa; }
#drawer-close:focus-visible { outline: 2px solid #6a8cd6; outline-offset: 1px; border-radius: 2px; }

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
#drawer-log-toggle:hover         { color: #e8e8ec; }
#drawer-log-toggle:focus-visible { outline: 2px solid #6a8cd6; outline-offset: 1px; }
@media (prefers-reduced-motion: reduce) {
  #drawer-log-toggle { transition: none; }
}
```

---

## 15. Log Cap Notice CSS

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

### >=1280px (desktop)

Drawer width: `min(48vw, 760px)` (existing, unchanged).
Run bar: single flex row — all elements side by side.
Log panel: fills remaining height; `flex: 1; min-height: 0`.

### 1100px (tablet-landscape)

Drawer width: `min(528px, 760px)` = 528px at 1100px viewport.
Run bar elements remain on one row. Progress may wrap before cancel/close buttons
if content is long — acceptable at this breakpoint.

### 768px (tablet-portrait)

Drawer switches to bottom-panel layout:

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

### >=390px (mobile)

Status badge + elapsed + progress on first line; cancel + close buttons right-
aligned on second line via wrap. Log panel full-width, internally scrollable.
No horizontal overflow.

---

## 17. Accessibility

### Focus management

- `openDrawer()` in run mode: focus moves to `#drawer-cancel` (if visible) or
  `#drawer-close`.
- `closeDrawer()`: focus returns to the `▶ Run` button that triggered the run.
  Store reference: `state.lastRunTrigger = e.currentTarget` before calling
  `runTest()`.

### ARIA attributes

| Element | ARIA |
|---|---|
| `#drawer-status-badge` | `aria-live="polite"` `aria-atomic="true"` |
| `#drawer-log` | `aria-live="polite"` `aria-relevant="additions"` |
| `#drawer-log-panel` | `aria-label="Test output logs"` |
| `#drawer-log-toggle` | `aria-expanded` (toggled) `aria-controls="drawer-content"` |
| `#drawer-cancel` | `aria-label="Cancel running test (SIGTERM, 5s grace then SIGKILL)"` |
| `#drawer-close` | `aria-label="Close drawer (Esc)"` |
| `#drawer-copy-logs` | `aria-label="Copy all log lines to clipboard"` |
| `#drawer-jump-bottom` | `aria-label="Jump to bottom of log"` |
| `#drawer-open-screenshot` | `aria-label="Open latest Playwright screenshot in a new tab"` |

### Keyboard

| Key | Context | Action |
|---|---|---|
| `Escape` | Drawer open | `closeDrawer()` (existing behavior preserved) |
| `Tab` | Within drawer | DOM order: status-badge → cancel → close → copy-logs → log-toggle → log-scroll → jump-to-bottom (when visible) → screenshot-button (when visible) |
| `Enter` / `Space` | Any button | Native button activation |

### Color-blind safety

Every state distinction uses both color AND text/symbol:
- RUNNING: pulse dot + word `RUNNING`
- PASSED: `✓` + word `PASSED` + green
- FAILED: `✗` + word `FAILED` + red
- CANCELLED: `■` + word `CANCELLED`
- ERROR: `⚠` + word `ERROR`
- Log lines: symbol prefix when not already present

### Focus ring (Wave 125 canonical)

All interactive elements: `outline: 2px solid #6a8cd6; outline-offset: 1px;`
on `:focus-visible` only. No alpha variants.

### Reduced motion

Every `animation` and `transition` rule has a `@media (prefers-reduced-motion: reduce)`
override (listed in each section above). The RUNNING pulse dot becomes `animation: none;
opacity: 1` — static dot, no flicker.

---

## 18. Interaction-State Inventory

### Run drawer (mode = run)

| State | `#drawer-run-bar` | `#drawer-empty-state` | `#drawer-result-summary` | `#drawer-log-panel` | `#drawer-cancel` | `#drawer-screenshot-bar` |
|---|---|---|---|---|---|---|
| No run (drawer freshly opened) | hidden | visible | hidden | hidden | hidden | hidden |
| PENDING | visible, state-pending | hidden | hidden | visible | visible | hidden |
| RUNNING | visible, state-running | hidden | hidden | visible | visible | hidden (until path found) |
| PASSED | visible, state-passed | hidden | visible | visible | hidden | cond. visible |
| FAILED | visible, state-failed | hidden | visible | visible | hidden | cond. visible |
| CANCELLED | visible, state-cancelled | hidden | visible | visible | hidden | cond. visible |
| ERROR | visible, state-error | hidden | visible | visible | hidden | hidden |

### File drawer (mode = file)

`#drawer-run-bar` hidden. `#drawer-title-row` visible. `#drawer-file-content`
visible. All run-specific elements hidden.

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
| Cancel tooltip | `Send SIGTERM to the running test process (5s grace → SIGKILL)` |
| Close aria-label | `Close drawer (Esc)` |
| Close title | `Close (Esc)` |
| Copy logs — default | `Copy logs` |
| Copy logs — success | `Copied N lines` (N = actual count) |
| Copy logs — failure | `Copy failed` |
| Log toggle — expanded | `▼ Hide` |
| Log toggle — collapsed | `▶ Show` |
| Log panel header | `Logs (N lines)` |
| Log cap notice | `⚠ Log buffer capped at 2 000 lines — earliest lines removed.` |
| Jump-to-bottom | `Jump to bottom ↓` |
| Screenshot — default | `Open screenshot →` |
| Screenshot — path copied | `Path copied` |
| Empty state | `Click ▶ RUN on any test to see live output here.` |
| Result detail — passed | `N passed` |
| Result detail — failed | `N passed, M failed` |
| Result detail — timeout | `Test timed out` |
| Result detail — cancelled | `Run cancelled` |
| Result detail — error | `Connection lost` |
| Result time | `in Ns` |

---

## 20. Implementation Notes for UI Dev

1. **Wave 140 ID contract.** Do not rename: `#drawer-log`, `#drawer-log-cap`,
   `#drawer-cancel`, `#drawer-file-content`, `#drawer-content`. The new structure
   wraps and extends them — it does not replace them.

2. **`setDrawerStatus()` migration.** The function currently targets `#drawer-status`.
   Update it to target `#drawer-status-badge`. Class name mapping:
   `'pending'` → `'state-pending'`, `'run'` → `'state-running'`,
   `'ok'` → `'state-passed'`, `'fail'` → `'state-failed'`.
   Remove the legacy `<span id="drawer-status">` from index.html.

3. **Timer implementation.**
   ```javascript
   let elapsedInterval = null;
   let elapsedSeconds = 0;
   function startElapsedTimer() {
     elapsedSeconds = 0;
     renderElapsed();
     elapsedInterval = setInterval(() => { elapsedSeconds++; renderElapsed(); }, 1000);
   }
   function stopElapsedTimer() { clearInterval(elapsedInterval); elapsedInterval = null; }
   function renderElapsed() {
     const m = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
     const s = String(elapsedSeconds % 60).padStart(2, '0');
     $('#drawer-elapsed').textContent = m + ':' + s;
   }
   ```
   Call `startElapsedTimer()` on SSE `start` event. Call `stopElapsedTimer()` on
   `done`, `timeout`, and `error` events. Reset on `openDrawer()`.

4. **Log line count.** Add to `flushLogBuffer()` after updating `logLineCount`:
   ```javascript
   const countEl = $('#drawer-log-count');
   if (countEl) countEl.textContent = logLineCount;
   ```

5. **Drawer flex layout.** `<aside id="drawer">` must be
   `display: flex; flex-direction: column`. `#drawer-content` must have
   `flex: 1; min-height: 0` to fill remaining height without overflow.

6. **`#drawer-log-panel` visibility.** Show (remove `hidden`) when
   `openDrawer()` fires with mode = `run`, in the existing `if (mode === 'run')`
   branch alongside the existing `#drawer-log` and `#drawer-cancel` unhiding.

7. **No external dependencies.** All CSS in `public/style.css`. No new npm packages.

---

## 21. Out of Scope

- Per-file progress inside vitest runs (structured JSON output required)
- Diff view for failed assertions
- Run history / log persistence beyond current browser session
- Light-mode theme
- Sound or system notification on completion
- Changes to the `▶ RUN` button in the Output tab rows
