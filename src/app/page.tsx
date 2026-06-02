"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AgentPane } from "@/components/AgentPane";
import { ActivityLog, type ActivityEntry } from "@/components/ActivityLog";
import { OrchestratorBar } from "@/components/OrchestratorBar";
import { CiHealthBanner } from "@/components/CiHealthBanner";
import { useCiHealth } from "@/hooks/useCiHealth";
import type {
  AccentKey,
  AgentConfig,
  AgentState,
  ChatMessage,
  MessageAuthor,
  Provider,
  RoleId,
  SseEvent,
  TeamRoleId,
} from "@/types";

const DEFAULT_MODELS: Record<Provider, string> = {
  claude: "claude-sonnet-4-6",
  gemini: "gemini-2.5-flash",
  groq: "llama-3.3-70b-versatile",
};

const ALL_ROLES: RoleId[] = [
  "product-owner",
  "business-analyst",
  "architect",
  "ui-developer",
  "backend-developer",
  "qa",
  "devsecops",
  "ux-designer",
];
const TEAM_ROLES: TeamRoleId[] = [
  "business-analyst",
  "architect",
  "ui-developer",
  "backend-developer",
  "qa",
  "devsecops",
  "ux-designer",
];

const ROLE_META: Record<RoleId, { title: string; accent: AccentKey }> = {
  "product-owner": { title: "Product Owner", accent: "po" },
  "business-analyst": { title: "Business Analyst", accent: "ba" },
  architect: { title: "Architect", accent: "arch" },
  "ui-developer": { title: "UI Developer", accent: "ui" },
  "backend-developer": { title: "Backend Developer", accent: "be" },
  qa: { title: "QA", accent: "qa" },
  devsecops: { title: "DevSecOps", accent: "ops" },
  "ux-designer": { title: "UX Designer", accent: "uxd" },
};

function defaultAgents(): Record<RoleId, AgentConfig> {
  return Object.fromEntries(
    ALL_ROLES.map((r) => [r, { role: r, provider: "claude" as Provider, model: DEFAULT_MODELS.claude }]),
  ) as Record<RoleId, AgentConfig>;
}

function blankPerRole<T>(value: T): Record<RoleId, T> {
  return Object.fromEntries(ALL_ROLES.map((r) => [r, value])) as Record<RoleId, T>;
}

