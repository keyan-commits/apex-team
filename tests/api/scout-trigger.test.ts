import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("node:child_process", () => ({
  spawn: vi.fn().mockReturnValue({
    pid: 12345,
    on: vi.fn(),
  }),
}));

vi.mock("../../src/lib/scout-state", () => ({
  scoutRunning: false,
  setScoutRunning: vi.fn(),
}));

describe("POST /api/scout/trigger", () => {
  const originalKey = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    if (originalKey !== undefined) {
      process.env.ANTHROPIC_API_KEY = originalKey;
    } else {
      delete process.env.ANTHROPIC_API_KEY;
    }
  });

  it("returns 503 when ANTHROPIC_API_KEY is not set", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    vi.doMock("../../src/lib/scout-state", () => ({
      scoutRunning: false,
      setScoutRunning: vi.fn(),
    }));
    const { POST } = await import("../../src/app/api/scout/trigger/route");
    const req = new Request("http://localhost/api/scout/trigger", { method: "POST" });
    const res = await POST();
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error.code).toBe("API_KEY_MISSING");
    expect(body.error.message).toContain("ANTHROPIC_API_KEY");
  });

  it("returns 202 and spawns script when API key is set", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    vi.doMock("../../src/lib/scout-state", () => ({
      scoutRunning: false,
      setScoutRunning: vi.fn(),
    }));
    const { POST } = await import("../../src/app/api/scout/trigger/route");
    const req = new Request("http://localhost/api/scout/trigger", { method: "POST" });
    const res = await POST();
    expect(res.status).toBe(202);
    const body = await res.json();
    expect(body.status).toBe("running");
  });

  it("returns 409 when scout is already running", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    vi.doMock("../../src/lib/scout-state", () => ({
      scoutRunning: true,
      setScoutRunning: vi.fn(),
    }));
    const { POST } = await import("../../src/app/api/scout/trigger/route");
    const req = new Request("http://localhost/api/scout/trigger", { method: "POST" });
    const res = await POST();
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe("ALREADY_RUNNING");
  });
});
