## Done
- Wave 106 US-064 AC4: `McpRebindBanner` component implemented (`src/components/McpRebindBanner.tsx`). Placed in `page.tsx` immediately below `OrchestratorBar` (before `CiHealthBanner`). Grid updated to 6 rows.
- Banner detects server restart via `GET /api/health` → `startedAt` vs `localStorage.lastKnownServerStart`. Re-checks on `visibilitychange`. Dismisses via X, global Escape, or Space/Enter (native button). `prefers-reduced-motion` guard on fade-out. `role="status"` + `aria-live="polite"`.
- Tests: `tests/ui/McpRebindBanner.test.tsx` — 9 tests (shouldShowBanner predicate + localStorage key contract). 443/443 green, type-check 0.
- Branch: `feature/106-us064-mcp-rebind-banner` — PR open, awaiting UX + Architect gates.

## In flight
- Waiting on UX Designer design-correctness gate (parallel).
- Waiting on Architect code gate (parallel).
- QA gates after both design gates PASS.

## Next
- On gates PASS → HANDOFF DevSecOps for squash-merge (closes #257).

## Notes
- localStorage keys per spec §Implementation Notes: `lastKnownServerStart` + `dismissedServerStart` (no `apex` prefix despite dispatch summary).
- `shouldShowBanner` exported from the component for testability.
- The banner does NOT hide on re-check if already showing — only explicit dismiss or new check with `dismissed >= startedAt` suppresses it.
