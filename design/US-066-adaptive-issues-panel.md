# US-066 — Adaptive Issues Panel Design Spec

**Status:** `ready` | **Wave:** 66 | **Designer:** UX | **Issue:** #144

---

## Overview

The adaptive Issues panel displays the GitHub backlog on the dashboard with severity-based filtering and wave-assignment hints. This panel is density-aware and responsive across all three breakpoints.

**Current dashboard structure:**
- PO pane: full-width top
- 6 peer panes: 3-column grid below

---

## Layout

### Desktop (≥1280px)

**Position:** right-side rail, adjacent to the 3-column peer grid.

```
┌─────────────────────────────────────────────────────────────────┐
│                      OrchestratorBar                             │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│                       PO Pane (full-width)                      │
└─────────────────────────────────────────────────────────────────┘
┌────────────────────┬────────────────────┬────────────────────┬──────────────────┐
│   Agent Pane 1     │   Agent Pane 2     │   Agent Pane 3     │  Issues Panel     │
│  (flex: 1)         │  (flex: 1)         │  (flex: 1)         │  (flex: 0 0 280px)│
├────────────────────┼────────────────────┼────────────────────┤                  │
│   Agent Pane 4     │   Agent Pane 5     │   Agent Pane 6     │  Issues Panel     │
│  (flex: 1)         │  (flex: 1)         │  (flex: 1)         │  (continues)      │
└────────────────────┴────────────────────┴────────────────────┴──────────────────┘
```

**Rail spec:**
- Width: 280px (fixed)
- Max-height: viewport height - OrchestratorBar (60px) - PO pane (180px) ≈ 300px (with overflow scroll internal)
- Padding: 12px
- Border-left: 1px solid `--border-dim`
- Background: `--surface-0` (subtle distinction from peer panes)
- Position: sticky top (scrolls with page, not with individual peer panes)

### Tablet landscape (768px–1279px)

**Position:** full-width strip below PO pane, above peer grid.

```
┌─────────────────────────────────────────┐
│         OrchestratorBar                 │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│          PO Pane (full-width)           │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│      Issues Panel (full-width, collapsed)
│  [Issues ▼] · [All severity levels]     │
│  · Backlog: 24 | In-flight: 3           │
└─────────────────────────────────────────┘
┌────────────────────┬────────────────────┬────────────────────┐
│   Agent Pane 1     │   Agent Pane 2     │   Agent Pane 3     │
└────────────────────┴────────────────────┴────────────────────┘
┌────────────────────┬────────────────────┬────────────────────┐
│   Agent Pane 4     │   Agent Pane 5     │   Agent Pane 6     │
└────────────────────┴────────────────────┴────────────────────┘
```

**Strip spec:**
- Full-width (no rail)
- Height: 44px (header bar) + dynamic-height collapsed summary OR 200px max-height when expanded
- Collapsed state: shows filter bar only, single-line summary (count badges)
- Expanded state: shows full issue list with scroll
- Toggle: click the header to expand/collapse

### Mobile (<768px)

**Position:** collapsible panel, accessible via "Issues" button in OrchestratorBar or as a fixed bottom drawer.

```
┌──────────────────────────┐
│   OrchestratorBar        │
│ [PO] [Wave] [+Issues  ▼] │  ← Issues button in bar
└──────────────────────────┘
┌──────────────────────────┐
│    PO Pane (full-width)  │
└──────────────────────────┘
┌──────────────────────────┐
│  Peer 1  │  Peer 2       │
├──────────┼───────────────┤
│  Peer 3  │  Peer 4       │
├──────────┼───────────────┤
│  Peer 5  │  Peer 6       │
└──────────┴───────────────┘
```

**Drawer spec:**
- Bottom-sheet drawer, 50% viewport height when open
- Dismiss: click outside, Escape key, or swipe down (native gesture)
- Header: "Issues" (Title Case) with close button (×)
- Content scrolls internally; drawer height fixed
- No transition during open/close — snap to visible/hidden (avoid reflow)

---

## Issue Row Rendering

Each issue row displays: **# · Title · [Severity Chip] · [Wave Pill (optional)] · [Assignee Chip (optional)]**

### Row Layout (Desktop / Tablet expanded)

```
┌─ US #144 — Adaptive issues panel design
│  [critical] · Wave 66 · @ui-developer
│  
│  Row divider
└─
```

**Columns (flex layout, left-to-right):**

