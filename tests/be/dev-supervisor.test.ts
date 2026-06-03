import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// ── Mocks (hoisted) ──────────────────────────────────────────────────────────

// Prevent any real file I/O from the supervisor module.
vi.mock("node:fs", () => ({
  watchFile: vi.fn(),
  rmSync: vi.fn(),
  writeFileSync: vi.fn(),
  readFileSync: vi.fn().mockImplementation(() => {
    throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
  }),
  mkdirSync: vi.fn(),
}));

vi.mock("node:child_process", () => ({
  spawn: vi.fn(),
}));

import { Supervisor } from "../../scripts/dev-supervisor.mjs";
import { writeFileSync, readFileSync } from "node:fs";
import { EventEmitter } from "node:events";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a minimal fake ChildProcess. Uses real EventEmitter.once so tests
 *  can emit 'exit' to unblock killChild(). kill() is a spy for assertions. */
function makeFakeChild(pid = 12345) {
  const emitter = new EventEmitter();
  return Object.assign(emitter, {
    pid,
    kill: vi.fn(),
  });
}

// ── AC7b — stale-child fast-resolve ─────────────────────────────────────────

describe("killChild() — stale-child short-circuit (AC6 / AC7b)", () => {
  let processKillSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    processKillSpy = vi.spyOn(process, "kill").mockImplementation((_pid, _sig) => {
      // Simulate ESRCH for all pids (all children appear dead).
      throw Object.assign(new Error("ESRCH"), { code: "ESRCH" });
    });
  });

  afterEach(() => {
    processKillSpy.mockRestore();
  });

  it("resolves immediately (< 100ms) when child.pid is ESRCH", async () => {
    const sup = new Supervisor({ graceMs: 15_000 });
    sup.child = makeFakeChild(99999) as unknown as typeof sup.child;

    const start = Date.now();
    await sup.killChild();
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(100);
    expect(sup.child).toBeNull();
  });

  it("does not call child.kill() when pid is already gone", async () => {
    const sup = new Supervisor({ graceMs: 15_000 });
    const fakeChild = makeFakeChild(88888);
    sup.child = fakeChild as unknown as typeof sup.child;

    await sup.killChild();

    // SIGTERM should NOT have been sent — we resolved on ESRCH.
    expect(fakeChild.kill).not.toHaveBeenCalled();
  });

  it("returns immediately when child is null", async () => {
    const sup = new Supervisor({ graceMs: 15_000 });
    await expect(sup.killChild()).resolves.toBeUndefined();
  });
});

// ── AC7a — double-signal escalation ─────────────────────────────────────────

