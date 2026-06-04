---
ticket: ARCH-0001
parent_feat: FEAT-0004
parent_us: US-101
role: architect
status: accepted
---

# ARCH-0001 — Viewer a11y polish (NFR ratification)

**Wave:** 125
**Date:** 2026-06-04
**Owner:** Architect
**Scope:** Light NFR ratification — no novel architecture, no new fitness function, no NFR delta.
**Companion artifacts:**
- `requirements/features/FEAT-0004-viewer-a11y-polish.md` (BA, in-flight this wave)
- `requirements/user-stories/US-101-*.md` (BA, in-flight this wave)
- `design/features/FEAT-0004-viewer-a11y-polish/UX-0001-viewer-a11y-polish.md` (UX, in-flight this wave)
- `tests/qa/features/FEAT-0004-viewer-a11y-polish/TEST-0002-viewer-a11y-polish.test.ts` (QA, Lane 2)
- Viewer-side edits land in `keyan-commits/apex-team-viewer` (`public/style.css`, `public/app.js`).

---

## 1. NFR posture — WCAG 2.1 AA is the standing a11y target for the viewer

The apex-team-viewer is the only user-facing UI surface this team owns under
the Plan C subagent runtime (apex-team itself has no UI — the Next.js monolith
retired Wave 106). All viewer a11y work is bound by **WCAG 2.1 Level AA**.

`architecture/workspace-conventions.md` does not currently state a viewer-wide
a11y conformance target — the closest existing record is `architecture/nfr.md`
§Accessibility, which carries one viewer-adjacent NFR (NFR-A11Y-001, conditional
render for dialog / drawer components) introduced for the retired Next.js
monolith. This ARCH ticket **ratifies WCAG 2.1 AA as the standing viewer a11y
target** without amending workspace-conventions.md — the binding is local to
the viewer surface and FEAT-grouped.

