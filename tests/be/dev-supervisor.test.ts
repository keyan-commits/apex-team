import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// ── Mocks (hoisted) ──────────────────────────────────────────────────────────

// Prevent any real file I/O from the supervisor module.
vi.mock("node:fs", () => ({
  watchFile: vi.fn(),
  watch: vi.fn().mockReturnValue({ on: vi.fn() }),
  rmSync: vi.fn(),
  writeFileSync: vi.fn(),
  readFileSync: vi.fn().mockImplementation(() => {
    throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
  }),
  readdirSync: vi.fn().mockReturnValue([]),
  mkdirSync: vi.fn(),
}));

vi.mock("node:child_process", () => ({
  spawn: vi.fn(),
}));

import { Supervisor } from "../../scripts/dev-supervisor.mjs";
import { writeFileSync, readFileSync } from "node:fs";
import { spawn } from "node:child_process";
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

// ── AC1 — conflict-marker precompile fence ───────────────────────────────────

describe("AC1 — conflict-marker fence: _checkFileForMarkers()", () => {
  beforeEach(() => {
    vi.mocked(readFileSync).mockReset();
    vi.mocked(spawn as ReturnType<typeof vi.fn>).mockReset();
  });

  it("ignores non-watched extensions (.css, .json, .md)", () => {
    const sup = new Supervisor();
    for (const path of ["/src/globals.css", "/src/data.json", "/src/README.md"]) {
      sup._checkFileForMarkers(path);
    }
    expect(readFileSync).not.toHaveBeenCalled();
    expect(sup["_conflictFiles"].size).toBe(0);
  });

  it("detects <<<<<<<, =======, >>>>>>> markers and records file + 1-based lines", () => {
    vi.mocked(readFileSync).mockReturnValueOnce(
      "// good\n<<<<<<< HEAD\nconst a = 1;\n=======\nconst a = 2;\n>>>>>>> branch\n"
    );
    const sup = new Supervisor();
    sup.child = Object.assign(new EventEmitter(), { pid: 1, kill: vi.fn() }) as any;
    const killSpy = vi.spyOn(sup, "killChild").mockResolvedValue(undefined);

    sup._checkFileForMarkers("/src/lib/foo.ts");

    expect(sup["_conflictFiles"].has("/src/lib/foo.ts")).toBe(true);
    const lines = sup["_conflictFiles"].get("/src/lib/foo.ts") as number[];
    expect(lines).toContain(2); // <<<<<<< on line 2
    expect(lines).toContain(4); // ======= on line 4
    expect(lines).toContain(6); // >>>>>>> on line 6
    expect(killSpy).toHaveBeenCalled();
  });

  it("does not call killChild() a second time for the same already-tracked file", () => {
    vi.mocked(readFileSync).mockReturnValue(
      "<<<<<<< HEAD\n"
    );
    const sup = new Supervisor();
    sup.child = Object.assign(new EventEmitter(), { pid: 2, kill: vi.fn() }) as any;
    const killSpy = vi.spyOn(sup, "killChild").mockResolvedValue(undefined);

    sup._checkFileForMarkers("/src/lib/foo.ts"); // first detection — child present, killChild fires
    sup.child = null; // child is now gone after kill
    sup._checkFileForMarkers("/src/lib/foo.ts"); // same file, still conflicted — isNew=false → no second kill

    expect(killSpy).toHaveBeenCalledTimes(1);
  });

  it("clears the file from _conflictFiles when markers are removed", () => {
    // First call: markers present
    vi.mocked(readFileSync).mockReturnValueOnce("<<<<<<< HEAD\n");
    const sup = new Supervisor();
    vi.spyOn(sup, "killChild").mockResolvedValue(undefined);
    vi.spyOn(sup, "_onConflictResolved").mockImplementation(() => {});

    sup._checkFileForMarkers("/src/lib/foo.ts");
    expect(sup["_conflictFiles"].size).toBe(1);

    // Second call: file is clean
    vi.mocked(readFileSync).mockReturnValueOnce("// all good\n");
    sup._checkFileForMarkers("/src/lib/foo.ts");
    expect(sup["_conflictFiles"].has("/src/lib/foo.ts")).toBe(false);
    expect(sup["_onConflictResolved"]).toHaveBeenCalled();
  });

  it("removes file from _conflictFiles when file is deleted (readFileSync throws)", () => {
    vi.mocked(readFileSync).mockReturnValueOnce("<<<<<<< HEAD\n");
    const sup = new Supervisor();
    vi.spyOn(sup, "killChild").mockResolvedValue(undefined);
    const resolvedSpy = vi.spyOn(sup, "_onConflictResolved").mockImplementation(() => {});

    sup._checkFileForMarkers("/src/lib/foo.ts");
    expect(sup["_conflictFiles"].size).toBe(1);

    // File deleted — readFileSync throws
    vi.mocked(readFileSync).mockImplementationOnce(() => {
      throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
    });
    sup._checkFileForMarkers("/src/lib/foo.ts");
    expect(sup["_conflictFiles"].has("/src/lib/foo.ts")).toBe(false);
    expect(resolvedSpy).toHaveBeenCalled();
  });
});