describe("handleSignal() — double-signal escalation (AC5 / AC7a)", () => {
  let processKillSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.mocked(writeFileSync).mockReset();
    // Child looks alive for the first signal path.
    processKillSpy = vi.spyOn(process, "kill").mockReturnValue(true as unknown as never);
  });

  afterEach(() => {
    processKillSpy.mockRestore();
  });

  it("second SIGINT within window: SIGKILLs child, writes user-off sentinel, calls exitFn(0)", () => {
    const exitFn = vi.fn();
    const sup = new Supervisor({
      graceMs: 15_000,
      doubleSignalWindowMs: 8_000,
      userOffPath: "/tmp/.test-user-off",
      exitFn,
    });
    const fakeChild = makeFakeChild(55555);
    sup.child = fakeChild as unknown as typeof sup.child;

    // First signal — starts grace shutdown (async, does NOT block here)
    sup.handleSignal("SIGINT");
    expect(sup["_shutdownState"]).toBe("grace");

    // Second signal immediately (well within 8s window)
    sup.handleSignal("SIGINT");
    expect(sup["_shutdownState"]).toBe("escalated");

    // Child should have been SIGKILL'd via escalation path
    expect(fakeChild.kill).toHaveBeenCalledWith("SIGKILL");

    // user-off sentinel written
    expect(writeFileSync).toHaveBeenCalledWith(
      "/tmp/.test-user-off",
      expect.stringContaining('"double-signal"'),
    );
    expect(writeFileSync).toHaveBeenCalledWith(
      "/tmp/.test-user-off",
      expect.stringContaining('"SIGINT"'),
    );

    // exitFn(0) — clean exit → launchd will NOT respawn
    expect(exitFn).toHaveBeenCalledWith(0);
  });

  it("second SIGINT outside window: calls exitFn(1)", () => {
    const exitFn = vi.fn();
    const sup = new Supervisor({
      graceMs: 15_000,
      doubleSignalWindowMs: 0, // window = 0ms → second signal always outside
      exitFn,
    });

    sup.handleSignal("SIGINT"); // first — grace
    // Override _firstSignalAt to be 1s ago to ensure we're outside window
    sup["_firstSignalAt"] = Date.now() - 1000;
    sup.handleSignal("SIGINT"); // second — outside window → hard exit

    expect(exitFn).toHaveBeenCalledWith(1);
  });

  it("third signal: calls exitFn(1)", () => {
    const exitFn = vi.fn();
    const sup = new Supervisor({
      graceMs: 15_000,
      doubleSignalWindowMs: 8_000,
      exitFn,
    });
    const fakeChild = makeFakeChild(44444);
    sup.child = fakeChild as unknown as typeof sup.child;

    sup.handleSignal("SIGINT");                // 1st: grace
    sup.handleSignal("SIGINT");                // 2nd: escalated + exitFn(0)
    exitFn.mockClear();
    sup.handleSignal("SIGINT");                // 3rd: hard exit
    expect(exitFn).toHaveBeenCalledWith(1);
  });

  it("SIGTERM and SIGHUP follow same escalation path as SIGINT", () => {
    const exitFn = vi.fn();
    const sup = new Supervisor({
      graceMs: 15_000,
      doubleSignalWindowMs: 8_000,
      exitFn,
    });

    sup.handleSignal("SIGTERM");
    expect(sup["_shutdownState"]).toBe("grace");
    sup.handleSignal("SIGHUP");
    expect(sup["_shutdownState"]).toBe("escalated");
    expect(exitFn).toHaveBeenCalledWith(0);
  });
});

// ── Startup orphan detection ─────────────────────────────────────────────────

describe("checkStaleChildOnStartup()", () => {
  let processKillSpy: ReturnType<typeof vi.spyOn>;

  afterEach(() => {
    processKillSpy?.mockRestore();
  });

  it("kills a live orphan PID from a previous supervisor run", () => {
    vi.mocked(readFileSync).mockReturnValueOnce("77777" as any);
    processKillSpy = vi.spyOn(process, "kill").mockReturnValue(true as unknown as never);

    const sup = new Supervisor({ pidFile: "/tmp/.test-supervisor.pid" });
    sup.checkStaleChildOnStartup();

    expect(process.kill).toHaveBeenCalledWith(77777, 0);
    expect(process.kill).toHaveBeenCalledWith(77777, "SIGKILL");
  });

  it("does nothing when PID file is missing (ENOENT)", () => {
    vi.mocked(readFileSync).mockImplementationOnce(() => {
      throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
    });
    processKillSpy = vi.spyOn(process, "kill").mockReturnValue(true as unknown as never);

    const sup = new Supervisor({ pidFile: "/tmp/.test-supervisor-missing.pid" });
    sup.checkStaleChildOnStartup();

    expect(process.kill).not.toHaveBeenCalled();
  });

  it("does nothing when saved PID is already gone (ESRCH)", () => {
    vi.mocked(readFileSync).mockReturnValueOnce("66666" as any);
    processKillSpy = vi.spyOn(process, "kill").mockImplementation((_pid, sig) => {
      if (sig === 0) throw Object.assign(new Error("ESRCH"), { code: "ESRCH" });
      return true as unknown as never;
    });

    const sup = new Supervisor({ pidFile: "/tmp/.test-supervisor-esrch.pid" });
    sup.checkStaleChildOnStartup();

    // kill(0) was called but SIGKILL was NOT (pid already gone)
    expect(process.kill).toHaveBeenCalledWith(66666, 0);
    expect(process.kill).not.toHaveBeenCalledWith(66666, "SIGKILL");
  });
});
