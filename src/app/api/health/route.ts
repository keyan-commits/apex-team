import { APEX_MCP_URL } from "@/lib/mcp-config";
import { statSync, readdirSync } from "node:fs";
import { join } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stable per process lifetime — not re-evaluated per request.
const BOOT_TIME = Date.now();

// Walk src/ tree and return the maximum file mtime (ms) among .ts/.tsx/.mjs files.
// Bounded depth to prevent runaway on unexpected large trees.
function maxSrcMtime(dir: string, depth = 0): number {
  if (depth > 8) return 0;
  let max = 0;
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        const sub = maxSrcMtime(full, depth + 1);
        if (sub > max) max = sub;
      } else if (/\.(ts|tsx|mjs)$/.test(entry.name)) {
        try {
          const mtime = statSync(full).mtimeMs;
          if (mtime > max) max = mtime;
        } catch {}
      }
    }
  } catch {}
  return max;
}

export async function GET(): Promise<Response> {
  let apexEngineUp = false;
  try {
    // Any HTTP response (2xx or 4xx) means the process is up.
    // Only a network error or timeout means it's down.
    await fetch(APEX_MCP_URL, { signal: AbortSignal.timeout(2000) });
    apexEngineUp = true;
  } catch {
    // apexEngineUp stays false
  }

  // US-084 AC4: surface stale compile when source files are newer than boot.
  // "stale" = source was modified after this process started, meaning the
  // running compiled output may not reflect the current source state.
  const srcDir = join(process.cwd(), "src");
  const srcMtime = maxSrcMtime(srcDir);
  const staleCompile = srcMtime > BOOT_TIME;
  const staleCompileByMs = staleCompile ? Math.round(srcMtime - BOOT_TIME) : 0;

  const body = {
    status: apexEngineUp ? "ok" : "degraded",
    apexEngine: apexEngineUp ? "up" : "down",
    defaultCwd: process.cwd(),
    mcpMounted: true,
    startedAt: BOOT_TIME,
    staleCompile,
    ...(staleCompile && {
      staleCompileByMs,
      staleCompileMessage: `compile is ${Math.round(staleCompileByMs / 1000)}s older than source — restart the server`,
    }),
  };

  // Return 503 when compile is stale so callers can detect degraded state
  // without needing to parse the body.
  const httpStatus = staleCompile ? 503 : 200;
  return Response.json(body, { status: httpStatus });
}
