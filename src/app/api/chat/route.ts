import { NextRequest } from "next/server";
import { z } from "zod";

import { runTurnWithDispatches } from "@/lib/run-turn-with-dispatches";
import { publish } from "@/lib/event-bus";
import type { AgentConfig, RoleId } from "@/types";

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
  "ux-designer",
]);
const ProviderEnum = z.enum(["claude", "gemini", "groq"]);

const AgentConfigSchema = z.object({
  role: RoleEnum,
  provider: ProviderEnum,
  model: z.string().min(1),
});

const BodySchema = z.object({
  threadId: z.string().min(1),
  target: RoleEnum,
  userMessage: z.string().optional(),
  workspace: z.string().optional(),
  agents: z.object({
    "product-owner": AgentConfigSchema,
    "business-analyst": AgentConfigSchema,
    architect: AgentConfigSchema,
    "ui-developer": AgentConfigSchema,
    "backend-developer": AgentConfigSchema,
    qa: AgentConfigSchema,
    devsecops: AgentConfigSchema,
    "ux-designer": AgentConfigSchema,
  }),
});

// POST kicks off a turn (plus any PO-dispatched peers) and awaits it.
// All observable events flow through the per-thread event bus; subscribe
// at /api/thread-events to watch them stream. No SSE on this endpoint —
// the bus is the single delivery path for turn events.
export async function POST(req: NextRequest): Promise<Response> {
  let parsed: z.infer<typeof BodySchema>;
  try {
    parsed = BodySchema.parse(await req.json());
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "invalid body", detail: String(err) }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const { threadId, target, userMessage, workspace, agents } = parsed;

  const ctrl = new AbortController();
  req.signal.addEventListener("abort", () => ctrl.abort(), { once: true });

  try {
    await runTurnWithDispatches({
      threadId,
      target,
      userMessage,
      workspace,
      agents: agents as Record<RoleId, AgentConfig>,
      signal: ctrl.signal,
    });
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Best-effort error broadcast — runTurn already publishes its own
    // error event for stream failures, but catch the outer envelope too.
    publish(threadId, { type: "error", role: target, message });
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
