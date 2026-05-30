// Custom Next.js server with a WebSocket upgrade handler for /api/pty.
// We need this because Next.js's App Router route handlers don't expose
// WebSocket upgrade — and we need a real bidirectional socket to bridge
// xterm.js (in the browser) <-> node-pty (running `claude` on the server).

import { createServer, type IncomingMessage } from "node:http";
import { parse } from "node:url";
import type { Duplex } from "node:stream";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import next from "next";
import { WebSocketServer, type WebSocket } from "ws";
import { spawn as ptySpawn, type IPty } from "node-pty";

const PORT = parseInt(process.env.PORT ?? "3000", 10);
const HOST = process.env.HOST ?? "localhost";
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// Resolve the absolute path to `claude` once, at startup. node-pty's
// posix_spawnp uses the calling process's PATH for lookup; if the
// parent shell that ran `pnpm dev` didn't have ~/.local/bin or
// /opt/homebrew/bin on PATH, the spawn fails with "posix_spawnp failed."
// Using an absolute path sidesteps the issue entirely. Override with
// the CLAUDE_BIN env var if needed.
function resolveClaudeBin(): string | null {
  const fromEnv = process.env.CLAUDE_BIN?.trim();
  if (fromEnv && existsSync(fromEnv)) return fromEnv;

  try {
    const which = execSync("command -v claude 2>/dev/null", {
      encoding: "utf8",
      shell: "/bin/bash",
      env: process.env,
    }).trim();
    if (which && existsSync(which)) return which;
  } catch {
    // fall through to candidate scan
  }

  const candidates = [
    "/opt/homebrew/bin/claude",
    "/usr/local/bin/claude",
    join(homedir(), ".local/bin/claude"),
  ];
  for (const path of candidates) {
    if (existsSync(path)) return path;
  }
  return null;
}

const CLAUDE_BIN = resolveClaudeBin();

// Validate a client-supplied cwd. Falls back to the server's own cwd
// if the path is missing, non-existent, or not a directory. Single-user
// local app, so we don't sandbox — the user can point to any directory
// they have access to.
function resolveCwd(candidate: string | undefined): string {
  if (!candidate) return process.cwd();
  try {
    const stat = require("node:fs").statSync(candidate);
    if (stat.isDirectory()) return candidate;
  } catch {
    // fall through
  }
  return process.cwd();
}

interface PtyMessage {
  type: "input" | "resize";
  data?: string;
  cols?: number;
  rows?: number;
}

interface ServerMessage {
  type: "output" | "exit" | "error";
  data?: string;
  code?: number;
  message?: string;
}

void app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res, parse(req.url ?? "/", true));
  });

  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req: IncomingMessage, socket: Duplex, head: Buffer) => {
    const url = parse(req.url ?? "/", true);
    if (url.pathname === "/api/pty") {
      const cwdParam = typeof url.query.cwd === "string" ? url.query.cwd : undefined;
      const resolvedCwd = resolveCwd(cwdParam);
      wss.handleUpgrade(req, socket, head, (ws) => {
        attachPty(ws, resolvedCwd);
      });
    } else {
      socket.destroy();
    }
  });

  server.listen(PORT, HOST, () => {
    console.log(`> apex-team ready on http://${HOST}:${PORT}  (PTY at ws://${HOST}:${PORT}/api/pty)`);
    if (CLAUDE_BIN) {
      console.log(`> claude binary resolved: ${CLAUDE_BIN}`);
    } else {
      console.warn(
        `> WARNING: could not resolve 'claude' binary. Set CLAUDE_BIN in .env.local or add it to PATH.`,
      );
    }
  });
});

function attachPty(ws: WebSocket, cwd: string): void {
  const send = (msg: ServerMessage) => {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
  };

  if (!CLAUDE_BIN) {
    send({
      type: "error",
      message:
        "Could not find the 'claude' CLI on this machine. Add it to PATH or set CLAUDE_BIN=/absolute/path/to/claude in .env.local and restart pnpm dev.",
    });
    ws.close();
    return;
  }

  let term: IPty;
  try {
    term = ptySpawn(CLAUDE_BIN, [], {
      name: "xterm-256color",
      cols: 80,
      rows: 24,
      cwd,
      env: process.env as Record<string, string>,
    });
  } catch (err) {
    send({
      type: "error",
      message: `Failed to spawn '${CLAUDE_BIN}': ${err instanceof Error ? err.message : String(err)}`,
    });
    ws.close();
    return;
  }

  console.log(`> [pty] spawned claude pid=${term.pid} cwd=${cwd}`);

  term.onData((data) => send({ type: "output", data }));

  term.onExit(({ exitCode }) => {
    send({ type: "exit", code: exitCode });
    if (ws.readyState === ws.OPEN) ws.close();
  });

  ws.on("message", (raw) => {
    let msg: PtyMessage;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (msg.type === "input" && typeof msg.data === "string") {
      term.write(msg.data);
    } else if (
      msg.type === "resize" &&
      typeof msg.cols === "number" &&
      typeof msg.rows === "number"
    ) {
      try {
        term.resize(Math.max(msg.cols, 1), Math.max(msg.rows, 1));
      } catch {
        // node-pty throws if dimensions are invalid; ignore.
      }
    }
  });

  const cleanup = () => {
    try {
      term.kill();
    } catch {
      // already dead
    }
  };
  ws.on("close", cleanup);
  ws.on("error", cleanup);
}
