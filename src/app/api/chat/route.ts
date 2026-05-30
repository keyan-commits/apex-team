import { NextRequest } from "next/server";
import { z } from "zod";

import { runTurn } from "@/lib/run-turn";
import { sseFormat, sseHeaders } from "@/lib/sse";
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
        send({ type: "turn-start", role: target });

        const result = await runTurn({
          threadId,
          target,
          userMessage,
          workspace,
          agents: agents as Record<RoleId, AgentConfig>,
          signal: ctrl.signal,
          onChunk: (chunk) => send({ type: "delta", role: target, text: chunk }),
        });

        if (result.newHandoffDoc !== null) {
          send({
            type: "notes-updated",
            role: target,
            handoffDoc: result.newHandoffDoc,
          });
        }

        if (target !== "product-owner") {
          for (const h of result.handoffs) {
            send({
              type: "handoff",
              from: target as Exclude<RoleId, "product-owner">,
              to: h.to as Exclude<RoleId, "product-owner">,
              message: h.message,
            });
          }
        }

        if (target === "product-owner") {
          for (const d of result.dispatches) {
            send({ type: "dispatch", to: d.to, message: d.message });
          }
        }

        send({ type: "turn-end", role: target, text: result.visibleText });
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
