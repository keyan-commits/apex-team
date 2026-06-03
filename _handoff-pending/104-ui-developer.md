## Done
- US-060 (#226): StallSettingsDrawer closed-state a11y fix — conditional render of `<aside>` when `open` (removes dialog from DOM/a11y tree when closed). Removes defeated `aria-hidden`. Adds focus-on-open (close button), Tab trap, focus-return-to-trigger (gear button via `gearBtnRef`). Type-check 0 errors, 433/433 tests green.
- PR: `feature/104-us060-stall-drawer-a11y` (pending push + PR open)

## In flight
- Awaiting UX gate (no new visual surface; focus management correctness) + Architect code gate (parallel)

## Next
- QA gate after UX + Architect PASS — pre-written Playwright assertions in `architecture/nfr.md`
- DevSecOps merge after QA PASS (merge #274's `afterEach` fix first to avoid order-dependent CI flake)

## Notes
- `@testing-library/react` NOT in devDependencies — vitest environment is `node`. Tests written as pure-function tests (matching existing pattern). DOM/a11y-tree assertions (AC1/AC5 Playwright) are for QA per `nfr.md`.
- `architecture/nfr.md` and `architecture/INDEX.md` changes authored by Architect are unstaged — not included in this PR. Architect should commit or the PO should fold them.
