import { vi, describe, it, expect } from "vitest";

// Hoisted mocks — must precede imports that load the route
const mockGetAgentState = vi.fn();
const mockListPendingInbox = vi.fn(() => []);

vi.mock("@/lib/db", () => ({
  getAgentState: mockGetAgentState,
  listPendingInbox: mockListPendingInbox,
}));
vi.mock("@/lib/roles", () => ({
  isTeamRole: vi.fn(() => true),
}));

describe("/api/agent-state GET — lastTurnAt in response shape (US-052 AC3)", () => {
  it("response body includes lastTurnAt from AgentState", async () => {
    const fakeState = {
      threadId: "t1",
      role: "qa",
      handoffDoc: "",
      updatedAt: 1000,
      lastTurnAt: 9_999_999,
    };
    mockGetAgentState.mockReturnValue(fakeState);

    const { GET } = await import("@/app/api/agent-state/route");
    const req = new Request(
      "http://localhost/api/agent-state?threadId=t1&role=qa",
      { method: "GET" },
    );
    const res = await GET(req as never);
    expect(res.status).toBe(200);
    const body = await res.json() as { state: typeof fakeState };
    expect(body.state.lastTurnAt).toBe(9_999_999);
  });

  it("response body handles null lastTurnAt (new thread)", async () => {
    const fakeState = {
      threadId: "t2",
      role: "architect",
      handoffDoc: "",
      updatedAt: 0,
      lastTurnAt: null,
    };
    mockGetAgentState.mockReturnValue(fakeState);

    const { GET } = await import("@/app/api/agent-state/route");
    const req = new Request(
      "http://localhost/api/agent-state?threadId=t2&role=architect",
      { method: "GET" },
    );
    const res = await GET(req as never);
    expect(res.status).toBe(200);
    const body = await res.json() as { state: typeof fakeState };
    expect(body.state.lastTurnAt).toBeNull();
  });
});
