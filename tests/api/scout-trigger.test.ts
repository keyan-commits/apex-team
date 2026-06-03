import { describe, it, expect, vi, beforeEach } from "vitest";

// scout-state: top-level mock with getter so _scoutRunning drives the value
// across test resets without requiring vi.resetModules for this module.
let _scoutRunning = false;
vi.mock("../../src/lib/scout-state", () => ({
  get scoutRunning() { return _scoutRunning; },
  setScoutRunning: vi.fn(),
}));

function makeQueryIterable(throws = false) {
  return {
    [Symbol.asyncIterator]() {
      return {
        async next(): Promise<IteratorResult<unknown>> {
          if (throws) throw new Error("not authenticated — run claude login");
          return { done: true, value: undefined };
        },
      };
    },
  };
}

describe("POST /api/scout/trigger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _scoutRunning = false;
    vi.resetModules();
    delete process.env.ANTHROPIC_API_KEY;
  });

  it("(AC6a) invokes query() for the auth probe", async () => {
    vi.doMock("@anthropic-ai/claude-agent-sdk", () => ({
      query: vi.fn(() => makeQueryIterable()),
    }));
    vi.doMock("../../src/lib/scout-runner", () => ({
      runScout: vi.fn().mockResolvedValue(undefined),
    }));

    const { POST } = await import("../../src/app/api/scout/trigger/route");
    const res = await POST();
    expect(res.status).toBe(202);

    const { query } = await import("@anthropic-ai/claude-agent-sdk");
    expect(vi.mocked(query as (...args: unknown[]) => unknown)).toHaveBeenCalled();
  });

  it("(AC6b) returns 202 when ANTHROPIC_API_KEY absent but OAuth OK", async () => {
    vi.doMock("@anthropic-ai/claude-agent-sdk", () => ({
      query: vi.fn(() => makeQueryIterable()),
    }));
    vi.doMock("../../src/lib/scout-runner", () => ({
      runScout: vi.fn().mockResolvedValue(undefined),
    }));

    const { POST } = await import("../../src/app/api/scout/trigger/route");
    const res = await POST();
    expect(res.status).toBe(202);
    const body = await res.json();
    expect(body?.error?.code).not.toBe("API_KEY_MISSING");
  });

  it("(AC6c) returns 503 with clear message when OAuth is absent", async () => {
    vi.doMock("@anthropic-ai/claude-agent-sdk", () => ({
      query: vi.fn(() => makeQueryIterable(true)),
    }));

    const { POST } = await import("../../src/app/api/scout/trigger/route");
    const res = await POST();
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHENTICATED");
    expect(body.error.message).toBe(
      "Claude Code not logged in — run 'claude login' to authenticate",
    );
  });

  it("returns 409 when scout is already running", async () => {
    _scoutRunning = true;

    const { POST } = await import("../../src/app/api/scout/trigger/route");
    const res = await POST();
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe("ALREADY_RUNNING");
  });
});
