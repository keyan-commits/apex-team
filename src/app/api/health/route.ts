import { APEX_MCP_URL } from "@/lib/mcp-config";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  let apexEngineReachable = false;
  try {
    const res = await fetch(APEX_MCP_URL.replace(/\/mcp$/, "/healthz"), {
      signal: AbortSignal.timeout(1500),
    });
    apexEngineReachable = res.ok;
  } catch {
    apexEngineReachable = false;
  }
  return Response.json({
    ok: true,
    apex: { url: APEX_MCP_URL, reachable: apexEngineReachable },
    defaultCwd: process.cwd(),
  });
}
