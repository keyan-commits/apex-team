# US-064 — MCP Server Restart Banner (AC4 Conditional)

**Status:** ready (AC4 conditional — unneeded if AC2 resolves to AC3 auto-rebind)  
**Issue:** #257  
**Story:** US-064  
**User story:** `requirements/user-stories/US-064-mcp-client-rebind-after-restart.md`

---

## Summary

This spec covers AC4 only: the dashboard **non-blocking dismissible banner** that appears when the MCP server has restarted and the client has not yet re-bound via `/mcp` in Claude Code.

**Condition:** This surface ships ONLY if Architect's AC2 verdict is that the MCP protocol does **not** support automatic client rebind via `notifications/tools/list_changed` or `serverInfo.version` mismatch. If AC2 → AC3 (auto-rebind supported), the banner is unneeded and US-064 ships with no UI surface.

---

## Design

### Copy

```
Server restarted — run `/mcp` in Claude Code to reconnect.
```

**Rationale:** Action-first imperative (verb: "run"). Concise. Mirrors the AC4 acceptance criterion. User context: they already know `/mcp` from setting up apex-team. Tone: informational, not alarmed.

---

### Placement

**Location:** Dismissible banner strip immediately below `OrchestratorBar` (the top bar with workspace field + new-thread button).

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ OrchestratorBar (workspace selector, new-thread button)     │
├─────────────────────────────────────────────────────────────┤
│ ℹ Server restarted — run `/mcp` in Claude Code to reconnect. ✕ │  ← MCP Rebind Banner
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [PO pane (full width)]                                     │
│                                                             │
├──────────────────────┬──────────────────────┬───────────────┤
│ BA pane              │ Architect pane       │ UI Dev pane   │
├──────────────────────┼──────────────────────┼───────────────┤
│ Backend Dev pane     │ QA pane              │ DevSecOps pane│
├──────────────────────┴──────────────────────┴───────────────┤
│ Unused row (1 of 7 roles, 3 cols)                           │
└─────────────────────────────────────────────────────────────┘
```

**Dimensions:**
- Full dashboard width (100vw bounded by dashboard container).
- Height: 40px (matches typical banner height).
- Left border: 3px solid `--accent-info` (blue, info tone).
- Background: `--surface-1` or `--surface-2` (matches poll-error banner from design notes #22).
- Padding: 8px 12px (content start at the left edge, 12px left margin for visual breathing room after border).

**X-button placement:** Right side of the banner, 12px from the right edge. Centered vertically.

**Non-blocking mandate:** The banner is rendered as a separate row above the panes, not an overlay or modal. Panes are fully interactive while the banner is visible.

---

### Interaction States

#### 1. **Default (Hidden)**

No banner visible. Dashboard renders normally (OrchestratorBar → PO pane → 3+3+1 grid).

**Condition:** 
- Server `startedAt` (from `/api/health`) is NOT newer than the client's stored `lastKnownServerStart`.
- AND `lastKnownServerStart` is not null (page has loaded at least once).

---

#### 2. **Visible**

Banner appears immediately below `OrchestratorBar`.

**Condition:**
- `/api/health.startedAt` (server startup Unix timestamp, milliseconds) is **newer** than the stored `lastKnownServerStart` in localStorage.
- AND either `dismissedServerStart` is null or `dismissedServerStart < /api/health.startedAt` (banner was dismissed for a previous restart, so show it again for the new restart).

**Rendering:**
```
┌─────────────────────────────────────────────────────────┐
│ ℹ  Server restarted — run `/mcp` in Claude Code to      ✕ │
│     reconnect.                                           │
└─────────────────────────────────────────────────────────┘
```

- Icon: circle-info SVG or plain `ℹ` character, `--text-dim` color, 16px size, 8px right margin.
- Text: `--text-dim` color (same as poll-error banner #22), sentence case, no bold.
- X-button: `--text-dim` color on hover → `--text` (higher contrast), cursor pointer, 20px × 20px, `aria-label="Dismiss"`.

**Detection mechanism (on page load or SSE reconnect):**
1. On `OrchestratorBar` mount (first page render), fetch `/api/health`.
2. Read `startedAt` (server timestamp).
3. Read `lastKnownServerStart` from localStorage.
4. If `startedAt > lastKnownServerStart` (or `lastKnownServerStart` is null), set `showBanner = true`.
5. Store current `startedAt` in localStorage as `lastKnownServerStart` for next page load.
6. Re-check on every SSE reconnect (use the same logic to handle a server restart that occurs while the dashboard is open).

---

#### 3. **Dismissed**

User clicks the X button or presses Escape (global Escape handler, or tabbing focus into the X-button and pressing Space/Enter).

**Behavior:**
1. Banner fades out (150ms `opacity` transition, `ease-out`).
2. Store current `startedAt` in localStorage as `dismissedServerStart`.
3. `showBanner` state → `false`.
4. Banner does **NOT** reappear until the next server restart (`/api/health.startedAt > dismissedServerStart`).

**Persistance:** `dismissedServerStart` in localStorage persists across page reloads within the same session. On the next server restart, `dismissedServerStart` is no longer relevant (new `startedAt` is newer), so the banner re-appears.

---

#### 4. **Keyboard Interaction**

**Global Escape handler:**
- When banner is visible and focused (or at any time), pressing Escape dismisses the banner (same effect as clicking X).

**Focus:**
- X-button is tabbable (`tabIndex={0}`).
- On X-button focus, visible focus ring (`:focus-visible` with `outline: 2px solid var(--accent-focus)`).
- On X-button press (Space or Enter), dismiss the banner.

**Space/Enter parity (per prior a11y work):**
- Both Space and Enter trigger the X-button dismiss action.
- No special handling needed — standard `<button>` element behavior.

---

### A11y / Semantics

**HTML structure:**
```jsx
<div
  role="status"
  aria-live="polite"
  aria-label="Server restart notification"
  className="mcp-rebind-banner"
