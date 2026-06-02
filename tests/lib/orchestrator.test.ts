import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseAgentReply } from "@/lib/orchestrator";

describe("parseAgentReply — inline-mention guard (Bug B fix)", () => {
  // ── NOTES ──────────────────────────────────────────────────────────────────

  it("parses NOTES block at start of string (regression)", () => {
    const raw = "[[NOTES]]\nhandoff content\n[[/NOTES]]\nVisible text";
    const result = parseAgentReply(raw);
    expect(result.newHandoffDoc).toBe("handoff content");
    expect(result.visibleText).toBe("Visible text");
  });

  it("parses NOTES block after visible prose", () => {
    const raw = "Visible text\n[[NOTES]]\nhandoff content\n[[/NOTES]]";
    const result = parseAgentReply(raw);
    expect(result.newHandoffDoc).toBe("handoff content");
    expect(result.visibleText).toBe("Visible text");
  });

  it("ignores inline backtick [[NOTES]] mention — no real block present", () => {
    const raw =
      "Update the `[[NOTES]]` block for your own state. Nothing to commit yet.";
    const result = parseAgentReply(raw);
    expect(result.newHandoffDoc).toBeNull();
    expect(result.visibleText).toBe(
      "Update the `[[NOTES]]` block for your own state. Nothing to commit yet.",
    );
  });

  it("parses only the real NOTES block when prose also contains an inline mention", () => {
    const raw =
      "Use `[[NOTES]]` for state.\n[[NOTES]]\nreal handoff\n[[/NOTES]]";
    const result = parseAgentReply(raw);
    expect(result.newHandoffDoc).toBe("real handoff");
    expect(result.visibleText).toContain("Use `[[NOTES]]` for state.");
    expect(result.visibleText).not.toContain("real handoff");
  });

  // ── HANDOFF ────────────────────────────────────────────────────────────────

  it("parses HANDOFF block at start of line (regression)", () => {
    const raw = "Some visible text.\n[[HANDOFF: qa]]\nPlease test PR #99.\n[[/HANDOFF]]";
    const result = parseAgentReply(raw);
    expect(result.handoffs).toHaveLength(1);
    expect(result.handoffs[0].to).toBe("qa");
    expect(result.handoffs[0].message).toBe("Please test PR #99.");
    expect(result.visibleText).toBe("Some visible text.");
  });

  it("ignores inline [[HANDOFF: qa]] mention — no real block present", () => {
    const raw =
      "Send a `[[HANDOFF: qa]]` block to request QA testing. Nothing to send now.";
    const result = parseAgentReply(raw);
    expect(result.handoffs).toHaveLength(0);
    expect(result.visibleText).toBe(
      "Send a `[[HANDOFF: qa]]` block to request QA testing. Nothing to send now.",
    );
  });

  it("parses only the real HANDOFF block when prose also contains an inline mention", () => {
    const raw =
      "Emit a `[[HANDOFF: qa]]` to hand off.\n[[HANDOFF: qa]]\nActual message.\n[[/HANDOFF]]";
    const result = parseAgentReply(raw);
    expect(result.handoffs).toHaveLength(1);
    expect(result.handoffs[0].message).toBe("Actual message.");
    expect(result.visibleText).toContain("Emit a `[[HANDOFF: qa]]` to hand off.");
  });

  // ── DISPATCH ───────────────────────────────────────────────────────────────

  it("parses DISPATCH block at start of line (regression)", () => {
    const raw =
      "PO decision.\n[[DISPATCH: backend-developer]]\nImplement feature X.\n[[/DISPATCH]]";
    const result = parseAgentReply(raw);
    expect(result.dispatches).toHaveLength(1);
    expect(result.dispatches[0].to).toBe("backend-developer");
    expect(result.dispatches[0].message).toBe("Implement feature X.");
  });

  it("ignores inline [[DISPATCH: backend-developer]] mention — no real block present", () => {
    const raw =
      "Emit a `[[DISPATCH: backend-developer]]` block to fire their turn. Not doing it now.";
    const result = parseAgentReply(raw);
    expect(result.dispatches).toHaveLength(0);
    expect(result.visibleText).toBe(
      "Emit a `[[DISPATCH: backend-developer]]` block to fire their turn. Not doing it now.",
    );
  });

  it("parses only the real DISPATCH block when prose also contains an inline mention", () => {
    const raw =
      "Use `[[DISPATCH: qa]]` to trigger QA.\n[[DISPATCH: qa]]\nActual dispatch body.\n[[/DISPATCH]]";
    const result = parseAgentReply(raw);
    expect(result.dispatches).toHaveLength(1);
    expect(result.dispatches[0].message).toBe("Actual dispatch body.");
    expect(result.visibleText).toContain("Use `[[DISPATCH: qa]]` to trigger QA.");
  });

  // ── AGENT-MODELS ───────────────────────────────────────────────────────────

  it("parses AGENT-MODELS block at start of string (regression)", () => {
    const raw =
      "[[AGENT-MODELS]]\nproduct-owner: claude-opus-4-8\narchitect: claude-opus-4-8\n[[/AGENT-MODELS]]\nPO text.";
    const result = parseAgentReply(raw);
    expect(result.agentModels).not.toBeNull();
    expect(result.agentModels?.["product-owner"]).toBe("claude-opus-4-8");
    expect(result.agentModels?.["architect"]).toBe("claude-opus-4-8");
    expect(result.visibleText).toBe("PO text.");
  });

  it("ignores inline [[AGENT-MODELS]] mention — no real block present", () => {
    const raw =
      "The `[[AGENT-MODELS]]` block sets per-role models. No block emitted here.";
    const result = parseAgentReply(raw);
    expect(result.agentModels).toBeNull();
    expect(result.visibleText).toBe(
      "The `[[AGENT-MODELS]]` block sets per-role models. No block emitted here.",
    );
  });

  it("parses only the real AGENT-MODELS block when prose also contains an inline mention", () => {
    const raw =
      "Use `[[AGENT-MODELS]]` to set defaults.\n[[AGENT-MODELS]]\nproduct-owner: claude-opus-4-8\n[[/AGENT-MODELS]]";
    const result = parseAgentReply(raw);
    expect(result.agentModels).not.toBeNull();
    expect(result.agentModels?.["product-owner"]).toBe("claude-opus-4-8");
    expect(result.visibleText).toContain(
      "Use `[[AGENT-MODELS]]` to set defaults.",
    );
  });
});

