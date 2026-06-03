# US-009 / US-010 / US-011 — Agent profile page + dashboard additions

**Status:** reviewed  
**User stories:** US-009 (agent profile page), US-010 (manual scout trigger), US-011 (context saturation indicator)  
**Spec author:** UX Designer  
**Date:** 2026-05-31  
**Implementation PR:** #78

---

## 1. US-009 — `/agents/[role]` profile page

### 1a. Layout

Single-column reading view, max-width 800px, centered. Three sections:
1. Breadcrumb nav
2. Header card
3. Skills accordion
4. Improvements form

No scrollwalls — skills collapsed by default. Each expanded skill section is capped at `max-height: 320px` with internal scroll to prevent unbounded expansion.

```
┌────────────────────────────────────────────────┐
│ ← Team  /  Dashboard  /  Business Analyst      │  breadcrumb (12px)
├────────────────────────────────────────────────┤
│ Business Analyst            [ba]               │  h1 + role pill
│ Model  claude-sonnet-4-6                       │  meta row (11px monospace)
│ You are the Business Analyst on the team…      │  system prompt summary (12px dimmed)
├────────────────────────────────────────────────┤
│ SKILLS (7)                                     │  section heading (uppercase 11px)
│ ▸ Discovery (Example Mapping)        [user]    │  collapsed skill row
│ ▸ ADR discipline                     [claude]  │
│ ▾ Fitness functions              [external ↗]  │  expanded; body scrolls at 320px
│   └── body content (ReactMarkdown)             │
├────────────────────────────────────────────────┤
│ SUGGEST AN IMPROVEMENT                         │
│ File a skill-proposal issue for this agent…   │  hint (12px)
│ ┌──────────────────────────────────────────┐   │
│ │ Issue title                              │   │  text input
│ └──────────────────────────────────────────┘   │
│ ┌──────────────────────────────────────────┐   │
│ │ Describe the improvement…               │   │  textarea (4 rows)
│ └──────────────────────────────────────────┘   │
│ [File issue]                                   │  accent-tinted button
└────────────────────────────────────────────────┘
```

### 1b. Header card — states

| State | Behavior |
|---|---|
| **loading** | Centered "Loading…" text (12px dim); no breadcrumb (role unknown) |
| **error (HTTP 4xx/5xx)** | Breadcrumb visible; red `error-banner` with error message |
| **loaded** | Full header card with accent-tinted border/background per role |

The header card border uses the role's accent token at 35% mix: `color-mix(in srgb, var(--accent-<role>) 35%, var(--border))`. Background at 4% mix.

### 1c. Provenance badges

Three categories, visually distinct:

| Provenance | Color | Token |
|---|---|---|
| `claude` | Gray | `var(--text-dim)` / `var(--border)` |
| `user` | Blue | `var(--accent-ui)` |
| `external` | Green | `var(--accent-ba)` |

For `external` with a source URL: the badge renders as an `<a>` inside the button, with `onClick stopPropagation` to avoid triggering the accordion expand. Badge text is the provenance label; link opens in new tab.

### 1d. Skills accordion — interaction states

| State | Behavior |
|---|---|
| **default (collapsed)** | `▸` chevron, section heading, provenance badge |
| **expanded** | `▾` chevron, body (ReactMarkdown) visible, max-height 320px scroll |
| **button:hover** | Background darkens slightly via color-mix border |
| **button:focus-visible** | 2px outline using `var(--accent-po)` — see **Known nit #1** |
| **external badge hover** | Underline on the link text |

**Known nit #1 (open):** The `skill-hd:focus-visible` outline uses `var(--accent-po)` regardless of the current role's accent. Inconsistent but not broken. Filed as `[ux:profile]` issue.

### 1e. Improvements form — states

| State | Trigger | Display |
|---|---|---|
| **idle** | default | Input + textarea + disabled "File issue" until both fields filled |
| **sending** | button click | Input + textarea + button disabled; button shows "Filing…" |
| **success** | 201 response | Green-tinted success banner with `#<number>` link + "File another" reset |
| **error** | non-201 response | Red `error-banner` above the button; form remains editable; retry available |

### 1f. Accessibility

- `aria-expanded` on skill accordion buttons ✓
- `aria-label` on form inputs ✓  
- `focus-visible` on all interactive elements ✓
- `tabIndex={0}` not needed on skill bodies (non-interactive scrollable container)
- Breadcrumb links use `next/link` (correct semantics)

### 1g. Responsive behavior

- `max-width: 800px` centered — naturally single-column at all breakpoints
- No grid, no complex layout — no breakpoint spec needed
- Improvements textarea: `resize: vertical` allows user to grow it if needed

### 1h. Navigation — entry points

