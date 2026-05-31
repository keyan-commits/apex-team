import { NextRequest } from "next/server";
import { z } from "zod";

import { listMessages } from "@/lib/db";
import type { RoleId, WorkflowEdge, WorkflowResponse } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXPECTED: RoleId[] = [
  "product-owner",
  "business-analyst",
  "ux-designer",
  "ui-developer",
  "ux-designer",
  "qa",
  "devsecops",
];

const QuerySchema = z.object({
  threadId: z.string().min(1),
});

export async function GET(req: NextRequest): Promise<Response> {
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({ threadId: url.searchParams.get("threadId") });
  if (!parsed.success) {
    return Response.json({ error: "missing threadId" }, { status: 400 });
  }

  const { threadId } = parsed.data;
  const allMessages = listMessages(threadId);
  // Cap at last 200 to avoid blowing up on long threads
  const messages = allMessages.slice(-200);

  const edges: WorkflowEdge[] = [];

  for (const msg of messages) {
    const { author } = msg;
    if (author.kind === "user") {
      edges.push({
        from: "user",
        to: (author.to ?? "product-owner") as RoleId,
        kind: "user",
        messageId: msg.id,
        createdAt: msg.createdAt,
        excerpt: msg.content.slice(0, 80),
      });
    } else if (author.kind === "dispatch") {
      edges.push({
        from: "product-owner",
        to: author.to,
        kind: "dispatch",
        messageId: msg.id,
        createdAt: msg.createdAt,
        excerpt: msg.content.slice(0, 80),
      });
    } else if (author.kind === "handoff") {
      edges.push({
        from: author.from,
        to: author.to,
        kind: "handoff",
        messageId: msg.id,
        createdAt: msg.createdAt,
        excerpt: msg.content.slice(0, 80),
      });
    }
  }

  // Collapse consecutive visits to the same destination role into steps
  const steps: WorkflowResponse["steps"] = [];
  for (const edge of edges) {
    const last = steps[steps.length - 1];
    if (last && last.role === edge.to) {
      last.visits += 1;
      last.lastAt = edge.createdAt;
    } else {
      steps.push({ role: edge.to, visits: 1, firstAt: edge.createdAt, lastAt: edge.createdAt });
    }
  }

  const response: WorkflowResponse = {
    threadId,
    edges,
    steps,
    expected: EXPECTED,
  };

  return Response.json(response);
}
