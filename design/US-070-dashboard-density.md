# Design Spec — US-070: Dashboard Adaptive Layout + Density Polish

**Status:** reviewed (retroactive — spec written after implementation, Wave 112)
**Issue:** #286 (US-070)
**PR:** #311 (merged @ 32b3ff2)
**UX Gate:** PASS (Wave 112 — no block-severity deltas vs. implementation)

---

## Overview

Seven density and layout improvements to the `/dashboard` page: done-panel grid expansion, workspace-path truncation, model-select reveal-on-hover, peer-idle row nowrap, done-panel sort, idle copy update, and NOW-panel pill overflow.

---

## ASCII Wireframe — Dashboard (≥1280px, all panels visible)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ OrchestratorBar                                                          │
│  workspace: [/path/to/…/apex-team ▼]  thread: [abc123]  [New]           │
│  (path truncated RTL to last ~40 chars on blur; full path in title=)     │
└──────────────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────────────┐
│ NOW panel                                                                │
│  [po] thinking  [arch] streaming  [ba] idle  +3 ← overflow badge        │
│  (max 2 role-chips visible; additional roles shown as "+N more")         │
└──────────────────────────────────────────────────────────────────────────┘

┌─── QUEUED ────────────┐ ┌─── DONE ──────────────────────────────────────┐
│ drag-to-reorder list  │ │  Wave 112 ▸ [role] [role] [role]              │
│ each row expandable   │ │  Wave 111 ▸ [role] [role]                     │
│                       │ │                                               │
│                       │ │  [at ≥1280px: DONE panel expands to           │
│                       │ │   full 3-col width via grid-column: 1/4]      │
└───────────────────────┘ └───────────────────────────────────────────────┘

┌─── BLOCKED ───────────┐ ┌─── CONTEXT ──────────────────────────────────┐
│ role + error pill     │ │  [role] handoff-size / msg-depth              │
│                       │ │  [role] ████░░ 60% amber                     │
│ (empty → panel hidden)│ └──────────────────────────────────────────────┘
└───────────────────────┘

┌─── PEER IDLE ──────────────────────────────────────────────────────────┐
│ [role-badge] [task-preview-text …] [pill]  [role-badge] [task …] [pill]│
│ (flex-wrap: nowrap; overflow-x: auto — row never wraps to second line) │
└─────────────────────────────────────────────────────────────────────────┘

┌─── ACTIVE WAVE ────────────────────────────────────────────────────────┐
│ Wave 112 — "feat(skills): user-directive supremacy"                    │
│ Section D: [idle state] → "Tick scheduler idle — queue is empty.       │
│             Send a goal via your Claude Code session, or use the       │
│             composer."                                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## AC Inventory

### AC1 — Done-panel full-width expand at ≥1280px

**Trigger:** `data-done-expands` attribute set on Done panel container when viewport ≥1280px.

**Behavior:** `grid-column: 1 / 4` — Done panel spans all three grid columns. Snap is instant (no transition).

**States:**
- **≥1280px:** full-width, all done rows visible in a 3-column card grid
- **<1280px:** Done panel in single-column slot, standard card width

**Copy:** No copy change.

---

### AC2 — Workspace-path RTL truncation

**Trigger:** Path string > 40 characters.

**Behavior:**
- While editing (focused): show full path
- On blur (unfocused, > 40 chars): truncate to last ~40 chars, prepend `…`
- `title` attribute always holds the full path for hover tooltip

**States:**
| State | Display |
|---|---|
| path ≤ 40 chars | Full path shown |
| path > 40 chars, unfocused | `…/Development/Study/apex-team` (RTL) |
| path > 40 chars, focused | Full path |
| hover on truncated path | Browser tooltip shows full path via `title=` |

**Copy:** No change to label or placeholder text.

---

### AC3 — Model-select dropdown: reveal on hover / focus-within

**Default state:** Model selector hidden (opacity 0, pointer-events none).

**Reveal trigger:** `.ctx-card:hover` OR `.ctx-card:focus-within` — entire context card acts as the hover zone.

**States:**
| State | Model select visibility |
|---|---|
| Default | Hidden |
| Card hovered | Visible |
| Any child focused (keyboard tab) | Visible (focus-within a11y) |
| Model selected | Visible until blur |

