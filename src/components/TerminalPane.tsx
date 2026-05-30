"use client";

import { useEffect, useRef, useState } from "react";
import "@xterm/xterm/css/xterm.css";

interface Props {
  workspace: string;
}

export function TerminalPane({ workspace }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<string>("connecting…");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!workspace) return;

    let disposed = false;
    let cleanup: (() => void) | null = null;

    // Dynamic import — xterm references `window` at module top-level, so it
    // can't be imported in a server-rendered file.
    (async () => {
      const [{ Terminal }, { FitAddon }] = await Promise.all([
        import("@xterm/xterm"),
        import("@xterm/addon-fit"),
      ]);
      if (disposed) return;

      const term = new Terminal({
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
        fontSize: 13,
        cursorBlink: true,
        scrollback: 5000,
        theme: {
          background: "#0b0e14",
          foreground: "#e6e9ef",
          cursor: "#e0af68",
          black: "#15191f",
          red: "#f7768e",
          green: "#9ece6a",
          yellow: "#e0af68",
          blue: "#7aa2f7",
          magenta: "#bb9af7",
          cyan: "#7dcfff",
          white: "#a9b1d6",
          brightBlack: "#414868",
          brightRed: "#f7768e",
          brightGreen: "#9ece6a",
          brightYellow: "#e0af68",
          brightBlue: "#7aa2f7",
          brightMagenta: "#bb9af7",
          brightCyan: "#7dcfff",
          brightWhite: "#c0caf5",
        },
      });
      const fit = new FitAddon();
      term.loadAddon(fit);
      term.open(container);
      fit.fit();

      const wsUrl =
        (location.protocol === "https:" ? "wss://" : "ws://") +
        location.host +
        "/api/pty?cwd=" +
        encodeURIComponent(workspace);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setStatus("connected");
        ws.send(
          JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }),
        );
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data) as {
            type: string;
            data?: string;
            code?: number;
            message?: string;
          };
          if (msg.type === "output" && typeof msg.data === "string") {
            term.write(msg.data);
          } else if (msg.type === "exit") {
            setStatus(`exited (${msg.code ?? "?"})`);
            term.write(`\r\n\x1b[33m[claude exited with code ${msg.code ?? "?"}]\x1b[0m\r\n`);
          } else if (msg.type === "error") {
            setStatus("error");
            term.write(`\r\n\x1b[31m[server error: ${msg.message ?? "unknown"}]\x1b[0m\r\n`);
          }
        } catch {
          // ignore malformed frames
        }
      };

      ws.onclose = () => setStatus((s) => (s === "error" ? s : "disconnected"));
      ws.onerror = () => setStatus("error");

      const inputSub = term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "input", data }));
        }
      });

      const onResize = () => {
        fit.fit();
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }),
          );
        }
      };
      window.addEventListener("resize", onResize);

      cleanup = () => {
        window.removeEventListener("resize", onResize);
        inputSub.dispose();
        try {
          ws.close();
        } catch {
          // ignore
        }
        term.dispose();
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [workspace]);

  return (
    <section className="term-pane">
      <header className="term-header">
        <div className="title">
          <span className="logo">⌬</span>
          <strong>Claude Code</strong>
          <span className="hint">
            (real CLI — cwd: <code>{workspace || "…"}</code>)
          </span>
        </div>
        <span className="status">{status}</span>
      </header>
      <div ref={containerRef} className="term-host" />
      <style jsx>{`
        .term-pane {
          display: flex;
          flex-direction: column;
          min-height: 0;
          background: var(--surface);
          border: 1px solid color-mix(in srgb, var(--accent-orch) 30%, var(--border));
          border-radius: 12px;
          overflow: hidden;
        }
        .term-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 14px;
          border-bottom: 1px solid var(--border);
          background: color-mix(in srgb, var(--accent-orch) 6%, var(--surface));
          gap: 12px;
        }
        .title {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          font-weight: 600;
        }
        .logo { color: var(--accent-orch); font-size: 16px; }
        .hint {
          font-size: 11px;
          color: var(--text-dim);
          font-weight: 400;
        }
        .hint code {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 1px 5px;
          color: var(--text);
        }
        .status {
          font-size: 11px;
          color: var(--text-dim);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        }
        .term-host {
          flex: 1;
          padding: 6px;
          background: #0b0e14;
          min-height: 360px;
        }
        .term-host :global(.xterm) {
          height: 100%;
        }
        .term-host :global(.xterm-viewport) {
          background-color: transparent !important;
        }
      `}</style>
    </section>
  );
}
