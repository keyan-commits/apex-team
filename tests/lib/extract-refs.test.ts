import { describe, it, expect } from "vitest";
import { extractRefs } from "../../src/lib/extract-refs";

describe("extractRefs", () => {
  it("extracts a single ticket ref", () => {
    expect(extractRefs("#101").tickets).toEqual([101]);
  });

  it("extracts multiple ticket refs from Closes line", () => {
    const { tickets } = extractRefs("Closes #99 and #100");
    expect(tickets).toEqual([99, 100]);
  });

  it("extracts wave ref", () => {
    const { waves } = extractRefs("Wave 48 — Phase 2");
    expect(waves).toEqual([48]);
  });

  it("extracts both tickets and waves from combined content", () => {
    const refs = extractRefs("Wave 48 — closes #101");
    expect(refs.tickets).toEqual([101]);
    expect(refs.waves).toEqual([48]);
  });

  it("ignores hex literals and html entities", () => {
    // 0xff#abc — # preceded by word char (f); &#123; — # preceded by &; color:#abc — #abc has no digits
    const { tickets } = extractRefs("0xff#abc &#123; color:#abc");
    expect(tickets).toEqual([]);
  });

  it("deduplicates repeated ticket refs", () => {
    const { tickets } = extractRefs("#5 again #5");
    expect(tickets).toEqual([5]);
  });

  it("returns empty arrays for content with no refs", () => {
    const refs = extractRefs("no refs here");
    expect(refs.tickets).toEqual([]);
    expect(refs.waves).toEqual([]);
  });
});
