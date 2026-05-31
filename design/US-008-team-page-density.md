# US-008 — Team page density redesign

**Status:** ready  
**User story:** User feedback Wave 28 — "Still too much information and UI/UX can be improved"  
**Linked issue:** #43 (tracked in GitHub)  
**Spec author:** UX Designer  
**Date:** 2026-05-31

---

## 1. Diagnosis — root causes

Reading `AgentPane.tsx`, `AgentStatePanel.tsx`, `MessageBubble.tsx`, and `page.tsx` reveals three independent density problems, each with a concrete fix.

### 1a. Pane has no height cap (primary — BLOCK)

`.pane` in `AgentPane.tsx` is a flex column with `min-height: 0` but **no `max-height`**. The `.messages` area is `flex: 1; overflow-y: auto` — scroll is there but the pane itself grows to its natural content height. The CSS grid in `page.tsx` uses `grid-template-columns: repeat(3, minmax(0, 1fr))` with no `grid-auto-rows` or height constraint.

**Effect:** one active pane with 20+ messages towers over six idle panes. The user must scroll the page to see other roles. On a standard 1080px viewport, a single streaming pane can push everything below the fold.

### 1b. HANDOFF doc body has no height cap (secondary — WARN)

`AgentStatePanel.tsx` `.body` has `padding: 4px 14px 12px` and renders full markdown. A typical HANDOFF doc is 80–200 lines. When the user opens it, the pane height doubles or triples. No `max-height` or `overflow-y: auto` on `.body`.

### 1c. MessageBubble collapse threshold is too permissive (tertiary — WARN)

`COLLAPSE_CHARS = 400`, `COLLAPSE_LINES = 6`. Six visible lines before "Show more" is appropriate for a conversational UI; it is too much for a monitoring/log-stream view. An agent reply with a multi-step plan shows six lines (~1200px of content) before collapsing — adding 200–300px of height to the pane.

---

## 2. What does NOT need fixing

- **ActivityLog** — already a compact 28px horizontal bar. No change.
- **AgentPane folded state** — already a 40px compact bar. No change.
- **AgentStatePanel toggle** — defaults to `open=false`. HANDOFF doc is hidden by default. No change to default behavior.
- **Grid column structure** — 3+3+1 layout is appropriate. Responsive breakpoints are correct.
- **Auto-fold after 60s idle** — correct behavior. Keep.
- **Auto-expand on `busy`** — correct behavior. Keep.

---

## 3. Proposed changes — complete spec

### 3a. Per-pane max-height with internal scroll

**Recommendation: fixed viewport-relative max-height on each expanded `.pane`.**

Two options evaluated:

| Option | Approach | Verdict |
|---|---|---|
| A (recommended) | `max-height: min(560px, 65vh)` per pane | ✅ Idle panes stay short; busy pane scrolls internally |
| B | `grid-auto-rows` equalization | ✗ Forces idle panes to match busy pane height — wastes space |

**Spec:**

- Team pane (expanded): `max-height: min(560px, 65vh)`
- PO pane (full-width, expanded): `max-height: min(420px, 48vh)`
- Pane folded state: `min-height: 0` (unchanged, 40px bar)

At 560px, the internal layout is approximately:
```
┌──────────────────────────────────────────┐  ← max-height: 560px
│ header-row     [pill] Role Title  [▲]    │  ~40px
│ task-bar    last task text…              │  ~22px
├──────────────────────────────────────────┤
│ ▸ HANDOFF  · updated 14:32              │  ~36px (closed)
├──────────────────────────────────────────┤
│ ┌──────────────────────────────────────┐ │
│ │  You (user)                          │ │  \
│ │  send a message to this role…        │ │   \
│ └──────────────────────────────────────┘ │    ~360px
│ ┌──────────────────────────────────────┐ │    overflow-y: auto
│ │  Business Analyst (you)              │ │   /
│ │  I've reviewed the requirements and  │ │  /
│ │  Show more (+24 lines) ▾             │ │
│ └──────────────────────────────────────┘ │
├──────────────────────────────────────────┤
│ [Process inbox (3)]                      │  ~30px (if inbox > 0)
│ ┌───────────────────────────────────┐[→] │  ~102px
│ │ Message Business Analyst…  (2 rows)│   │
│ └───────────────────────────────────┘   │
└──────────────────────────────────────────┘
```

**Breakpoint behavior (from existing breakpoints):**
- `>1100px`: 3-column grid, each pane `max-height: min(560px, 65vh)`
- `768px–1100px`: 2-column grid, same max-height
- `<768px`: 1-column grid, `max-height: min(480px, 60vh)`