// ── DISPATCH model override (Wave 51) ──────────────────────────────────────

describe("parseAgentReply — DISPATCH model override", () => {
  it("parses DISPATCH block with model: field", () => {
    const raw =
      "PO decision.\n[[DISPATCH: backend-developer model:claude-sonnet-4-6]]\nImplement it.\n[[/DISPATCH]]";
    const result = parseAgentReply(raw);
    expect(result.dispatches).toHaveLength(1);
    expect(result.dispatches[0].to).toBe("backend-developer");
    expect(result.dispatches[0].model).toBe("claude-sonnet-4-6");
    expect(result.dispatches[0].message).toBe("Implement it.");
  });

  it("parses DISPATCH block without model: field — model is undefined", () => {
    const raw =
      "PO decision.\n[[DISPATCH: qa]]\nTest it.\n[[/DISPATCH]]";
    const result = parseAgentReply(raw);
    expect(result.dispatches).toHaveLength(1);
    expect(result.dispatches[0].to).toBe("qa");
    expect(result.dispatches[0].model).toBeUndefined();
  });
});

// ── All 7 team role-ids (#154 + #137 regression guard) ────────────────────

describe("parseAgentReply — all 7 team role-ids parse in DISPATCH_RE and HANDOFF_RE", () => {
  const ALL_TEAM_ROLES = [
    "business-analyst",
    "architect",
    "ui-developer",
    "backend-developer",
    "qa",
    "devsecops",
    "ux-designer",
  ] as const;

  for (const role of ALL_TEAM_ROLES) {
    it(`DISPATCH: ${role} parses correctly`, () => {
      const raw = `PO decision.\n[[DISPATCH: ${role}]]\nDo the work.\n[[/DISPATCH]]`;
      const result = parseAgentReply(raw);
      expect(result.dispatches).toHaveLength(1);
      expect(result.dispatches[0].to).toBe(role);
      expect(result.dispatches[0].message).toBe("Do the work.");
    });

    it(`HANDOFF: ${role} parses correctly`, () => {
      const raw = `Some text.\n[[HANDOFF: ${role}]]\nHere is the handoff.\n[[/HANDOFF]]`;
      const result = parseAgentReply(raw);
      expect(result.handoffs).toHaveLength(1);
      expect(result.handoffs[0].to).toBe(role);
      expect(result.handoffs[0].message).toBe("Here is the handoff.");
    });
  }

  it("nested [orchestrator \u2192 role] text inside a DISPATCH body does not misroute", () => {
    const raw =
      "[[DISPATCH: ui-developer]]\n[orchestrator \u2192 architect] This IS for you, Architect.\n[[/DISPATCH]]";
    const result = parseAgentReply(raw);
    expect(result.dispatches).toHaveLength(1);
    expect(result.dispatches[0].to).toBe("ui-developer");
  });

  it("unrecognized role-id in DISPATCH body text does not produce a dispatch", () => {
    const raw =
      "[[DISPATCH: qa]]\nSee also [orchestrator \u2192 unknown-role] for context.\n[[/DISPATCH]]";
    const result = parseAgentReply(raw);
    expect(result.dispatches).toHaveLength(1);
    expect(result.dispatches[0].to).toBe("qa");
  });
});

