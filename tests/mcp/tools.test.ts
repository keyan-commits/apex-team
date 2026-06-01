/**
 * MCP tool handler tests — verify that talk_to_product_owner and talk_to_role
 * call runTurn exactly once (no fan-out) and return structured dispatch/handoff data.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { RunTurnResult } from "@/lib/run-turn";
import type { TeamRoleId } from "@/types";
import { getThreadAgentModels, setThreadWorkspace } from "@/lib/db";

const mockRunTurn = vi.fn();
const mockRunTurnWithDispatches = vi.fn();

vi.mock("@/lib/run-turn", () => ({
  runTurn: mockRunTurn,
}));

vi.mock("@/lib/run-turn-with-dispatches", () => ({
  runTurnWithDispatches: mockRunTurnWithDispatches,
}));

vi.mock("@/lib/db", () => ({
  appendMessage: vi.fn(),
  getAgentState: vi.fn(() => ({ handoffDoc: "", updatedAt: Date.now() })),
  getThreadAgentModels: vi.fn(() => null),
  listMessages: vi.fn(() => []),
  listPendingInbox: vi.fn(() => []),
  setThreadWorkspace: vi.fn(),
}));

vi.mock("@/lib/active-thread", () => ({
  setActiveThread: vi.fn(),
}));

vi.mock("@/lib/providers", () => ({
  defaultAgentConfig: vi.fn(() => ({ provider: "claude", model: "claude-sonnet-4-6" })),
}));

vi.mock("@/lib/roles", () => ({
  ALL_ROLES: ["product-owner", "business-analyst", "architect"],
  TEAM_ROLES: ["business-analyst", "architect"],
  isTeamRole: vi.fn(() => false),
  DEFAULT_ROLE_MODELS: {
    "product-owner": "claude-opus-4-8",
    "architect": "claude-opus-4-8",
    "business-analyst": "claude-sonnet-4-6",
  },
}));

vi.mock("node:fs", () => ({
  existsSync: vi.fn(() => false),
  readdirSync: vi.fn(() => []),
  readFileSync: vi.fn(() => ""),
  statSync: vi.fn(() => ({ isDirectory: () => true })),
}));

type ToolResult = { content: { type: string; text: string }[] };
type ToolHandler = (args: Record<string, unknown>) => Promise<ToolResult>;

function buildCapturingServer(): {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  server: any;
  getHandler: (name: string) => ToolHandler;
} {
  const handlers = new Map<string, ToolHandler>();
  const server = {
    registerTool(_name: string, _opts: unknown, handler: ToolHandler) {
      handlers.set(_name, handler);
    },
  };
  return { server, getHandler: (name) => handlers.get(name)! };
}

const baseResult: RunTurnResult = {
  visibleText: "Agent reply",
  rawBuffer: "Agent reply",
  newHandoffDoc: null,
  handoffs: [],
  dispatches: [],
  agentModels: null,
};

const basePOResult = { ...baseResult, peerReplies: [] };

describe("talk_to_product_owner", () => {
  let getHandler: (name: string) => ToolHandler;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { server, getHandler: gh } = buildCapturingServer();
    getHandler = gh;
    const { registerApexTeamTools } = await import("@/mcp/tools");
    registerApexTeamTools(server);
  });

  it("calls runTurnWithDispatches exactly once (peer fan-out handled internally)", async () => {
    mockRunTurnWithDispatches.mockResolvedValueOnce({
      ...basePOResult,
      dispatches: [
        { to: "business-analyst" as TeamRoleId, message: "Spec feature X" },
        { to: "architect" as TeamRoleId, message: "Review scope" },
      ],
      peerReplies: [
        { role: "business-analyst" as TeamRoleId, result: { ...baseResult, visibleText: "BA ran" } },
        { role: "architect" as TeamRoleId, result: { ...baseResult, visibleText: "Arch ran" } },
      ],
    });

    const handler = getHandler("talk_to_product_owner");
    await handler({ message: "Build feature X", thread_id: "t1" });

    expect(mockRunTurnWithDispatches).toHaveBeenCalledTimes(1);
    // talk_to_role's runTurn should NOT be called — peers ran inside runTurnWithDispatches
    expect(mockRunTurn).not.toHaveBeenCalled();
  });

  it("returns auto-triggered peer replies in result text", async () => {
    mockRunTurnWithDispatches.mockResolvedValueOnce({
      ...basePOResult,
      dispatches: [
        { to: "business-analyst" as TeamRoleId, message: "Spec feature X" },
        { to: "architect" as TeamRoleId, message: "Review scope" },
      ],
      peerReplies: [
        { role: "business-analyst" as TeamRoleId, result: { ...baseResult, visibleText: "BA reply" } },
        { role: "architect" as TeamRoleId, result: { ...baseResult, visibleText: "Arch reply" } },
      ],
    });

    const handler = getHandler("talk_to_product_owner");
    const result = await handler({ message: "Build feature X", thread_id: "t1" });

    const text = result.content[0].text;
    expect(text).toContain("business-analyst");
    expect(text).toContain("architect");
    expect(text).toContain("auto-triggered");
    expect(text).not.toContain("NOT auto-triggered — call talk_to_role for each dispatched role");
  });

  it("includes PO visible text in result", async () => {
    mockRunTurnWithDispatches.mockResolvedValueOnce({ ...basePOResult, visibleText: "My PO decision" });

    const handler = getHandler("talk_to_product_owner");
    const result = await handler({ message: "Status?", thread_id: "t1" });

    expect(result.content[0].text).toContain("My PO decision");
  });

  it("includes dispatched peer visible text when peers run", async () => {
    mockRunTurnWithDispatches.mockResolvedValueOnce({
      ...basePOResult,
      dispatches: [{ to: "qa" as TeamRoleId, message: "Test this" }],
      peerReplies: [{ role: "qa" as TeamRoleId, result: { ...baseResult, visibleText: "QA ran" } }],
    });

    const handler = getHandler("talk_to_product_owner");
    const result = await handler({ message: "Go", thread_id: "t1" });

    const text = result.content[0].text;
    expect(text).toContain("qa");
    expect(text).toContain("QA ran");
    expect(text).toContain("auto-triggered");
  });

  it("response has no peer section when PO emits no dispatches", async () => {
    mockRunTurnWithDispatches.mockResolvedValueOnce({ ...basePOResult, peerReplies: [] });

    const handler = getHandler("talk_to_product_owner");
    const result = await handler({ message: "Status?", thread_id: "t1" });

    const text = result.content[0].text;
    expect(text).not.toContain("Dispatched peers");
    expect(mockRunTurnWithDispatches).toHaveBeenCalledTimes(1);
  });

  it("uses claude-opus-4-8 for product-owner and architect when no stored models", async () => {
    vi.mocked(getThreadAgentModels).mockReturnValueOnce(null);
    mockRunTurnWithDispatches.mockResolvedValueOnce(basePOResult);

    const handler = getHandler("talk_to_product_owner");
    await handler({ message: "Go", thread_id: "t1" });

    const agents = mockRunTurnWithDispatches.mock.calls[0][0].agents;
    expect(agents["product-owner"].model).toBe("claude-opus-4-8");
    expect(agents["architect"].model).toBe("claude-opus-4-8");
    expect(agents["business-analyst"].model).toBe("claude-sonnet-4-6");
  });
});

describe("talk_to_role", () => {
  let getHandler: (name: string) => ToolHandler;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { server, getHandler: gh } = buildCapturingServer();
    getHandler = gh;
    const { registerApexTeamTools } = await import("@/mcp/tools");
    registerApexTeamTools(server);
  });

  it("calls runTurn exactly once regardless of dispatch count", async () => {
    mockRunTurn.mockResolvedValueOnce({
      ...baseResult,
      dispatches: [
        { to: "architect" as TeamRoleId, message: "Please review" },
        { to: "qa" as TeamRoleId, message: "Please test" },
      ],
    } satisfies RunTurnResult);

    const handler = getHandler("talk_to_role");
    await handler({ role: "product-owner", message: "Go", thread_id: "t1" });

    expect(mockRunTurn).toHaveBeenCalledTimes(1);
  });

  it("returns dispatch list in result text with NOT-auto-triggered wording", async () => {
    mockRunTurn.mockResolvedValueOnce({
      ...baseResult,
      dispatches: [{ to: "architect" as TeamRoleId, message: "Review this code" }],
    } satisfies RunTurnResult);

    const handler = getHandler("talk_to_role");
    const result = await handler({ role: "product-owner", message: "Go", thread_id: "t1" });

    const text = result.content[0].text;
    expect(text).toContain("architect");
    expect(text).toContain("NOT auto-triggered");
  });

  it("returns agent visible text in result", async () => {
    mockRunTurn.mockResolvedValueOnce({ ...baseResult, visibleText: "BA reply here" } satisfies RunTurnResult);

    const handler = getHandler("talk_to_role");
    const result = await handler({ role: "business-analyst", message: "Write story", thread_id: "t1" });

    expect(result.content[0].text).toContain("BA reply here");
  });

  it("uses claude-opus-4-8 for architect when no stored models", async () => {
    vi.mocked(getThreadAgentModels).mockReturnValueOnce(null);
    mockRunTurn.mockResolvedValueOnce(baseResult);

    const handler = getHandler("talk_to_role");
    await handler({ role: "architect", message: "Review this", thread_id: "t1" });

    const agents = mockRunTurn.mock.calls[0][0].agents;
    expect(agents["architect"].model).toBe("claude-opus-4-8");
  });

  it("uses stored model when getThreadAgentModels returns an override", async () => {
    vi.mocked(getThreadAgentModels).mockReturnValueOnce({ architect: "claude-opus-4-7" });
    mockRunTurn.mockResolvedValueOnce(baseResult);

    const handler = getHandler("talk_to_role");
    await handler({ role: "architect", message: "Review this", thread_id: "t1" });

    const agents = mockRunTurn.mock.calls[0][0].agents;
    expect(agents["architect"].model).toBe("claude-opus-4-7");
  });

  it("uses claude-sonnet-4-6 for non-opus roles when no stored models", async () => {
    vi.mocked(getThreadAgentModels).mockReturnValueOnce(null);
    mockRunTurn.mockResolvedValueOnce(baseResult);

    const handler = getHandler("talk_to_role");
    await handler({ role: "business-analyst", message: "Write story", thread_id: "t1" });

    const agents = mockRunTurn.mock.calls[0][0].agents;
    expect(agents["business-analyst"].model).toBe("claude-sonnet-4-6");
  });

  it("calls setThreadWorkspace when workspace arg is provided", async () => {
    mockRunTurn.mockResolvedValueOnce(baseResult);

    const handler = getHandler("talk_to_role");
    await handler({ role: "architect", message: "Go", thread_id: "t1", workspace: "/workspace/lfm" });

    expect(vi.mocked(setThreadWorkspace)).toHaveBeenCalledWith("t1", "/workspace/lfm");
  });

  it("does NOT call setThreadWorkspace when workspace arg is absent", async () => {
    mockRunTurn.mockResolvedValueOnce(baseResult);

    const handler = getHandler("talk_to_role");
    await handler({ role: "architect", message: "Go", thread_id: "t1" });

    expect(vi.mocked(setThreadWorkspace)).not.toHaveBeenCalled();
  });
});

describe("talk_to_product_owner workspace", () => {
  let getHandler: (name: string) => ToolHandler;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { server, getHandler: gh } = buildCapturingServer();
    getHandler = gh;
    const { registerApexTeamTools } = await import("@/mcp/tools");
    registerApexTeamTools(server);
  });

  it("calls setThreadWorkspace when workspace arg is provided", async () => {
    mockRunTurnWithDispatches.mockResolvedValueOnce(basePOResult);

    const handler = getHandler("talk_to_product_owner");
    await handler({ message: "Build X", thread_id: "t1", workspace: "/workspace/lfm" });

    expect(vi.mocked(setThreadWorkspace)).toHaveBeenCalledWith("t1", "/workspace/lfm");
  });

  it("does NOT call setThreadWorkspace when workspace arg is absent", async () => {
    mockRunTurnWithDispatches.mockResolvedValueOnce(basePOResult);

    const handler = getHandler("talk_to_product_owner");
    await handler({ message: "Build X", thread_id: "t1" });

    expect(vi.mocked(setThreadWorkspace)).not.toHaveBeenCalled();
  });
});
