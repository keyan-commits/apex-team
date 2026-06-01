import { APEX_MCP_URL } from "@/lib/mcp-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  return Response.json({
    status: apexEngineUp ? "ok" : "degraded",
    apexEngine: apexEngineUp ? "up" : "down",
    defaultCwd: process.cwd(),
    mcpMounted: true,
  });
}
