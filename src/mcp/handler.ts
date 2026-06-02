// Streamable HTTP MCP handler. Mounted at /mcp in server.ts.
//
// Stateless per-request: each MCP request creates a fresh McpServer +
// transport. Mirrors apex-engine's pattern — cheap (microseconds),
// avoids cross-request state that would survive a respawn, simpler
// debugging.

import type { IncomingMessage, ServerResponse } from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { registerApexTeamTools } from "./tools";

export const MCP_PATH = "/mcp";

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

  const server = new McpServer(
    { name: "apex-team", version: "0.1.0" },
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
