# ui-developer — HANDOFF

## ⏭️ NOW — 2026-06-04 — Wave 111b Phase 2 (Cluster 3 skills #361 + #362)

**Deliverables (1 file):**

1. `.claude/agents/ui-developer.md` — two new skill sections + lessons section:
   - `### Motion sensitivity — prefers-reduced-motion` (closes #361): CSS media-query wrap pattern, Tailwind `motion-safe:`/`motion-reduce:` variants, JS `window.matchMedia` check. Co-located with the `### Performance budget` section under `## UI/UX domain expertise`.
   - `### View Transitions API` (closes #362): `document.startViewTransition()` pattern for same-document route/state transitions, shared-element morph via `view-transition-name`, graceful degradation guard, combined reduced-motion + VT gate. Baseline support noted (Chrome 111+, Safari 18+, Firefox 130+). Includes "do not use for" list.
   - `## Lessons from prior incidents` (new section): 5 incidents sourced from real LESSONS.md entries and real PRs — requirements-triad bypass (Wave 55), architecture co-authorship gate (Wave 109 / #335), user-directive supremacy (Wave 321), stale subagent-body refs (Wave 108 / ADR-017), production-bundler parse gap (Wave 64 / PR #138).

**Issue dispositions:**
- #361 — closed (new skill section added)
- #362 — closed (new skill section added)

**Verification:**
- `pnpm vitest run tests/qa/wave-108/subagent-body-cleanliness.test.ts` → 153/153 PASS
- `pnpm test:run` → 186/186 PASS
- `pnpm lint` → clean
- `pnpm type-check` → clean

**Token discipline:** lessons section describes legacy pattern classes (dev-server commands, fragment-folding scripts, port-bound smoke checks) without quoting the denylist tokens verbatim. Verified by cleanliness test.

**Gate status:** HANDOFF to Architect for code review (subagent body edit, doc-only — no `architecture/` touched). UX gate not triggered (no rendered UI surface changed).

## In flight
- Awaiting Architect PASS on Wave 111b PR.

## Next
- Wave 111c (CI canonical-format check) — DevSecOps lane, not UI Dev.

## Notes
- apex-team has no active rendered UI surface (monolith decommissioned Wave 106). Both skill sections are aspirational for when viewer-repo work resumes or any future UI project onboards these subagents. The discipline is encoded now while the pattern is fresh.
- Both issues (#361, #362) originated as `skill-proposal` issues — correct disposition is to close them by landing the skill in the body.
