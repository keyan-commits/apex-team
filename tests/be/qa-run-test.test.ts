import { vi, describe, it, expect, beforeEach } from "vitest";

// ── Mocks (hoisted) ──────────────────────────────────────────────────────────

// Mock db so the route never opens a real SQLite connection.
vi.mock("@/lib/db", () => ({
  upsertQaTestRun: vi.fn(),
}));

// Mock child_process spawn — controlled per-test via `spawnImpl`.
let spawnImpl: () => ReturnType<typeof import("node:child_process").spawn>;
vi.mock("node:child_process", () => ({
  spawn: (...args: unknown[]) => spawnImpl(...(args as [])),
}));

// Mock fs.readdirSync so we can control the allowlist without touching disk.
let readdirImpl: (path: string, opts: { withFileTypes: true }) => Array<{
  name: string;
  isDirectory: () => boolean;
  isFile: () => boolean;
}>;
vi.mock("node:fs", () => ({
  readdirSync: (path: string, opts: { withFileTypes: true }) => readdirImpl(path, opts),
}));

import { POST, GET, enumerateTestFiles } from "../../src/app/api/qa/run-test/route";
import { upsertQaTestRun } from "@/lib/db";
import { EventEmitter } from "node:events";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeAbortSignal(): AbortSignal {
  return new AbortController().signal;
}

function makeReq(body: unknown, signal = makeAbortSignal()): Request {
  return new Request("http://localhost/api/qa/run-test", {
    method: "POST",
    body: JSON.stringify(body),
    signal,
  });
}

// Minimal fake ChildProcess that emits 'close' with the given code.
function makeFakeProc(exitCode: number, stdout = "vitest output") {
  const proc = new EventEmitter() as ReturnType<typeof import("node:child_process").spawn>;
  // Attach stream emitters for stdout/stderr
  (proc as unknown as { stdout: EventEmitter; stderr: EventEmitter; killed: boolean; kill: () => void }).stdout = new EventEmitter();
  (proc as unknown as { stderr: EventEmitter }).stderr = new EventEmitter();
  (proc as unknown as { killed: boolean; kill: () => void }).killed = false;
  (proc as unknown as { kill: () => void }).kill = () => {};

  setImmediate(() => {
    (proc as unknown as { stdout: EventEmitter }).stdout.emit("data", Buffer.from(stdout));
    proc.emit("close", exitCode);
  });
  return proc;
}

// Default allowlist setup — two test files under tests/be/
function setupAllowlist() {
  readdirImpl = (path: string, _opts: { withFileTypes: true }) => {
    // Only enumerate "tests/be/" directory
    if (path.endsWith("tests")) {
      return [
        { name: "be", isDirectory: () => true, isFile: () => false },
      ];
    }
    if (path.endsWith("be")) {
      return [
        { name: "foo.test.ts", isDirectory: () => false, isFile: () => true },
        { name: "bar.test.ts", isDirectory: () => false, isFile: () => true },
      ];
    }
    return [];
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("enumerateTestFiles", () => {
  it("returns normalized forward-slash paths relative to root", () => {
    setupAllowlist();
    const results = enumerateTestFiles("/workspace");
    expect(results).toContain("tests/be/foo.test.ts");
    expect(results).toContain("tests/be/bar.test.ts");
    expect(results).toHaveLength(2);
  });

  it("returns empty array when tests/ does not exist", () => {
    readdirImpl = () => { throw new Error("ENOENT"); };
    const results = enumerateTestFiles("/workspace");
    expect(results).toEqual([]);
  });
});

describe("GET /api/qa/run-test", () => {
  it("returns JSON with tests array", async () => {
    setupAllowlist();
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json() as { tests: string[] };
    expect(Array.isArray(body.tests)).toBe(true);
  });
});

describe("POST /api/qa/run-test — validation", () => {
  beforeEach(() => {
    setupAllowlist();
    vi.clearAllMocks();
  });

  it("returns 400 when body is not JSON", async () => {
    const req = new Request("http://localhost/api/qa/run-test", {
      method: "POST",
      body: "not-json",
      signal: makeAbortSignal(),
    });
    const res = await POST(req as unknown as import("next/server").NextRequest);
    expect(res.status).toBe(400);
    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe("INVALID_BODY");
  });

  it("returns 400 when testPath is missing", async () => {
    const res = await POST(makeReq({}) as unknown as import("next/server").NextRequest);
    expect(res.status).toBe(400);
    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe("MISSING_PATH");
  });

  it("returns 400 when testPath is not in the allowlist", async () => {
    const res = await POST(
      makeReq({ testPath: "tests/malicious/../../../etc/passwd" }) as unknown as import("next/server").NextRequest,
    );
    expect(res.status).toBe(400);
    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe("PATH_NOT_ALLOWED");
  });

  it("returns 400 for an arbitrary string not in allowlist", async () => {
    const res = await POST(
      makeReq({ testPath: "tests/nonexistent.test.ts" }) as unknown as import("next/server").NextRequest,
    );
    expect(res.status).toBe(400);
    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe("PATH_NOT_ALLOWED");
  });
});

describe("POST /api/qa/run-test — happy path", () => {
  beforeEach(() => {
    setupAllowlist();
    vi.clearAllMocks();
  });

  it("returns 200 SSE response for an allowlisted path", async () => {
    spawnImpl = () => makeFakeProc(0, "all tests passed") as ReturnType<typeof import("node:child_process").spawn>;

    const res = await POST(
      makeReq({ testPath: "tests/be/foo.test.ts" }) as unknown as import("next/server").NextRequest,
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/event-stream");
  });

  it("persists pass status to DB on exit code 0", async () => {
    spawnImpl = () => makeFakeProc(0, "ok") as ReturnType<typeof import("node:child_process").spawn>;

    const res = await POST(
      makeReq({ testPath: "tests/be/foo.test.ts" }) as unknown as import("next/server").NextRequest,
    );
    // Consume the stream to let the close handler fire
    const reader = res.body!.getReader();
    while (true) {
      const { done } = await reader.read();
      if (done) break;
    }

    expect(upsertQaTestRun).toHaveBeenCalledWith(
      "tests/be/foo.test.ts",
      "pass",
      expect.any(Number),
      expect.any(String),
    );
  });

  it("persists fail status to DB on non-zero exit code", async () => {
    spawnImpl = () => makeFakeProc(1, "FAIL") as ReturnType<typeof import("node:child_process").spawn>;

    const res = await POST(
      makeReq({ testPath: "tests/be/foo.test.ts" }) as unknown as import("next/server").NextRequest,
    );
    const reader = res.body!.getReader();
    while (true) {
      const { done } = await reader.read();
      if (done) break;
    }

    expect(upsertQaTestRun).toHaveBeenCalledWith(
      "tests/be/foo.test.ts",
      "fail",
      expect.any(Number),
      expect.any(String),
    );
  });
});