**A11y note:** `focus-within` ensures keyboard users can reach the select without a mouse. The reveal must NOT require hover alone.

---

### AC4 — Peer-idle row layout

**Before:** `flex-wrap: wrap` — long task previews caused the row to wrap to a second line, inflating panel height.

**After:** `flex-wrap: nowrap; overflow-x: auto` — row stays single-line; horizontal scroll reveals overflow content.

**Also:** `recent-row-body` gap increased from 6px → 12px for visual breathing room.

**States:** No additional interaction states. Scroll affordance is passive (no scrollbar shown unless hovered on macOS).

---

### AC5 — Done-panel wave-descending sort

**Behavior:** Done entries pre-sorted by wave number descending (highest wave first) before grouping. Entries with no wave number sort last (nulls last).

**Copy:** No change.

---

### AC6 — ActiveWaveCard Section D idle copy

**Before (old copy):** Generic idle message.

**After (new copy — verbatim):**
> Tick scheduler idle — queue is empty. Send a goal via your Claude Code session, or use the composer.

**States:**
| State | Section D content |
|---|---|
| Active wave running | Wave excerpt + role list |
| Queue empty / idle | Verbatim copy above |

---

### AC7 — NOW-panel chip-strip: 2-pill limit + overflow badge

**Behavior:** The NOW panel role-chip row shows at most **2 chips**. Additional roles (3rd, 4th, …) are hidden behind a `+N` overflow badge.

**Badge copy:** `+N` where N = count of hidden roles. No tooltip required.

**States:**
| NOW-active count | Chips shown |
|---|---|
| 0 | No chips, panel section hidden or empty |
| 1 | 1 chip |
| 2 | 2 chips |
| 3 | 2 chips + `+1` |
| 7 | 2 chips + `+5` |

---

## Interaction States — Full Inventory

| Component | State | Visual |
|---|---|---|
| OrchestratorBar workspace input | focused (editing) | Full path, cursor visible |
| OrchestratorBar workspace input | blurred, long path | Truncated RTL with `…` prefix |
| Done panel | ≥1280px | Full-width grid span |
| Done panel | <1280px | Standard column width |
| Context card model select | default | Hidden |
| Context card model select | card hovered or child focused | Visible |
| NOW chip strip | ≤2 active | All chips shown |
| NOW chip strip | 3+ active | First 2 chips + `+N` badge |
| ActiveWaveCard Section D | queue empty | Idle copy (verbatim, AC6) |
| Peer-idle row | any | Single-line, h-scroll on overflow |

---

## Responsive behavior

| Breakpoint | Done panel | NOW chips | Notes |
|---|---|---|---|
| ≥1280px | Full-width (3-col span) | 2 + overflow | `data-done-expands` active |
| 1100px | Normal column | 2 + overflow | Grid narrows |
| ≤768px | Normal column | 2 + overflow | Single-column layout |
| ≤480px | Normal column | 1 + overflow | Further compression acceptable |

---

## Copy — Verbatim Strings

| Location | Copy |
|---|---|
| ActiveWaveCard idle | `Tick scheduler idle — queue is empty. Send a goal via your Claude Code session, or use the composer.` |
| NOW overflow badge | `+N` (N = hidden role count) |
| Workspace truncated | `…<last-40-chars-of-path>` |

---

## Component List

- `src/app/dashboard/page.tsx` — AC1, AC4, AC5, AC7 (done expand, peer-idle nowrap, done sort, chip overflow)
- `src/components/OrchestratorBar.tsx` — AC2, AC3 (workspace truncation, model-select reveal)
- `src/components/ActiveWaveCard.tsx` — AC6 (idle copy)
- `src/components/AgentPane.tsx` — AC7 (NOW chip strip, minor)

---

## Density Audit Checklist (post-ship verification)

- [x] Unbound height: Done panel bounded by viewport height + internal scroll
- [x] Uncapped list: NOW chips capped at 2 + overflow badge (AC7)
- [x] Peer-idle row: nowrap + overflow-x:auto prevents unbounded height growth
- [x] Overflow-x on peer-idle: contained, no horizontal page scroll
- [x] ActiveWaveCard idle copy: specific and actionable

---

_UX Designer — retroactive spec, 2026-06-03 (implementation shipped Wave 112, PR #311 @ 32b3ff2)_
