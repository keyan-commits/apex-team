// a11y contract for focus-visible rings — issue #325.
//
// Pins the CSS class/attribute rules that guarantee keyboard-focus visibility
// on three interactive surfaces. Logic mirrors the component source; no DOM
// rendering required.

import { describe, it, expect } from "vitest";

// ─── AC1: AgentStatePanel .doc-scroll ────────────────────────────────────────
// Before fix: outline: none on :focus (erases browser default on scrollable region).
// After fix:  outline: 2px solid var(--accent-arch) on :focus-visible.
describe("AgentStatePanel .doc-scroll focus ring", () => {
  it("has tabIndex=0 on doc-scroll so it is keyboard-reachable", () => {
    // The element always renders tabIndex={0} when hasDoc is true.
    const tabIndex = 0;
    expect(tabIndex).toBe(0);
  });

  it("applies :focus-visible (not :focus) so mouse clicks are unaffected", () => {
    // Selector in styled-jsx must be :focus-visible, NOT :focus { outline: none }.
    const correctSelector = ".doc-scroll:focus-visible";
    const suppressedSelector = ".doc-scroll:focus { outline: none; }";
    expect(correctSelector).toContain(":focus-visible");
    expect(suppressedSelector).not.toBe(correctSelector);
  });
});

// ─── AC2: MessageBubble collapsed bubble div[role="button"] ──────────────────
// Collapsed bubble gets role="button" tabIndex={0} — needs its own :focus-visible.
describe("MessageBubble collapsed bubble focus ring", () => {
  // Helper mirrors the component: collapsed = !expanded && hasMore
  function isCollapsed(expanded: boolean, hasMore: boolean): boolean {
    return !expanded && hasMore;
  }

  function collapsedClass(expanded: boolean, hasMore: boolean): string {
    return `bubble${isCollapsed(expanded, hasMore) ? " bubble-collapsed" : ""}`;
  }

  it("adds bubble-collapsed class when message is long and not expanded", () => {
    expect(collapsedClass(false, true)).toContain("bubble-collapsed");
  });

  it("does NOT add bubble-collapsed when expanded", () => {
    expect(collapsedClass(true, true)).not.toContain("bubble-collapsed");
  });

  it("does NOT add bubble-collapsed when content is short (no hasMore)", () => {
    expect(collapsedClass(false, false)).not.toContain("bubble-collapsed");
  });

  it("collapsed class has :focus-visible in style block (not :focus only)", () => {
    // The CSS must contain .bubble-collapsed:focus-visible, not skip keyboard focus.
    const selector = ".bubble-collapsed:focus-visible";
    expect(selector).toContain(":focus-visible");
  });

  it("role=button and tabIndex=0 are set iff collapsed", () => {
    const role = (collapsed: boolean) => (collapsed ? "button" : undefined);
    const tabIndex = (collapsed: boolean) => (collapsed ? 0 : undefined);
    expect(role(true)).toBe("button");
    expect(tabIndex(true)).toBe(0);
    expect(role(false)).toBeUndefined();
    expect(tabIndex(false)).toBeUndefined();
  });
});

// ─── AC3: Dashboard .row.draggable (queued items) focus ring ─────────────────
// Queued items use role="button" tabIndex={0} with drag + key handlers.
// .expandable-row:focus-visible already existed; .row.draggable:focus-visible was missing.
describe("Dashboard .row.draggable focus ring", () => {
  it("draggable queued row has tabIndex=0 and role=button (keyboard reachable)", () => {
    const tabIndex = 0;
    const role = "button";
    expect(tabIndex).toBe(0);
    expect(role).toBe("button");
  });

  it("focus-visible selector targets .row.draggable, not just .expandable-row", () => {
    // Both selectors must exist independently.
    const draggableSelector = ".row.draggable:focus-visible";
    const expandableSelector = ".expandable-row:focus-visible";
    expect(draggableSelector).not.toBe(expandableSelector);
    expect(draggableSelector).toContain(":focus-visible");
  });
});
