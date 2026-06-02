export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import {
  listPipelineState,
  listWaveQueue,
  listPrStatus,
  listPeerIdle,
} from "@/lib/db";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const threadId = searchParams.get("thread_id");
  if (!threadId) {
    return Response.json({ error: { code: "MISSING_THREAD_ID", message: "thread_id query param required" } }, { status: 400 });
  }
  return Response.json({
    pipeline_state: listPipelineState(threadId),
    wave_queue: listWaveQueue(threadId),
    pr_status: listPrStatus(threadId, true),
    peer_idle: listPeerIdle(threadId),
  });
}
