import { describe, it, expect, vi, afterEach } from "vitest";
import { checkHealth } from "../../scripts/post-deploy-smoke.mjs";

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("checkHealth", () => {
  it("returns pass when status=ok and mcpMounted=true", async () => {
    vi.stubGlobal("fetch", mockFetch(200, { status: "ok", mcpMounted: true }));
    const result = await checkHealth("http://localhost:3000/api/health");
    expect(result.pass).toBe(true);
  });

  it("returns fail when status=degraded", async () => {
    vi.stubGlobal("fetch", mockFetch(200, { status: "degraded", mcpMounted: true }));
    const result = await checkHealth("http://localhost:3000/api/health");
    expect(result.pass).toBe(false);
    expect(result.reason).toContain('status="degraded"');
  });

  it("returns fail when mcpMounted=false", async () => {
    vi.stubGlobal("fetch", mockFetch(200, { status: "ok", mcpMounted: false }));
    const result = await checkHealth("http://localhost:3000/api/health");
    expect(result.pass).toBe(false);
    expect(result.reason).toContain("mcpMounted=false");
  });

  it("returns fail on HTTP error status", async () => {
    vi.stubGlobal("fetch", mockFetch(500, {}));
    const result = await checkHealth("http://localhost:3000/api/health");
    expect(result.pass).toBe(false);
    expect(result.reason).toContain("HTTP 500");
  });

  it("returns fail on network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));
    const result = await checkHealth("http://localhost:3000/api/health");
    expect(result.pass).toBe(false);
    expect(result.reason).toContain("ECONNREFUSED");
  });
});
