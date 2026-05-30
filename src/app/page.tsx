"use client";

import { useCallback, useEffect, useState } from "react";

import { AgentPane } from "@/components/AgentPane";
import { OrchestratorBar } from "@/components/OrchestratorBar";
import { TerminalPane } from "@/components/TerminalPane";
import { consumeSse } from "@/lib/sse-client";
import type {
  AgentConfig,
  AgentState,
  ChatMessage,
  MessageAuthor,
  Provider,
  RoleId,
  TeamRoleId,
} from "@/types";

const DEFAULT_MODELS: Record<Provider, string> = {
  claude: "claude-sonnet-4-6",
  gemini: "gemini-2.5-flash",
  groq: "llama-3.3-70b-versatile",
};

const TEAM_ROLES: TeamRoleId[] = ["business-analyst", "developer"];

// Orchestrator is rendered via TerminalPane (real `claude` CLI subprocess);
// we never invoke /api/chat for target=orchestrator anymore. But the request
// schema and Record<RoleId, …> shapes still expect an `orchestrator` entry,
// so we keep a stub config that's never actually used.
function defaultAgents(): Record<RoleId, AgentConfig> {
  return {
    "business-analyst": { role: "business-analyst", provider: "claude", model: DEFAULT_MODELS.claude },
    developer: { role: "developer", provider: "claude", model: DEFAULT_MODELS.claude },
    orchestrator: { role: "orchestrator", provider: "claude", model: DEFAULT_MODELS.claude },
  };
}

function blankPerTeamRole<T>(value: T): Record<TeamRoleId, T> {
  return { "business-analyst": value, developer: value };
}

