import { NextRequest } from "next/server";
import { z } from "zod";

import { appendMessage, setAgentHandoffDoc } from "@/lib/db";
import { runAgentTurn } from "@/lib/agents";
import { parseAgentReply } from "@/lib/orchestrator";
import { sseFormat, sseHeaders } from "@/lib/sse";
import type { AgentConfig, RoleId } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RoleEnum = z.enum(["business-analyst", "developer", "orchestrator"]);
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
    "business-analyst": AgentConfigSchema,
    developer: AgentConfigSchema,
    orchestrator: AgentConfigSchema,
  }),
});

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

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const ctrl = new AbortController();
      req.signal.addEventListener("abort", () => ctrl.abort(), { once: true });

      const send = (event: Parameters<typeof sseFormat>[0]) => {
        controller.enqueue(sseFormat(event));
      };

      try {
        if (userMessage && userMessage.trim()) {
          appendMessage(
            threadId,
            { kind: "user", to: target },
            userMessage.trim(),
          );
        }

        send({ type: "turn-start", role: target });

        let buffer = "";
        for await (const chunk of runAgentTurn({
          threadId,
          role: target,
          agents: agents as Record<RoleId, AgentConfig>,
          cwd: workspace,
          signal: ctrl.signal,
        })) {
          buffer += chunk;
          send({ type: "delta", role: target, text: chunk });
        }

        const { visibleText, newHandoffDoc, handoffs, dispatches } = parseAgentReply(buffer);

        appendMessage(
          threadId,
          { kind: "agent", role: target },
          visibleText || buffer.trim(),
        );

        if (newHandoffDoc !== null) {
          setAgentHandoffDoc(threadId, target, newHandoffDoc);
          send({
            type: "notes-updated",
            role: target,
            handoffDoc: newHandoffDoc,
          });
        }

        // Peer HANDOFF — async inbox, no auto-trigger. BA/Dev emit these.
        for (const h of handoffs) {
          if (target === "orchestrator") continue; // orchestrator uses DISPATCH; ignore stray HANDOFF.
          appendMessage(
            threadId,
            { kind: "handoff", from: target as "business-analyst" | "developer", to: h.to },
            h.message,
          );
          send({ type: "handoff", from: target as "business-analyst" | "developer", to: h.to, message: h.message });
        }

        // Orchestrator DISPATCH — auto-triggers target turn (client picks this up).
        for (const d of dispatches) {
          if (target !== "orchestrator") continue; // only orchestrator may DISPATCH.
          appendMessage(threadId, { kind: "dispatch", to: d.to }, d.message);
          send({ type: "dispatch", to: d.to, message: d.message });
        }

        send({ type: "turn-end", role: target, text: visibleText });
        send({ type: "done" });
      } catch (err) {
        send({ type: "error", message: errorMessage(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: sseHeaders() });
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
