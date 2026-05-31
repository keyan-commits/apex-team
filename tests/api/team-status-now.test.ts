import { describe, it, expect } from "vitest";
import { deriveNowAndQueued } from "../../src/lib/derive-now-queued";
import type { RoleId } from "../../src/types";

const NOW = 1_000_000;
const RECENT = NOW - 60_000;    // 1 min ago — within 10m window
const OLD = NOW - 700_000;      // ~12 min ago — outside 10m window
const THRESHOLD = NOW - 600_000; // now10mMs

function trigger(id: number, createdAt: number, kind: "dispatch" | "user" = "dispatch") {
  return { id, content: "do something", createdAt, kind };
}

describe("deriveNowAndQueued", () => {
  it("unanswered trigger within 10m → now", () => {
    const triggers = new Map<RoleId, ReturnType<typeof trigger>>([
      ["architect", trigger(10, RECENT)],
    ]);
    const { now, queued } = deriveNowAndQueued(triggers, new Map(), THRESHOLD);
    expect(now).toHaveLength(1);
    expect(now[0].role).toBe("architect");
    expect(now[0].state).toBe("thinking");
    expect(queued).toHaveLength(0);
  });

  it("unanswered trigger older than 10m → queued", () => {
    const triggers = new Map<RoleId, ReturnType<typeof trigger>>([
      ["architect", trigger(10, OLD)],
    ]);
    const { now, queued } = deriveNowAndQueued(triggers, new Map(), THRESHOLD);
    expect(now).toHaveLength(0);
    expect(queued).toHaveLength(1);
    expect(queued[0].toRole).toBe("architect");
    expect(queued[0].fromRole).toBe("product-owner");
  });

  it("user-kind trigger → queued fromRole is 'user'", () => {
    const triggers = new Map<RoleId, ReturnType<typeof trigger>>([
      ["qa", trigger(5, OLD, "user")],
    ]);
    const { queued } = deriveNowAndQueued(triggers, new Map(), THRESHOLD);
    expect(queued[0].fromRole).toBe("user");
  });

  it("answered trigger (agent replied) → omitted from both panels", () => {
    const triggers = new Map<RoleId, ReturnType<typeof trigger>>([
      ["qa", trigger(5, RECENT)],
    ]);
    const lastAgentId = new Map<RoleId, number>([["qa", 10]]); // agent replied after trigger
    const { now, queued } = deriveNowAndQueued(triggers, lastAgentId, THRESHOLD);
    expect(now).toHaveLength(0);
    expect(queued).toHaveLength(0);
  });

  it("no triggers → both panels empty", () => {
    const { now, queued } = deriveNowAndQueued(new Map(), new Map(), THRESHOLD);
    expect(now).toHaveLength(0);
    expect(queued).toHaveLength(0);
  });

  it("mix of recent + old + answered → correct split", () => {
    const triggers = new Map<RoleId, ReturnType<typeof trigger>>([
      ["architect", trigger(1, RECENT)],      // recent → now
      ["qa", trigger(2, OLD)],                // old → queued
      ["backend-developer", trigger(3, RECENT)], // answered → omitted
    ]);
    const lastAgentId = new Map<RoleId, number>([["backend-developer", 5]]);
    const { now, queued } = deriveNowAndQueued(triggers, lastAgentId, THRESHOLD);
    expect(now.map((n) => n.role)).toContain("architect");
    expect(now.map((n) => n.role)).not.toContain("backend-developer");
    expect(queued.map((q) => q.toRole)).toContain("qa");
  });
});
