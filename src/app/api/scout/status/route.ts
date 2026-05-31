import { getScoutMeta } from "@/lib/db";
import { scoutRunning } from "@/lib/scout-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const meta = getScoutMeta();
  return Response.json({
    running: scoutRunning,
    lastRunAt: meta.lastRunAt,
    proposalsLast7Days: meta.proposalsLast7Days,
  });
}
