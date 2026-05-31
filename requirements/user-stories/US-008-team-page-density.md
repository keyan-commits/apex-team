# US-008 — Team page density redesign: collapsed-by-default, click-to-expand

**Status:** proposed
**Owner role:** ui-developer
**Created:** 2026-05-31
**Story ID:** US-008

---

## Narrative

As a user watching the apex-team team page during agent work, I want each pane to show only the at-a-glance status by default and let me drill into details on click, so that I can scan the team's state without scrolling through hundreds of lines of inline HANDOFF docs and message history.

## Background

The team page (`/` route) currently renders each AgentPane at unconstrained height. When an agent produces a long turn (many message bubbles, a multi-section HANDOFF doc, nested HANDOFF-to-X blocks), its pane grows to fill the page — breaking the at-a-glance monitoring purpose. The other seven panes still show correctly, but the tall pane forces the user to scroll both vertically inside it and horizontally across the grid. Wave 28a UX research (see `design/US-008-team-page-density.md`) diagnosed four root causes, all fixable in two component files with ~8 LOC of CSS and constant changes.

## Acceptance Criteria

- **AC1 — HANDOFF body has a capped height:** Given an AgentStatePanel with its body open, when rendered, then the body section has `max-height: 200px` and `overflow-y: auto`, so a 200-line HANDOFF doc never expands the pane beyond that height.

- **AC2 — Message history section has a capped height:** Given an AgentPane that has received multiple messages, when rendered, then the `.messages` container has `max-height: clamp(260px, 38vh, 480px)` with `overflow-y: auto` (and `min-height` is reduced from 120px to 80px), so the pane never grows unconstrained regardless of message count.

- **AC3 — Message bubbles have a tighter preview threshold:** Given any agent reply rendered as a MessageBubble on the Team page, when the message content exceeds the preview threshold, then it collapses to a 3-line / 200-character preview (down from 6 lines / 400 characters), so the Team page shows shorter snippets and reading-level content stays on `/dashboard`.

- **AC4 — Outbound routing bubbles collapse by default:** Given an agent reply that contains a `[[HANDOFF: role]]` or `[[DISPATCH: role]]` block rendered as a MessageBubble with `tone === "handoff-out"` or `"dispatch-out"`, when rendered on the Team page, then the bubble starts collapsed regardless of length. HANDOFF/DISPATCH routing infrastructure does not need to be reading material on the monitoring surface.

- **AC5 — Page fits on 1080p without vertical scroll (8 idle panes):** Given the redesign is shipped, when the Team page loads with 8 idle roles and no agent actively streaming, then all 8 panes are simultaneously visible within 100vh on a 1080p (1920×1080) viewport with no scroll required.

- **AC6 — Activity log strip behavior preserved:** The compact activity strip at the top of `/` is unchanged by this story (no regression). Its position and compact height are acceptable per Wave 28a spec.

## Out of Scope

- Full click-to-expand collapsed pane (just the role label) — too large for this wave; deferred to US-009 if needed after AC5 is achieved.
- Moving the activity log to `/dashboard` — deferred; Wave 28a spec says keep it.
- Any changes to `/dashboard` route — that page is the full-detail surface by design.

## Links

- design: `design/US-008-team-page-density.md` (Wave 28a UX spec)
- impl: (pending)
- test: (pending)
