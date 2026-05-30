import { NextRequest } from "next/server";
import { z } from "zod";

import { listMessages } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  threadId: z.string().min(1),
});

export async function GET(req: NextRequest): Promise<Response> {
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({ threadId: url.searchParams.get("threadId") });
  if (!parsed.success) {
    return Response.json({ error: "missing threadId" }, { status: 400 });
  }
  const messages = listMessages(parsed.data.threadId);
  return Response.json({ messages });
}
