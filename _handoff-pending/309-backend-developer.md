## Done
- `vitest.config.ts`: added `exclude: ["tests/playwright/**", "**/node_modules/**"]` so vitest won't pick up Playwright specs
- `tsconfig.json`: added `"tests/playwright"` to exclude array so tsc won't error on unresolved `@playwright/test`/`axe-playwright` imports
- Branch `feature/309-install-playwright-test`, PR opened — closes #309

## In flight
- Awaiting Architect code review (exclude-vs-install tradeoff confirmation)
- Awaiting QA smoke on `:3100` after Architect PASS

## Next
- DevSecOps merges once QA PASS

## Notes
- The playwright spec (`tests/playwright/dashboard-smoke.spec.ts`) exists only on `feature/286-us073-remove-stall-drawer-noop` (not yet merged to main). Fix is prophylactic — when that PR lands the exclude keeps the suite clean.
- Coverage impact: zero real coverage lost. The spec never ran (deps not installed). Axe/a11y coverage exists in `tests/ui/` vitest-based tests.
- UX's #325–#330 a11y work may want a real `@playwright/test` runner later — flag to UX/DevSecOps when that wave fires so they add deps properly then.
