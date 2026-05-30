import { NextRequest } from "next/server";

import { subscribe } from "@/lib/event-bus";
import { sseFormat, sseHeaders } from "@/lib/sse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Long-lived SSE feed for a single thread. Subscribes to the in-memory
// event bus and forwards every turn event (UI-initiated or MCP-initiated)
// to the browser. The dashboard opens one of these per thread on mount.
export async function GET(req: NextRequest): Promise<Response> {
  const threadId = req.nextUrl.searchParams.get("threadId");
  if (!threadId) {
    return new Response(JSON.stringify({ error: "threadId required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const safeEnqueue = (data: Uint8Array) => {
        if (closed) return;
        try {
          controller.enqueue(data);
        } catch {
          closed = true;
        }
      };

      // Open with a no-op event so the client knows the stream is live.
      safeEnqueue(sseFormat({ type: "done" }));

      const unsubscribe = subscribe(threadId, (event) => {
        safeEnqueue(sseFormat(event));
      });

      // Periodic keepalive comment — many proxies idle-close SSE streams
      // after ~60s with no traffic. The bus may go quiet between turns.
      const keepalive = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(new TextEncoder().encode(": keepalive\n\n"));
        } catch {
          closed = true;
        }
      }, 25_000);

      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(keepalive);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      req.signal.addEventListener("abort", cleanup, { once: true });
    },
  });

  return new Response(stream, { headers: sseHeaders() });
}
