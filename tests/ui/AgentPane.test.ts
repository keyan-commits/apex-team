// Tests for the pillState / pillLabel state machine (US-032 — PENDING badge, closes #170).
// Logic mirrors AgentPane.tsx lines 161–173 verbatim — edit both together.
import { describe, it, expect } from "vitest";

function pillState(
  status: string | null,
  busy: boolean,
  pendingDraft: string | null,
  inboxCount: number,
): string {
  return status?.startsWith("error:") ? "error"
    : status === "dispatching" ? "dispatching"
    : busy && pendingDraft !== null ? "streaming"
    : busy ? "thinking"
    : inboxCount > 0 ? "pending"
    : "idle";
}

function pillLabel(state: string, inboxCount: number, status: string | null): string {
  return state === "error" ? (status ?? "error")
    : state === "dispatching" ? "dispatching"
    : state === "streaming" ? "streaming"
    : state === "thinking" ? "thinking…"
    : state === "pending" ? `pending(${inboxCount})`
    : "idle";
}

describe("pillState — PENDING", () => {
  it("is pending when not busy and inboxCount > 0", () => {
    expect(pillState(null, false, null, 1)).toBe("pending");
    expect(pillState(null, false, null, 2)).toBe("pending");
    expect(pillState("idle", false, null, 3)).toBe("pending");
  });

  it("is idle when not busy and inboxCount === 0", () => {
    expect(pillState(null, false, null, 0)).toBe("idle");
  });

  it("WORKING takes priority over PENDING", () => {
    expect(pillState(null, true, "draft", 5)).toBe("streaming");
    expect(pillState(null, true, null, 5)).toBe("thinking");
    expect(pillState("dispatching", false, null, 5)).toBe("dispatching");
  });

  it("ERROR takes priority over PENDING", () => {
    expect(pillState("error: something", false, null, 2)).toBe("error");
  });
});

describe("pillLabel — PENDING", () => {
  it("embeds inboxCount in label", () => {
    expect(pillLabel("pending", 1, null)).toBe("pending(1)");
    expect(pillLabel("pending", 3, null)).toBe("pending(3)");
  });

  it("other states unaffected", () => {
    expect(pillLabel("idle", 0, null)).toBe("idle");
    expect(pillLabel("thinking", 0, null)).toBe("thinking…");
    expect(pillLabel("streaming", 0, null)).toBe("streaming");
    expect(pillLabel("dispatching", 0, null)).toBe("dispatching");
    expect(pillLabel("error", 0, "error: oops")).toBe("error: oops");
  });
});
