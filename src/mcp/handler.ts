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
// undici's bodyTimeout rolling during long agent turns.
export function startHeartbeat(res: ServerResponse, intervalMs = 15_000): ReturnType<typeof setInterval> {
  return setInterval(() => {
    if (!res.writableEnded) {
      try {
        res.write(": keepalive\n\n");
        (res as unknown as { flush?: () => void }).flush?.();
      } catch {}
    }
  }, intervalMs);
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
  const heartbeat = startHeartbeat(res);
  try {
    await transport.handleRequest(req, res, raw);
  } finally {
    clearInterval(heartbeat);
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
