"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { TeamStatus, RepoStatus } from "@/types";
import { OrchestratorBar } from "@/components/OrchestratorBar";
import { StallBanner } from "@/components/StallBanner";
import {
  StallSettingsDrawer,
  DEFAULT_STALL_SETTINGS,
  STALL_SETTINGS_KEY,
  type StallSettings,
} from "@/components/StallSettingsDrawer";
import { ActiveWaveCard } from "@/components/ActiveWaveCard";

const ROLE_ACCENT: Record<string, string> = {
  "product-owner": "po", "business-analyst": "ba", architect: "arch",
  "ui-developer": "ui", "backend-developer": "be", qa: "qa", devsecops: "ops",
  "ux-designer": "uxd",
};

const WORKSPACE_KEY = "apex-team:workspace";
const POLL_INTERVAL_KEY = "apex-poll-interval";
const KNOWN_MODELS = [
  "claude-opus-4-8",
  "claude-opus-4-7",
  "claude-sonnet-4-6",
  "claude-haiku-4-5-20251001",
  "gemini-2.5-flash",
  "llama-3.3-70b-versatile",
];
const ROLES = [
  "product-owner","business-analyst","architect",
  "ui-developer","backend-developer","qa","devsecops","ux-designer",
] as const;

const CONTEXT_MAX_CHARS = 8000;
const CONTEXT_AMBER = 0.5;
const CONTEXT_RED = 0.8;

function satLevel(chars: number): "green" | "amber" | "red" {
  const pct = chars / CONTEXT_MAX_CHARS;
  return pct > CONTEXT_RED ? "red" : pct > CONTEXT_AMBER ? "amber" : "green";
}

const PANEL_INFO: Record<string, string> = {
  now: "Roles currently working. Each row shows the task they were given and the state (thinking / streaming / dispatching).",
  queued: "Tasks that have been dispatched but not yet started. Drag-and-drop to set your own priority order — stored locally.",
  done: "Recently completed turns across all roles. Click a row to see the full task summary.",
  blocked: "Roles whose most recent turn ended in error. Click to see the error.",
  wave: "Excerpt from the Product Owner's most recent plan, showing what the team is collectively working on.",
  issues: "Open GitHub issues by label. Select rows and click \"→ PO\" to ask the Product Owner to schedule them.",
  scout: "Weekly self-improvement scan that files skill-proposal issues. Currently manual — Product Owner proposes a scout wave when 7+ days have passed.",
  context: "Each role's working memory: HANDOFF doc size + message-history depth. \"Needs cleanup\" badge appears when oversized; Product Owner compacts on next turn.",
  spend: "Token cost per role, based on reference public API pricing. Useful as a relative efficiency signal — you're on a Claude subscription, not pay-per-token.",
};

