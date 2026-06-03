// Tests for StallSettingsDrawer a11y logic — US-060 (#226).
// Pure-function tests; DOM/a11y-tree assertions (AC1, AC5) live in Playwright
// smoke — see nfr.md for the pre-written Playwright assertion shapes.
import { describe, it, expect } from "vitest";

// ─── notifDisabled predicate ──────────────────────────────────────────────────
// Mirrors the component's `notifDisabled` expression.
type PermState = NotificationPermission | "unavailable" | null;
function notifDisabled(perm: PermState): boolean {
  return perm === "denied" || perm === "unavailable";
}

describe("notifDisabled — notification checkbox disabled state", () => {
  it("disabled when permission denied (AC3)", () => {
    expect(notifDisabled("denied")).toBe(true);
  });

  it("disabled when Notification API unavailable (AC3)", () => {
    expect(notifDisabled("unavailable")).toBe(true);
  });

  it("enabled when permission not yet requested", () => {
    expect(notifDisabled("default")).toBe(false);
  });

  it("enabled when permission granted", () => {
    expect(notifDisabled("granted")).toBe(false);
  });

  it("enabled when permission state not yet read (null)", () => {
    expect(notifDisabled(null)).toBe(false);
  });
});

// ─── Tab trap boundary detection ─────────────────────────────────────────────
// Mirrors the Tab-trap handler logic in the component.
// Given the current focused element index in the focusable list, returns
// whether Tab/Shift+Tab should be intercepted and where focus should land.
function tabTrapDecision(
  currentIndex: number,
  total: number,
  shiftKey: boolean,
): { intercept: boolean; nextIndex: number } {
  if (total === 0) return { intercept: false, nextIndex: -1 };
  const first = 0;
  const last = total - 1;
  if (shiftKey && currentIndex === first) return { intercept: true, nextIndex: last };
  if (!shiftKey && currentIndex === last) return { intercept: true, nextIndex: first };
  return { intercept: false, nextIndex: -1 };
}

describe("Tab trap — boundary wrapping (AC4)", () => {
  // 4 focusable elements: close button + 3 checkboxes
  const TOTAL = 4;

  it("Tab on last element → intercept, wrap to first", () => {
    const result = tabTrapDecision(3, TOTAL, false);
    expect(result.intercept).toBe(true);
    expect(result.nextIndex).toBe(0);
  });

  it("Shift+Tab on first element → intercept, wrap to last", () => {
    const result = tabTrapDecision(0, TOTAL, true);
    expect(result.intercept).toBe(true);
    expect(result.nextIndex).toBe(3);
  });

  it("Tab on non-last element → no intercept", () => {
    const result = tabTrapDecision(1, TOTAL, false);
    expect(result.intercept).toBe(false);
  });

  it("Shift+Tab on non-first element → no intercept", () => {
    const result = tabTrapDecision(2, TOTAL, true);
    expect(result.intercept).toBe(false);
  });

  it("empty focusable list → no intercept", () => {
    const result = tabTrapDecision(0, 0, false);
    expect(result.intercept).toBe(false);
  });

  it("single element → Tab wraps to itself", () => {
    const fwd = tabTrapDecision(0, 1, false);
    expect(fwd.intercept).toBe(true);
    expect(fwd.nextIndex).toBe(0);

    const bwd = tabTrapDecision(0, 1, true);
    expect(bwd.intercept).toBe(true);
    expect(bwd.nextIndex).toBe(0);
  });
});
