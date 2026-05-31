/**
 * API shape regression tests.
 * These lock in the response shape of each route so drift from the
 * health-endpoint-refactor class of bug (issue #29) is caught immediately.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("/api/health shape", () => {
  beforeEach(() => {
    // Stub global fetch so the apex-engine reachability check succeeds.
    vi.stubGlobal("fetch", async () => new Response("ok", { status: 200 }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns { status, apexEngine, defaultCwd, mcpMounted } — not { ok }", async () => {
    // Dynamically import so the stubbed fetch is in place before module executes.
    const { GET } = await import("@/app/api/health/route");
    const response = await GET();
    const body = await response.json() as Record<string, unknown>;

    // Shape contract — these fields must be present
    expect(body).toHaveProperty("status");
    expect(body).toHaveProperty("apexEngine");
    expect(body).toHaveProperty("defaultCwd");
    expect(body).toHaveProperty("mcpMounted");

    // Regression: old shape was { ok: true }; new shape has no "ok" key
    expect(body).not.toHaveProperty("ok");

    // Value contract when apex-engine is reachable
    expect(body.status).toBe("ok");
    expect(body.apexEngine).toBe("up");
    expect(typeof body.defaultCwd).toBe("string");
    expect(body.mcpMounted).toBe(true);
  });

  it("returns status:degraded when apex-engine is unreachable", async () => {
    vi.stubGlobal("fetch", async () => { throw new Error("ECONNREFUSED"); });
    const { GET } = await import("@/app/api/health/route");
    const response = await GET();
    const body = await response.json() as Record<string, unknown>;

    expect(body.status).toBe("degraded");
    expect(body.apexEngine).toBe("down");
    expect(body).toHaveProperty("defaultCwd");
    expect(body).toHaveProperty("mcpMounted");
  });
});
