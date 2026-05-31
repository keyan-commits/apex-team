# US-008 — Team Page Information Density Redesign

**Status:** ready  
**Linked issue:** user feedback Wave 28 ("Still too much information and UI/UX can be improved")  
**UX Designer:** Wave 28a  
**Spec date:** 2026-05-31

---

## Problem statement

The Team page (`/` route) has unbounded vertical growth. A single active pane can exceed the viewport height by 4-10×, forcing simultaneous scroll inside the pane AND across the page. The root causes are four specific missing constraints in the current code:

1. **`AgentStatePanel` `.body` has no `max-height`** — a full HANDOFF.md (200+ lines in this project) renders at full uncapped height when the panel is open.
2. **`AgentPane` `.messages` has `min-height: 120px` but no `max-height`** — grows unboundedly with message history.
3. **`MessageBubble` threshold is generous** — `COLLAPSE_CHARS=400, COLLAPSE_LINES=6` shows substantial markdown content before collapsing.
4. **Outbound HANDOFF/dispatch bubbles render at full height** — handoff messages TO a peer are status info, not reading material; they shouldn't expand inline.

---

## Design diagnosis

### What's already working — do not change

- **Collapsed pane** (`folded=true`): 40px single bar showing pill + title + inbox count + expand button. Perfect — keep exactly as-is.
- **Auto-expand on busy / auto-fold at 60s idle**: Good behavior — keep.
- **ActivityLog strip**: 28px, horizontal, max-5 entries, monospace. No change needed.
- **HANDOFF panel toggle** (`AgentStatePanel`): Closed by default (`defaultOpen=false`). Good — keep.
- **MessageBubble "Show more" affordance**: Mechanism is correct, threshold needs tightening only.

### What needs changing

| Culprit | Current | Problem | Fix |
|---|---|---|---|
| HANDOFF body | No `max-height` | Full doc renders (200+ lines) | `max-height: 200px; overflow-y: auto` |
| Pane messages area | `min-height: 120px`, no max | Grows with full message history | `max-height: clamp(260px, 38vh, 480px); overflow-y: auto` |
| Message bubble threshold | 400 chars / 6 lines | 6 lines of markdown = substantial text | 200 chars / 3 lines |
| HANDOFF-out / dispatch-out bubbles | Full content rendered | Outbound messages shouldn't dominate | Collapsed-by-default: show 1-line summary + char count |

---

## Visual wireframes

### Expanded pane — idle state (no active turn)

```
┌────────────────────────────────────────────────────────────┐
│ ● idle   Business Analyst                  Claude ▾  [▲]  │  ← header-row: 40px
│ Last: "Write US-007 story with AC for boot…"               │  ← task-bar: 24px
├────────────────────────────────────────────────────────────┤
│ ▸ HANDOFF · updated 14:23                                  │  ← HANDOFF toggle (closed): 36px
├────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Business Analyst (you)                               │  │  ← 3 lines max
│  │ US-007 written. ACs: 1. idempotent bootstrap         │  │
│  │ command 2. no auto-yes on branch protection…         │  │
│  │                                 Show more (+22) ▾    │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ↳ Handoff to DevSecOps                  [expand ▾]   │  │  ← outbound: 1-line collapsed
│  └──────────────────────────────────────────────────────┘  │
│  ↑ messages area: max-height clamp(260px,38vh,480px),      │
│    overflow-y: auto, scrollbar-thin                        │
├────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────┐  [Send]        │
│  │ Message Business Analyst… (⌘+Enter)   │                │
│  └────────────────────────────────────────┘                │
└────────────────────────────────────────────────────────────┘
```

### Expanded pane — HANDOFF panel open

```
┌────────────────────────────────────────────────────────────┐
│ ● idle   Business Analyst                  Claude ▾  [▲]  │
│ Last: "Write US-007 story…"                                │
├────────────────────────────────────────────────────────────┤
│ ▾ HANDOFF · updated 14:23                                  │  ← toggle open
│ ┌──────────────────────────────────────────────────────┐   │
│ │ ## ⏭️ NOW — 2026-05-31                               │   │  ← HANDOFF body:
│ │                                                      │   │    max-height: 200px
│ │ Wave 28 — …                                          │   │    overflow-y: auto
│ │                                                    ↕ │   │    scrollbar-thin
│ └──────────────────────────────────────────────────────┘   │
│                                          [Edit]            │
├────────────────────────────────────────────────────────────┤
│  messages area (capped height, scrollable)                 │
├────────────────────────────────────────────────────────────┤
│  composer                                                  │
└────────────────────────────────────────────────────────────┘
```

### Collapsed pane (unchanged)

```
┌────────────────────────────────────────────────────────────┐
│ ● idle   Business Analyst         ② inbox          [▼]    │  ← 40px
└────────────────────────────────────────────────────────────┘
```

---

## Component-level spec

### 1. `AgentStatePanel.tsx` — HANDOFF body max-height

**File:** `src/components/AgentStatePanel.tsx`  
**Change:** Add to `.body` CSS rule:

