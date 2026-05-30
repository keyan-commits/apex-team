import { NextRequest } from "next/server";
import { z } from "zod";

import { getAgentState, listPendingInbox, setAgentHandoffDoc } from "@/lib/db";
import { isTeamRole } from "@/lib/roles";
import type { TeamRoleId } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RoleEnum = z.enum([
  "product-owner",
  "business-analyst",
  "architect",
  "ui-developer",
  "backend-developer",
  "qa",
  "devsecops",
]);

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
  const pendingInbox = isTeamRole(role)
    ? listPendingInbox(threadId, role as TeamRoleId)
    : [];
  return Response.json({
    state: getAgentState(threadId, role),
    pendingInbox,
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