>
  <span className="mcp-rebind-banner-icon">ℹ</span>
  <span className="mcp-rebind-banner-text">
    Server restarted — run `/mcp` in Claude Code to reconnect.
  </span>
  <button
    onClick={handleDismiss}
    aria-label="Dismiss notification"
    className="mcp-rebind-banner-close"
  >
    ✕
  </button>
</div>
```

**Notes:**
- `role="status"` implicitly sets `aria-live="polite"` (updates announced when the banner appears, but don't interrupt the user).
- `aria-label` on the container provides context for screen readers (not announced every time, but available for inspection).
- `aria-label` on the X-button clarifies its purpose (not just "button").
- No `aria-hidden` on the icon or text — they are part of the message and should be read aloud.

---

## Visual Tone

**Severity:** Info (routine event, not an error or warning).

**Color palette:**
- Left border: `--accent-info` (blue, typically `#0066cc` or project equivalent).
- Background: `--surface-1` (same as other UI surfaces; matches poll-error banner from #22).
- Text: `--text-dim` (secondary text color, ~70% opacity of `--text`).
- Icon + X button: `--text-dim` by default; X button → `--text` on hover.

**Icon:**
- Optional circle-info SVG (16px × 16px) or text character `ℹ`.
- If SVG: `stroke-width: 2`, rounded corners, no fill.
- If character: plain `ℹ` in the active font, no styling.

**No animation on appearance** (banner doesn't slide in or fade in; appears instantly). This signals a routine, non-critical status update.

---

## CSS + Responsive Behavior

### Desktop (≥1100px)

Banner full width below `OrchestratorBar`, 40px height, left border 3px, left padding 12px.

### Tablet (768px–1100px)

Same layout. If the dashboard width shrinks, banner shrinks with it (flexbox, no min-width override).

### Mobile (<768px)

**Option A (recommended):** Banner remains full-width below `OrchestratorBar`, text wraps to 2 lines if needed.
```
┌──────────────────────────┐
│ ℹ Server restarted —      ✕ │
│   run `/mcp` in Claude   │
│   Code to reconnect.     │
└──────────────────────────┘
```

Adjusted height: auto, min-height 40px, max-height 80px to cap wrapping. X-button positioned at top-right corner, stays 40px tall.

**Option B (hide on mobile):** If space is critical, banner only shows on ≥768px. On mobile, the user can still run `/mcp` manually — they'll realize the tools are missing when they try to use apex-team.

**Recommendation:** Option A. The banner is critical information on all device sizes, and the wrap is acceptable given the short text.

---

## Implementation Notes (for UI Developer)

### Detection API Contract

Backend must expose via `/api/health`:
```json
{
  "status": "ok",
  "startedAt": 1717424400000,  // Unix timestamp in milliseconds
  "workspace": "..."
}
```

- `startedAt` is set once at server startup (captured in the HTTP server initialization in `server.ts` or the health route).
- `startedAt` remains stable for the lifetime of the server process; it is **not** bumped on code reload or MCP restart within the same process.
- If the server process is killed and restarted, `startedAt` increases (new Date.now() at startup).

### Client-side Implementation Pattern

1. **On component mount (`useEffect`):**
   ```jsx
   const [showBanner, setShowBanner] = useState(false);

   useEffect(() => {
     const checkHealth = async () => {
       const health = await fetch('/api/health').then(r => r.json());
       const lastKnown = localStorage.getItem('lastKnownServerStart');
       const dismissed = localStorage.getItem('dismissedServerStart');

       if (health.startedAt > (dismissed || 0) && health.startedAt > (lastKnown || 0)) {
         setShowBanner(true);
       }
       localStorage.setItem('lastKnownServerStart', health.startedAt);
     };
     checkHealth();
   }, []);
   ```

2. **On banner dismiss:**
   ```jsx
   const handleDismiss = () => {
     localStorage.setItem('dismissedServerStart', lastKnownServerStart);
     setShowBanner(false);
   };
   ```

3. **On SSE reconnect (existing SSE client):**
   - Trigger the same health check logic whenever SSE reconnects (existing `onError` / `onClose` handlers in the SSE client).
   - This ensures the banner re-appears if the server has restarted while the page was open.

---

## Status & Next Steps

**AC4 Condition:** This spec is active only if Architect's AC2 verdict is **not supported** (auto-rebind unavailable).

**If AC2 → AC3 (auto-rebind supported):**
- This spec is archived (not shipped).
- US-064 implementation skips AC4 entirely.
- Banner code is **not** written.

**If AC2 → AC4 (not supported):**
- UI Developer implements against this spec.
- Backend Developer ensures `/api/health` includes `startedAt`.
- UI Developer opens a HANDOFF to UX Designer when implementation is ready (for the standard UX verification gate on the resulting PR).

---

**UX Designer · 2026-06-03**