function blankAgentStates(): Record<RoleId, AgentState> {
  return Object.fromEntries(
    ALL_ROLES.map((r) => [r, { threadId: "", role: r, handoffDoc: "", updatedAt: 0 }]),
  ) as Record<RoleId, AgentState>;
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
  const [pending, setPending] = useState<Record<RoleId, string | null>>(() =>
    blankPerRole<string | null>(null),
  );
  const [busy, setBusy] = useState<Record<RoleId, boolean>>(() => blankPerRole(false));
  const [status, setStatus] = useState<Record<RoleId, string | null>>(() =>
    blankPerRole<string | null>(null),
  );
  const [handoffDocs, setHandoffDocs] = useState<Record<RoleId, AgentState>>(blankAgentStates);
  const [inboxCounts, setInboxCounts] = useState<Record<TeamRoleId, number>>(() =>
    Object.fromEntries(TEAM_ROLES.map((r) => [r, 0])) as Record<TeamRoleId, number>,
  );
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);
  const activitySeqRef = useRef(0);

  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  // Track whether the user has manually typed a thread ID. If so, we don't
  // override it with the MCP-last-used thread on mount.
  const userEditedThreadRef = useRef(false);

  // Stable ref to current threadId for use inside intervals.
  const threadIdRef = useRef(threadId);
  threadIdRef.current = threadId;

  useEffect(() => {
    // Defer minting a local thread ID until we know whether the MCP client
    // already has an active thread. Minting immediately and then overriding
    // on the fetch result opens a spurious EventSource to the discarded ID.
    fetch("/api/active-thread", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { threadId: string | null }) => {
        if (data.threadId && !userEditedThreadRef.current) {
          setThreadId(data.threadId);
        } else if (!userEditedThreadRef.current) {
          setThreadId(newThreadId());
        }
      })
      .catch(() => {
        if (!userEditedThreadRef.current) setThreadId(newThreadId());
      });

    const stored = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (stored && stored.trim()) {
      setWorkspace(stored);
      return;
    }
    fetch("/api/health", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { defaultCwd?: string }) => {
        if (data.defaultCwd) setWorkspace(data.defaultCwd);
      })
      .catch(() => {});
  }, []);

  const pushActivity = useCallback((text: string) => {
    setActivityLog((prev) => {
      const entry: ActivityEntry = { id: ++activitySeqRef.current, ts: Date.now(), text };
      return [...prev.slice(-4), entry];
    });
  }, []);

  const onWorkspaceChange = useCallback((next: string) => {
    setWorkspace(next);
    try {
      localStorage.setItem(WORKSPACE_STORAGE_KEY, next);
    } catch {}
  }, []);

  const refreshStates = useCallback(async (tid: string) => {
    const fetches = ALL_ROLES.map((r) =>
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
        if (res && res.r !== "product-owner") {
          // Defensive: /api/agent-state may return an error shape (e.g. for
          // newly-added roles whose row hasn't been seeded yet, or 500s
          // during dev HMR). Treat missing pendingInbox as "0 pending".
          next[res.r as TeamRoleId] = res.data?.pendingInbox?.length ?? 0;
        }
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!threadId) return;
    refreshStates(threadId);
    fetch(`/api/thread-config?threadId=${threadId}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { agentModels: Record<string, string> | null }) => {
        if (!data.agentModels) return;
        const models = data.agentModels;
        setAgents((prev) => {
          const next = { ...prev };
          for (const [role, model] of Object.entries(models)) {
            if (next[role as RoleId]) {
              next[role as RoleId] = { ...next[role as RoleId], model };
              try { localStorage.setItem(`apex-model-${role}`, model); } catch {}
            }
          }
          return next;
        });
      })
      .catch(() => {});
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

  // Replay history, THEN subscribe to live events. Sequencing matters —
  // opening the EventSource first races against the history fetch and
  // can cause a live event to be wiped by a stale fetch result.
  useEffect(() => {
    if (!threadId) return;
    let cancelled = false;
    let es: EventSource | null = null;

    (async () => {
      try {
        const res = await fetch(`/api/thread?threadId=${threadId}`, { cache: "no-store" });
        if (cancelled) return;
        if (res.ok) {
          const data = (await res.json()) as { messages?: ChatMessage[] };
          if (!cancelled && Array.isArray(data.messages)) setMessages(data.messages);
        }
      } catch {
        /* leave messages as-is */
      }
      if (cancelled) return;

      es = new EventSource(`/api/thread-events?threadId=${threadId}`);

      es.onmessage = (e) => {
      let ev: SseEvent;
      try {
        ev = JSON.parse(e.data);
      } catch {
        return;
      }
      switch (ev.type) {
        case "user-message":
          if (ev.role && ev.text) appendLocal({ kind: "user", to: ev.role }, ev.text);
          break;
        case "turn-start":
          if (ev.role) {
            const r = ev.role;
            setBusy((b) => ({ ...b, [r]: true }));
            setPending((p) => ({ ...p, [r]: "" }));
            setStatus((s) => ({ ...s, [r]: "thinking…" }));
            pushActivity(`${r} started`);
          }
          break;
        case "delta":
          if (ev.role && ev.text) {
            const r = ev.role;
            setPending((p) => ({ ...p, [r]: (p[r] ?? "") + ev.text! }));
          }
          break;
        case "turn-end":
          if (ev.role) {
            const r = ev.role;
            const charCount = (ev.text ?? "").length;
            appendLocal({ kind: "agent", role: r }, ev.text ?? "");
            setBusy((b) => ({ ...b, [r]: false }));
            setPending((p) => ({ ...p, [r]: null }));
            setStatus((s) => ({ ...s, [r]: "idle" }));
            pushActivity(`${r} done (${charCount} chars)`);
            // Auto-refresh handoff / inbox counts after each turn.
            refreshStates(threadId);
          }
          break;
        case "handoff":
          if (ev.from && ev.to && ev.message) {
            appendLocal({ kind: "handoff", from: ev.from, to: ev.to }, ev.message);
            pushActivity(`${ev.from} → ${ev.to} HANDOFF`);
          }
          break;
        case "dispatch":
          if (ev.to && ev.message) {
            appendLocal({ kind: "dispatch", to: ev.to }, ev.message);
            // PO dispatch fan-out is server-driven now; just reflect
            // status so the UI shows the peer queued up.
            setStatus((s) => ({ ...s, [ev.to!]: "dispatching" }));
            pushActivity(`PO → ${ev.to} dispatching`);
          }
          break;
        case "notes-updated":
          if (ev.role && typeof ev.handoffDoc === "string") {
            const r = ev.role;
            setHandoffDocs((d) => ({
              ...d,
              [r]: { threadId, role: r, handoffDoc: ev.handoffDoc!, updatedAt: Date.now() },
            }));
          }
          break;
        case "error":
          if (ev.role) {
            const r = ev.role;
            setStatus((s) => ({ ...s, [r]: `error: ${ev.message ?? "unknown"}` }));
            setBusy((b) => ({ ...b, [r]: false }));
            setPending((p) => ({ ...p, [r]: null }));
          }
          break;
        case "agent-models":
          if (ev.agentModels) {
            const models = ev.agentModels;
            setAgents((prev) => {
              const next = { ...prev };
              for (const [role, model] of Object.entries(models)) {
                if (next[role as RoleId]) {
                  next[role as RoleId] = { ...next[role as RoleId], model };
                  try { localStorage.setItem(`apex-model-${role}`, model); } catch {}
                }
              }
              return next;
            });
          }
          break;
      }
    };

      es.onerror = () => {
        // EventSource auto-reconnects; nothing to do here. Surfacing the
        // error in any UI is noise during dev (HMR restarts trip it).
      };
    })();

    return () => {
      cancelled = true;
      es?.close();
    };
  }, [threadId, appendLocal, refreshStates, pushActivity]);

  const runTurn = useCallback(
    (target: RoleId, userMessage: string | null) => {
      if (!threadId) return;
      if (busy[target]) return;

      setStatus((s) => ({ ...s, [target]: "dispatching" }));

      void fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId,
          target,
          ...(userMessage ? { userMessage } : {}),
          ...(workspace ? { workspace } : {}),
          agents,
        }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const detail = await res.text().catch(() => "");
            setStatus((s) => ({
              ...s,
              [target]: `error: HTTP ${res.status}: ${detail || res.statusText}`,
            }));
          }
        })
        .catch((err) => {
          setStatus((s) => ({
            ...s,
            [target]: `error: ${err instanceof Error ? err.message : String(err)}`,
          }));
        });
    },
    [threadId, agents, busy, workspace],
  );

  const onPaneSend = useCallback(
    (text: string, target: RoleId) => {
      runTurn(target, text);
    },
    [runTurn],
  );

  const onProcessInbox = useCallback(
    (target: TeamRoleId) => {
      runTurn(target, null);
    },
    [runTurn],
  );

  const onEditHandoffDoc = useCallback(
    async (role: RoleId, next: string) => {
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

  const resetThreadLocalState = useCallback(() => {
    setMessages([]);
    setStatus(blankPerRole(null));
    setPending(blankPerRole<string | null>(null));
    setBusy(blankPerRole(false));
    setHandoffDocs(blankAgentStates());
    setInboxCounts(Object.fromEntries(TEAM_ROLES.map((r) => [r, 0])) as Record<TeamRoleId, number>);
  }, []);

  // Poll active-thread every 4s so the browser tracks MCP-driven thread switches.
  useEffect(() => {
    const id = setInterval(() => {
      if (userEditedThreadRef.current) return;
      fetch("/api/active-thread", { cache: "no-store" })
        .then((r) => r.json())
        .then((data: { threadId: string | null }) => {
          if (data.threadId && data.threadId !== threadIdRef.current && !userEditedThreadRef.current) {
            setThreadId(data.threadId);
            resetThreadLocalState();
          }
        })
        .catch(() => {});
    }, 4000);
    return () => clearInterval(id);
  }, [resetThreadLocalState]);

  const onNewThread = useCallback(() => {
    setThreadId(newThreadId());
    resetThreadLocalState();
  }, [resetThreadLocalState]);

  const onThreadIdChange = useCallback(
    (next: string) => {
      const trimmed = next.trim();
      if (!trimmed) return;
      userEditedThreadRef.current = true;
      setThreadId(trimmed);
      resetThreadLocalState();
    },
    [resetThreadLocalState],
  );

  const updateAgent = (role: RoleId, cfg: AgentConfig) =>
    setAgents((prev) => ({ ...prev, [role]: cfg }));

  const ciHealth = useCiHealth();
  const anyBusy = Object.values(busy).some(Boolean);

  const paneProps = (role: RoleId) => ({
    role,
    title: ROLE_META[role].title,
    accent: ROLE_META[role].accent,
    config: agents[role],
    onConfigChange: (c: AgentConfig) => updateAgent(role, c),
    messages,
    pendingDraft: pending[role],
    busy: busy[role],
    status: status[role],
    handoffDoc: handoffDocs[role].handoffDoc,
    handoffDocUpdatedAt: handoffDocs[role].updatedAt,
    inboxCount: role === "product-owner" ? 0 : inboxCounts[role as TeamRoleId],
    onSend: onPaneSend,
    onProcessInbox:
      role === "product-owner" ? undefined : () => onProcessInbox(role as TeamRoleId),
    onEditHandoffDoc: (next: string) => onEditHandoffDoc(role, next),
  });

  return (
    <main className="layout">
      <OrchestratorBar
        threadId={threadId || "(initializing)"}
        onNewThread={onNewThread}
        onThreadIdChange={onThreadIdChange}
        busy={anyBusy}
        workspace={workspace}
        onWorkspaceChange={onWorkspaceChange}
        ciHealth={ciHealth}
      />

      <CiHealthBanner ciHealth={ciHealth} />

      <ActivityLog entries={activityLog} />

      <div className="po-area">
        <AgentPane {...paneProps("product-owner")} maxHeight="min(420px, 48vh)" />
      </div>

      <div className="team-grid">
        {TEAM_ROLES.map((r) => (
          <AgentPane key={r} {...paneProps(r)} />
        ))}
      </div>

      <style jsx>{`
        .layout {
          min-height: 100vh;
          display: grid;
          grid-template-rows: auto auto auto auto 1fr;
          gap: 0;
        }
        .po-area {
          padding: 10px 12px 0;
        }
        .team-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          padding: 10px 12px 12px;
        }
        @media (max-width: 1100px) {
          .team-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 720px) {
          .team-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
