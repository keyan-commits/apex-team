import { describe, it, expect, vi } from "vitest";
import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("returns startedAt as a stable number greater than 0", async () => {
    // First call
    const res1 = await GET();
    const data1 = await res1.json();

    // Second call — should have the same startedAt (module-level constant)
    const res2 = await GET();
    const data2 = await res2.json();

    // Assertions
    expect(typeof data1.startedAt).toBe("number");
    expect(data1.startedAt).toBeGreaterThan(0);
    expect(data1.startedAt).toBe(data2.startedAt);
  });

  it("returns status and mcpMounted fields", async () => {
    const res = await GET();
    const data = await res.json();

    expect(data).toHaveProperty("status");
    expect(["ok", "degraded"]).toContain(data.status);
    expect(data).toHaveProperty("mcpMounted");
    expect(data.mcpMounted).toBe(true);
  });
});