```css
.body {
  padding: 4px 14px 12px;
  max-height: 200px;
  overflow-y: auto;
}
```

- **Why 200px:** Shows ~10-12 lines of the HANDOFF NOW block — enough to scan status without scrolling for the common case. The HANDOFF doc header (`## ⏭️ NOW`) lands at line 1; the user sees the current-wave summary immediately.
- **Scrollbar:** Use `scrollbar-thin` (Tailwind) or equivalent — `scrollbar-width: thin` — so the internal scroll doesn't clash with the pane's outer scroll.
- **No animation on open/close transition:** Body appears/disappears instantly (already toggled via `{open && ...}` conditional render). Adding a transition here would conflict with the `max-height` scroll cap.

**Interaction states:**
- **default (closed):** toggle bar only, 36px, no scroll
- **open, doc fits within 200px:** no scrollbar appears
- **open, doc overflows 200px:** `scrollbar-thin` appears on right edge; user scrolls inside the panel
- **open, empty doc:** "No HANDOFF doc yet. This agent will create one on its next turn..." (existing empty state, unchanged)
- **open, editing mode:** textarea appears inside the body (existing behavior); textarea height still auto-sizes to content; overall body is now scrollable which means the Edit/Cancel buttons scroll with the textarea — acceptable for this use case

---

### 2. `AgentPane.tsx` — Messages area max-height

**File:** `src/components/AgentPane.tsx`  
**Change:** Update `.messages` CSS rule:

```css
.messages {
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  min-height: 80px;
  max-height: clamp(260px, 38vh, 480px);
}
```

- **Why clamp(260px, 38vh, 480px):** At 1440px viewport height (common desktop), 38vh ≈ 547px — capped at 480px. At 900px viewport height, 38vh ≈ 342px. At 600px (small screen), 38vh = 228px — floored at 260px to ensure at least 2-3 messages are visible.
- **Why reduce min-height 120px → 80px:** 80px still shows 2-3 short messages while reducing the empty-state visual weight for idle panes.
- **Auto-scroll to bottom on new messages:** Existing `scrollerRef.scrollTop = scrollerRef.scrollHeight` logic is unchanged — scrolls the messages area to the latest message.
- **During streaming:** The messages area is always at max-height when the pane is expanded; the latest pending draft stays visible via the existing auto-scroll.

**Interaction states:**
- **empty (no messages):** "No messages yet. Talk to X below." centered at 80px height
- **1-3 short messages:** messages fill naturally; no scrollbar
- **many messages / overflow:** scrollbar-thin appears; auto-scroll keeps newest visible during streaming
- **folded pane:** messages area not rendered (existing behavior)

---

### 3. `MessageBubble.tsx` — Tighter collapse threshold

**File:** `src/components/MessageBubble.tsx`  
**Change:**

```ts
const COLLAPSE_CHARS = 200;   // was 400
const COLLAPSE_LINES = 3;     // was 6
```

- **Why 200 chars / 3 lines:** The Team page is a monitoring surface — users scan for status, not read for detail. 3 lines shows: a heading + 1-2 content lines, or the first few bullets of a list. Enough to identify the message type and key outcome; "Show more" is the natural next step.
- **"Show more (+ N lines) ▾" copy:** Unchanged. The `extraLines` count already reflects the correct delta.
- **Already-expanded bubbles:** Collapsing by default is reset-state only — users who have clicked "Show more" stay expanded for that session (existing `useState(!isLong)` behavior is preserved).

**Interaction states (all existing, threshold change only):**
- **short message (≤200 chars and ≤3 lines):** no Show more button; renders in full
- **long message:** 3-line preview with fade overlay + "Show more (+N lines) ▾"
- **expanded:** full content + "Collapse ▴"
- **streaming/pending:** `pending` prop → pending-dot in header; no collapse affordance while streaming (content grows in place)

---

### 4. Outbound HANDOFF/dispatch bubbles — collapsed by default

**File:** `src/components/MessageBubble.tsx`  
**Change:** Outbound message types (`handoff-out`, `dispatch-out`) start collapsed regardless of length.

Rationale: A HANDOFF or DISPATCH message that this agent SENT to a peer is routing infrastructure — not reading material for the pane's own role. It should be visible as a status indicator ("I sent something to QA") but not expand to consume vertical space by default.

```ts
// Replace the current isLong initializer:
const isOutbound = tone === "handoff-out" || tone === "dispatch-out";
const [expanded, setExpanded] = useState(isOutbound ? false : !isLong);
```

**Visual diff vs current:**

Current (handoff-out):
```
┌─────────────────────────────────────────────┐
│ ↳ Handoff to DevSecOps                       │  (dashed border, gold tint)
│                                              │
│ Wave 27 — Deploy US-005. QA PASS on          │
│ `feature/13b-issues-ui-polish` SHA `e73bfa7` │  ← full content visible
│ (base: `feature/13b-repo-status` SHA         │
│ `35533b0`). Branch protection is now LIVE    │
│ …                                Show more ▾ │
└─────────────────────────────────────────────┘
```