describe("AC1 — conflict-marker fence: spawnChild() guard", () => {
  beforeEach(() => {
    vi.mocked(spawn as ReturnType<typeof vi.fn>).mockReset();
  });

  it("does not call spawn when _conflictFiles is non-empty", () => {
    const sup = new Supervisor();
    sup["_conflictFiles"].set("/src/lib/roles.ts", [3, 5]);

    sup.spawnChild();

    expect(spawn).not.toHaveBeenCalled();
  });

  it("calls spawn when _conflictFiles is empty", () => {
    const fakeChild = Object.assign(new EventEmitter(), { pid: 42, kill: vi.fn() });
    vi.mocked(spawn as ReturnType<typeof vi.fn>).mockReturnValue(fakeChild as any);
    vi.mocked(readFileSync).mockImplementation(() => { throw new Error("ENOENT"); });

    const sup = new Supervisor();
    // _conflictFiles is empty by default
    sup.spawnChild();

    expect(spawn).toHaveBeenCalledWith("tsx", ["server.ts"], expect.objectContaining({ stdio: "inherit" }));
  });
});

describe("AC1 — conflict-marker fence: _onConflictResolved()", () => {
  it("calls spawnChild() when all conflicts cleared and no child is running", () => {
    const sup = new Supervisor();
    sup["_conflictFiles"].set("/src/lib/foo.ts", [1]);
    sup.child = null;
    const spawnSpy = vi.spyOn(sup, "spawnChild").mockImplementation(() => {});

    // Clear the conflict, then call resolved
    sup["_conflictFiles"].delete("/src/lib/foo.ts");
    sup._onConflictResolved();

    expect(spawnSpy).toHaveBeenCalled();
  });

  it("does not call spawnChild() when child is already running", () => {
    const sup = new Supervisor();
    sup.child = Object.assign(new EventEmitter(), { pid: 99, kill: vi.fn() }) as any;
    const spawnSpy = vi.spyOn(sup, "spawnChild").mockImplementation(() => {});

    sup._onConflictResolved();

    expect(spawnSpy).not.toHaveBeenCalled();
  });

  it("does not call spawnChild() when other conflict files remain", () => {
    const sup = new Supervisor();
    sup["_conflictFiles"].set("/src/lib/foo.ts", [1]);
    sup["_conflictFiles"].set("/src/lib/bar.ts", [5]);
    sup.child = null;
    const spawnSpy = vi.spyOn(sup, "spawnChild").mockImplementation(() => {});

    // Resolve only one file
    sup["_conflictFiles"].delete("/src/lib/foo.ts");
    sup._onConflictResolved();

    expect(spawnSpy).not.toHaveBeenCalled();
  });

  it("does not call spawnChild() when shutdownState is not 'running'", () => {
    const sup = new Supervisor();
    sup["_shutdownState"] = "grace";
    sup.child = null;
    const spawnSpy = vi.spyOn(sup, "spawnChild").mockImplementation(() => {});

    sup._onConflictResolved();

    expect(spawnSpy).not.toHaveBeenCalled();
  });
});