function newThreadId(): string {
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

const WORKSPACE_STORAGE_KEY = "apex-team:workspace";

export default function Home() {
  const [threadId, setThreadId] = useState<string>("");
  const [workspace, setWorkspace] = useState<string>("");
  const [agents, setAgents] = useState<Record<RoleId, AgentConfig>>(defaultAgents);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState<Record<TeamRoleId, string | null>>(() =>
    blankPerTeamRole<string | null>(null),
  );
  const [busy, setBusy] = useState<Record<TeamRoleId, boolean>>(() => blankPerTeamRole(false));
  const [status, setStatus] = useState<Record<TeamRoleId, string | null>>(() =>
    blankPerTeamRole<string | null>(null),
  );
  const [handoffDocs, setHandoffDocs] = useState<Record<TeamRoleId, AgentState>>(() => ({
    "business-analyst": { threadId: "", role: "business-analyst", handoffDoc: "", updatedAt: 0 },
    developer: { threadId: "", role: "developer", handoffDoc: "", updatedAt: 0 },
  }));
  const [inboxCounts, setInboxCounts] = useState<Record<TeamRoleId, number>>(() =>
    blankPerTeamRole(0),
  );

  useEffect(() => {
    setThreadId(newThreadId());
    const stored = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (stored && stored.trim()) {
      setWorkspace(stored);
      return;
    }
    // No stored workspace — fall back to the server's cwd (apex-team itself).
    fetch("/api/health", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { defaultCwd?: string }) => {
        if (data.defaultCwd) setWorkspace(data.defaultCwd);
      })
      .catch(() => {
        // ignore
      });
  }, []);

  const onWorkspaceChange = useCallback((next: string) => {
    setWorkspace(next);
    try {
      localStorage.setItem(WORKSPACE_STORAGE_KEY, next);
    } catch {
      // private mode or quota; non-fatal
    }
  }, []);

  const refreshStates = useCallback(async (tid: string) => {
    const fetches = TEAM_ROLES.map((r) =>
      fetch(`/api/agent-state?threadId=${tid}&role=${r}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((data: { state: AgentState; pendingInbox: ChatMessage[] }) => ({ r, data }))
        .catch(() => null),
    );
    const results = await Promise.all(fetches);
    setHandoffDocs((prev) => {
      const next = { ...prev };
      for (const res of results) {
        if (res?.data?.state) next[res.r] = res.data.state;
      }
      return next;
    });
    setInboxCounts((prev) => {
      const next = { ...prev };
      for (const res of results) {
        if (res?.data) next[res.r] = res.data.pendingInbox.length;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (threadId) refreshStates(threadId);
  }, [threadId, refreshStates]);

  const appendLocal = useCallback(
    (author: MessageAuthor, content: string) => {
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length > 0 ? prev[prev.length - 1].id + 1 : 1,
          threadId,
          author,
          content,
          createdAt: Date.now(),
        },
      ]);
    },
    [threadId],
  );

  const runTurn = useCallback(
    async (target: TeamRoleId, userMessage: string | null) => {
      if (!threadId) return;
      if (busy[target]) return;

      setBusy((b) => ({ ...b, [target]: true }));
      setStatus((s) => ({ ...s, [target]: "dispatching" }));

      if (userMessage) appendLocal({ kind: "user", to: target }, userMessage);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            threadId,
            target,
            ...(userMessage ? { userMessage } : {}),
            ...(workspace ? { workspace } : {}),
            agents,
          }),
        });
        if (!res.ok) {
          const detail = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status}: ${detail || res.statusText}`);
        }

        await consumeSse(res, (ev) => {
          switch (ev.type) {
            case "turn-start":
              setPending((p) => ({ ...p, [target]: "" }));
              setStatus((s) => ({ ...s, [target]: "thinking…" }));
              break;
            case "delta":
              if (ev.text) {
                setPending((p) => ({
                  ...p,
                  [target]: (p[target] ?? "") + ev.text,
                }));
              }
              break;
            case "turn-end":
              appendLocal({ kind: "agent", role: target }, ev.text ?? "");
              setPending((p) => ({ ...p, [target]: null }));
              setStatus((s) => ({ ...s, [target]: "done" }));
              break;
            case "handoff":
              if (ev.from && ev.to && ev.message) {
                appendLocal({ kind: "handoff", from: ev.from, to: ev.to }, ev.message);
                setStatus((s) => ({ ...s, [target]: `→ ${ev.to}` }));
              }
              break;
            case "notes-updated":
              if (ev.role && typeof ev.handoffDoc === "string") {
                const updatedRole = ev.role;
                if (updatedRole === "business-analyst" || updatedRole === "developer") {
                  setHandoffDocs((d) => ({
                    ...d,
                    [updatedRole]: {
                      threadId,
                      role: updatedRole,
                      handoffDoc: ev.handoffDoc!,
                      updatedAt: Date.now(),
                    },
                  }));
                }
              }
              break;
            case "error":
              setStatus((s) => ({ ...s, [target]: `error: ${ev.message ?? "unknown"}` }));
              break;
            case "done":
              setStatus((s) => ({ ...s, [target]: "idle" }));
              break;
          }
        });
      } catch (err) {
        setStatus((s) => ({
          ...s,
          [target]: `error: ${err instanceof Error ? err.message : String(err)}`,
        }));
      } finally {
        setBusy((b) => ({ ...b, [target]: false }));
        setPending((p) => ({ ...p, [target]: null }));
        refreshStates(threadId);
      }
    },
    [threadId, agents, busy, appendLocal, refreshStates, workspace],
  );

  const onPaneSend = useCallback(
    (text: string, target: TeamRoleId) => {
      void runTurn(target, text);
    },
    [runTurn],
  );

  const onProcessInbox = useCallback(
    (target: TeamRoleId) => {
      void runTurn(target, null);
    },
    [runTurn],
  );

  const onEditHandoffDoc = useCallback(
    async (role: TeamRoleId, next: string) => {
      if (!threadId) return;
      const res = await fetch("/api/agent-state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, role, handoffDoc: next }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { state: AgentState };
      setHandoffDocs((d) => ({ ...d, [role]: data.state }));
    },
    [threadId],
  );

  const onNewThread = useCallback(() => {
    setThreadId(newThreadId());
    setMessages([]);
    setStatus(blankPerTeamRole(null));
    setPending(blankPerTeamRole<string | null>(null));
    setBusy(blankPerTeamRole(false));
    setHandoffDocs({
      "business-analyst": { threadId: "", role: "business-analyst", handoffDoc: "", updatedAt: 0 },
      developer: { threadId: "", role: "developer", handoffDoc: "", updatedAt: 0 },
    });
    setInboxCounts(blankPerTeamRole(0));
  }, []);

  const updateAgent = (role: RoleId, cfg: AgentConfig) =>
    setAgents((prev) => ({ ...prev, [role]: cfg }));

  const anyBusy = Object.values(busy).some(Boolean);

  return (
    <main className="layout">
      <OrchestratorBar
        threadId={threadId || "(initializing)"}
        onNewThread={onNewThread}
        busy={anyBusy}
        workspace={workspace}
        onWorkspaceChange={onWorkspaceChange}
      />

      <div className="orch-area">
        <TerminalPane workspace={workspace} />
      </div>

      <div className="panes">
        {TEAM_ROLES.map((r) => (
          <AgentPane
            key={r}
            role={r}
            title={r === "business-analyst" ? "Business Analyst" : "Developer"}
            accent={r === "business-analyst" ? "ba" : "dev"}
            config={agents[r]}
            onConfigChange={(c) => updateAgent(r, c)}
            messages={messages}
            pendingDraft={pending[r]}
            busy={busy[r]}
            status={status[r]}
            handoffDoc={handoffDocs[r].handoffDoc}
            handoffDocUpdatedAt={handoffDocs[r].updatedAt}
            inboxCount={inboxCounts[r]}
            onSend={onPaneSend}
            onProcessInbox={() => onProcessInbox(r)}
            onEditHandoffDoc={(next) => onEditHandoffDoc(r, next)}
          />
        ))}
      </div>

      <style jsx>{`
        .layout {
          height: 100vh;
          display: grid;
          grid-template-rows: auto auto 1fr;
          gap: 0;
        }
        .orch-area {
          padding: 12px 12px 0;
          min-height: 0;
        }
        .panes {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          padding: 12px;
          min-height: 0;
        }
      `}</style>
    </main>
  );
}
