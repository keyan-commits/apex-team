import { describe, it, expect } from "vitest";
import { detectCiHealth } from "@/app/api/ci-health/route";

type Run = Parameters<typeof detectCiHealth>[0][number];

function run(
  headSha: string,
  conclusion: string | null,
  status = "completed"
): Run {
  return {
    headSha,
    status,
    conclusion,
    name: `CI / build (${headSha.slice(0, 7)})`,
    createdAt: "2026-06-03T10:00:00Z",
  };
}

describe("detectCiHealth", () => {
  it("returns unknown when there are no completed runs", () => {
    const result = detectCiHealth([run("sha1", null, "in_progress")]);
    expect(result.state).toBe("unknown");
    expect(result.consecutiveReds).toBe(0);
    expect(result.latestRun).toBeNull();
  });

  it("returns unknown for an empty runs array", () => {
    const result = detectCiHealth([]);
    expect(result.state).toBe("unknown");
  });

  it("returns healthy when all completed runs are green", () => {
    const result = detectCiHealth([run("sha1", "success"), run("sha2", "success")]);
    expect(result.state).toBe("healthy");
    expect(result.consecutiveReds).toBe(0);
  });

  it("returns warning for 1 consecutive red SHA (threshold=2)", () => {
    const result = detectCiHealth([run("sha1", "failure")]);
    expect(result.state).toBe("warning");
    expect(result.consecutiveReds).toBe(1);
  });

  it("returns alarm for 2 consecutive red SHAs (default threshold=2)", () => {
    const result = detectCiHealth([
      run("sha1", "failure"),
      run("sha2", "failure"),
    ]);
    expect(result.state).toBe("alarm");
    expect(result.consecutiveReds).toBe(2);
  });

  it("returns alarm for 3 consecutive red SHAs (still >= threshold)", () => {
    const result = detectCiHealth([
      run("sha1", "cancelled"),
      run("sha2", "failure"),
      run("sha3", "failure"),
    ]);
    expect(result.state).toBe("alarm");
    expect(result.consecutiveReds).toBe(3);
  });

  it("treats cancelled as red (same as failure)", () => {
    const result = detectCiHealth([
      run("sha1", "cancelled"),
      run("sha2", "cancelled"),
    ]);
    expect(result.state).toBe("alarm");
  });

  it("returns recovering when latest SHA is green and prior window has a red SHA", () => {
    const result = detectCiHealth([
      run("sha1", "success"), // latest
      run("sha2", "failure"), // prior red
    ]);
    expect(result.state).toBe("recovering");
    expect(result.consecutiveReds).toBe(0);
  });

  it("does not call a SHA red if it has any success run (mixed outcomes)", () => {
    // sha1 has both failure and success → NOT red → no consecutive reds
    const result = detectCiHealth([
      run("sha1", "failure"),
      run("sha1", "success"),
    ]);
    expect(result.state).toBe("healthy");
    expect(result.consecutiveReds).toBe(0);
  });

  it("respects a configurable threshold (threshold=1 → alarm on 1 red SHA)", () => {
    const result = detectCiHealth([run("sha1", "failure")], 1);
    expect(result.state).toBe("alarm");
    expect(result.consecutiveReds).toBe(1);
    expect(result.threshold).toBe(1);
  });
});