**Success Criteria bound to this wave (the four issues in US-101's AC):**

| SC | Title | Issue |
|---|---|---|
| 1.4.11 | Non-text contrast (3:1 minimum) | #7 — `.feat-card-header` / `.badge-btn` focus ring at 25% alpha (~1.8:1) |
| 2.1.1 | Keyboard accessible | #8 — `.feat-ticket-row .file-open` spans not keyboard-reachable |
| 2.4.7 | Focus visible | #5 — `.search` input `outline: none` with no `:focus-visible` replacement |
| 2.4.11 | Focus not obscured (AA) | #5 — same; focus indication must remain perceivable |
| 4.1.2 | Name, role, value | #9 — `.feat-card-body` missing `role="region"` + `aria-labelledby` |

**Measurement (per success criterion):** static-parse assertions in QA's
TEST-0002 (parsing the viewer's `public/style.css` and `public/app.js`)
verify each fix is structurally present. No runtime browser harness is added
for this wave — the surface is small, the assertions are mechanical, and
adding Playwright/axe to the viewer is its own ARCH ticket (deferrable, see
§4 below).

**Future binding:** the next viewer-touching wave that adds a wholly new
interactive surface should re-cite this section as the standing AA target.
Promotion of WCAG 2.1 AA to a workspace-conventions-level NFR (alongside
NFR-A11Y-001 in `architecture/nfr.md`) is a deferrable follow-up — see §4.

---

## 2. Pattern ratification — `:focus-visible` + solid focus ring as the canonical viewer pattern

UX's UX-0001 codifies a `:focus-visible` selector with a solid (non-alpha-blended)
focus ring as the standard mechanism for keyboard focus indication on every
focusable element in the viewer. This ARCH ratifies that pattern as the
**canonical viewer focus-indication pattern** going forward.

**Pattern shape (mirrors UX-0001):**

- Use `:focus-visible` rather than `:focus` — keyboard focus only; clicks do
  not light up the ring.
- The focus ring is a **solid color** with sufficient contrast against the
  underlying background (≥3:1 per WCAG 1.4.11). Alpha-blended rings are
  forbidden when the blended result falls below 3:1.
- The ring is applied as an `outline` (preferred) or as a `box-shadow` when
  `outline` clashes with layout. `outline: none` without a replacement is
  forbidden (the root cause of issue #5).

**Scope:** local to the viewer (`keyan-commits/apex-team-viewer`). apex-team
itself has no UI under Plan C — there is no apex-team `src/components/` lane
to mirror this rule against. If a future apex-team surface ships (none planned),
the pattern can be re-ratified for that surface in its own ARCH ticket.

**Cross-reference:** `design/features/FEAT-0004-viewer-a11y-polish/UX-0001-viewer-a11y-polish.md`
is the design-side source of truth for the visual spec (color, width, offset).
This ARCH ticket binds the pattern at the architecture-decision level; UX-0001
binds the rendered pixels.

---

## 3. No NFR delta — perf, security, observability unchanged

The Wave 125 changes are:

- Two `public/style.css` edits (focus-visible rules for `.search` and the
  feat card header + badge buttons).
- Two `public/app.js` edits (a `keydown` listener for Enter/Space on
  `.file-open` spans + `tabindex="0"` + `role="button"`; static `role="region"` +
  `aria-labelledby` attributes added at render time for `.feat-card-body`).

**Performance:** no measurable delta. A single `keydown` listener on a
non-hot path. Static attribute strings in the render path. No new bundles,
no new dependencies, no new network calls.

**Security envelope:** unchanged. No new event surfaces accept untrusted
input (the `keydown` handler invokes the same code path the existing click
handler already invokes — no new sink). No new external resources.

**Observability:** unchanged. No new structured-log emitters, no metric
labels, no instrumentation surface.

**Scalability / deployability / availability:** N/A — static-asset edit in
a read-only file-poller viewer.

**Verdict:** zero NFR delta beyond the explicit a11y binding in §1.

---

## 4. Cross-cutting note — keyboard-reachability precedent for clickable elements in viewer JS

Issue #8's fix establishes a precedent: **every clickable element added by
viewer JS (`public/app.js`) MUST be keyboard-reachable.** Concretely, an
interactive element MUST carry:

1. A native interactive element OR a `tabindex` (typically `tabindex="0"`).
2. A `role` that matches its behavior (e.g. `role="button"`, `role="link"`).
3. A `keydown` handler responding to Enter/Space (for `role="button"`) or
   Enter (for `role="link"`).
4. A focus-visible style (per §2).

**Pre-existing pattern surface in scope (this wave):** `.feat-ticket-row
.file-open` — the immediate fix.

**Future surface in scope:** any new clickable element introduced by future
viewer JS edits. The pattern is recorded here for Wave 125 only; **promotion
to a workspace-wide ADR is a deferrable follow-up** (see §6 below). For this
wave the local note in ARCH-0001 suffices — the viewer surface is small and
the cross-cutting rule fits in a single section.

**Why not file as ADR-019 this wave:** an ADR requires Context / Decision /
Consequences and a stable cross-cutting binding; the viewer surface is
small enough that the local rule binds the same surface area as an ADR
would. If a third pattern appears (clickable element \#3 in viewer JS), the
recurrence threshold is met and the rule is promoted to an ADR in the next
viewer-touching wave.

---

## 5. Code-review pre-commitment — Architect gates UI Dev's PR in Lane 2

Per the standing design gate, Architect reviews the non-UI portions of any
mixed PR (workspace-conventions §"Review-lane boundary"). The Wave 125 viewer
PR is a UI-touching PR, so the lane split is:

- **UX Designer** gates the UI portion: rendered focus ring color +
  contrast, layout / spacing of the focus ring, screen-reader landmark
  behavior for the new `role="region"`.
- **Architect** gates the non-UI portion: pattern conformance (does the
  `:focus-visible` rule shape match UX-0001?), keyboard-event handler
  correctness (Enter/Space both bound? Default `preventDefault` semantics?),
  static-attribute placement at render time vs DOM-mutation timing,
  dead-code / unused-export hygiene, abstraction quality.

**Pre-commitment for this wave (Wave 109 co-authorship not required —
small CSS + JS surface):**

- I will review the UI Dev's PR in Lane 2 under the standard non-UI review
  rubric (cohesion / coupling / naming / error handling / test existence).
- The viewer PR is small enough that Wave 109 co-authorship pre-staging is
  not required (co-authorship is reserved for cross-cutting `.claude/agents/`
  edits — this wave touches only viewer source).
- Lane 2 fires after BA US-101 + UX UX-0001 + this ARCH-0001 are all on
  disk (the triad-return condition).

**Verdict format:** per ADR-018, my Lane 2 verdict will be recorded in
this `coordination/handoffs/architect.md` under a fresh Wave-125 PASS
or CONCERNS or FAIL block with the canonical anchor:
`### Wave-125 <PASS|CONCERNS|FAIL> verdict — PR #N — SHA <40-char>`.

---

## 6. Deferrable follow-ups (out of scope this wave)

These are real architectural improvements surfaced by this wave but explicitly
out of scope per the dispatch brief. Tracked here for future wave triage; the
PO sequences them. None block Wave 125 merge.

1. **Promote WCAG 2.1 AA to a workspace-conventions NFR.** Add a viewer-wide
   a11y conformance section to `architecture/nfr.md` (sibling to NFR-A11Y-001)
   or extend `architecture/workspace-conventions.md` with a viewer a11y
   policy block. Trigger: any wave that introduces a wholly new viewer
   interactive surface.
2. **Promote the keyboard-reachability rule to an ADR.** Filed as a
   deferrable follow-up per §4. Trigger: a third clickable-in-JS element
   appears in `public/app.js`.
3. **Automated WCAG conformance in viewer CI.** axe-core or Playwright +
   `@axe-core/playwright` runner in the viewer repo's CI. Wave 125's QA
   coverage is static-parse only; a runtime conformance check is the next
   layer. Owner: DevSecOps + QA jointly. Trigger: viewer CI matures past
   file-presence checks.

---

## 7. Cross-references

- `architecture/workspace-conventions.md` — workspace directory contract; this
  ratification is filed as Architect-lane FEAT-grouped work per §"FEAT-XXXX
  feature grouping (Wave 122)".
- `architecture/nfr.md` §Accessibility — pre-existing NFR-A11Y-001 (dialog
  conditional-render); sibling-context for WCAG bindings.
- `architecture/INDEX.md` — Architect's top-level index (ADRs + flat docs).
- `architecture/features/INDEX.md` — ARCH ticket allocation log (this ticket
  added here as ARCH-0001 row).
- `architecture/decisions/ADR-018-pass-verdict-format.md` — PASS-verdict
  format binding the Lane 2 code-review verdict.
- `requirements/features/FEAT-0004-viewer-a11y-polish.md` — BA parent feature
  doc (in-flight Lane 1).
- `requirements/user-stories/US-101-*.md` — BA driving story (in-flight
  Lane 1).
- `design/features/FEAT-0004-viewer-a11y-polish/UX-0001-viewer-a11y-polish.md`
  — UX visual + interaction spec (in-flight Lane 1).
- WCAG 2.1 success criteria: 1.4.11, 2.1.1, 2.4.7, 2.4.11, 4.1.2 (all Level AA
  or below).
