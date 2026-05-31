import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:child_process", () => ({
  execFileSync: vi.fn(),
}));

import { POST } from "../../src/app/api/agent/[role]/improvement/route";

describe("POST /api/agent/[role]/improvement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for unknown role", async () => {
    const req = new Request("http://localhost/api/agent/bad-role/improvement", {
      method: "POST",
      body: JSON.stringify({ title: "t", body: "b" }),
    });
    const params = Promise.resolve({ role: "bad-role" });
    const res = await POST(req as any, { params });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe("UNKNOWN_ROLE");
  });

  it("returns 400 when body fields missing", async () => {
    const req = new Request("http://localhost/api/agent/architect/improvement", {
      method: "POST",
      body: JSON.stringify({ title: "" }),
    });
    const params = Promise.resolve({ role: "architect" });
    const res = await POST(req as any, { params });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe("INVALID_BODY");
  });

  it("calls gh CLI and returns issue url + number on success", async () => {
    const { execFileSync } = await import("node:child_process");
    vi.mocked(execFileSync).mockReturnValue(
      "https://github.com/keyan-commits/apex-team/issues/99\n" as any,
    );
    const req = new Request("http://localhost/api/agent/architect/improvement", {
      method: "POST",
      body: JSON.stringify({ title: "Add ADR skill", body: "This would help." }),
    });
    const params = Promise.resolve({ role: "architect" });
    const res = await POST(req as any, { params });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.url).toContain("/issues/99");
    expect(json.number).toBe(99);
    const [, args] = vi.mocked(execFileSync).mock.calls[0] as [unknown, string[]];
    expect(args).toContain("skill-proposal");
    expect(args).toContain("architect");
  });

  it("returns 500 when gh CLI throws", async () => {
    const { execFileSync } = await import("node:child_process");
    vi.mocked(execFileSync).mockImplementation(() => {
      throw new Error("gh: command not found");
    });
    const req = new Request("http://localhost/api/agent/qa/improvement", {
      method: "POST",
      body: JSON.stringify({ title: "New skill", body: "Details here." }),
    });
    const params = Promise.resolve({ role: "qa" });
    const res = await POST(req as any, { params });
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error.code).toBe("GH_CLI_ERROR");
  });
});
