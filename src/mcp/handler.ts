// Streamable HTTP MCP handler. Mounted at /mcp in server.ts.
//
// Stateless per-request: each MCP request creates a fresh McpServer +
// transport. Mirrors apex-engine's pattern — cheap (microseconds),
// avoids cross-request state that would survive a respawn, simpler
// debugging.
//
// Session refresh on restart (#257): BOOT_SESSION_ID is a UUID generated once
// per process lifetime. It is injected as Mcp-Session-Id in every initialize
// response. Non-initialize requests that carry a different (pre-restart) session
// ID receive 404, which the MCP spec requires clients to handle by re-sending
// initialize — giving them a fresh tool registry without a manual reconnect.

import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { registerApexTeamTools } from "./tools";

export const MCP_PATH = "/mcp";

// One UUID per process boot. Changes on every restart, invalidating stale
// client-side session caches (MCP Streamable HTTP §Session Management).
export const BOOT_SESSION_ID = randomUUID();

// Exported for testing. Writes SSE comment bytes at intervalMs cadence to keep
// undici's bodyTimeout rolling during long agent turns. Returns a `stop`
// disposer that cancels both the immediate first-fire timeout AND the
// recurring interval (#172).
//
// First beat fires after `firstBeatMs` (default 100ms) — setInterval alone
// would not fire until `intervalMs` elapsed, leaving the response stream
// silent during the initial model round-trip; if any client/proxy timeout
// is shorter than that initial gap, the connection drops before the first
// keepalive is ever written. The immediate-first-fire defeats that class
// of failure.
function writeKeepalive(res: ServerResponse): void {
  if (!res.writableEnded) {
    try {
      res.write(": keepalive\n\n");
      (res as unknown as { flush?: () => void }).flush?.();
    } catch (err) {
      // Log so transport drops are diagnosable instead of silently swallowed.
      console.warn("[mcp/handler] heartbeat write failed:", err);
    }
  }
}

export function startHeartbeat(
  res: ServerResponse,
  intervalMs = 5_000,
  firstBeatMs = 100,
): { stop: () => void } {
  // Defeat sub-interval client/proxy timeouts by writing one keepalive almost
  // immediately, before the SDK starts its model round-trip.
  const firstTimer = setTimeout(() => writeKeepalive(res), firstBeatMs);
  const interval = setInterval(() => writeKeepalive(res), intervalMs);
  return {
    stop: () => {
      clearTimeout(firstTimer);
      clearInterval(interval);
    },
  };
}

export async function handleMcpRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const raw = await readBody(req);
  const isInitialize = (raw as { method?: string } | undefined)?.method === "initialize";
  const clientSessionId = req.headers["mcp-session-id"] as string | undefined;

  // Non-initialize requests with a stale or absent session ID get 404.
  // Per spec, clients MUST re-send initialize on 404, which gives them a
  // fresh tool registry after a server restart (#257).
  if (!isInitialize && clientSessionId !== BOOT_SESSION_ID) {
    const id = (raw as { id?: unknown } | undefined)?.id ?? null;
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32001, message: "Session expired — send initialize to reconnect" },
        id,
      }),
    );
    return;
  }

  // Advertise the boot-scoped session ID so the client tracks it.
  // Node.js buffers setHeader() values and sends them with the first write,
  // so this header appears in the transport's response even though we set it
  // before the transport writes anything.
  if (isInitialize) {
    res.setHeader("Mcp-Session-Id", BOOT_SESSION_ID);
  }

  const server = new McpServer(
    { name: "apex-team", version: BOOT_SESSION_ID },
    {
      capabilities: { tools: {} },
    },
  );
  registerApexTeamTools(server);

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
    enableDnsRebindingProtection: true,
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      "[::1]",
      `localhost:${process.env.PORT ?? "3000"}`,
      `127.0.0.1:${process.env.PORT ?? "3000"}`,
      `[::1]:${process.env.PORT ?? "3000"}`,
    ],
  });
  await server.connect(transport);

  // Keep the TCP connection alive during long agent turns. undici's bodyTimeout
  // (5 min default) + intermediate network idle timeouts can kill the socket
  // before a multi-agent tool call completes. Any bytes flowing reset both.
  // The SDK always responds with text/event-stream for tool calls, so SSE
  // comment bytes are valid and ignored by the client.
  //
  // 5s cadence + immediate first-beat (~100ms) defeats sub-interval client and
  // proxy timeouts that were dropping connections before the first keepalive
  // could fire (#172).
  const heartbeat = startHeartbeat(res);
  try {
    await transport.handleRequest(req, res, raw);
  } finally {
    heartbeat.stop();
  }
}

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let buf = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      buf += chunk;
      if (buf.length > 5 * 1024 * 1024) {
        reject(new Error("request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!buf) return resolve(undefined);
      try {
        resolve(JSON.parse(buf));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}
