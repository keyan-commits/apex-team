import { describe, it, expect } from "vitest";
import { rankIssues, type GithubIssue } from "@/lib/skills/product-owner";

function makeIssue(
  number: number,
  labels: string[],
  createdAt: string
): GithubIssue {
  return {
    number,
    title: `Issue ${number}`,
    labels: labels.map((name) => ({ name })),
    createdAt,
  };
}

describe("rankIssues", () => {
  it("sorts blocker before high before unlabeled by priorityRank", () => {
    const issues = [
      makeIssue(3, [], "2024-01-01T00:00:00Z"),
      makeIssue(1, ["high"], "2024-01-01T00:00:00Z"),
      makeIssue(2, ["blocker"], "2024-01-01T00:00:00Z"),
    ];
    const result = rankIssues(issues);
    expect(result.map((i) => i.number)).toEqual([2, 1, 3]);
  });

  it("breaks priority tie by typeRank (bug before self-improvement)", () => {
    const issues = [
      makeIssue(10, ["high", "self-improvement"], "2024-01-01T00:00:00Z"),
      makeIssue(11, ["high", "bug"], "2024-01-01T00:00:00Z"),
    ];
    const result = rankIssues(issues);
    expect(result[0].number).toBe(11);
    expect(result[1].number).toBe(10);
  });

  it("breaks type tie by age — older issue sorts first", () => {
    const issues = [
      makeIssue(20, ["bug"], "2024-06-01T00:00:00Z"),
      makeIssue(21, ["bug"], "2024-01-01T00:00:00Z"),
    ];
    const result = rankIssues(issues);
    expect(result[0].number).toBe(21);
    expect(result[1].number).toBe(20);
  });

  it("breaks age tie by issueNumber ascending", () => {
    const ts = "2024-03-15T12:00:00Z";
    const issues = [
      makeIssue(100, ["medium"], ts),
      makeIssue(50, ["medium"], ts),
    ];
    const result = rankIssues(issues);
    expect(result[0].number).toBe(50);
    expect(result[1].number).toBe(100);
  });

  it("treats unlabeled priority and type as rank 5 (lowest)", () => {
    const issues = [
      makeIssue(1, [], "2024-01-01T00:00:00Z"),
      makeIssue(2, ["low", "mcp-proposal"], "2024-01-01T00:00:00Z"),
    ];
    const result = rankIssues(issues);
    // low (4) < unlabeled (5) for priority → issue 2 first
    expect(result[0].number).toBe(2);
  });

  it("does not mutate the input array", () => {
    const issues = [
      makeIssue(5, ["low"], "2024-01-01T00:00:00Z"),
      makeIssue(1, ["blocker"], "2024-01-01T00:00:00Z"),
    ];
    const copy = [...issues];
    rankIssues(issues);
    expect(issues[0].number).toBe(copy[0].number);
    expect(issues[1].number).toBe(copy[1].number);
  });
});
