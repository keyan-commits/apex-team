import { NextRequest } from "next/server";
import { z } from "zod";

import { getAgentState, listPendingInbox, setAgentHandoffDoc } from "@/lib/db";
import type { RoleId } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RoleEnum = z.enum(["business-analyst", "developer"]);

const QuerySchema = z.object({
  threadId: z.string().min(1),
  role: RoleEnum,
});

export async function GET(req: NextRequest): Promise<Response> {
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    threadId: url.searchParams.get("threadId"),
    role: url.searchParams.get("role"),
  });
  if (!parsed.success) {
    return Response.json({ error: "missing threadId/role" }, { status: 400 });
  }
  const { threadId, role } = parsed.data;
  return Response.json({
    state: getAgentState(threadId, role),
    pendingInbox: listPendingInbox(threadId, role as RoleId),
  });
}

const PutSchema = z.object({
  threadId: z.string().min(1),
  role: RoleEnum,
  handoffDoc: z.string(),
});

export async function PUT(req: NextRequest): Promise<Response> {
  let body: z.infer<typeof PutSchema>;
  try {
    body = PutSchema.parse(await req.json());
  } catch (err) {
    return Response.json({ error: "invalid body", detail: String(err) }, { status: 400 });
  }
  const state = setAgentHandoffDoc(body.threadId, body.role, body.handoffDoc);
  return Response.json({ state });
}
