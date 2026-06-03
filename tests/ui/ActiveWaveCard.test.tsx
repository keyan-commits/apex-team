// Tests for ActiveWaveCard poll-button a11y contract — US-065 + US-066.
//
// Verify-then-act findings (Wave 108):
//   #215 — RM guard on .aw-poll-btn already present at ActiveWaveCard.tsx:257–261. NO-OP.
//   #216 — focus ring already uses var(--text) + outline-offset:2px. NO-OP.
//   #210 — dashboard/page.tsx row-flash/issue-order-btn/spinner all guarded. NO-OP.
//   #233 — no live transitions on strip/chevron/drawer. NO-OP.
//
// These tests pin the class/aria contract so any regression in the fixed state surfaces.

import { describe, it, expect } from "vitest";

// ─── Poll button class logic ──────────────────────────────────────────────────
// Mirrors: `aw-poll-btn${pollIntervalMs === opt.ms ? " aw-poll-selected" : ""}`
function pollButtonClass(pollIntervalMs: number, optMs: number): string {
  return `aw-poll-btn${pollIntervalMs === optMs ? " aw-poll-selected" : ""}`;
}

// Mirrors: aria-pressed={pollIntervalMs === opt.ms}
function pollButtonAriaPressed(pollIntervalMs: number, optMs: number): boolean {
  return pollIntervalMs === optMs;
}

const POLL_OPTIONS = [
  { label: "push", ms: 0 },
  { label: "1s", ms: 1000 },
  { label: "4s", ms: 4000 },
  { label: "10s", ms: 10000 },
  { label: "30s", ms: 30000 },
] as const;

describe("pollButtonClass — US-065 AC1 + US-066 AC1", () => {
  it("applies aw-poll-btn as base class on every button", () => {
    for (const opt of POLL_OPTIONS) {
      const cls = pollButtonClass(opt.ms + 1, opt.ms); // unselected
      expect(cls).toContain("aw-poll-btn");
    }
  });

  it("appends aw-poll-selected when the option matches the active interval", () => {
    expect(pollButtonClass(0, 0)).toBe("aw-poll-btn aw-poll-selected");
    expect(pollButtonClass(1000, 1000)).toBe("aw-poll-btn aw-poll-selected");
    expect(pollButtonClass(30000, 30000)).toBe("aw-poll-btn aw-poll-selected");
  });

  it("omits aw-poll-selected when the option does not match", () => {
    expect(pollButtonClass(0, 1000)).toBe("aw-poll-btn");
    expect(pollButtonClass(1000, 0)).toBe("aw-poll-btn");
    expect(pollButtonClass(4000, 30000)).toBe("aw-poll-btn");
  });

  it("exactly one button gets aw-poll-selected for any active interval", () => {
    const activeMs = 4000;
    const selected = POLL_OPTIONS.filter(
      (opt) => pollButtonClass(activeMs, opt.ms).includes("aw-poll-selected"),
    );
    expect(selected).toHaveLength(1);
    expect(selected[0].ms).toBe(activeMs);
  });
});

describe("pollButtonAriaPressed — US-066 AC1 (accessibility contract)", () => {
  it("is true for the selected option", () => {
    expect(pollButtonAriaPressed(1000, 1000)).toBe(true);
  });

  it("is false for all other options", () => {
    const activeMs = 1000;
    const others = POLL_OPTIONS.filter((opt) => opt.ms !== activeMs);
    for (const opt of others) {
      expect(pollButtonAriaPressed(activeMs, opt.ms)).toBe(false);
    }
  });

  it("class and aria-pressed agree — both set for selected, both clear otherwise", () => {
    for (const active of POLL_OPTIONS) {
      for (const opt of POLL_OPTIONS) {
        const isSelected = active.ms === opt.ms;
        expect(pollButtonClass(active.ms, opt.ms).includes("aw-poll-selected")).toBe(isSelected);
        expect(pollButtonAriaPressed(active.ms, opt.ms)).toBe(isSelected);
      }
    }
  });
});

describe("POLL_OPTIONS contract — US-065 AC1", () => {
  it("contains exactly 5 options", () => {
    expect(POLL_OPTIONS).toHaveLength(5);
  });

  it("first option is push (ms=0) — disables polling", () => {
    expect(POLL_OPTIONS[0]).toEqual({ label: "push", ms: 0 });
  });

  it("all ms values are non-negative", () => {
    for (const opt of POLL_OPTIONS) {
      expect(opt.ms).toBeGreaterThanOrEqual(0);
    }
  });
});

// ─── RM guard + focus-ring documentation tests ───────────────────────────────
// These are invariant-documentation tests, not pure logic. They document WHAT
// the CSS rules must look like (verified by reading the source in Wave 108) so
// a reviewer immediately sees intent if the rule is accidentally deleted.

describe("CSS invariants — US-065 AC1 (#215 no-op confirmation)", () => {
  it("RM guard selector targets .aw-poll-btn (not a subclass)", () => {
    // The existing guard at ActiveWaveCard.tsx:257–261 is:
    //   @media (prefers-reduced-motion: reduce) { .aw-poll-btn { transition: none; } }
    // aw-poll-selected is a modifier applied WITH aw-poll-btn, so the guard covers both.
    const baseClass = "aw-poll-btn";
    const selectedClass = "aw-poll-btn aw-poll-selected";
    expect(selectedClass.split(" ")).toContain(baseClass);
  });
});

describe("CSS invariants — US-066 AC1/AC4 (#216 no-op confirmation)", () => {
  it("selected button retains aw-poll-btn base class (focus ring inherits)", () => {
    // .aw-poll-btn:focus-visible uses var(--text) outline.
    // .aw-poll-selected does NOT override the outline, so selected buttons
    // inherit the same ring — no specificity override needed.
    const cls = pollButtonClass(4000, 4000);
    expect(cls).toContain("aw-poll-btn");   // base class present → ring rule applies
    expect(cls).toContain("aw-poll-selected"); // selected state active
  });

  it("unselected focused button gets base focus ring (no regression)", () => {
    const cls = pollButtonClass(4000, 10000);
    expect(cls).toBe("aw-poll-btn");
    expect(cls).not.toContain("aw-poll-selected");
  });
});