function fmtTime(ms: number | null | undefined): string {
  if (!ms) return "never";
  const d = new Date(ms);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function fmtUsd(n: number): string {
  return n < 0.001 ? "<$0.001" : `$${n.toFixed(3)}`;
}

function fmtNum(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function roleBadge(role: string) {
  const accent = ROLE_ACCENT[role] ?? "po";
  return (
    <span
      key={role}
      style={{
        display: "inline-block", padding: "1px 6px", borderRadius: 99, fontSize: 10,
        fontWeight: 700, fontFamily: "ui-monospace, monospace", letterSpacing: "0.03em",
        background: `color-mix(in srgb, var(--accent-${accent}) 15%, var(--surface-2))`,
        color: `var(--accent-${accent})`,
        border: `1px solid color-mix(in srgb, var(--accent-${accent}) 40%, var(--border))`,
      }}
    >{role}</span>
  );
}

function playStallAlertSound() {
  try {
    const ctx = new (window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  } catch {
    // Web Audio unavailable; silently skip
  }
}

interface WaveStateData {
  peer_idle: Array<{ role: string; isIdle: boolean }>;
}

function severityStyle(labelName: string, labelColor?: string): [string, string] {
  switch (labelName.toLowerCase()) {
    case "blocker":  return ["var(--accent-error)", "white"];
    case "critical": return ["var(--accent-critical)", "white"];
    case "high":     return ["var(--accent-warning)", "var(--text)"];
    case "medium":   return ["var(--accent-info)", "white"];
    case "low":      return ["var(--surface-2)", "var(--text-dim)"];
    case "nit":      return ["var(--surface-1)", "var(--text-dim)"];
    default:
      if (labelColor) return [labelColor, getContrastingTextColor(labelColor)];
      return ["var(--accent-info)", "white"]; // unlabeled → medium
  }
}

// WCAG 2.x relative luminance — gamma-linearizes each channel, then picks #000 or #fff
// at the 0.179 threshold (≥4.5:1 contrast ratio for both choices).
function getContrastingTextColor(bgHex: string): string {
  if (!bgHex.startsWith("#") || bgHex.length < 7) return "#fff";
  const lin = (c: number) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const r = lin(parseInt(bgHex.slice(1, 3), 16) / 255);
  const g = lin(parseInt(bgHex.slice(3, 5), 16) / 255);
  const b = lin(parseInt(bgHex.slice(5, 7), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.179 ? "#000" : "#fff";
}
export default function DashboardPage() {
  const [threadId, setThreadId] = useState<string>("");
  const [data, setData] = useState<TeamStatus | null>(null);
  const [waveState, setWaveState] = useState<WaveStateData | null>(null);
  const [endpointReady, setEndpointReady] = useState(true);
  const [savedOrder, setSavedOrder] = useState<number[]>([]);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [selectedIssues, setSelectedIssues] = useState<Set<number>>(new Set());
  const [dispatchState, setDispatchState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<Record<string, string | number>>({});
  const [openTooltip, setOpenTooltip] = useState<string | null>(null);
  const [roleModels, setRoleModels] = useState<Record<string, string>>({});
  const [workspace, setWorkspace] = useState<string>("");
  const [sendingRows, setSendingRows] = useState<Set<number>>(new Set());
  const [fetchError, setFetchError] = useState(false);
  const [pollIntervalMs, setPollIntervalMs] = useState<number>(10000);
  const [flashedRowId, setFlashedRowId] = useState<number | null>(null);
  const [liveMsg, setLiveMsg] = useState("");
  const [scoutRunning, setScoutRunning] = useState(false);
  const [scoutError, setScoutError] = useState<string | null>(null);
  const scoutBaseRunAtRef = useRef<number | null | undefined>(undefined);

  // Stall notification state
  const [stallSettings, setStallSettings] = useState<StallSettings>(DEFAULT_STALL_SETTINGS);
  const [stallDismissed, setStallDismissed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; duration: number; key: number } | null>(null);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unavailable" | null>(null);
  const [issueOrder, setIssueOrder] = useState<"lifo" | "fifo">(() => {
    try {
      const v = localStorage.getItem("apex-team:issues-order");
      return v === "fifo" ? "fifo" : "lifo";
    } catch { return "lifo"; }
  });
  const prevStallActiveRef = useRef(false);
  const queuedRowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const userEditedThreadRef = useRef(false);
  const threadIdRef = useRef(threadId);
  threadIdRef.current = threadId;

  useEffect(() => {
    fetch("/api/active-thread", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { threadId: string | null; workspace?: string | null }) => {
        if (d.threadId && !userEditedThreadRef.current) setThreadId(d.threadId);
        if (d.workspace) setWorkspace(d.workspace);
      })
      .catch(() => {});
  }, []);

  // Poll active-thread every 4s so the dashboard tracks MCP-driven thread switches.
  useEffect(() => {
    const id = setInterval(() => {
      if (userEditedThreadRef.current) return;
      fetch("/api/active-thread", { cache: "no-store" })
        .then((r) => r.json())
        .then((d: { threadId: string | null; workspace?: string | null }) => {
          if (d.threadId && d.threadId !== threadIdRef.current && !userEditedThreadRef.current) {
            setThreadId(d.threadId);
          }
          if (d.workspace) setWorkspace(d.workspace);
        })
        .catch(() => {});
    }, 4000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!threadId) return;
    try {
      const raw = localStorage.getItem(`apex-priority-${threadId}`);
      if (raw) setSavedOrder(JSON.parse(raw));
    } catch {}
  }, [threadId]);

  useEffect(() => {
    const m: Record<string, string> = {};
    for (const r of ROLES) {
      m[r] = localStorage.getItem(`apex-model-${r}`) ?? "claude-sonnet-4-6";
    }
    setRoleModels(m);
    try {
      const ws = localStorage.getItem(WORKSPACE_KEY);
      if (ws) { setWorkspace(ws); return; }
    } catch {}
    // No localStorage entry — seed from server's MCP-configured workspace
    fetch("/api/health", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { defaultCwd?: string }) => { if (d.defaultCwd) setWorkspace(d.defaultCwd); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!openTooltip) return;
    const onDown = (e: MouseEvent) => {
      if (!(e.target as Element).closest(".panel-hd-wrap")) setOpenTooltip(null);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenTooltip(null); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openTooltip]);

  const fetchTeamData = useCallback(() => {
    if (!threadId || document.visibilityState !== "visible") return;
    fetch(`/api/team-status?threadId=${encodeURIComponent(threadId)}&workspace=${encodeURIComponent(workspace)}`, { cache: "no-store" })
      .then((r) => {
        if (r.status === 404) { setEndpointReady(false); return null; }
        setEndpointReady(true);
        return r.json() as Promise<TeamStatus>;
      })
      .then((d) => { if (d) { setData(d); setFetchError(false); } })
      .catch(() => setFetchError(true));
    fetch(`/api/wave-state?thread_id=${encodeURIComponent(threadId)}`, { cache: "no-store" })
      .then((r) => r.ok ? r.json() as Promise<WaveStateData> : null)
      .then((d) => { if (d) setWaveState(d); })
      .catch(() => {});
  }, [threadId, workspace]);

  useEffect(() => {
    if (!threadId) return;
    setData(null);
    fetchTeamData();
    const onVis = () => fetchTeamData();
    document.addEventListener("visibilitychange", onVis);
    if (pollIntervalMs === 0) {
      return () => document.removeEventListener("visibilitychange", onVis);
    }
    const id = setInterval(fetchTeamData, pollIntervalMs);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, [threadId, fetchTeamData, pollIntervalMs]);

  useEffect(() => {
    if (!threadId) return;
    const es = new EventSource(`/api/thread-events?threadId=${threadId}`);
    es.onmessage = (e) => {
      let ev: { type: string };
      try { ev = JSON.parse(e.data); } catch { return; }
      if (["turn-end", "notes-updated", "handoff", "dispatch"].includes(ev.type)) {
        fetchTeamData();
      }
    };
    return () => es.close();
  }, [threadId, fetchTeamData]);

  const PINNED_LABELS = ["critical", "blocker"];
  const sortedRecentIssues = useMemo(() => {
    const recent = data?.issues.recent ?? [];
    const pinned = recent.filter((iss) => PINNED_LABELS.includes(iss.label.toLowerCase()));
    const rest = recent.filter((iss) => !PINNED_LABELS.includes(iss.label.toLowerCase()));
    const sortFn = (a: typeof recent[0], b: typeof recent[0]) =>
      issueOrder === "lifo" ? b.number - a.number : a.number - b.number;
    return { pinned: [...pinned].sort(sortFn), rest: [...rest].sort(sortFn) };
  }, [data?.issues.recent, issueOrder]);

  const toggleIssueOrder = useCallback((order: "lifo" | "fifo") => {
    setIssueOrder(order);
    try { localStorage.setItem("apex-team:issues-order", order); } catch {}
  }, []);

  const sortedQueued = useMemo<TeamStatus["queued"]>(() => {
    if (!data?.queued) return [];
    if (!savedOrder.length) return data.queued;
    const pos = new Map(savedOrder.map((id, i) => [id, i]));
    return [...data.queued].sort((a, b) => (pos.get(a.id) ?? 9999) - (pos.get(b.id) ?? 9999));
  }, [data?.queued, savedOrder]);

  interface DoneGroup {
    key: string;
    rows: TeamStatus["done"];
    waves: number[];
    tickets: number[];
    roles: string[];
    latestAt: number;
  }

  const groupedDone = useMemo<DoneGroup[]>(() => {
    if (!data?.done) return [];
    const groups: DoneGroup[] = [];
    for (const row of data.done) {
      const rowWaves = row.waves ?? [];
      const rowTickets = row.tickets ?? [];
      const last = groups[groups.length - 1];
      const sharesWave = last && rowWaves.length > 0 && last.waves.some((w) => rowWaves.includes(w));
      const sharesTicketFallback =
        last && last.waves.length === 0 && rowWaves.length === 0 &&
        rowTickets.length > 0 && last.tickets.some((t) => rowTickets.includes(t));
      if (sharesWave || sharesTicketFallback) {
        last.rows.push(row);
        for (const w of rowWaves) if (!last.waves.includes(w)) last.waves.push(w);
        for (const t of rowTickets) if (!last.tickets.includes(t)) last.tickets.push(t);
        if (!last.roles.includes(row.role)) last.roles.push(row.role);
        if (row.completedAt > last.latestAt) last.latestAt = row.completedAt;
      } else {
        const sortedW = [...rowWaves].sort((a, b) => a - b);
        const sortedT = [...rowTickets].sort((a, b) => a - b);
        const key = sortedW.length > 0
          ? `wave-${sortedW[0]}`
          : sortedT.length > 0
          ? `tickets-${sortedT.join("-")}`
          : `single-${row.role}-${row.completedAt}`;
        groups.push({ key, rows: [row], waves: [...rowWaves], tickets: [...rowTickets], roles: [row.role], latestAt: row.completedAt });
      }
    }
    return groups;
  }, [data?.done]);

  const handleDrop = (toIdx: number) => {
    if (dragFrom === null || dragFrom === toIdx) return;
    const arr = [...sortedQueued];
    const [item] = arr.splice(dragFrom, 1);
    arr.splice(toIdx, 0, item);
    const ids = arr.map((x) => x.id);
    setSavedOrder(ids);
    if (threadId) {
      try { localStorage.setItem(`apex-priority-${threadId}`, JSON.stringify(ids)); } catch {}
    }
    setDragFrom(null);
  };

  const moveQueued = (fromIdx: number, dir: -1 | 1) => {
    const toIdx = fromIdx + dir;
    if (toIdx < 0 || toIdx >= sortedQueued.length) return;
    const arr = [...sortedQueued];
    const [item] = arr.splice(fromIdx, 1);
    arr.splice(toIdx, 0, item);
    const ids = arr.map((x) => x.id);
    setSavedOrder(ids);
    if (threadId) {
      try { localStorage.setItem(`apex-priority-${threadId}`, JSON.stringify(ids)); } catch {}
    }
    setFlashedRowId(item.id);
    setTimeout(() => setFlashedRowId(null), 200);
    setLiveMsg(`Moved to position ${toIdx + 1} of ${arr.length}`);
    setTimeout(() => { queuedRowRefs.current[toIdx]?.focus(); }, 0);
  };

  const queuedRowKd = (idx: number, itemId: number) => (ev: React.KeyboardEvent) => {
    if (ev.key === "ArrowUp") { ev.preventDefault(); moveQueued(idx, -1); return; }
    if (ev.key === "ArrowDown") { ev.preventDefault(); moveQueued(idx, 1); return; }
    if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); toggleRow("queued", itemId); }
  };

  const toggleIssue = (num: number) => {
    setSelectedIssues((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num); else next.add(num);
      return next;
    });
  };

  const toggleRow = (panel: string, key: string | number) =>
    setExpandedRow(prev => {
      const next = { ...prev };
      if (next[panel] === key) delete next[panel]; else next[panel] = key;
      return next;
    });

  const rowKd = (panel: string, key: string | number) => (ev: React.KeyboardEvent) => {
    if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); toggleRow(panel, key); }
  };

  const dispatchToPo = async (issueNumbers: number[]) => {
    if (!threadId) return;
    setDispatchState("sending");
    setDispatchError(null);
    try {
      const res = await fetch("/api/po-dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, issueNumbers }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      setSelectedIssues(new Set());
      setDispatchState("success");
      setTimeout(() => setDispatchState("idle"), 8000);
    } catch (err) {
      setDispatchError(err instanceof Error ? err.message : String(err));
      setDispatchState("error");
    }
  };

  // Per-row single-issue dispatch — runs concurrently; does NOT block other rows.
  const dispatchRowToPo = async (issueNumber: number) => {
    if (!threadId || sendingRows.has(issueNumber)) return;
    setSendingRows((prev) => new Set(prev).add(issueNumber));
    try {
      const res = await fetch("/api/po-dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, issueNumbers: [issueNumber] }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }
    } catch {
      // swallow — button re-enables for retry
    } finally {
      setSendingRows((prev) => { const n = new Set(prev); n.delete(issueNumber); return n; });
    }
  };

  const handlePollIntervalChange = (ms: number) => {
    setPollIntervalMs(ms);
    try { localStorage.setItem(POLL_INTERVAL_KEY, String(ms)); } catch {}
  };

  const setRoleModel = (role: string, model: string) => {
    setRoleModels((prev) => ({ ...prev, [role]: model }));
    try { localStorage.setItem(`apex-model-${role}`, model); } catch {}
  };

  const triggerScout = async () => {
    setScoutError(null);
    scoutBaseRunAtRef.current = data?.scout.lastRunAt;
    try {
      const res = await fetch("/api/scout/trigger", { method: "POST" });
      if (res.status === 503) {
        const body = await res.json().catch(() => ({})) as { error?: { message?: string } };
        setScoutError(body.error?.message ?? "ANTHROPIC_API_KEY not configured — scout disabled");
        return;
      }
      setScoutRunning(true);
    } catch {
      setScoutError("Failed to trigger scout — check server logs");
    }
  };

  useEffect(() => {
    if (!scoutRunning) return;
    const id = setInterval(() => {
      fetch("/api/scout/status", { cache: "no-store" })
        .then((r) => r.json())
        .then((d: { running: boolean; lastRunAt: number | null }) => {
          if (!d.running && d.lastRunAt !== scoutBaseRunAtRef.current) {
            setScoutRunning(false);
          }
        })
        .catch(() => {});
    }, 5000);
    return () => clearInterval(id);
  }, [scoutRunning]);

  // Load stall settings and notification permission on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STALL_SETTINGS_KEY);
      if (raw) setStallSettings({ ...DEFAULT_STALL_SETTINGS, ...JSON.parse(raw) });
    } catch {}
    if (typeof Notification !== "undefined") {
      setNotifPermission(Notification.permission);
    } else {
      setNotifPermission("unavailable");
    }
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(POLL_INTERVAL_KEY);
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if ([0, 1000, 4000, 10000, 30000].includes(parsed)) setPollIntervalMs(parsed);
      }
    } catch {}
  }, []);

  // Persist settings to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STALL_SETTINGS_KEY, JSON.stringify(stallSettings));
    } catch {}
  }, [stallSettings]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), toast.duration);
    return () => clearTimeout(t);
  }, [toast]);

  // Stall onset detection — fires notification + audio on false→true transition
  useEffect(() => {
    const currentlyStalled = !!(data?.stall?.active);
    if (!prevStallActiveRef.current && currentlyStalled) {
      // Stall onset
      if (stallSettings.notification && notifPermission === "granted") {
        try {
          new Notification("apex-team: Team stalled", {
            body: "No merge in >60 min. Backlog present. Check dashboard.",
            tag: "apex-stall",
          });
        } catch {}
      }
      if (stallSettings.audio) {
        playStallAlertSound();
      }
      // Reset dismissed state so banner re-shows on a new stall event
      setStallDismissed(false);
    }
    prevStallActiveRef.current = currentlyStalled;
  }, [data?.stall?.active, stallSettings.notification, stallSettings.audio, notifPermission]);

  const handleNotificationToggle = useCallback(
    async (checked: boolean) => {
      if (!checked) {
        setStallSettings((s) => ({ ...s, notification: false }));
        return;
      }
      const perm = typeof Notification !== "undefined" ? Notification.permission : "denied";
      if (perm === "denied") return;
      if (perm === "granted") {
        setStallSettings((s) => ({ ...s, notification: true }));
        setToast({ msg: "Notifications enabled", duration: 2000, key: Date.now() });
        return;
      }
      // "default" — request from user gesture (this fires inside the checkbox handler)
      try {
        const result = await Notification.requestPermission();
        if (result === "granted") {
          setNotifPermission("granted");
          setStallSettings((s) => ({ ...s, notification: true }));
          setToast({ msg: "Notifications enabled", duration: 2000, key: Date.now() });
        } else {
          setNotifPermission("denied");
          setStallSettings((s) => ({ ...s, notification: false }));
          setToast({
            msg: "Browser blocked notifications — check site settings",
            duration: 4000,
            key: Date.now(),
          });
        }
      } catch {}
    },
    [],
  );

  const REPO_STATUS_COPY: Record<Exclude<RepoStatus, "ok">, string> = {
    none: "No origin remote configured — issues unavailable.",
    "not-git": "This workspace isn't a git repo — issues unavailable.",
    "non-github": "Workspace remote isn't on GitHub — issues unavailable.",
    "bad-path": "Workspace path not found — set a valid directory above.",
  };

  const empty = (msg: string) => <p className="empty-msg">{msg}</p>;
  const notReady = empty("Dashboard data not available — is the server fully started?");

  const panelHd = (title: string, key: string) => (
    <div className="panel-hd-wrap">
      <h2 className="panel-h">
        {title}
        <button
          className="info-btn"
          onClick={(e) => { e.stopPropagation(); setOpenTooltip(v => v === key ? null : key); }}
          aria-label={`About ${title}`}
          aria-expanded={openTooltip === key}
        >ⓘ</button>
      </h2>
      {openTooltip === key && (
        <div className="info-popover" role="tooltip">{PANEL_INFO[key] ?? ""}</div>
      )}
    </div>
  );

  const stallActive = !!(data?.stall?.active);

  return (
    <div className="dash">
      {stallSettings.banner && (
        <StallBanner
          active={stallActive && !stallDismissed}
          onDismiss={() => setStallDismissed(true)}
        />
      )}

      <OrchestratorBar
        threadId={threadId}
        onNewThread={() => setThreadId(`t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`)}
        onThreadIdChange={(next) => { userEditedThreadRef.current = true; setThreadId(next); }}
        busy={false}
        workspace={workspace}
        onWorkspaceChange={(ws) => {
          setWorkspace(ws);
          try { localStorage.setItem(WORKSPACE_KEY, ws); } catch {}
        }}
        onSettingsOpen={() => setSettingsOpen((v) => !v)}
        settingsOpen={settingsOpen}
      />

      <StallSettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={stallSettings}
        onSettingsChange={setStallSettings}
        onNotificationToggle={handleNotificationToggle}
        notificationPermission={notifPermission}
      />

      {toast && (
        <div className="stall-toast" key={toast.key} role="status" aria-live="polite">
          {toast.msg}
        </div>
      )}

      {fetchError && (
        <div className="poll-error">
          ⚠ Failed to reach /api/team-status — retrying in 10s
        </div>
      )}

      <div className="grid">


        {/* NOW */}
        <section className="panel span2">
          {panelHd("Now — In-Flight", "now")}
          {!endpointReady ? notReady : !data ? empty("Loading…") : data.now.length === 0 ? empty("No active turns.") : (
            <div className="row-list">
              {data.now.map((e) => (
                <div key={e.role} className="row-item">
                  <div
                    className="row expandable-row"
                    onClick={() => toggleRow("now", e.role)}
                    onKeyDown={rowKd("now", e.role)}
                    tabIndex={0}
                    role="button"
                    aria-expanded={expandedRow["now"] === e.role}
                  >
                    <span className="row-chevron" aria-hidden="true">{expandedRow["now"] === e.role ? "▾" : "▸"}</span>
                    {roleBadge(e.role)}
                    {((e.waves?.length ?? 0) + (e.tickets?.length ?? 0)) > 0 && (() => {
                      const allChips = [
                        ...(e.waves ?? []).map((w) => ({ kind: "wave" as const, label: `Wave ${w}`, key: `w${w}` })),
                        ...(e.tickets ?? []).map((t) => ({ kind: "ticket" as const, num: t, key: `t${t}` })),
                      ];
                      const visible = allChips.slice(0, 3);
                      const overflow = allChips.length - visible.length;
                      return (
                        <span className="chip-strip" onClick={(ev) => ev.stopPropagation()}>
                          {visible.map((chip) =>
                            chip.kind === "wave"
                              ? <span key={chip.key} className="now-chip now-chip-wave">{chip.label}</span>
                              : data?.issues.repoStatus === "ok"
                              ? <a key={chip.key} className="now-chip now-chip-ticket" href={`https://github.com/${data.issues.repo}/issues/${chip.num}`} target="_blank" rel="noreferrer" onClick={(ev) => ev.stopPropagation()}>#{chip.num}</a>
                              : <span key={chip.key} className="now-chip now-chip-ticket">#{chip.num}</span>
                          )}
                          {overflow > 0 && <span className="now-chip now-chip-overflow">+{overflow}</span>}
                        </span>
                      );
                    })()}
                    <span className="state-pill">{e.state}</span>
                    <span className="task-text">{e.taskSummary}</span>
                    <span className="dim">{fmtTime(e.startedAt)}</span>
                  </div>
                  {expandedRow["now"] === e.role && (
                    <div className="row-detail">
                      <p className="row-detail-text">{e.taskSummary}</p>
                      <div className="row-detail-meta">state: <strong>{e.state}</strong> · started: {fmtTime(e.startedAt)}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* QUEUED */}
        <section className="panel span2">
          {panelHd("Queued — Drag to prioritize", "queued")}
          {!endpointReady ? notReady : !data ? empty("Loading…") : sortedQueued.length === 0 ? empty("No queued tasks.") : (
            <>
              <div className="sr-only" aria-live="polite" aria-atomic="true">{liveMsg}</div>
              <div className="row-list">
              {sortedQueued.map((item, i) => (
                <div key={item.id} className="row-item">
                  <div
                    ref={(el) => { queuedRowRefs.current[i] = el; }}
                    draggable
                    onDragStart={() => setDragFrom(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(i)}
                    onDragEnd={() => setDragFrom(null)}
                    onClick={() => toggleRow("queued", item.id)}
                    onKeyDown={queuedRowKd(i, item.id)}
                    tabIndex={0}
                    role="button"
                    aria-expanded={expandedRow["queued"] === item.id}
                    aria-label={`${item.taskSummary} — position ${i + 1} of ${sortedQueued.length}. Use arrow keys to reorder.`}
                    className={`row draggable${dragFrom === i ? " row-dragging" : ""}${flashedRowId === item.id ? " row-flash" : ""}`}
                  >
                    <span className="drag-handle" aria-hidden="true">⠿</span>
                    <span className="row-chevron" aria-hidden="true">{expandedRow["queued"] === item.id ? "▾" : "▸"}</span>
                    {roleBadge(item.toRole)}
                    <span className="task-text">{item.taskSummary}</span>
                    <span className="dim">{fmtTime(item.createdAt)}</span>
                  </div>
                  {expandedRow["queued"] === item.id && (
                    <div className="row-detail">
                      <p className="row-detail-text">{item.taskSummary}</p>
                      <div className="row-detail-meta">from: {roleBadge(item.fromRole)} · queued: {fmtTime(item.createdAt)}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            </>
          )}
        </section>

        {/* DONE */}
        <section className="panel">
          {panelHd("Done — last 24h", "done")}
          {!endpointReady ? notReady : !data ? empty("Loading…") : data.done.length === 0 ? empty("Nothing completed yet.") : (
            <div className="row-list">
              {groupedDone.map((group, idx) => {
                if (group.rows.length === 1) {
                  const e = group.rows[0];
                  const doneKey = `${group.key}-${idx}`;
                  return (
                    <div key={doneKey} className="row-item">
                      <div
                        className="row expandable-row"
                        onClick={() => toggleRow("done", doneKey)}
                        onKeyDown={rowKd("done", doneKey)}
                        tabIndex={0}
                        role="button"
                        aria-expanded={expandedRow["done"] === doneKey}
                      >
                        <span className="row-chevron" aria-hidden="true">{expandedRow["done"] === doneKey ? "▾" : "▸"}</span>
                        {roleBadge(e.role)}
                        <span className="task-text">{e.taskSummary}</span>
                        <span className="dim">{fmtTime(e.completedAt)}</span>
                      </div>
                      {expandedRow["done"] === doneKey && (
                        <div className="row-detail">
                          <p className="row-detail-text">{e.taskSummary}</p>
                          {e.commitSha && <div className="row-detail-meta">commit: <code>{e.commitSha}</code></div>}
                          <div className="row-detail-meta">completed: {fmtTime(e.completedAt)}</div>
                        </div>
                      )}
                    </div>
                  );
                }
                // Multi-row group — collapsed summary with expand
                const groupKey = `${group.key}-${idx}`;
                const allChips = [
                  ...group.waves.map((w) => ({ kind: "wave" as const, label: `Wave ${w}`, key: `w${w}` })),
                  ...group.tickets.map((t) => ({ kind: "ticket" as const, num: t, key: `t${t}` })),
                ];
                const visibleChips = allChips.slice(0, 4);
                const chipOverflow = allChips.length - visibleChips.length;
                return (
                  <div key={groupKey} className="row-item">
                    <div
                      className="row expandable-row"
                      onClick={() => toggleRow("done", groupKey)}
                      onKeyDown={rowKd("done", groupKey)}
                      tabIndex={0}
                      role="button"
                      aria-expanded={expandedRow["done"] === groupKey}
                    >
                      <span className="row-chevron" aria-hidden="true">{expandedRow["done"] === groupKey ? "▾" : "▸"}</span>
                      <span className="chip-strip" onClick={(ev) => ev.stopPropagation()}>
                        {visibleChips.map((chip) =>
                          chip.kind === "wave"
                            ? <span key={chip.key} className="now-chip now-chip-wave">{chip.label}</span>
                            : data.issues.repoStatus === "ok"
                              ? <a key={chip.key} className="now-chip now-chip-ticket" href={`https://github.com/${data.issues.repo}/issues/${chip.num}`} target="_blank" rel="noreferrer" onClick={(ev) => ev.stopPropagation()}>#{chip.num}</a>
                              : <span key={chip.key} className="now-chip now-chip-ticket">#{chip.num}</span>
                        )}
                        {chipOverflow > 0 && <span className="now-chip now-chip-overflow">+{chipOverflow}</span>}
                      </span>
                      {(() => {
                        const visibleRoles = group.roles.slice(0, 4);
                        const roleOverflow = group.roles.length - visibleRoles.length;
                        return (
                          <span className="done-role-strip">
                            {visibleRoles.map((r) => roleBadge(r))}
                            {roleOverflow > 0 && <span className="now-chip now-chip-overflow">+{roleOverflow}</span>}
                          </span>
                        );
                      })()}
                      <span className="dim">{fmtTime(group.latestAt)}</span>
                    </div>
                    {expandedRow["done"] === groupKey && (
                      <div className="row-detail group-detail">
                        {group.rows.map((e) => {
                          const rowKey = `${e.role}-${e.completedAt}`;
                          const isItemExpanded = expandedRow["done-item"] === rowKey;
                          return (
                            <div key={rowKey} className="group-row-item">
                              <div
                                className="row expandable-row"
                                onClick={(ev) => { ev.stopPropagation(); toggleRow("done-item", rowKey); }}
                                onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); ev.stopPropagation(); toggleRow("done-item", rowKey); } }}
                                tabIndex={0}
                                role="button"
                                aria-expanded={isItemExpanded}
                              >
                                <span className="row-chevron" aria-hidden="true">{isItemExpanded ? "▾" : "▸"}</span>
                                {roleBadge(e.role)}
                                <span className="task-text">{e.taskSummary}</span>
                                <span className="dim">{fmtTime(e.completedAt)}</span>
                              </div>
                              {isItemExpanded && (
                                <div className="row-detail">
                                  <p className="row-detail-text">{e.taskSummary}</p>
                                  {e.commitSha && <div className="row-detail-meta">commit: <code>{e.commitSha}</code></div>}
                                  <div className="row-detail-meta">completed: {fmtTime(e.completedAt)}</div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* BLOCKED */}
        <section className="panel">
          {panelHd("Blocked", "blocked")}
          {!endpointReady ? notReady : !data ? empty("Loading…") : data.blocked.length === 0 ? empty("No errors.") : (
            <div className="row-list">
              {data.blocked.map((e) => (
                <div key={e.role} className="row-item">
                  <div
                    className="row row-error expandable-row"
                    onClick={() => toggleRow("blocked", e.role)}
                    onKeyDown={rowKd("blocked", e.role)}
                    tabIndex={0}
                    role="button"
                    aria-expanded={expandedRow["blocked"] === e.role}
                  >
                    <span className="row-chevron" aria-hidden="true">{expandedRow["blocked"] === e.role ? "▾" : "▸"}</span>
                    {roleBadge(e.role)}
                    <span className="error-text">{e.errorMessage}</span>
                    <span className="dim">{fmtTime(e.sinceAt)}</span>
                  </div>
                  {expandedRow["blocked"] === e.role && (
                    <div className="row-detail row-detail-error">
                      <p className="row-detail-text">{e.errorMessage}</p>
                      <div className="row-detail-meta">since: {fmtTime(e.sinceAt)}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ACTIVE WAVE */}
        <section className="panel span2">
          <ActiveWaveCard
            activeWave={data?.activeWave ?? null}
            now={data?.now ?? []}
            done={data?.done ?? []}
            queued={data?.queued ?? []}
            pollIntervalMs={pollIntervalMs}
            onPollIntervalChange={handlePollIntervalChange}
            endpointReady={endpointReady}
          />
        </section>

        {/* ISSUES */}
        <aside className="panel issue-panel" aria-labelledby="issues-panel-title">
          <div className="panel-hd-wrap">
            <h2 className="panel-h" id="issues-panel-title">
              Issues
              <button
                className="info-btn"
                onClick={(e) => { e.stopPropagation(); setOpenTooltip(v => v === "issues" ? null : "issues"); }}
                aria-label="About Issues"
                aria-expanded={openTooltip === "issues"}
              >ⓘ</button>
            </h2>
            {openTooltip === "issues" && (
              <div className="info-popover" role="tooltip">{PANEL_INFO["issues"] ?? ""}</div>
            )}
          </div>
          {!endpointReady ? notReady : !data ? empty("Loading…") : (
            <div className="issue-panel-inner">
              {data.issues.repoStatus !== "ok" ? (
                <p className="empty-msg">{REPO_STATUS_COPY[data.issues.repoStatus]}</p>
              ) : (
                <>
                  <p className="issue-repo-attr">
                    <a
                      href={`https://github.com/${data.issues.repo}/issues`}
                      target="_blank"
                      rel="noreferrer"
                      className="issue-repo-link"
                    >{data.issues.repo}</a>
                    <span className="issue-total-badge" aria-label={`${data.issues.total} open issues`}>{data.issues.total} open</span>
                  </p>

                  {/* Peer-idle row — from /api/wave-state */}
                  {(() => {
                    const idlePeers = (waveState?.peer_idle ?? []).filter((p) => p.isIdle).map((p) => p.role);
                    if (idlePeers.length === 0) return null;
                    return (
                      <div className="peer-idle-row" aria-label="Idle peers">
                        <span className="peer-idle-label">Idle:</span>
                        {idlePeers.map((r) => roleBadge(r))}
                      </div>
                    );
                  })()}

                  {/* Dynamic label counts — replaces hardcoded apex-team 3-row grid */}
                  {data.issues.byLabel.length > 0 ? (
                    <div className="issue-grid">
                      {data.issues.byLabel.slice(0, 8).map((lbl) => {
                        const [bg, fg] = severityStyle(lbl.name, lbl.color);
                        return (
                          <a
                            key={lbl.name}
                            className="issue-row"
                            href={`https://github.com/${data.issues.repo}/issues?q=label%3A${encodeURIComponent(lbl.name)}+is%3Aopen`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <span className="issue-count" style={{ color: bg }}>{lbl.count}</span>
                            <span
                              className="issue-label-chip"
                              style={{ background: bg, color: fg }}
                              aria-label={`${lbl.name} severity`}
                            >{lbl.name}</span>
                          </a>
                        );
                      })}
                      {data.issues.unlabeled > 0 && (
                        <a
                          className="issue-row"
                          href={`https://github.com/${data.issues.repo}/issues?q=no%3Alabel+is%3Aopen`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <span className="issue-count" style={{ color: "var(--accent-info)" }}>{data.issues.unlabeled}</span>
                          <span
                            className="issue-label-chip"
                            style={{ background: "var(--accent-info)", color: "white" }}
                          >unlabeled</span>
                        </a>
                      )}
                    </div>
                  ) : data.issues.total === 0 ? (
                    <div role="status" aria-live="polite" className="empty-msg">
                      No open issues in {data.issues.repo}.
                    </div>
                  ) : null}

                  {/* Recent open — always shown when total > 0 (AC#2) */}
                  {(data.issues.total ?? 0) > 0 && (
                    <div className="recent-issues">
                      <div className="recent-issues-hd-row">
                        <span className="recent-issues-hd">Recent open</span>
                        <div
                          className="issue-order-toggle"
                          role="group"
                          aria-label="Issue sort order"
                        >
                          <button
                            className={`issue-order-btn${issueOrder === "lifo" ? " active" : ""}`}
                            aria-pressed={issueOrder === "lifo"}
                            onClick={() => toggleIssueOrder("lifo")}
                          >Newest</button>
                          <button
                            className={`issue-order-btn${issueOrder === "fifo" ? " active" : ""}`}
                            aria-pressed={issueOrder === "fifo"}
                            onClick={() => toggleIssueOrder("fifo")}
                          >Oldest</button>
                        </div>
                      </div>
                      {data.issues.recent.length === 0 ? (
                        <p className="empty-msg">No recently opened issues.</p>
                      ) : [...sortedRecentIssues.pinned, ...sortedRecentIssues.rest].map((iss, idx) => {
                        const [sevBg, sevFg] = severityStyle(iss.label, iss.labelColor);
                        const isPinned = PINNED_LABELS.includes(iss.label.toLowerCase());
                        const isDivider = sortedRecentIssues.pinned.length > 0 && idx === sortedRecentIssues.pinned.length;
                        return (
                          <div key={iss.number}>
                            {isDivider && <div className="pinned-divider" aria-hidden="true" />}
                            <div className="recent-row">
                            <input
                              type="checkbox"
                              className="iss-check"
                              checked={selectedIssues.has(iss.number)}
                              onChange={() => toggleIssue(iss.number)}
                              aria-label={`Select issue #${iss.number}`}
                              onClick={(e) => e.stopPropagation()}
                              disabled={dispatchState === "sending"}
                            />
                            <a
                              className="recent-row-body"
                              href={iss.url}
                              target="_blank"
                              rel="noreferrer"
                              title={`#${iss.number} — ${iss.label || "no label"}${isPinned ? " (pinned)" : ""}`}
                            >
                              <span className="iss-num">#{iss.number}</span>
                              <span className="iss-title">{iss.title}</span>
                              {iss.inFlight && <span className="iss-inflight-pill">in-flight</span>}
                              {iss.queued && <span className="iss-queued-pill">queued</span>}
                              <span
                                className="iss-label-badge"
                                style={{ background: sevBg, color: sevFg, borderColor: "transparent" }}
                                aria-label={iss.label ? `${iss.label} severity` : "unlabeled — medium severity"}
                              >{iss.label || "unlabeled"}</span>
                            </a>
                            <button
                              className="iss-po-btn"
                              onClick={() => dispatchRowToPo(iss.number)}
                              disabled={sendingRows.has(iss.number) || !threadId}
                              aria-label={`Send issue #${iss.number} to PO`}
                              title="Send to Product Owner"
                            >{sendingRows.has(iss.number) ? "…" : "→ PO"}</button>
                          </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {dispatchState === "success" && (
                    <div className="dispatch-success">
                      Dispatched to PO. Switch to Team view to watch.{" "}
                      <Link href="/" className="team-link">Team →</Link>
                    </div>
                  )}
                  {dispatchState === "error" && dispatchError && (
                    <div className="dispatch-error">{dispatchError}</div>
                  )}

                  {selectedIssues.size > 0 && (
                    <div className="issue-footer">
                      <span className="sel-count">{selectedIssues.size} selected</span>
                      <button
                        className="footer-cancel"
                        onClick={() => setSelectedIssues(new Set())}
                        disabled={dispatchState === "sending"}
                      >Cancel</button>
                      <button
                        className="footer-dispatch"
                        onClick={() => dispatchToPo([...selectedIssues])}
                        disabled={dispatchState === "sending" || !threadId}
                      >
                        {dispatchState === "sending"
                          ? <><span className="spinner" aria-hidden="true" /> Sending…</>
                          : `→ Send ${selectedIssues.size} to PO`}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </aside>

        {/* SCOUT */}
        <section className="panel">
          {panelHd("Daily Scout", "scout")}
          {!endpointReady ? notReady : !data ? empty("Loading…") : (
            <>
              <dl className="kv-list">
                <dt>Last run</dt><dd>{fmtTime(data.scout.lastRunAt)}</dd>
                <dt>Proposals filed</dt><dd>{data.scout.proposalsLast7Days}</dd>
                <dt>Next run</dt><dd>{data.scout.nextScheduledAt ? fmtTime(data.scout.nextScheduledAt) : "manual only"}</dd>
              </dl>
              {scoutError && (
                <p className="scout-error">{scoutError}</p>
              )}
              <button
                className="scout-run-btn"
                onClick={() => { void triggerScout(); }}
                disabled={scoutRunning}
                aria-busy={scoutRunning}
              >
                {scoutRunning
                  ? <><span className="spinner" aria-hidden="true" /> Running…</>
                  : "Run now"}
              </button>
            </>
          )}
        </section>

        {/* CONTEXT */}
        <section className="panel span2">
          {panelHd("Context", "context")}
          {!endpointReady ? notReady : !data ? empty("Loading…") : data.context.length === 0 ? empty("No context data.") : (
            <div className="context-grid">
              {data.context.map((ctx) => {
                const sat = satLevel(ctx.handoffChars);
                return (
                <div key={ctx.role} className={`ctx-card${ctx.needsCleanup ? " ctx-warn" : ""}`}>
                  <Link href={`/agents/${ctx.role}`} className="ctx-role-link">{roleBadge(ctx.role)}</Link>
                  {ctx.needsCleanup && <span className="cleanup-badge">needs cleanup</span>}
                  <div className="ctx-stats">
                    <span>{fmtNum(ctx.handoffChars)} chars</span>
                    <span>{ctx.historyDepth} msgs</span>
                  </div>
                  <div className="sat-bar-wrap" title={`Context: ${Math.round((ctx.handoffChars / CONTEXT_MAX_CHARS) * 100)}%`}>
                    <div
                      className={`sat-bar sat-${sat}`}
                      style={{ width: `${Math.min(100, (ctx.handoffChars / CONTEXT_MAX_CHARS) * 100).toFixed(1)}%` }}
                    />
                  </div>
                  <select
                    className="ctx-model-select"
                    value={roleModels[ctx.role] ?? "claude-sonnet-4-6"}
                    onChange={(e) => setRoleModel(ctx.role, e.target.value)}
                    aria-label={`Model for ${ctx.role}`}
                    title={`Model for ${ctx.role}`}
                  >
                    {KNOWN_MODELS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                );
              })}
            </div>
          )}
        </section>

        {/* SPEND */}
        <section className="panel span2">
          {panelHd("Spend", "spend")}
          {!endpointReady ? notReady : !data ? empty("Loading…") : (
            <>
              <div className="spend-totals">
                <div className="spend-stat"><span className="spend-val">{fmtUsd(data.spend.todayUsd)}</span><span className="spend-lbl">today</span></div>
                <div className="spend-stat"><span className="spend-val">{fmtUsd(data.spend.threadUsd)}</span><span className="spend-lbl">this thread</span></div>
              </div>
              <div className="spend-roles">
                {[...data.spend.perRole]
                  .sort((a, b) => b.usd - a.usd)
                  .map((r) => {
                    const pct = data.spend.threadUsd > 0 ? (r.usd / data.spend.threadUsd) * 100 : 0;
                    return (
                      <div key={r.role} className="spend-row">
                        {roleBadge(r.role)}
                        <div className="spend-bar-wrap">
                          <div className="spend-bar" style={{ width: `${pct.toFixed(1)}%` }} />
                        </div>
                        <span className="spend-cost">{fmtUsd(r.usd)}</span>
                        <span className="dim">{fmtNum(r.tokensIn + r.tokensOut)} tok</span>
                      </div>
                    );
                  })}
              </div>
            </>
          )}
        </section>

      </div>

      <style jsx>{`
        .dash { min-height: 100vh; display: flex; flex-direction: column; }

        .grid {
          display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px; padding: 12px;
        }
        @media (min-width: 1280px) {
          .grid {
            grid-template-columns: repeat(3, minmax(0, 1fr)) 280px;
            align-items: start;
          }
        }
        .panel {
          background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
          padding: 12px;
        }
        .span2 { grid-column: span 2; }
        @media (min-width: 1280px) {
          .span2:not(.issue-panel) { grid-column: span 1; }
        }

        .panel-hd-wrap { position: relative; margin-bottom: 10px; }
        .panel-h {
          font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--text-dim); margin: 0; display: flex; align-items: center; gap: 6px;
        }
        .info-btn {
          font-size: 11px; color: var(--text-dim); background: none; border: none;
          cursor: pointer; padding: 0 2px; line-height: 1; flex-shrink: 0; border-radius: 2px;
        }
        .info-btn:hover { color: var(--text); }
        .info-btn:focus-visible { outline: 1px solid var(--accent-po); color: var(--text); }
        .info-popover {
          position: absolute; top: 100%; left: 0; z-index: 100; margin-top: 4px;
          max-width: 320px; padding: 10px 12px;
          background: var(--surface-2); border: 1px solid var(--border);
          border-left: 3px solid var(--accent-po);
          border-radius: 0 6px 6px 6px; font-size: 11px; line-height: 1.55;
          color: var(--text); font-weight: 400; letter-spacing: 0; text-transform: none;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .empty-msg { font-size: 12px; color: var(--text-dim); margin: 4px 0; }

        .row-list { display: flex; flex-direction: column; gap: 6px; }
        .row-item { display: flex; flex-direction: column; }
        .row {
          display: flex; align-items: center; gap: 8px; padding: 5px 8px;
          background: var(--surface-2); border-radius: 6px; font-size: 12px;
        }
        .expandable-row { cursor: pointer; }
        .expandable-row:hover { background: color-mix(in srgb, var(--accent-po) 6%, var(--surface-2)); }
        .expandable-row:focus-visible { outline: 1px solid var(--accent-po); border-radius: 6px; outline-offset: 1px; }
        .row-chevron { font-size: 10px; color: var(--text-dim); flex-shrink: 0; width: 12px; }
        .row-detail {
          padding: 6px 10px 6px 22px;
          border-left: 2px solid var(--border);
          margin: 1px 0 0 14px;
          background: color-mix(in srgb, var(--surface) 60%, var(--surface-2));
          border-radius: 0 0 4px 4px;
        }
        .row-detail-text {
          font-size: 11px; color: var(--text); white-space: pre-wrap; word-break: break-word; margin: 0 0 4px;
        }
        .row-detail-meta {
          font-size: 10px; color: var(--text-dim); display: flex; align-items: center;
          gap: 6px; flex-wrap: wrap; margin: 2px 0 0;
        }
        .row-detail-error .row-detail-text { color: var(--accent-qa); }
        .row-error { background: color-mix(in srgb, var(--accent-qa) 8%, var(--surface-2)); }
        .row.draggable { cursor: grab; }
        .row.row-dragging { opacity: 0.4; }
        .row.row-flash { background: var(--surface-2); transition: background 200ms ease-out; }
        @media (prefers-reduced-motion: reduce) {
          .row.row-flash {
            transition: none;
            background: var(--surface-0);
          }
        }
        .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
        .drag-handle { color: var(--text-dim); font-size: 14px; cursor: grab; }
        .state-pill {
          font-size: 9px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;
          padding: 1px 5px; border-radius: 99px; border: 1px solid var(--border);
          color: var(--accent-arch); font-family: ui-monospace, monospace;
        }
        .task-text { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .error-text { flex: 1; min-width: 0; color: var(--accent-qa); font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dim { font-size: 10px; color: var(--text-dim); white-space: nowrap; flex-shrink: 0; }

        .issue-grid { display: flex; flex-direction: column; gap: 4px; }
        .issue-row {
          display: flex; align-items: center; gap: 10px; padding: 6px 8px;
          background: var(--surface-2); border-radius: 6px; text-decoration: none; color: var(--text);
        }
        .issue-row:hover { background: color-mix(in srgb, var(--border) 50%, var(--surface-2)); }
        .issue-count { font-size: 20px; font-weight: 700; min-width: 32px; text-align: center; color: var(--accent-po); }
        .issue-label { font-size: 12px; color: var(--text-dim); }

        .kv-list { display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; font-size: 12px; margin: 0 0 10px; }
        dt { color: var(--text-dim); }
        dd { margin: 0; font-family: ui-monospace, monospace; font-size: 11px; }
        .scout-run-btn {
          padding: 5px 14px; border-radius: 6px; font-size: 12px; font-weight: 600;
          border: 1px solid var(--border); cursor: pointer;
          background: color-mix(in srgb, var(--accent-po) 14%, var(--surface));
          color: var(--text); display: inline-flex; align-items: center; gap: 6px;
        }
        .scout-run-btn:hover { background: color-mix(in srgb, var(--accent-po) 24%, var(--surface)); }
        .scout-run-btn:focus-visible { outline: 2px solid var(--accent-po); outline-offset: 2px; }
        .scout-run-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .scout-error { font-size: 11px; color: var(--accent-qa); margin: 6px 0 6px; padding: 5px 8px; border-radius: 5px; border: 1px solid color-mix(in srgb, var(--accent-qa) 30%, var(--border)); background: color-mix(in srgb, var(--accent-qa) 7%, var(--surface)); }

        .context-grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .ctx-role-link { text-decoration: none; display: contents; }
        .ctx-card {
          display: flex; flex-direction: column; gap: 4px; padding: 8px;
          background: var(--surface-2); border-radius: 6px; border: 1px solid var(--border);
          min-width: 140px;
        }
        .ctx-warn { border-color: color-mix(in srgb, var(--accent-po) 50%, var(--border)); }
        .cleanup-badge {
          font-size: 9px; font-weight: 700; color: var(--accent-po); padding: 1px 5px;
          border-radius: 99px; border: 1px solid var(--accent-po);
          background: color-mix(in srgb, var(--accent-po) 10%, var(--surface-2));
          width: fit-content;
        }
        .ctx-stats { display: flex; gap: 8px; font-size: 10px; color: var(--text-dim); font-family: ui-monospace, monospace; }
        .sat-bar-wrap { height: 4px; background: var(--border); border-radius: 99px; overflow: hidden; }
        .sat-bar { height: 100%; border-radius: 99px; min-width: 2px; }
        .sat-green { background: var(--status-green); }
        .sat-amber { background: var(--status-amber); }
        .sat-red { background: var(--accent-qa); }
        .ctx-model-select {
          font-size: 10px; color: var(--text-dim);
          background: var(--surface); border: 1px solid var(--border); border-radius: 4px;
          padding: 2px 4px; cursor: pointer; width: 100%;
        }
        .ctx-model-select:hover { border-color: var(--text-dim); }
        .ctx-model-select:focus { outline: 2px solid var(--accent-po); outline-offset: 1px; }

        .spend-totals { display: flex; gap: 20px; margin-bottom: 12px; }
        .spend-stat { display: flex; flex-direction: column; align-items: center; }
        .spend-val { font-size: 22px; font-weight: 700; font-family: ui-monospace, monospace; color: var(--text); }
        .spend-lbl { font-size: 10px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.05em; }
        .spend-roles { display: flex; flex-direction: column; gap: 6px; }
        .spend-row { display: flex; align-items: center; gap: 8px; font-size: 12px; }
        .spend-bar-wrap { flex: 1; height: 6px; background: var(--border); border-radius: 99px; overflow: hidden; }
        .spend-bar { height: 100%; background: var(--accent-po); border-radius: 99px; min-width: 2px; }
        .spend-cost { font-family: ui-monospace, monospace; font-size: 11px; min-width: 56px; text-align: right; }

        .issue-panel {
          position: relative;
        }
        @media (min-width: 1280px) {
          .issue-panel {
            grid-column: 4;
            grid-row: 2 / span 2;
            max-height: calc(100vh - 280px);
            overflow-y: auto;
          }
        }
        @media (max-width: 1279px) and (min-width: 768px) {
          .issue-panel {
            grid-column: 1 / -1;
            order: -1;
          }
        }
        .issue-panel-inner { display: flex; flex-direction: column; gap: 10px; }
        .issue-repo-attr {
          font-size: 11px; color: var(--text-dim); margin: 0;
          display: flex; align-items: center; gap: 6px;
        }
        .issue-repo-link {
          font-family: ui-monospace, monospace; color: var(--text-dim);
          text-decoration: none;
        }
        .issue-repo-link:hover { color: var(--text); text-decoration: underline; }
        .issue-repo-link:visited { color: var(--text-dim); }
        .issue-repo-link:focus-visible { outline: 1px solid var(--accent-po); border-radius: 2px; }
        .issue-total-badge {
          font-size: 9px; font-weight: 700; padding: 1px 6px; border-radius: 99px;
          background: color-mix(in srgb, var(--accent-po) 12%, var(--surface-2));
          color: var(--accent-po); border: 1px solid color-mix(in srgb, var(--accent-po) 30%, var(--border));
          white-space: nowrap;
        }

        .peer-idle-row {
          display: flex; align-items: center; gap: 4px; flex-wrap: wrap;
          padding: 4px 6px; background: var(--surface-2); border-radius: 6px;
          font-size: 11px;
        }
        .peer-idle-label { color: var(--text-dim); font-size: 10px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; flex-shrink: 0; }

        .issue-label-chip {
          font-size: 9px; font-weight: 500; padding: 2px 6px; border-radius: 3px;
          white-space: nowrap; flex-shrink: 0;
        }

        .recent-issues { display: flex; flex-direction: column; gap: 4px; }
        .recent-issues-hd-row { display: flex; align-items: center; justify-content: space-between; margin: 0 0 4px; }
        .recent-issues-hd { font-size: 10px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: var(--text-dim); margin: 0; }
        .issue-order-toggle { display: flex; border-radius: 4px; overflow: hidden; border: 1px solid var(--surface-2); gap: 0; }
        .issue-order-btn {
          font-size: 10px; font-weight: 600; padding: 2px 7px; border: none; cursor: pointer;
          background: var(--surface-1); color: var(--text-dim);
          transition: background 0.1s, color 0.1s;
        }
        .issue-order-btn:first-child { border-right: 1px solid var(--surface-2); }
        .issue-order-btn:hover:not(.active) { background: var(--surface-2); color: var(--text); }
        .issue-order-btn:focus-visible { outline: 2px solid var(--accent-ui, var(--accent-po)); outline-offset: -2px; }
        .issue-order-btn.active { background: var(--accent-ui, var(--accent-po)); color: white; }
        @media (prefers-reduced-motion: reduce) {
          .issue-order-btn { transition: none; }
        }
        .pinned-divider { height: 1px; background: var(--surface-2); opacity: 0.3; margin: 2px 0; }
        .recent-row {
          display: flex; align-items: center; gap: 6px;
          padding: 4px 6px; background: var(--surface-2); border-radius: 6px;
        }
        .iss-check { flex-shrink: 0; cursor: pointer; accent-color: var(--accent-po); }
        .recent-row-body {
          display: flex; align-items: center; gap: 6px; flex: 1; min-width: 0;
          text-decoration: none; color: var(--text); font-size: 12px;
        }
        .recent-row-body:hover .iss-title { text-decoration: underline; }
        .iss-num { font-size: 10px; color: var(--text-dim); font-family: ui-monospace, monospace; flex-shrink: 0; }
        .iss-title { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .iss-label-badge {
          font-size: 9px; font-weight: 500; padding: 2px 6px; border-radius: 3px;
          white-space: nowrap; flex-shrink: 0;
        }
        .iss-po-btn {
          flex-shrink: 0; font-size: 10px; font-weight: 700; padding: 2px 7px;
          border-radius: 4px; border: 1px solid var(--accent-po);
          background: color-mix(in srgb, var(--accent-po) 12%, var(--surface));
          color: var(--accent-po); cursor: pointer; white-space: nowrap;
        }
        .iss-po-btn:hover:not(:disabled) { background: color-mix(in srgb, var(--accent-po) 22%, var(--surface)); }
        .iss-po-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .iss-inflight-pill {
          font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 3px;
          background: color-mix(in srgb, var(--accent-arch) 14%, var(--surface-2));
          color: var(--accent-arch); border: 1px solid color-mix(in srgb, var(--accent-arch) 40%, var(--border));
          white-space: nowrap; flex-shrink: 0; letter-spacing: 0.03em;
        }
        .iss-queued-pill {
          font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 3px;
          background: color-mix(in srgb, var(--status-amber) 14%, var(--surface-2));
          color: var(--status-amber); border: 1px solid color-mix(in srgb, var(--status-amber) 40%, var(--border));
          white-space: nowrap; flex-shrink: 0; letter-spacing: 0.03em;
        }

        .chip-strip { display: inline-flex; align-items: center; gap: 3px; flex-shrink: 0; }
        .now-chip {
          display: inline-block; font-size: 9px; font-weight: 700; padding: 1px 5px;
          border-radius: 99px; font-family: ui-monospace, monospace; letter-spacing: 0.02em;
          white-space: nowrap; text-decoration: none;
        }
        .now-chip-wave {
          background: color-mix(in srgb, var(--accent-arch) 14%, var(--surface-2));
          color: var(--accent-arch);
          border: 1px solid color-mix(in srgb, var(--accent-arch) 40%, var(--border));
        }
        .now-chip-ticket {
          background: color-mix(in srgb, var(--accent-po) 12%, var(--surface-2));
          color: var(--accent-po);
          border: 1px solid color-mix(in srgb, var(--accent-po) 35%, var(--border));
        }
        .now-chip-ticket:hover { opacity: 0.8; }
        .now-chip-ticket:focus-visible { outline: 2px solid var(--accent-po); outline-offset: 2px; }
        .now-chip-overflow {
          font-size: 9px; color: var(--text-dim); padding: 1px 3px;
        }

        .done-role-strip { flex: 1; min-width: 0; overflow: hidden; display: inline-flex; align-items: center; gap: 3px; flex-wrap: nowrap; }
        .group-row-item {
          display: block; padding: 0;
          font-size: 11px; border-top: 1px solid var(--border);
        }
        .group-row-item:first-child { border-top: none; }
        .group-row-item .row { font-size: 11px; }
        .group-detail { max-height: 280px; overflow-y: auto; }
        .group-sha { font-size: 9px; color: var(--text-dim); background: none; }

        .issue-footer {
          display: flex; align-items: center; gap: 8px; padding: 8px 10px;
          background: var(--surface-2); border-radius: 6px;
          border: 1px solid color-mix(in srgb, var(--accent-po) 30%, var(--border));
          position: sticky; bottom: 0;
        }
        .sel-count { font-size: 12px; font-weight: 600; color: var(--accent-po); flex: 1; }
        .footer-cancel {
          font-size: 11px; padding: 3px 10px; border-radius: 4px;
          border: 1px solid var(--border); background: var(--surface); color: var(--text-dim); cursor: pointer;
        }
        .footer-cancel:hover:not(:disabled) { color: var(--text); }
        .footer-cancel:disabled { opacity: 0.4; cursor: not-allowed; }
        .footer-dispatch {
          display: flex; align-items: center; gap: 5px;
          font-size: 11px; font-weight: 700; padding: 3px 12px; border-radius: 4px;
          border: 1px solid var(--accent-po); background: var(--accent-po); color: #fff; cursor: pointer;
        }
        .footer-dispatch:hover:not(:disabled) { opacity: 0.88; }
        .footer-dispatch:disabled { opacity: 0.5; cursor: not-allowed; }
        .spinner {
          display: inline-block; width: 10px; height: 10px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) {
          .spinner {
            animation: rm-spinner-pulse 1.5s ease-in-out infinite;
            border-top-color: currentColor;
          }
          @keyframes rm-spinner-pulse {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0.3; }
          }
        }

        .dispatch-success {
          font-size: 12px; padding: 8px 10px; border-radius: 6px;
          background: color-mix(in srgb, var(--accent-po) 10%, var(--surface-2));
          color: var(--accent-po); border: 1px solid color-mix(in srgb, var(--accent-po) 30%, var(--border));
        }
        .team-link { color: var(--accent-po); font-weight: 700; text-decoration: underline; }
        .dispatch-error {
          font-size: 12px; padding: 8px 10px; border-radius: 6px;
          background: color-mix(in srgb, var(--accent-qa) 10%, var(--surface-2));
          color: var(--accent-qa); border: 1px solid color-mix(in srgb, var(--accent-qa) 30%, var(--border));
        }

        .poll-error {
          background: color-mix(in srgb, var(--color-error, #e05252) 12%, transparent);
          border-left: 3px solid var(--color-error, #e05252);
          color: var(--text);
          padding: 8px 14px;
          font-size: 13px;
          border-radius: 4px;
          margin-bottom: 12px;
        }

        @media (max-width: 720px) {
          .grid { grid-template-columns: 1fr; }
          .span2 { grid-column: span 1; }
        }

        .stall-toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 300;
          background: var(--surface-2);
          border: 1px solid var(--border);
          color: var(--text);
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 13px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
          max-width: 320px;
        }
      `}</style>
    </div>
  );
}
