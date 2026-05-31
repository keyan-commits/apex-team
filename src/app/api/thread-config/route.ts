import { getThreadAgentModels } from "@/lib/db";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const threadId = new URL(req.url).searchParams.get("threadId");
  if (!threadId) return Response.json({ agentModels: null }, { status: 400 });
  return Response.json({ agentModels: getThreadAgentModels(threadId) });
}