### 3b. HANDOFF doc body height cap

When `.state-panel` is open, the `.body` div gets:
- `max-height: 220px`
- `overflow-y: auto`

This keeps the HANDOFF doc readable while preventing it from blowing up the pane. The Edit textarea is exempt (editor should show the full doc for editing; limit to 12 rows via the existing `Math.min(12, …)` logic, unchanged).

**States:**

| State | Behavior |
|---|---|
| `open=false` (default) | Toggle bar only, 36px |
| `open=true`, doc ≤ ~15 lines | Full doc visible, no scroll |
| `open=true`, doc > ~15 lines | Scrolls at 220px; gradient fade at bottom edge (same `bubble-fade` pattern) |
| editing mode | Textarea grows as-is (up to 12 rows); no max-height override |

ASCII — open + long doc:
```
┌──────────────────────────────────────────┐
│ ▾ HANDOFF  · updated 14:32   [inbox 2]  │  ← toggle
├──────────────────────────────────────────┤
│ ## ⏭️ NOW — 2026-05-31                   │  \
│                                          │   \
│ Wave 28 - UX density spec in progress…  │    220px max
│                                          │   /  overflow-y: auto
│ **Awaiting:** QA PASS on feature/28a    │  /
│ ~~~~~~~~~~~~~~~~~~~~~~~~~~~ [fade]       │  ← gradient fade at bottom
├──────────────────────────────────────────┤
│                [Edit]                    │
└──────────────────────────────────────────┘
```

### 3c. MessageBubble collapse thresholds

**Change:**
- `COLLAPSE_CHARS`: `400` → `200`
- `COLLAPSE_LINES`: `6` → `3`

**Rationale:** This is a monitoring view, not a conversation. The user wants to see at a glance that a role completed a task, not read the whole reply. Full content is one click away. 3 lines (~120-180px per message) keeps the pane scannable.

**Copy (unchanged):** "Show more (+N lines) ▾" / "Collapse ▴" — already correct.

**Impact on streaming (pending draft):** The `pending` prop renders the in-flight streaming draft without collapse — this is correct and stays unchanged. Only committed messages collapse.

### 3d. Composer textarea height

**Change:** `rows={isPO ? 2 : 3}` → `rows={isPO ? 2 : 2}`

Team pane textarea: 3 rows → 2 rows. Saves ~20px per expanded pane. Small but adds up across 7 panes.

PO pane textarea: 2 rows — unchanged (PO writes longer orchestration prompts).

---

## 4. Interaction state inventory

### 4a. AgentPane — all states

| State | Default visible content |
|---|---|
| **folded (idle, 60s+ timeout)** | 40px bar: pill · role title · inbox badge (if >0) · expand ▼ |
| **folded (busy)** | Auto-unfolds via existing `if (busy) setFolded(false)` |
| **expanded, idle, no messages** | Header + HANDOFF toggle (closed) + empty state text + composer |
| **expanded, idle, N messages** | Header + HANDOFF toggle + messages (max-height, scrolls) + composer |
| **expanded, busy/streaming** | Same as above; streaming draft at bottom; elapsed timer in header |
| **expanded, error** | Pill shows error state; click-to-expand error detail (existing) |
| **expanded, HANDOFF open** | HANDOFF body (max 220px, scroll) visible between header and messages |
| **focus on fold/unfold button** | `:focus-visible` outline (existing from Wave 25) |

### 4b. Pane grid at different viewports

```
>1100px                  768px–1100px             <768px
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   Product Owner  │    │   Product Owner  │    │   Product Owner  │
│   (full-width)   │    │   (full-width)   │    │   (full-width)   │
└──────────────────┘    └──────────────────┘    └──────────────────┘
┌──────┐┌──────┐┌──────┐ ┌────────┐┌────────┐ ┌──────────────────┐
│  BA  ││  Arc ││  UI  │ │  BA    ││  Arc   │ │  Business Analyst│
└──────┘└──────┘└──────┘ └────────┘└────────┘ └──────────────────┘
┌──────┐┌──────┐┌──────┐ ┌────────┐┌────────┐ ┌──────────────────┐
│  BE  ││  QA  ││  Ops │ │  UI    ││  BE    │ │  Architect       │
└──────┘└──────┘└──────┘ └────────┘└────────┘ └──────────────────┘
┌──────────────────────┐ ┌────────┐┌────────┐ … (stacked, 1-col)
│  UX Designer         │ │  QA    ││  Ops   │
└──────────────────────┘ └────────┘└────────┘
                         ┌────────┐┌────────┐
                         │  UXD   ││        │
                         └────────┘└────────┘
```

