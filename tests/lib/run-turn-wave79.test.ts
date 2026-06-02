/**
 * Wave 79 (#171) — run-turn.ts PO-HANDOFF auto-promote tests.
 * ADR-006 cases 1–3.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAppendMessage = vi.fn();
const mockGetThreadAgentModels = vi.fn(() => null);
const mockSetAgentHandoffDoc = vi.fn();
const mockSetThreadAgentModels = vi.fn();
const mockRecordTurnUsage = vi.fn();

vi.mock("@/lib/db", () => ({
  appendMessage: mockAppendMessage,
  getThreadAgentModels: mockGetThreadAgentModels,
  setAgentHandoffDoc: mockSetAgentHandoffDoc,
  setThreadAgentModels: mockSetThreadAgentModels,
  recordTurnUsage: mockRecordTurnUsage,
}));

vi.mock("@/lib/event-bus", () => ({ publish: vi.fn() }));

vi.mock("@/lib/roles", () => ({
  ALL_ROLES: ["product-owner", "qa", "architect", "backend-developer"],
}));

vi.mock("@/lib/providers", () => ({
  DEFAULT_MODELS: { claude: "claude-sonnet-4-6" },
}));

const mockRunAgentTurn = vi.fn();
vi.mock("@/lib/agents", () => ({
  runAgentTurn: mockRunAgentTurn,
}));

async function* yieldOnce(text: string) {
  yield text;
}

const AGENTS = {
  "product-owner": { role: "product-owner", provider: "claude", model: "claude-opus-4-8" },
  "qa": { role: "qa", provider: "claude", model: "claude-sonnet-4-6" },
  "architect": { role: "architect", provider: "claude", model: "claude-opus-4-8" },
  "backend-developer": { role: "backend-developer", provider: "claude", model: "claude-sonnet-4-6" },
} as never;

describe("runTurn — Wave 79 PO-HANDOFF auto-promote (ADR-006 cases 1–3)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockGetThreadAgentModels.mockReturnValue(null);
  });

  it("case 1: PO HANDOFF→QA is promoted to a dispatch row + no handoff row written", async () => {
    mockRunAgentTurn.mockImplementation(() =>
      yieldOnce("[[HANDOFF: qa]]\nPlease test this.\n[[/HANDOFF]]"),
    );

    const { runTurn } = await import("@/lib/run-turn");
    const result = await runTurn({
      threadId: "t-79-case1",
      target: "product-owner",
      agents: AGENTS,
      signal: new AbortController().signal,
    });

    // Result.dispatches must include the promoted entry
    expect(result.dispatches).toContainEqual(
      expect.objectContaining({ to: "qa" }),
    );

    // appendMessage must have been called with kind:"dispatch" for qa
    const dispatchCalls = mockAppendMessage.mock.calls.filter(
      ([, author]) => author?.kind === "dispatch" && author?.to === "qa",
    );
    expect(dispatchCalls.length).toBe(1);

    // appendMessage must NOT have been called with kind:"handoff" for qa
    const handoffCalls = mockAppendMessage.mock.calls.filter(
      ([, author]) => author?.kind === "handoff" && author?.to === "qa",
    );
    expect(handoffCalls.length).toBe(0);
  });

  it("case 2: PO self-handoff [[HANDOFF: product-owner]] is dropped — no dispatch, no row", async () => {
    mockRunAgentTurn.mockImplementation(() =>
      yieldOnce("[[HANDOFF: product-owner]]\nSelf-note.\n[[/HANDOFF]]"),
    );

    const { runTurn } = await import("@/lib/run-turn");
    const result = await runTurn({
      threadId: "t-79-case2",
      target: "product-owner",
      agents: AGENTS,
      signal: new AbortController().signal,
    });

    // Not in dispatches
    expect(result.dispatches.map((d) => d.to)).not.toContain("product-owner");

    // No dispatch row for product-owner
    const poDispatch = mockAppendMessage.mock.calls.filter(
      ([, author]) => author?.kind === "dispatch" && author?.to === "product-owner",
    );
    expect(poDispatch.length).toBe(0);
  });

  it("case 3: peer→peer HANDOFF (Architect→BE Dev) stays as handoff row, NOT promoted", async () => {
    mockRunAgentTurn.mockImplementation(() =>
      yieldOnce("[[HANDOFF: backend-developer]]\nImplement X.\n[[/HANDOFF]]"),
    );

    const { runTurn } = await import("@/lib/run-turn");
    const result = await runTurn({
      threadId: "t-79-case3",
      target: "architect", // non-PO sender
      agents: AGENTS,
      signal: new AbortController().signal,
    });

    // Not in dispatches
    expect(result.dispatches.map((d) => d.to)).not.toContain("backend-developer");

    // handoff row persisted
    const handoffCalls = mockAppendMessage.mock.calls.filter(
      ([, author]) => author?.kind === "handoff" && author?.to === "backend-developer",
    );
    expect(handoffCalls.length).toBe(1);

    // dispatch row NOT written for backend-developer from this sender
    const dispatchCalls = mockAppendMessage.mock.calls.filter(
      ([, author]) => author?.kind === "dispatch" && author?.to === "backend-developer",
    );
    expect(dispatchCalls.length).toBe(0);
  });
});
