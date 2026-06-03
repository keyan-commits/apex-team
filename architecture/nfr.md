# Non-Functional Requirements

Last updated: 2026-06-03 (Wave 104 — NFR-A11Y-001, NFR-MOTION-001, NFR-MOTION-002)

Measurement method is listed alongside every NFR. An NFR without a measurement is a wish, not a requirement.

---

## Accessibility (A11Y)

### NFR-A11Y-001 — Conditional render for dialog / drawer components

**Requirement:** Any component that acts as a modal dialog or off-canvas drawer MUST be conditionally rendered (removed from the DOM) when closed. It MUST NOT use `aria-hidden`, the `hidden` attribute, or a CSS-only show/hide pattern as a substitute.

**Rationale:** `aria-hidden` and `display: none` are frequently incorrect or defeated by descendant overrides. Conditional render is the only approach that guarantees a closed dialog is not in the accessibility tree and cannot receive focus.

**Measurement:** Playwright assertion on the closed state:
```ts
// Drawer/dialog is NOT attached to the DOM when closed
await expect(page.locator('.stall-drawer')).not.toBeAttached();

// After open: dialog element IS attached and receives focus
await page.click('[aria-label*="settings"]');
await expect(page.locator('.stall-drawer')).toBeAttached();
await expect(page.locator('.stall-drawer .drawer-close')).toBeFocused();
```

**Applies to:** `StallSettingsDrawer.tsx` (US-060, #226). All future drawer/dialog components in this codebase must follow the same pattern.

**Introduced:** Wave 104 — US-060.

---

## Motion / Animation

### NFR-MOTION-001 — `prefers-reduced-motion` guards on existing animated surfaces

**Requirement:** Every animated surface in the current production UI MUST respect `prefers-reduced-motion: reduce` via a `@media (prefers-reduced-motion: reduce)` CSS guard co-located with the animation declaration. Under `reduce`, the animation or transition MUST resolve to `animation: none` or `transition: none`. Static visual states (e.g. colours, presence) MUST remain unaffected.

**Current animated surfaces in scope:**

| Component | Class / selector | Animation | Risk level |
|---|---|---|---|
| `AgentPane.tsx` | `.pill.dispatching`, `.pill.thinking`, `.pill.streaming` | `pill-pulse` (1.4s / 1.1s / 0.6s infinite) | HIGH vestibular |
| `MessageBubble.tsx` | `.pending-dot` (or equivalent) | `pulse` (1.1s infinite) | HIGH vestibular |

**Known defects (outstanding):**
- `AgentPane.tsx` — existing RM guard targets `.pane` (wrong selector); defective. Filed as #276.
- `MessageBubble.tsx` — no RM guard at all. Filed as #277. Both addressed in US-062.

**Measurement (Playwright):**
```ts
// Emulate reduced-motion preference
const context = await browser.newContext({ reducedMotion: 'reduce' });
const page = await context.newPage();
// ...navigate to dashboard...

// AgentPane pill — all three states must resolve to animation: none
for (const cls of ['dispatching', 'thinking', 'streaming']) {
  const animValue = await page.locator(`.pill.${cls}`).evaluate(
    el => getComputedStyle(el).animationName
  );
  expect(animValue).toBe('none');
}

// MessageBubble pending dot
const pendingAnim = await page.locator('.pending-dot').evaluate(
  el => getComputedStyle(el).animationName
);
expect(pendingAnim).toBe('none');
```

**Introduced:** Wave 104 — US-061 NFR gate. Defects filed as #276 / #277. Remediation: US-062.

---

### NFR-MOTION-002 — Co-location rule for future animated surfaces

**Requirement:** Any new animated surface introduced in future features (e.g. tablet / mobile responsive surfaces in US-061's scope) MUST ship its `@media (prefers-reduced-motion: reduce)` guard co-located with the animation declaration — in the same file, with a selector that exactly matches the animated element.

**Rationale:** The defect in `AgentPane.tsx` (#276) demonstrates that a guard targeting a parent selector is silently defeated. Co-location makes selector drift a visible diff-level mistake during code review.

**Pattern (required):**
```css
/* animation declaration */
.my-element {
  animation: my-pulse 1.2s ease-in-out infinite;
}
/* guard MUST immediately follow, same file */
@media (prefers-reduced-motion: reduce) {
  .my-element {
    animation: none;
  }
}
```

**Code review gate:** Architect will FAIL any PR that introduces a new animation without an adjacent RM guard in the same diff hunk.

**Introduced:** Wave 104 — US-061 NFR gate.

---

## Performance

*No quantified NFRs defined yet. Placeholder — update with p99 latency + bundle-size targets when baselines are established.*

## Security

*No quantified NFRs defined yet. Placeholder — update from STRIDE-lite analysis when threat model is drafted.*

## Observability

*No quantified NFRs defined yet. Placeholder — update when structured logging baseline is established.*

## Scalability / Availability

*Single-user local app — no distributed NFRs applicable at this stage.*
