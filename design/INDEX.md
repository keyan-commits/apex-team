# Design Index

UX Designer owns this directory. Every spec file is listed here with its linked issue, status, and current owner.

| File | Issue | Status | Notes |
|---|---|---|---|
| [US-003-workspace-scoped-issues.md](US-003-workspace-scoped-issues.md) | US-003 | reviewed | Post-hoc spec (Wave 11a dispatch dropped). 2 warns filed: attribution prefix redundancy + empty-state copy conflation. |

---

## Design notes — top-3 open UX issues

These are 1-paragraph spec starters for the highest-priority open UX issues. Full spec files will be added when PO schedules implementation.

---

### Issue #22 — Dashboard poll errors swallowed silently

**What:** The `/api/team-status` poll loop catches all errors with `catch(() => {})`. When the server is down or restarting, all 9 dashboard panels appear frozen (or "Loading…" forever) with no user-visible signal. The user cannot tell whether the team is idle or the dashboard is broken.

**Design spec note:** Add a single-line banner that appears directly below `OrchestratorBar` when a poll fails, auto-hides on the next successful response. No modal, no overlay — inline, non-blocking. Copy: `⚠ Dashboard unreachable — data may be stale. Retrying…` Use `--text-dim` for the text and a left border in `--accent-po` (orange = warning, not red = hard error — this is a recoverable transient state in a local dev tool). Append a dim `· last updated Xs ago` timestamp to the right of the message so the user knows how stale the data is. No retry button needed — the 10s poll retries automatically. The banner disappears without animation when data resumes.

**States to spec:**
- **default:** no banner visible
- **error:** banner visible, left-border orange, message above
- **recovering (first successful response after error):** banner disappears instantly (no fade — avoid visual noise on recovery)

---

### Issue #24 — Error status pill truncated at 120px

**What:** The AgentPane `.pill` truncates at 120px. When a role errors, the visible text is `error: HTTP 5…` with no expand path. Users cannot read the full error without opening DevTools.

**Design spec note (two-tier):**

Tier 1 (hover tooltip, one-liner): Add `title={pillLabel}` to the pill `<span>`. On hover, the browser native tooltip shows the full error text. Zero layout change, zero new state.

Tier 2 (click-to-expand, for when full error needs to be readable): When `pillState === "error"`, clicking the pill toggles an inline error detail block directly below the pane header bar (above the message thread). The block is styled to match the `/dashboard` DONE-row detail blocks: left border in the role's accent color, `font-size: 0.75rem`, monospace font for the error body. The block header reads `Agent error — last turn` (Title Case). Below: the full raw error string, wrapping freely. Dismissed by Escape or clicking anywhere outside the block. The pill itself gets `cursor: pointer` when in error state.

**States to spec:**
- **default (non-error pill):** no changes
- **pill:hover (any state):** native browser tooltip via `title` attribute
- **pill: error, not expanded:** pill shows truncated text + `cursor: pointer`
- **pill: error, expanded:** error detail block visible below header; pill background shifts to `var(--surface-2)` to indicate it's "open"
- **pill: error, expanded + Escape/outside-click:** block closes, pill returns to default error style

---

### Issue #21 — QUEUED panel drag-and-drop has no keyboard alternative

**What:** The QUEUED panel's drag-and-drop reorder is mouse-only. Keyboard users can Tab to a row, expand/collapse it with Enter/Space, but cannot reprioritize — the panel's stated primary purpose.

**Design spec note:** When a QUEUED row is focused, `↑`/`↓` arrow keys move it in `savedOrder` (the same localStorage array that DnD writes). The existing Enter/Space expand toggle must NOT be overridden — arrow keys are ADDED to the `onKeyDown` handler, not replacing existing bindings.

Visual feedback on keyboard move: row's background flashes to `var(--surface-2)` for 200ms (CSS transition) to confirm movement. Focus stays on the moved row (do not blur or jump).

Accessibility: add a visually-hidden `aria-live="polite"` region (position off-screen via `clip` not `display:none`) that announces `"Moved to position N of M"` after each arrow-key move. This lets screen reader users orient themselves without requiring them to navigate away and recount.

**States to spec (for the `onKeyDown` handler):**
- **ArrowUp on row 0 (top):** no-op (don't wrap)
- **ArrowUp on row N>0:** swap with row N-1; maintain focus on the moved row; announce new position
- **ArrowDown on last row:** no-op
- **ArrowDown on row N<last:** swap with row N+1; maintain focus; announce new position
- **Enter/Space:** toggle expand (unchanged from current behavior)
- **All other keys:** default browser behavior

---

_UX Designer · 2026-05-31_