After (handoff-out, collapsed by default):
```
┌─────────────────────────────────────────────┐
│ ↳ Handoff to DevSecOps                       │  (dashed border, gold tint)
│ Wave 27 — Deploy US-005. QA PASS on `feat… │  ← 1 line preview (200 chars still)
│                                  Show more ▾ │
└─────────────────────────────────────────────┘
```

**Interaction states:**
- **handoff-out / dispatch-out, default:** collapsed (even if short — the `isOutbound` override makes all outbound messages start collapsed, though for very short messages the "Show more" affordance won't appear since `hasMore` is false — no visual change for short outbound messages)
- **handoff-in / dispatch-in:** unchanged — inbound messages START collapsed only when they exceed the threshold (user is reading these, so the existing threshold applies)
- **After user clicks "Show more":** full content, same as today

---

### 5. Activity log strip — no change

**File:** `src/components/ActivityLog.tsx`  
Already well-constrained: 28px height, horizontal, overflow: hidden, max 5 entries. Its purpose (last routing decision, wave ID) is high-value at low cost. Keep exactly as-is.

---

## Interaction state inventory

Full enumeration per interactive surface in the redesigned pane:

| Surface | State | Behavior |
|---|---|---|
| Pane (expanded) | idle | Header (40px) + task-bar (24px) + HANDOFF toggle (36px) + messages (max 480px) + composer |
| Pane (expanded) | busy/streaming | Same layout; messages auto-scroll; pending bubble at bottom; elapsed counter in header |
| Pane (folded) | any | 40px bar only |
| HANDOFF toggle | closed | 36px bar; "▸ HANDOFF · updated HH:MM" |
| HANDOFF toggle | open, short doc | body up to 200px; no scrollbar |
| HANDOFF toggle | open, long doc | body at 200px with scrollbar-thin |
| HANDOFF toggle | open, editing | textarea inside body; Save/Cancel buttons scroll with content |
| Messages area | empty | 80px height; "No messages yet…" centered |
| Messages area | filling | grows to max-height; then scrolls; auto-scrolls to bottom on new message |
| MessageBubble | short (≤200c/3l) | full content, no Show more |
| MessageBubble | long | 3-line preview + fade + "Show more (+N) ▾" |
| MessageBubble | expanded | full content + "Collapse ▴" |
| MessageBubble (outbound) | any | starts collapsed; "Show more" if content exists |
| Composer | idle | 3-row textarea (2 for PO); Send button disabled when empty |
| Composer | busy | textarea + Send disabled |
| Process inbox btn | inboxCount > 0 | full-width button above textarea |

---

## Copy strings (verbatim)

All existing copy strings are unchanged. No new copy introduced.

- HANDOFF toggle: `"HANDOFF"` + `"· updated HH:MM"` / `"· empty"`
- HANDOFF empty state: `"No HANDOFF doc yet. This agent will create one on its next turn (via a [[NOTES]] block)."`
- MessageBubble show-more: `"Show more (${moreCopy}) ▾"` where `moreCopy = extraLines > 0 ? \`+${extraLines} lines\` : "more"`
- MessageBubble collapse: `"Collapse ▴"`

---

## Responsive behavior

| Breakpoint | Behavior |
|---|---|
| > 1100px | 3-column team grid (unchanged) |
| 768px–1100px | 2-column grid (existing `@media (max-width: 1100px)`) |
| ≤ 768px | 1-column stack (note: code currently uses `720px` — this is a pre-existing mismatch with the 768px standard; out of scope for this wave) |

The `max-height: clamp(260px, 38vh, 480px)` on `.messages` naturally adapts to all breakpoints — the `38vh` component tracks viewport height, not width. No additional breakpoint rules needed for the messages area.

---

## Implementation notes for UI Dev

Four surgical changes across two files:

1. **`AgentStatePanel.tsx`** — one CSS property addition to `.body`
2. **`AgentPane.tsx`** — two CSS value changes to `.messages` (`min-height` + add `max-height`)
3. **`MessageBubble.tsx`** — two constant changes (`COLLAPSE_CHARS`, `COLLAPSE_LINES`) + one `useState` initializer change for outbound types

Total estimated LOC: ~8 changed lines. No new components. No new state. No API changes.

**Regression risks:**
- `AgentStatePanel` editing mode: textarea inside a 200px scrolling body works but the Edit button row scrolls with the content — acceptable for an edge case (manual edit of HANDOFF doc is rare).
- Streaming pane during active turn: the messages area cap means users may not see the full token stream without scrolling. Auto-scroll to bottom mitigates this — newest content is always visible; older content scrolls out of view above.

---

## Skill gap — proposal filed

Filed as GitHub issue: `skill-proposal: information density audit checklist` — a structured checklist for scanning UI for unbounded heights, implicit overflow, uncapped list renders, and missing scroll containment. This would let the UX Designer catch the four issues diagnosed above during initial spec review rather than post-implementation.

---

_UX Designer · Wave 28a · 2026-05-31_
