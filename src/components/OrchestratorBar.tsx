"use client";

import { type RefObject, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CiHealthData, CiState } from "@/types";
import { formatRelative } from "@/hooks/useCiHealth";

interface Props {
  threadId: string;
  onNewThread: () => void;
  onThreadIdChange: (next: string) => void;
  busy: boolean;
  workspace: string;
  onWorkspaceChange: (next: string) => void;
  onSettingsOpen?: () => void;
  settingsOpen?: boolean;
  gearBtnRef?: RefObject<HTMLButtonElement | null>;
  ciHealth?: CiHealthData | null;
}

type ActiveCiState = Exclude<CiState, "healthy">;

const CI_ICON: Record<ActiveCiState, string> = {
  alarm: "✕",
  warning: "⚠",
  recovering: "↻",
  unknown: "?",
};

function ciPillValue(state: ActiveCiState, consecutiveReds: number): string {
  if (state === "alarm" || state === "warning") return `${consecutiveReds} red`;
  if (state === "recovering") return "recovering";
  return "CI";
}

function ciPillTooltip(ciHealth: CiHealthData): string {
  const { state, consecutiveReds, latestRun, staleSince } = ciHealth;
  if (state === "unknown") {
    const checked = staleSince ? formatRelative(staleSince) : "never";
    return `CI health unknown — last checked ${checked}`;
  }
  const detail = latestRun
    ? ` — last: ${latestRun.name} · ${formatRelative(latestRun.createdAt)}`
    : "";
  return `main has ${consecutiveReds} consecutive red CI run${consecutiveReds !== 1 ? "s" : ""}${detail}`;
}

