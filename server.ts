// Custom Next.js server. Hosts the Next.js request handler AND a
// Streamable-HTTP MCP server at /mcp so external Claude Code sessions
// can drive the apex-team:
//
//   claude mcp add apex-team --transport http http://localhost:3000/mcp
//
// MCP requests are intercepted here BEFORE Next.js sees them; everything
// else goes to the Next.js request handler as normal.

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { parse } from "node:url";
import next from "next";

// MCP handler is async-loaded so a stack-trace in MCP code doesn't crash
// the Next.js bootstrap path. Imported once on first MCP request.
let mcpHandler:
  | ((req: IncomingMessage, res: ServerResponse) => Promise<void>)
  | null = null;

const PORT = parseInt(process.env.PORT ?? "3000", 10);
const HOST = process.env.HOST ?? "localhost";
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

void app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    const url = parse(req.url ?? "/", true);

    if (url.pathname === "/mcp" || url.pathname?.startsWith("/mcp/")) {
      try {
        if (!mcpHandler) {
          const mod = await import("./src/mcp/handler");
          mcpHandler = mod.handleMcpRequest;
        }
        await mcpHandler(req, res);
      } catch (err) {
        console.error("[mcp] error", err);
        if (!res.headersSent) {
          res.writeHead(500, { "Content-Type": "application/json" });
        }
        res.end(
          JSON.stringify({
            jsonrpc: "2.0",
            error: {
              code: -32603,
              message: err instanceof Error ? err.message : String(err),
            },
            id: null,
          }),
        );
      }
      return;
    }

    handle(req, res, url);
  });

  server.listen(PORT, HOST, () => {
    console.log(`> apex-team ready on http://${HOST}:${PORT}`);
    console.log(`> MCP endpoint:  http://${HOST}:${PORT}/mcp`);
  });
});
