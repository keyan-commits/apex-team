import { NextRequest } from "next/server";
import { spawn } from "node:child_process";
import { readdirSync } from "node:fs";
import { join, relative } from "node:path";

import { sseFormat, sseHeaders } from "@/lib/sse";
import { upsertQaTestRun } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OUTPUT_CAP = 10 * 1024; // 10 KB

// Recursively enumerate tests/**/*.spec.ts relative to the workspace root.
// Returns normalized forward-slash paths (e.g. "tests/be/foo.spec.ts").
export function enumerateTestFiles(root: string): string[] {
  const results: string[] = [];
  function walk(dir: string) {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.endsWith(".spec.ts")) {
        results.push(relative(root, full).replace(/\\/g, "/"));
      }
    }
  }
  walk(join(root, "tests"));
  return results;
}

// GET — return the authoritative list of test files for the frontend to render.
export async function GET(): Promise<Response> {
  const tests = enumerateTestFiles(process.cwd());
  return new Response(JSON.stringify({ tests }), {
    headers: { "Content-Type": "application/json" },
  });
}

// POST — validate testPath against the server-side allowlist, then spawn
// pnpm vitest run <validatedPath> and stream stdout/stderr as SSE deltas.
export async function POST(req: NextRequest): Promise<Response> {
  let body: { testPath?: unknown };
  try {
    body = (await req.json()) as { testPath?: unknown };
  } catch {
    return new Response(
      JSON.stringify({ error: { code: "INVALID_BODY", message: "Request body must be JSON" } }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const clientPath = body?.testPath;
  if (typeof clientPath !== "string" || !clientPath) {
    return new Response(
      JSON.stringify({ error: { code: "MISSING_PATH", message: "testPath is required" } }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const workspaceRoot = process.cwd();
  const allowlist = enumerateTestFiles(workspaceRoot);

  if (!allowlist.includes(clientPath)) {
    return new Response(
      JSON.stringify({ error: { code: "PATH_NOT_ALLOWED", message: "testPath is not in the test allowlist" } }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const validatedPath = clientPath;
  const ranAt = Date.now();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      let outputBuffer = "";

      const safeEnqueue = (data: Uint8Array) => {
        if (closed) return;
        try {
          controller.enqueue(data);
        } catch {
          closed = true;
        }
      };

      const proc = spawn("pnpm", ["vitest", "run", validatedPath], {
        cwd: workspaceRoot,
        // shell: false is the default — explicit for clarity and safety
        shell: false,
      });

      const onData = (chunk: Buffer) => {
        const text = chunk.toString("utf8");
        if (outputBuffer.length < OUTPUT_CAP) {
          outputBuffer += text.slice(0, OUTPUT_CAP - outputBuffer.length);
        }
        safeEnqueue(sseFormat({ type: "delta", text }));
      };

      proc.stdout.on("data", onData);
      proc.stderr.on("data", onData);

      proc.on("error", (err) => {
        safeEnqueue(sseFormat({ type: "error", message: err.message }));
        if (!closed) {
          closed = true;
          try { controller.close(); } catch { /* already closed */ }
        }
        upsertQaTestRun(validatedPath, "fail", ranAt, outputBuffer);
      });

      proc.on("close", (code) => {
        const status = code === 0 ? "pass" : "fail";
        safeEnqueue(sseFormat({ type: "done" }));
        if (!closed) {
          closed = true;
          try { controller.close(); } catch { /* already closed */ }
        }
        upsertQaTestRun(validatedPath, status, ranAt, outputBuffer);
      });

      req.signal.addEventListener(
        "abort",
        () => {
          if (!proc.killed) proc.kill();
          if (!closed) {
            closed = true;
            try { controller.close(); } catch { /* already closed */ }
          }
        },
        { once: true },
      );
    },
  });

  return new Response(stream, { headers: sseHeaders() });
}
