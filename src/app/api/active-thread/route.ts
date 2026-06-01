export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { getActiveThread } from "@/lib/active-thread";
import { getMostRecentThreadId, getThreadWorkspace } from "@/lib/db";

// Returns the in-memory activeThreadId (set by MCP tool calls). On a
// fresh process boot — or after a `.restart-trigger` respawn — the
// in-memory value is null until the next MCP call. Fall back to the
// most recent thread in the DB so the dashboard never sits on
// "Loading…" forever just because the server restarted.
// Also returns the thread-bound workspace so every dashboard instance
// shows the correct project without requiring manual workspace entry.
export function GET(): Response {
  const active = getActiveThread();
  const threadId = active ?? getMostRecentThreadId();
  const workspace = threadId ? getThreadWorkspace(threadId) : null;
  return Response.json({ threadId, workspace });
}
