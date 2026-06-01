import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  listMessages: vi.fn(() => []),
  listAllAgentStates: vi.fn(() => []),
  getSpendSummary: vi.fn(() => ({ todayUsd: 0, threadUsd: 0, perRole: [] })),
  getScoutMeta: vi.fn(() => ({ lastRunAt: null, proposalsLast7Days: 0 })),
  getThreadWorkspace: vi.fn(() => null),
}));

const mockDeriveGithubRepo = vi.hoisted(() => vi.fn(() => ({ repo: "acme/app", repoStatus: "ok" as const })));
vi.mock("@/lib/derive-github-repo", () => ({ deriveGithubRepo: mockDeriveGithubRepo }));

vi.mock("@/lib/derive-now-queued", () => ({
  deriveNowAndQueued: vi.fn(() => ({ now: [], queued: [] })),
}));

const mockExecSync = vi.hoisted(() => vi.fn(() => "[]"));
vi.mock("node:child_process", () => ({ execSync: mockExecSync }));

import { listMessages } from "@/lib/db";
import { deriveNowAndQueued } from "@/lib/derive-now-queued";
import { GET } from "@/app/api/team-status/route";
import { NextRequest } from "next/server";

function makeReq(threadId = "t1") {
  return new NextRequest(`http://localhost/api/team-status?threadId=${threadId}&workspace=/some/ws`);
}

describe("team-status: now-panel ticket/wave enrichment (#110)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecSync.mockReturnValue("[]");
  });

  it("enriches now[0] with tickets and waves from full trigger content", async () => {
    vi.mocked(listMessages).mockReturnValue([
      { id: 1, threadId: "t1", author: { kind: "dispatch", to: "architect" }, content: "Wave 48 — closes #101", createdAt: Date.now() - 30_000 },
    ] as never);
    vi.mocked(deriveNowAndQueued).mockReturnValue({
      now: [{ role: "architect", taskSummary: "Wave 48 — closes #101".slice(0, 80), startedAt: Date.now() - 30_000, state: "thinking" }],
      queued: [],
    } as never);

    const res = await GET(makeReq());
    const body = await res.json();
    expect(body.now[0].tickets).toEqual([101]);
    expect(body.now[0].waves).toEqual([48]);
  });
});

describe("team-status: issues in-flight pill join (#111)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Use a unique repo so the module-level 60s issue cache doesn't collide with other test suites
    mockDeriveGithubRepo.mockReturnValue({ repo: "acme/inflight-test", repoStatus: "ok" as const });
  });

  it("marks issues whose number is in now-panel tickets as inFlight", async () => {
    mockExecSync.mockReturnValue(JSON.stringify([
      { number: 101, title: "Test issue", labels: [{ name: "bug" }], url: "https://github.com/acme/inflight-test/issues/101" },
      { number: 202, title: "Other issue", labels: [{ name: "enhancement" }], url: "https://github.com/acme/inflight-test/issues/202" },
    ]));
    vi.mocked(listMessages).mockReturnValue([
      { id: 1, threadId: "t1", author: { kind: "dispatch", to: "architect" }, content: "Wave 48 — closes #101", createdAt: Date.now() - 30_000 },
    ] as never);
    vi.mocked(deriveNowAndQueued).mockReturnValue({
      now: [{ role: "architect", taskSummary: "Wave 48 — closes #101".slice(0, 80), startedAt: Date.now() - 30_000, state: "thinking" }],
      queued: [],
    } as never);

    const res = await GET(makeReq());
    const body = await res.json();
    const issue101 = body.issues.recent.find((i: { number: number }) => i.number === 101);
    const issue202 = body.issues.recent.find((i: { number: number }) => i.number === 202);
    expect(issue101?.inFlight).toBe(true);
    expect(issue202?.inFlight).toBe(false);
  });
});

describe("team-status: done-panel ticket/wave enrichment (#113)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecSync.mockReturnValue("[]");
  });

  it("enriches done rows with tickets and waves from agent + trigger content", async () => {
    const now = Date.now();
    vi.mocked(listMessages).mockReturnValue([
      {
        id: 1, threadId: "t1",
        author: { kind: "dispatch", to: "backend-developer" },
        content: "Wave 48 — implements #101",
        createdAt: now - 80_000,
      },
      {
        id: 2, threadId: "t1",
        author: { kind: "agent", role: "backend-developer" },
        content: "Done. Closes #101",
        createdAt: now - 10_000,
      },
    ] as never);

    const res = await GET(makeReq());
    const body = await res.json();
    expect(body.done).toHaveLength(1);
    expect(body.done[0].tickets).toContain(101);
    expect(body.done[0].waves).toContain(48);
  });
});