- From `AgentPane` (folded bar): role title is a `<Link href="/agents/${role}">` — same visual as text (no underline default, underline on hover, focus ring visible)
- From `AgentPane` (expanded header): same link on the title text
- From dashboard Context panel: role badge wrapped in `<Link>` with `display: contents` (no layout change)

---

## 2. US-010 — Manual Daily Scout trigger (dashboard addition)

### 2a. Placement

Below the Scout panel's `kv-list` (last-run / proposals-filed / next-run metadata).

### 2b. States

| State | Trigger | Display |
|---|---|---|
| **idle** | default | "Run now" button (accent-po tinted, 12px, 5px 14px padding) |
| **running** | 202 response from POST | Button disabled; spinner `⟳` + "Running…"; polls `/api/scout/status` every 5s |
| **run complete** | `running: false` + `lastRunAt` changed | Reverts to "Run now"; kv-list refreshes on next 10s team-status poll |
| **503 (auth error)** | 503 response | Inline `scout-error` paragraph above button: `Claude Code not logged in — run 'claude login' to authenticate` |
| **network error** | fetch throws | Inline error: `Failed to trigger scout — check server logs` |

### 2c. Accessibility

- `aria-live="polite"` on the button tracks label change (non-standard pattern — see **Known warn #1**). Functional but not ideal.
- `disabled={scoutRunning}` prevents double-trigger ✓
- `focus-visible` outline on button ✓

**Known warn #1 (open):** `aria-live="polite"` placed directly on the `<button>` element is non-standard. Screen readers typically read button labels on focus, not via live regions. A sibling `aria-live` region outside the button would be more reliable. Filed as `[ux:scout]` issue.

---

## 3. US-011 — Context saturation bar (dashboard addition)

### 3a. Placement

In each `ctx-card` within the dashboard Context panel, below the `ctx-stats` row.

### 3b. Thresholds

```
CONTEXT_MAX_CHARS = 8000
CONTEXT_AMBER     = 0.5  (50%)
CONTEXT_RED       = 0.8  (80%)
```

### 3c. Visual

4px height bar; track is `var(--border)`; fill color:

| Level | Range | CSS |
|---|---|---|
| green | 0–50% | `#4caf50` — see **Known warn #2** |
| amber | 50–80% | `#ff9800` — see **Known warn #2** |
| red | >80% | `var(--accent-qa)` |

`title` tooltip shows percentage on hover (e.g. `"Context: 73%"`).

**Known warn #2 (open):** `#4caf50` (green) and `#ff9800` (amber) are hard-coded hex values. Design system convention requires named tokens in `globals.css`. These should become `--status-green` and `--status-amber` tokens. Filed as `[ux:saturation]` issue.

### 3d. "Needs cleanup" badge

When `ctx.needsCleanup === true`:
- The `ctx-card` gets `ctx-warn` class: `border-color: color-mix(in srgb, var(--accent-po) 50%, var(--border))`
- A `cleanup-badge` span renders: gold pill with "needs cleanup" text (9px, `var(--accent-po)`)
- The saturation bar will be at red level (>80% by definition of needsCleanup threshold)

The badge is visible before the bar — provides text-based signal for accessibility.

---

## 4. Interaction state inventory — new elements

| Element | Default | Hover | Focus | Active | Loading | Error | Empty/Zero | Disabled |
|---|---|---|---|---|---|---|---|---|
| Profile page title link | no underline | underline | 1px outline | — | — | — | — | — |
| Skill accordion button | surface-2 bg | darkened bg | 2px outline (accent-po) | — | — | — | "No skill sections defined." | — |
| Improvements input | border | — | 2px outline | — | — | — | placeholder text | 0.5 opacity |
| Improvements textarea | border | — | 2px outline | — | — | — | placeholder text | 0.5 opacity |
| File issue button | accent-po tint | deeper tint | 2px outline | — | "Filing…" | error banner above | — | 0.5 opacity |
| Run now button | accent-po tint | deeper tint | 2px outline | — | spinner + "Running…" | inline error para | — | 0.6 opacity |
| Saturation bar | fills to width% | tooltip | — | — | — | — | 2px min-width | — |

---

## 5. Out of scope (defer)

- Model selector dropdown on profile page (display-only model code is sufficient for now)
- Per-section editing of skills on the profile page
- Compaction trigger button on saturation card (deferred to US-011b per BA story)
- Scout run history log / detailed output view

---

## 6. Files changed (implementation reference)

| File | Change |
|---|---|
| `src/app/agents/[role]/page.tsx` | New profile page |
| `src/components/AgentPane.tsx` | Role title links in folded bar + expanded header |
| `src/app/dashboard/page.tsx` | Scout "Run now" button + saturation bar + role badge links |