// ── #164 — Tolerant fallback for unclosed DISPATCH/HANDOFF blocks ─────────

describe("parseAgentReply — tolerant fallback for missing [[/DISPATCH]] / [[/HANDOFF]]", () => {
  beforeEach(() => {
    // Suppress the expected console.warn from auto-termination diagnostics.
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("DISPATCH without closer terminated at next DISPATCH opener", () => {
    const raw =
      "Decision.\n[[DISPATCH: backend-developer]]\nWork A line 1.\nWork A line 2.\n[[DISPATCH: qa]]\nWork B line 1.\n[[/DISPATCH]]";
    const result = parseAgentReply(raw);
    expect(result.dispatches).toHaveLength(2);
    expect(result.dispatches[0].to).toBe("qa");
    expect(result.dispatches[0].message).toBe("Work B line 1.");
    expect(result.dispatches[1].to).toBe("backend-developer");
    expect(result.dispatches[1].message).toContain("Work A line 1.");
    expect(result.dispatches[1].message).toContain("Work A line 2.");
  });

  it("DISPATCH without closer terminated at [[HANDOFF: ...]] opener", () => {
    const raw =
      "[[DISPATCH: backend-developer]]\nDo this work.\n[[HANDOFF: architect]]\nHandoff body.\n[[/HANDOFF]]";
    const result = parseAgentReply(raw);
    expect(result.dispatches).toHaveLength(1);
    expect(result.dispatches[0].to).toBe("backend-developer");
    expect(result.dispatches[0].message).toBe("Do this work.");
    expect(result.handoffs).toHaveLength(1);
    expect(result.handoffs[0].to).toBe("architect");
  });

  it("DISPATCH without closer terminated at --- horizontal rule", () => {
    const raw =
      "[[DISPATCH: qa]]\nRun the tests.\nReport status.\n---\n\nNext section of prose.";
    const result = parseAgentReply(raw);
    expect(result.dispatches).toHaveLength(1);
    expect(result.dispatches[0].to).toBe("qa");
    expect(result.dispatches[0].message).toContain("Run the tests.");
    expect(result.dispatches[0].message).toContain("Report status.");
    expect(result.visibleText).toContain("Next section of prose.");
  });

  it("DISPATCH without closer at end-of-text captures everything to EOF", () => {
    const raw = "[[DISPATCH: ui-developer]]\nFix the bug.\nWrite a test.";
    const result = parseAgentReply(raw);
    expect(result.dispatches).toHaveLength(1);
    expect(result.dispatches[0].to).toBe("ui-developer");
    expect(result.dispatches[0].message).toBe("Fix the bug.\nWrite a test.");
  });

  it("DISPATCH with model: clause parses correctly without closer", () => {
    const raw =
      "[[DISPATCH: backend-developer model:claude-sonnet-4-6]]\nDo the work.\n---";
    const result = parseAgentReply(raw);
    expect(result.dispatches).toHaveLength(1);
    expect(result.dispatches[0].to).toBe("backend-developer");
    expect(result.dispatches[0].model).toBe("claude-sonnet-4-6");
    expect(result.dispatches[0].message).toBe("Do the work.");
  });

  it("HANDOFF without closer terminated at next opener", () => {
    const raw =
      "[[HANDOFF: architect]]\nReview please.\n[[HANDOFF: qa]]\nThen test.\n[[/HANDOFF]]";
    const result = parseAgentReply(raw);
    expect(result.handoffs).toHaveLength(2);
    expect(result.handoffs.map((h) => h.to).sort()).toEqual(["architect", "qa"]);
  });

  it("properly-closed blocks STILL preferred (strict regex first)", () => {
    const raw =
      "[[DISPATCH: qa]]\nProperly closed.\n[[/DISPATCH]]\n[[DISPATCH: architect]]\nUnclosed body.";
    const result = parseAgentReply(raw);
    expect(result.dispatches).toHaveLength(2);
    const qa = result.dispatches.find((d) => d.to === "qa");
    const arch = result.dispatches.find((d) => d.to === "architect");
    expect(qa?.message).toBe("Properly closed.");
    expect(arch?.message).toBe("Unclosed body.");
  });

  it("warns on auto-termination so drift is observable", () => {
    const warnSpy = vi.spyOn(console, "warn");
    parseAgentReply("[[DISPATCH: qa]]\nNo closer.");
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("missing [[/DISPATCH]] closer"),
    );
  });
});
