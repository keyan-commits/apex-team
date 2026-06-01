export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { getSchedulerState } from "@/lib/tick-scheduler";
import { getThreadSpendSince } from "@/lib/db";

export function GET(req: Request): Response {
  const url = new URL(req.url);
  const threadId = url.searchParams.get("thread_id");
  if (!threadId) {
    return Response.json(
      { error: { code: "MISSING_THREAD_ID", message: "thread_id query param is required" } },
      { status: 400 },
    );
  }

  const budgetCap = parseInt(
    process.env.APEX_TEAM_TICK_BUDGET_PER_HOUR ?? "500000",
    10,
  );
  const hourAgo = Date.now() - 3_600_000;
  const budgetSpent = getThreadSpendSince(threadId, hourAgo);
  const budgetPct = Math.round((budgetSpent / budgetCap) * 100);

  const state = getSchedulerState(threadId);
  if (!state) {
    return Response.json({ active: false, budgetSpent, budgetCap, budgetPct });
  }

  return Response.json({ ...state, budgetSpent, budgetCap, budgetPct });
}
