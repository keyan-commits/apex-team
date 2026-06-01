import { vi, describe, it, expect, beforeEach } from "vitest";

const mockDeriveGithubRepo = vi.hoisted(() =>
  vi.fn(() => ({ repo: null, repoStatus: "bad-path" as const })),
);

vi.mock("@/lib/db", () => ({
  listMessages: vi.fn(() => []),
  listAllAgentStates: vi.fn(() => []),
  getSpendSummary: vi.fn(() => ({ todayUsd: 0, threadUsd: 0, perRole: [] })),
  getScoutMeta: vi.fn(() => ({ lastRunAt: null, proposalsLast7Days: 0 })),
  getThreadWorkspace: vi.fn(() => null),
}));

vi.mock("@/lib/derive-github-repo", () => ({
  deriveGithubRepo: mockDeriveGithubRepo,
}));

vi.mock("@/lib/derive-now-queued", () => ({
  deriveNowAndQueued: vi.fn(() => ({ now: [], queued: [] })),
}));

vi.mock("node:child_process", () => ({
  execSync: vi.fn(() => ""),
}));

import { getThreadWorkspace } from "@/lib/db";
import { GET } from "@/app/api/team-status/route";
import { NextRequest } from "next/server";

describe("team-status: workspace override from thread config", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses query param workspace when no thread-bound workspace", async () => {
    vi.mocked(getThreadWorkspace).mockReturnValueOnce(null);
    const req = new NextRequest(
      "http://localhost/api/team-status?threadId=t1&workspace=/query/path",
    );
    await GET(req);
    expect(mockDeriveGithubRepo).toHaveBeenCalledWith("/query/path");
  });

  it("thread-bound workspace overrides query param when set", async () => {
    vi.mocked(getThreadWorkspace).mockReturnValueOnce("/thread/path");
    const req = new NextRequest(
      "http://localhost/api/team-status?threadId=t1&workspace=/query/path",
    );
    await GET(req);
    expect(mockDeriveGithubRepo).toHaveBeenCalledWith("/thread/path");
  });

  it("uses null when threadId absent and no query param", async () => {
    const req = new NextRequest("http://localhost/api/team-status");
    await GET(req);
    // threadId is "" so getThreadWorkspace is not called; workspace param is null
    expect(getThreadWorkspace).not.toHaveBeenCalled();
    expect(mockDeriveGithubRepo).toHaveBeenCalledWith(null);
  });
});