export function OrchestratorBar({
  threadId,
  onNewThread,
  onThreadIdChange,
  busy,
  workspace,
  onWorkspaceChange,
  onSettingsOpen,
  settingsOpen = false,
  gearBtnRef,
  ciHealth = null,
}: Props) {
  const pathname = usePathname();
  const [draft, setDraft] = useState(workspace);
  const [threadDraft, setThreadDraft] = useState(threadId);
  const [wsFocused, setWsFocused] = useState(false);

  useEffect(() => {
    setDraft(workspace);
  }, [workspace]);

  useEffect(() => {
    setThreadDraft(threadId);
  }, [threadId]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== workspace) onWorkspaceChange(trimmed);
  };

  const commitThread = () => {
    const trimmed = threadDraft.trim();
    if (trimmed && trimmed !== threadId) onThreadIdChange(trimmed);
  };

  return (
    <header className="bar">
      <div className="brand">
        <span className="logo">⌬</span> apex-team
      </div>

      <span className="sep" aria-hidden />

      <nav className="nav-tabs" aria-label="Main navigation">
        <Link href="/" className={`tab${pathname === "/" ? " tab-active" : ""}`}>Team</Link>
        <Link href="/dashboard" className={`tab${pathname === "/dashboard" ? " tab-active" : ""}`}>Dashboard</Link>
      </nav>

      <div className="workspace">
        <span className="label">workspace</span>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => setWsFocused(true)}
          onBlur={() => { setWsFocused(false); commit(); }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
              (e.target as HTMLInputElement).blur();
            }
          }}
          spellCheck={false}
          placeholder="/absolute/path/to/project"
          title={draft || "Working directory shared by the top Claude Code terminal and the BA/Dev agents."}
          aria-label={draft ? `Workspace: ${draft}` : "Workspace path"}
          style={!wsFocused && draft.length > 40 ? { direction: "rtl" } : undefined}
        />
        {draft !== workspace && <span className="dirty" title="Press Enter to apply">●</span>}
      </div>

      <div className="thread">
        <span className="label">thread</span>
        <input
          type="text"
          value={threadDraft}
          onChange={(e) => setThreadDraft(e.target.value)}
          onBlur={commitThread}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitThread();
              (e.target as HTMLInputElement).blur();
            }
          }}
          spellCheck={false}
          placeholder="thread id"
          title="Paste a thread id (e.g. from an MCP-driven session) to subscribe to its events."
        />
        {threadDraft !== threadId && (
          <span className="dirty" title="Press Enter to apply">●</span>
        )}
        <button type="button" className="ghost" onClick={onNewThread} disabled={busy}>
          new
        </button>
      </div>

      {onSettingsOpen && (
        <button
          ref={gearBtnRef}
          type="button"
          className={`gear-btn${settingsOpen ? " gear-active" : ""}`}
          onClick={onSettingsOpen}
          aria-label="Stall notification settings"
          aria-expanded={settingsOpen}
          title="Stall notification settings"
        >
          ⚙
        </button>
      )}

      {ciHealth && ciHealth.state !== "healthy" && (() => {
        const s = ciHealth.state as ActiveCiState;
        const icon = CI_ICON[s];
        const value = ciPillValue(s, ciHealth.consecutiveReds);
        const tooltip = ciPillTooltip(ciHealth);
        return (
          <span
            tabIndex={0}
            className={`ci-pill ci-pill--${s}`}
            title={tooltip}
            aria-label={tooltip}
          >
            <span className="ci-icon">{icon}</span>
            <span className="ci-main"> main{s !== "unknown" ? ":" : ""}</span>
            <span className="ci-body"> {value}</span>
          </span>
        );
      })()}

      <style jsx>{`
        .bar {
          display: flex;
          align-items: center;
          gap: 24px;
          padding: 8px 16px;
          border-bottom: 1px solid var(--border);
          background: var(--surface);
          flex-wrap: wrap;
        }
        .brand {
          font-weight: 700;
          letter-spacing: 0.02em;
          display: flex; align-items: center; gap: 6px;
          flex-shrink: 0;
        }
        .logo { color: var(--accent-orch); font-size: 18px; }
        .sep { width: 1px; height: 24px; background: var(--border); flex-shrink: 0; }
        .nav-tabs {
          display: flex;
          gap: 6px;
          flex-shrink: 0;
        }
        .tab {
          padding: 6px 16px;
          border-radius: 6px;
          border: 1px solid var(--border);
          font-size: 13px;
          font-weight: 500;
          color: var(--text-dim);
          text-decoration: none;
          transition: color 0.15s, background 0.15s, border-color 0.15s;
        }
        .tab:hover { color: var(--text); background: var(--surface-2); border-color: color-mix(in srgb, var(--accent-po) 50%, var(--border)); }
        .tab:focus-visible { outline: 2px solid var(--accent-po); outline-offset: 2px; }
        .tab-active {
          color: var(--text);
          background: color-mix(in srgb, var(--accent-po) 14%, var(--surface-2));
          border-color: var(--accent-po);
          font-weight: 700;
        }
        .workspace {
          flex: 1;
          min-width: 280px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--text-dim);
        }
        .workspace input {
          flex: 1;
          background: var(--surface-2);
          color: var(--text);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 4px 8px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 12px;
        }
        .workspace .dirty {
          color: var(--accent-orch);
          font-size: 14px;
          line-height: 1;
        }
        .thread {
          font-size: 12px;
          color: var(--text-dim);
          display: flex;
          gap: 6px;
          align-items: center;
        }
        .thread input {
          background: var(--surface-2);
          color: var(--text);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 2px 6px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 12px;
          min-width: 200px;
        }
        .thread .dirty {
          color: var(--accent-orch);
          font-size: 14px;
          line-height: 1;
        }
        .ghost {
          background: transparent;
          color: var(--text-dim);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 2px 8px;
          font-size: 11px;
          cursor: pointer;
        }
        .ghost:disabled { opacity: 0.4; cursor: not-allowed; }
        .gear-btn {
          background: transparent;
          border: none;
          color: var(--text-dim);
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
          padding: 4px 6px;
          border-radius: 4px;
          flex-shrink: 0;
          transition: color 150ms;
        }
        .gear-btn:hover { color: var(--accent-ui); }
        .gear-btn.gear-active { color: var(--accent-ui); }
        .gear-btn:focus-visible { outline: 2px solid var(--accent-ui); outline-offset: 2px; }

        /* CI health pill */
        .ci-pill {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 4px;
          border: 1px solid;
          font-size: 12px;
          font-weight: 500;
          flex-shrink: 0;
          cursor: default;
          outline: none;
          white-space: nowrap;
        }
        .ci-pill:focus-visible { outline-offset: 2px; }
        .ci-pill--warning {
          color: var(--accent-po);
          border-color: color-mix(in srgb, var(--accent-po) 40%, var(--border));
          background: color-mix(in srgb, var(--accent-po) 8%, var(--surface-2));
        }
        .ci-pill--warning:focus-visible { outline: 2px solid var(--accent-po); }
        .ci-pill--alarm {
          color: var(--accent-qa);
          border-color: color-mix(in srgb, var(--accent-qa) 40%, var(--border));
          background: color-mix(in srgb, var(--accent-qa) 8%, var(--surface-2));
        }
        .ci-pill--alarm:focus-visible { outline: 2px solid var(--accent-qa); }
        .ci-pill--recovering {
          color: var(--accent-po);
          border-color: color-mix(in srgb, var(--accent-po) 40%, var(--border));
          background: color-mix(in srgb, var(--accent-po) 8%, var(--surface-2));
        }
        .ci-pill--recovering:focus-visible { outline: 2px solid var(--accent-po); }
        .ci-pill--unknown {
          color: var(--text-dim);
          border-color: var(--border);
          background: var(--surface-2);
        }
        .ci-pill--unknown:focus-visible { outline: 2px solid var(--accent-po); }

        /* Responsive text hiding */
        @media (max-width: 768px) {
          .ci-main { display: none; }
        }
        @media (max-width: 480px) {
          .ci-body { display: none; }
        }
      `}</style>
    </header>
  );
}
