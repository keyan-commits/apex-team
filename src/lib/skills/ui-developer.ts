export const skills = `\
## UI/UX domain expertise

### Visual hierarchy
- Typographic scale only — never arbitrary font sizes; establish a scale (e.g. 12/14/16/20/24/32) and pick from it.
- 4/8px spacing grid — all margin, padding, gap values are multiples of 4.
- Color contrast: WCAG AA minimum — 4.5:1 for body text, 3:1 for large text and UI components.

### Component granularity
- Single-responsibility split criterion: if two callers need different behavior from the same component, split it. If the split produces a component only one parent ever uses, keep it together.
- Props surface = component contract. Keep it narrow; lift state only when two siblings need to share it.

### All interaction states — never skip any
Every interactive element must account for: loading, error, empty/zero, disabled, hover, focus, active, and (for lists) the selected state. Empty states are never blank screens — at minimum they explain why the list is empty and what the user can do.

### Accessibility-first
- Semantic HTML before ARIA — \`<button>\` not \`<div role="button">\`, \`<nav>\` not \`<div class="nav">\`.
- Every interactive element reachable and operable by keyboard alone.
- Visible focus ring (never \`outline: none\` without a replacement).
- Icon-only controls need \`aria-label\` or \`<span class="sr-only">\` visible text.
- Test with a screen reader before calling a component done.

### Mobile-first responsive
- Start every layout at 320px, expand outward. No magic breakpoint numbers — use the project's design token scale.
- Fluid sizing over hard pixel values where possible; relative units for type.
- Validate at 375px before 1440px.
- Prefer CSS container queries (\`@container\`) over viewport media queries for component-level responsiveness. A component that responds to its container width is composable; one that responds to the viewport is fragile when placed in a sidebar, grid, or panel. Container queries are baseline-supported (Chrome 105+, Firefox 110+, Safari 16+) — use them.

### Performance budget
- LCP target ≤ 2.5s — no blocking render paths on the critical route.
- Never import a library for one utility function — inline it or find a smaller dep.
- Lazy-load below-the-fold content (images, heavy components).
- INP target ≤ 200ms — use \`useTransition\` / \`useDeferredValue\` for rapid state updates (SSE token streams, typing). Synchronous re-renders on every delta push INP over 500ms.
- Never import a library for one utility function — inline it or find a smaller dep.
- Lazy-load below-the-fold content (images, heavy components).
- All images have explicit \`width\` and \`height\` to prevent cumulative layout shift (CLS).

### Pre-HANDOFF unit testing
Stack: Vitest + @testing-library/react (already in the project's devDependencies).
Test files: \`tests/ui/<ComponentName>.test.tsx\`. Mirror the component's directory structure.

**What to test (behavior contract, not implementation):**
- User interactions: simulate clicks, keydowns, focus — assert DOM state after.
- Aria attributes: verify \`aria-expanded\`, \`aria-label\`, \`role\` values after state changes.
- Conditional rendering: assert blocks appear/disappear based on props/state (e.g. error detail only when \`pillState === "error"\`).
- Keyboard flows: test the full key sequence for complex interactions (arrow reorder, escape-to-dismiss).

**What NOT to test:**
- CSS class names (fragile — test behavior, not styling tokens).
- Internal state variable names.
- Snapshot tests for dynamic content (SSE streams, timestamps).

**Before HANDOFF checklist:**
1. \`pnpm test:run\` passes — 0 failures, 0 skipped unintentionally.
2. New tests cover every AC from the BA user story.
3. \`pnpm type-check\` clean.
4. Self-review walkthrough (density, feedback latency, error visibility, keyboard a11y, zero-state) complete.
5. Commit on feature branch — do NOT push to main; HANDOFF to UX Designer (if UI) then QA.

### UI/UX self-review discipline
Before declaring any UI complete, mentally walk through: (1) **page density** — would a new user feel overwhelmed? Apply progressive disclosure (collapsibles, auto-fold idle elements, tabs over scroll-walls); (2) **feedback latency** — every user action has a visible state change ≤100ms (skeleton, optimistic update, spinner); (3) **error visibility** — every error has a recovery path, not just a red banner; (4) **keyboard accessibility** — Tab-through full flow, visible focus ring, ESC closes modals; (5) **zero-state aesthetics** — empty containers have intentional copy, not blank space. When in doubt, fewer elements visible at once wins.
`;
