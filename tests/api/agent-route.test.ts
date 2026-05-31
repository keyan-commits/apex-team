import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/lib/db", () => ({
  getThreadAgentModels: vi.fn().mockReturnValue(null),
}));

// Mock fs to avoid hitting real files
vi.mock("node:fs", () => ({
  existsSync: vi.fn().mockReturnValue(false),
  readFileSync: vi.fn(),
}));

import { GET } from "../../src/app/api/agent/[role]/route";

describe("GET /api/agent/[role]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for unknown role", async () => {
    const req = new Request("http://localhost/api/agent/not-a-role");
    const params = Promise.resolve({ role: "not-a-role" });
    const res = await GET(req as any, { params });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("UNKNOWN_ROLE");
  });

  it("returns 200 with correct shape for known role", async () => {
    const req = new Request("http://localhost/api/agent/architect");
    const params = Promise.resolve({ role: "architect" });
    const res = await GET(req as any, { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.role).toBe("architect");
    expect(body.title).toBe("Architect");
    expect(typeof body.accent).toBe("string");
    expect(typeof body.currentModel).toBe("string");
    expect(typeof body.skillsMarkdown).toBe("string");
    expect(typeof body.systemPromptSummary).toBe("string");
    expect(body.systemPromptSummary.length).toBeLessThanOrEqual(200);
    expect(typeof body.skillsProvenance).toBe("object");
  });

  it("uses thread's model override when threadId provided", async () => {
    const { getThreadAgentModels } = await import("../../src/lib/db");
    vi.mocked(getThreadAgentModels).mockReturnValue({ architect: "claude-opus-4-8" });
    const req = new Request("http://localhost/api/agent/architect?threadId=t1");
    const params = Promise.resolve({ role: "architect" });
    const res = await GET(req as any, { params });
    const body = await res.json();
    expect(body.currentModel).toBe("claude-opus-4-8");
  });

  it("falls back to claude-sonnet-4-6 when no thread config", async () => {
    const req = new Request("http://localhost/api/agent/qa?threadId=t1");
    const params = Promise.resolve({ role: "qa" });
    const res = await GET(req as any, { params });
    const body = await res.json();
    expect(body.currentModel).toBe("claude-sonnet-4-6");
  });
});
