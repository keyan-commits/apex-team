export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { getActiveThread } from "@/lib/active-thread";
import { getMostRecentThreadId } from "@/lib/db";

// Returns the in-memory activeThreadId (set by MCP tool calls). On a
// fresh process boot — or after a `.restart-trigger` respawn — the
// in-memory value is null until the next MCP call. Fall back to the
// most recent thread in the DB so the dashboard never sits on
// "Loading…" forever just because the server restarted.
export function GET(): Response {
  const active = getActiveThread();
  if (active) return Response.json({ threadId: active });
  return Response.json({ threadId: getMostRecentThreadId() });
}