1. **Issue ID** (4–8 ch): `US #144` · Monospace · `--text-muted` · Click opens GH issue in new tab
2. **Title** (remaining space): sentence case · `--text-primary` · Ellipsis if >50 ch
3. **Severity Chip** (flex: 0 0 auto): Label + color · 6px padding · border-radius 3px · 0.75rem font
4. **Wave Pill** (flex: 0 0 auto, optional): `Wave 66` · `--accent-architect` · border-radius 12px · 6px padding · only if issue is referenced by an in-flight wave (check via Architect's `inFlightWaves` list)
5. **Assignee Chip** (flex: 0 0 auto, optional): `@ui-developer` or `@qa` · role-specific accent color · border-radius 12px · only if Wave 51 auto-assign has claimed it

**Row height:** 40px (3 lines: ID+title on line 1, chips on line 2, divider space line 3)

**Row divider:** 1px border-bottom between rows · color `--border-dim`

### Severity Chip Color Hierarchy

All chips use the same 6px padding, 3px border-radius, 0.75rem font-weight 500 (semibold).

| Severity | Background | Text | Justification |
|---|---|---|---|
| **blocker** | `--accent-error` (#EF4444) | white | hard stop; highest urgency |
| **critical** | `--accent-critical` (#F97316) | white | release-blocking; high visibility |
| **high** | `--accent-warning` (#FBBF24) | `--text-primary` | important but not blocking |
| **medium** | `--accent-info` (#0EA5E9) | white | addressable this quarter |
| **low** | `--surface-2` | `--text-muted` | nice-to-have; defer without impact |
| **nit** | `--surface-1` | `--text-muted` | polish; changelog only |

Source for color values: existing `globals.css` token names; ensure these exist or use CSS custom properties.

### Wave Pill (optional)

**Condition:** show only if the issue is in `Architect.inFlightWaves` list (hardcoded or fetched from `/api/wave-state`).

**Style:**
- Background: `--accent-architect` (teal, role-specific)
- Text: white · 0.75rem
- Border-radius: 12px
- Padding: 4px 8px
- Separator dot before pill: `·` in `--text-muted`

**Content:** `Wave 66` (matches the wave number from Architect's design note)

### Assignee Chip (optional)

**Condition:** show only if Wave 51 auto-assign logic has claimed the issue (persisted in DB as `pr_assignee` field or similar).

**Style:**
- Background: role-specific accent color (same as the assigned peer's accent; e.g., `--accent-ui-developer` = blue)
- Text: white · 0.75rem
- Border-radius: 12px
- Padding: 4px 8px
- Separator dot before chip: `·` in `--text-muted`

**Content:** `@ui-developer` or `@qa` (short role name, not full name)

---

## Interactive States

### Hover (all breakpoints when possible)

**Row hover:**
- Background: `--surface-1` (subtle lift)
- Title text: `--text-link-hover` (if a link state exists; otherwise `--text-primary` bold)
- Cursor: `pointer`
- Transition: 100ms ease-in-out

**Title click:**
- Open the GitHub issue URL in a new tab (external link; user workflow)
- No navigation within the dashboard

### Focus (keyboard navigation)

**Focus ring on issue row:**
- Outline: 2px solid `--accent-focus` (default focus ring)
- Offset: 2px
- Border-radius: 3px (match row container, not individual cells)

**Tab order:**
- All issue rows are focusable
- Default tab order from DOM (flex-row order)
- Shift+Tab reverses

### Filter Chips (when implemented)

**Appearance (Desktop/Tablet expanded):**
Horizontal pill row above the issue list.

```
┌─ [All ×] [Blocker ×] [Wave 66 ×] [Unassigned ×]
```

**Filters (multi-select, AND logic by default):**
- Severity (checkboxes): All, Blocker, Critical, High, Medium, Low, Nit (radio or checkbox? **recommend checkbox** — allow multiple severity levels)
- Status: In-flight (Wave X), Backlog, Unassigned
- Custom: TBD per Architect's design

**Chip interaction:**
- Click to toggle filter on/off
- Active filter: solid background `--accent-architect`, white text
- Inactive filter: `--surface-2` background, `--text-muted` text
- Hover: background lightens 1 stop (use CSS `:hover`)
- × button on active filters to quick-reset that filter

---

## Empty State

**Condition:** shown when `backlog.length === 0` AND `inFlightWaves.length === 0` AND `peerInboxes.reduce((sum, inbox) => sum + inbox.length, 0) === 0` (all idle).

**Copy:**

```
Backlog empty — Wave 71 auto-continue is the only signal source.
```

**Style:**
- Centered text · `--text-muted` · 0.875rem
- Icon: optional, centered above copy — use ✓ or 🟢 glyph (keep it light)
- Vertical padding: 24px (visual breathing room)
- Horizontal padding: 12px

**A11y:** `role="status" aria-live="polite"` — screen reader announces when backlog becomes empty.

---

## Density & Scrolling

**Max-height on Desktop rail:** 300px
- Internal scroll if issue list exceeds height
- Scroll track: `--scrollbar-track` (standard appearance)
- Custom scrollbar thumb if design system permits

**Max-height on Tablet expanded:** 200px
- Internal scroll for list items
- Header remains sticky (filter row does not scroll away)

**No page scroll for this panel** — scrolling stays within the rail/strip container.

---

## Accessibility (a11y)

### Semantic HTML

- Panel root: `<section role="complementary" aria-label="GitHub backlog issues">`
- Issue list: `<ul role="list">` (or `<div role="list">` if using flex grid)
- Each issue row: `<li role="listitem">` or `<article role="article" aria-labelledby="issue-title-NNN">`
- Issue title: `<a id="issue-title-NNN" href="https://github.com/…">` (clickable link)

### Keyboard Navigation

- **Tab through all issues:** each row is a focusable element (tabindex="0" if not a button/link, or wrap in `<button role="link">`)
- **Enter on focused issue:** open the GitHub link (same as click)
- **Escape in drawer (mobile):** close the drawer
- **Arrow up/down:** navigate between rows (optional enhancement; MVP can skip)

### ARIA Labels

- Panel header: `<h2 id="issues-panel-title">Issues</h2>` + `aria-labelledby="issues-panel-title"` on the panel root
- Severity chip: `<span aria-label="Critical severity">` (for screen readers to understand the semantic meaning)
- Empty state: `<div role="status" aria-live="polite">` — announce when the backlog clears
- Issue count badge: `aria-label="24 backlog issues"` (if a separate count widget exists)

### Screen Reader Announcement

When an issue is focused:
- Issue ID + title (auto, from link text)
- Severity label (if available via aria-label)
- Wave assignment, if present
- Assignee, if present

Example: *"Issue #144, Adaptive issues panel design, critical severity, Wave 66, assigned to UI Developer"*

---

## Responsive Behavior Summary

| Breakpoint | Render | Scroll | Max-height | Toggle |
|---|---|---|---|---|
| ≥1280px | Rail (280px) | Internal | 300px | Always visible |
| 768–1279px | Strip (full-width) | Internal | 200px | Collapsed header; click to expand |
| <768px | Bottom drawer | Internal | 50vh | Drawer toggle in OrchestratorBar; Escape/outside-click to close |

---

## Implementation Notes for UI Dev

1. **Data source:** fetch from `/api/issues` or extend `/api/wave-state` to include a `backlog` array.
2. **Issue object shape:** `{ id: number, title: string, severity: string, waveRef?: string, assignee?: string, url: string, labels: string[] }`
3. **Severity values:** use the exact strings: `"blocker" | "critical" | "high" | "medium" | "low" | "nit"`
4. **Wave reference:** compare issue labels (e.g., `"Wave 66"`) against the active `Architect.inFlightWaves` list to decide whether to show the pill.
5. **Assignee:** check Wave 51 auto-assign database for the issue ID; fallback to GitHub's `assignee` field if not yet backfilled.
6. **Color tokens:** ensure all referenced tokens (`--accent-error`, `--accent-critical`, etc.) exist in `globals.css`. If missing, define them or request from Design.
7. **Escape key handling:** wire into the global escape handler so it closes the mobile drawer and any expanded desktop elements consistently.

---

## Open Design Questions for BA Consultation (Wave 70)

- **Peer-idle hints in the panel:** should the panel render a "Idle peers: <list>" row showing which roles are currently unassigned? (Default: YES, in-panel for transparency; show below the backlog count.)
- **Severity filter defaults:** should the panel default to showing ALL severity levels, or hide "nit" by default? (Default: show all; let the user filter if desired.)
- **Wave assignment visibility:** if an issue is referenced in a Wave that is NOT in-flight (e.g., Wave 70 is queued but not active), should the Wave pill still render? (Default: YES, show it — helps users understand future dependencies.)

---

_UX Designer · Wave 66 · 2026-06-01_
