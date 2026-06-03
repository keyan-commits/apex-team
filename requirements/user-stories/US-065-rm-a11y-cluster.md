---
name: US-065-rm-a11y-cluster
description: RM-transition trio — co-located reduced-motion overrides for Issues panel toggle (#210), ActiveWaveCard poll button (#215), responsive-layout transitions (#233). Verify-first ACs per Architect's drift findings. Focus-ring contrast (#216) split to US-066.
metadata:
  type: user-story
  status: closed
  owner: UI Dev
  closes: "#210, #215, #233"
  wave: Wave 108
---

## Story

As a user with vestibular sensitivity, I want all dashboard transitions to respect `prefers-reduced-motion: reduce`, so that I am not exposed to motion I have not consented to.

## Acceptance criteria

> **Drift note (Architect, Wave 108 pre-stage):** Issues #210 and #215 may be partially or fully addressed by prior waves (US-062/063). All ACs are **verify-then-act** — confirm the current state before writing any new CSS.

1. **(#215 — verify-first)** Read `src/components/ActiveWaveCard.tsx` and confirm whether a `@media (prefers-reduced-motion: reduce)` block already suppresses the `.aw-poll-btn` `transition: background 120ms, color 120ms` (guard is expected at lines 257–261 per Architect's ground-truth). If present and complete: close #215 as no-op, no code change required. If any uncovered poll-button transition exists, add a co-located override immediately after the offending `transition` declaration.

2. **(#210 — gap-check)** The Issues panel already RM-guards `.row-flash`, `.issue-order-btn`, and `.spinner`. Confirm whether the specific "order toggle" interaction cited in #210 is covered. If yes: close #210 as no-op. If a gap exists on the toggle selector specifically, add a co-located `@media (prefers-reduced-motion: reduce) { <selector> { transition: none; } }` block.

3. **(#233 — strip height)** For the tablet strip height/max-height expand/collapse transition in `src/app/page.tsx` (or relevant component): if a live CSS `transition: height` or `transition: max-height` exists on that element, add a co-located RM override suppressing it. If no live transition exists, no-op.

4. **(#233 — chevron)** The `.row-chevron` element swaps text glyphs (▾/▸) — it has **no CSS `transform: rotate()` transition** (confirmed by Architect ground-truth). No RM guard is needed. If a `transition` is discovered on inspection, guard it; otherwise no-op.

5. **(#233 — mobile drawer)** For the mobile bottom-drawer slide-in: if a live `transition: transform` or `transition: height` exists on the drawer element, add a co-located RM override. If no live transition exists on that surface, no-op.

6. **Co-location rule** — every override block must be placed immediately after the `transition` declaration it suppresses. No separate top-level at-rule blocks. Source: `design/issue-210-reduced-motion.md` §5 (UX spec, Wave 108 pre-stage). UX spec is authoritative if it specifies a different approach.

## Open questions

- **OQ-065-001 (RESOLVED)** — Architect's Wave 108 pre-stage recommendation to split #216 into US-066 was accepted. US-065 is the RM-transition trio only (#210 + #215 + #233). #216 (focus-ring contrast) is in US-066.

## Out of scope

- Focus-ring contrast on selected poll button (#216) — that is US-066.
- Audit of all other animated dashboard elements beyond the three listed issues — follow-up scope.
- Changing any CSS token values (only transition guards are in scope).
- Dashboard RM compliance indicator.

## Notes

- **RM lineage:** US-061 (deferred responsive RM scope) → US-062 (pill/dot RM guards) → US-063 (stall-drawer motion cleanup) → **US-065** (this story, Issues panel + ActiveWaveCard + responsive transitions).
- #233 is coupled to the responsive-layout scope deferred from issue #188 and to US-066 (if focus-ring and responsive layout land together, ensure no CSS conflicts).
- #216 was originally consolidated here; split to US-066 on Architect's Wave 108 pre-stage recommendation (focus-visible contrast is a distinct WCAG axis from reduced-motion).
- Discovered during: Wave 90 UX gate PR #206 (#210); Wave 122 UX gate PR #213 (#215); Wave 96 UX gate PR #231 (#233).
- Implementation held — Lane B single-occupancy (Wave 107 owns Lane B until its PR lands).
