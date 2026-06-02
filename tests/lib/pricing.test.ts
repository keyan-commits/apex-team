// When you change MODEL_PRICING in src/lib/pricing.ts, update this snapshot.
// The test is intentional friction — verify against https://platform.claude.com/docs/en/about-claude/pricing before bumping a value.
import { describe, it, expect } from "vitest";
import { MODEL_PRICING } from "@/lib/pricing";

describe("MODEL_PRICING snapshot — update test when prices change", () => {
  it("claude-opus-4-8", () => {
    expect(MODEL_PRICING["claude-opus-4-8"]).toMatchObject({
      inputPerMTok: 5, outputPerMTok: 25,
      cacheCreationPerMTok: 6.25, cacheReadPerMTok: 0.5,
    });
  });

  it("claude-opus-4-7 is absent (retired)", () => {
    expect(MODEL_PRICING["claude-opus-4-7"]).toBeUndefined();
  });

  it("claude-sonnet-4-6", () => {
    expect(MODEL_PRICING["claude-sonnet-4-6"]).toMatchObject({
      inputPerMTok: 3, outputPerMTok: 15,
      cacheCreationPerMTok: 3.75, cacheReadPerMTok: 0.3,
    });
  });

  it("claude-haiku-4-5-20251001", () => {
    expect(MODEL_PRICING["claude-haiku-4-5-20251001"]).toMatchObject({
      inputPerMTok: 1, outputPerMTok: 5,
      cacheCreationPerMTok: 1.25, cacheReadPerMTok: 0.1,
    });
  });

  it("gemini-2.5-flash", () => {
    expect(MODEL_PRICING["gemini-2.5-flash"]).toMatchObject({
      inputPerMTok: 0.075, outputPerMTok: 0.30,
    });
  });

  it("llama-3.3-70b-versatile", () => {
    expect(MODEL_PRICING["llama-3.3-70b-versatile"]).toMatchObject({
      inputPerMTok: 0.59, outputPerMTok: 0.59,
    });
  });
});