Each pane independently capped at `min(560px, 65vh)`. Idle panes are short; busy pane scrolls internally.

### 4c. Streaming pane — density control

```
Before fix:                        After fix:
┌────────────────┐                 ┌────────────────┐ ←max: 560px
│ DevSecOps      │                 │ DevSecOps      │
├────────────────┤                 ├────────────────┤
│ ▸ HANDOFF      │                 │ ▸ HANDOFF      │
├────────────────┤                 ├────────────────┤
│ Reading issue… │                 │ Reading issue… │  \
│ Creating …     │                 │ Creating …     │   |
│ ...            │                 │ ...            │   | scrolls
│ (pane height   │                 │ ...            │   | internally
│  grows to      │                 │ [scroll ↓]     │   |
│  push all      │                 ├────────────────┤   |
│  other roles   │                 │ streaming draft│  /
│  below fold)   │                 ├────────────────┤
│                │                 │ [composer]     │
│ streaming…     │                 └────────────────┘
├────────────────┤
│ [composer]     │                 Adjacent panes stay at their
└────────────────┘                 natural (short) height.
```

### 4d. Motion

- Pane expand/collapse (fold ▲/▼): 150ms ease-out (existing behavior — unchanged)
- HANDOFF body expand/collapse: 150ms ease-out
- Max-height constraint: no animation — scrollbar appears/disappears instantly
- `@media (prefers-reduced-motion: reduce)`: remove all transitions (add to existing reduced-motion block in the pane styles)

---

## 5. Copy changes

No copy changes required for this spec. All labels, empty states, and button text remain as-is.

---

## 6. Accessibility

- Max-height + internal scroll: screen readers navigate the message list normally; `overflow-y: auto` does not break AT traversal.
- HANDOFF doc scrollable region: add `tabIndex={0}` to the `.body` div so keyboard users can focus it and scroll with arrow keys when content overflows 220px.
- Streaming draft (`pending` prop): already rendered without collapse — AT hears the live region updates as before.

---

## 7. Design decisions — WHY

| Decision | Rationale |
|---|---|
| `max-height: min(560px, 65vh)` not `grid-auto-rows` | Grid equalization would force idle panes to match busy pane height — wastes vertical space for the majority of panes that are idle |
| 560px not viewport-fill | Team panes should feel like cards, not full-pane views. 560px shows ~5 messages + composer without overwhelming; the dashboard's job is monitoring, not reading |
| Collapse at 3 lines/200 chars not 1 line | 1-line collapse hides too much context at a glance. 3 lines lets the user see the opening of a response before "Show more" |
| Keep HANDOFF default-closed | Already correct. Opening it is an explicit user action; the HANDOFF doc is secondary to the message stream |
| PO pane max-height 420px | PO is full-width and typically shorter (orchestration messages, not implementation narratives). Smaller cap keeps the team grid accessible without scrolling past PO |

---

## 8. Out of scope (defer)

- Provider/model dropdowns hidden behind a gear icon (lower priority — this is a config affordance, not a density problem)
- Per-role keyboard shortcuts for expand/collapse (nice-to-have, not blocking)
- Message search / filter (separate feature)
- Dashboard split-view (separate feature)

---

## 9. Files to change (implementation reference for UI Dev)

| File | Change |
|---|---|
| `src/components/AgentPane.tsx` | Add `max-height: min(560px, 65vh)` to `.pane` in expanded state; `max-height: min(420px, 48vh)` passed from `page.tsx` for PO; `rows={2}` for team pane textarea |
| `src/components/AgentStatePanel.tsx` | Add `max-height: 220px; overflow-y: auto;` to `.body`; gradient fade at bottom |
| `src/components/MessageBubble.tsx` | `COLLAPSE_CHARS = 200`, `COLLAPSE_LINES = 3` |
| `src/app/page.tsx` | Pass `isPO` hint or explicit `maxHeight` prop to `AgentPane` for the PO pane cap |
| `src/app/globals.css` | Add `@media (prefers-reduced-motion: reduce)` override for pane/HANDOFF transitions if not already present |

> Implementation note: `max-height` on `.pane` is cleanest as a prop-driven CSS variable — `AgentPane` can accept an optional `maxHeight?: string` prop defaulting to `"min(560px, 65vh)"`, and `page.tsx` passes `"min(420px, 48vh)"` for the PO pane. No new component needed.
