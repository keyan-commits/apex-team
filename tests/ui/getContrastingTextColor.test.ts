// WCAG contrast helper — verifies legible text on GitHub label background colors.
// Logic mirrors page.tsx getContrastingTextColor verbatim — edit both together.
import { describe, it, expect } from "vitest";

function getContrastingTextColor(bgHex: string): string {
  if (!bgHex.startsWith("#") || bgHex.length < 7) return "#fff";
  const lin = (c: number) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const r = lin(parseInt(bgHex.slice(1, 3), 16) / 255);
  const g = lin(parseInt(bgHex.slice(3, 5), 16) / 255);
  const b = lin(parseInt(bgHex.slice(5, 7), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.179 ? "#000" : "#fff";
}

describe("getContrastingTextColor", () => {
  it("returns #000 on enhancement light teal #a2eeef (regression #195)", () => {
    expect(getContrastingTextColor("#a2eeef")).toBe("#000");
  });

  it("returns #000 on GitHub bug red #d73a4a (luminance ~0.180, marginally above threshold)", () => {
    // L≈0.179 — both #000 (4.60:1) and #fff (4.57:1) pass AA; #000 gives slightly more contrast.
    expect(getContrastingTextColor("#d73a4a")).toBe("#000");
  });

  it("returns #000 on light ux yellow #e4e669", () => {
    expect(getContrastingTextColor("#e4e669")).toBe("#000");
  });

  it("returns #fff on dark self-improvement purple #5319e7", () => {
    expect(getContrastingTextColor("#5319e7")).toBe("#fff");
  });

  it("returns #000 on pure white #ffffff", () => {
    expect(getContrastingTextColor("#ffffff")).toBe("#000");
  });

  it("returns #fff on pure black #000000", () => {
    expect(getContrastingTextColor("#000000")).toBe("#fff");
  });

  it("returns #fff on invalid / CSS-var input", () => {
    expect(getContrastingTextColor("var(--accent-info)")).toBe("#fff");
    expect(getContrastingTextColor("#abc")).toBe("#fff"); // too short
  });
});
