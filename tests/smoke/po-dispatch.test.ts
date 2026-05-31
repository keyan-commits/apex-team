/**
 * Shape regression tests for POST /api/po-dispatch.
 * Mocks execFileSync (gh CLI) + runTurnWithDispatches (turn runner) so
 * no real network calls are made.
 */
import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("node:child_process", () => ({
  execFileSync: vi.fn((_cmd: string, args: string[]) => {
    const issueNum = args[2] ?? "1";
    return JSON.stringify({
      number: Number(issueNum),
      title: `Test Issue #${issueNum}`,
      body: "test body",
      labels: [],
      url: `https://github.com/keyan-commits/apex-team/issues/${issueNum}`,
    });
  }),
}));

vi.mock("@/lib/run-turn-with-dispatches", () => ({
  runTurnWithDispatches: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/lib/providers", () => ({
  defaultAgentConfig: vi.fn(() => ({ provider: "claude", model: "claude-sonnet-4-6" })),
}));

function makeReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/po-dispatch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/po-dispatch shape", () => {
  it("returns 400 for empty issueNumbers", async () => {
    const { POST } = await import("@/app/api/po-dispatch/route");
    const res = await POST(makeReq({ threadId: "t1", issueNumbers: [] }));
    expect(res.status).toBe(400);
    const body = await res.json() as Record<string, unknown>;
    expect(body).toHaveProperty("error");
  });

  it("returns 202 { ok, accepted, issueNumbers } fire-and-forget for valid body", async () => {
    const { POST } = await import("@/app/api/po-dispatch/route");
    const res = await POST(makeReq({ threadId: "t1", issueNumbers: [42, 43] }));
    expect(res.status).toBe(202);
    const body = await res.json() as Record<string, unknown>;
    // Shape contract — hotfix 8fecea0: returns immediately, accepted === issueNumbers.length
    expect(body.ok).toBe(true);
    expect(body.accepted).toBe(2);
    expect(body.issueNumbers).toEqual([42, 43]);
  });
});
