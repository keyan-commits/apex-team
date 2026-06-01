import { describe, it, expect } from "vitest";
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
