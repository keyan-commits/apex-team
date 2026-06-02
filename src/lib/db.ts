import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import type {
  AgentState,
  ChatMessage,
  MessageAuthor,
  RoleId,
} from "@/types";
import { estimateCostUsd } from "./pricing";

const DB_PATH = process.env.APEX_TEAM_DB_PATH
  ? resolve(process.cwd(), process.env.APEX_TEAM_DB_PATH)
  : resolve(process.cwd(), "data", "apex-team.db");

let _db: Database.Database | null = null;

function db(): Database.Database {
  if (_db) return _db;
  mkdirSync(dirname(DB_PATH), { recursive: true });
  const conn = new Database(DB_PATH);
  conn.pragma("journal_mode = WAL");
  conn.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id   TEXT    NOT NULL,
      author_json TEXT    NOT NULL,
      content     TEXT    NOT NULL,
      created_at  INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id, id);

    CREATE TABLE IF NOT EXISTS agent_state (
      thread_id   TEXT    NOT NULL,
      role        TEXT    NOT NULL,
      handoff_doc TEXT    NOT NULL DEFAULT '',
      updated_at  INTEGER NOT NULL,
      PRIMARY KEY (thread_id, role)
    );

    CREATE TABLE IF NOT EXISTS thread_config (
      thread_id    TEXT PRIMARY KEY,
      agent_models TEXT NOT NULL DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS turn_usage (
      id                    INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id             TEXT    NOT NULL,
      role                  TEXT    NOT NULL,
      model                 TEXT    NOT NULL,
      input_tokens          INTEGER NOT NULL DEFAULT 0,
      output_tokens         INTEGER NOT NULL DEFAULT 0,
      cache_creation_tokens INTEGER NOT NULL DEFAULT 0,
      cache_read_tokens     INTEGER NOT NULL DEFAULT 0,
      cost_usd              REAL    NOT NULL DEFAULT 0,
      created_at            INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_turn_usage_thread ON turn_usage(thread_id);
    CREATE INDEX IF NOT EXISTS idx_turn_usage_role   ON turn_usage(role);
    CREATE INDEX IF NOT EXISTS idx_turn_usage_time   ON turn_usage(created_at);

    CREATE TABLE IF NOT EXISTS scout_runs (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      ran_at            INTEGER NOT NULL,
      proposals_filed   INTEGER NOT NULL DEFAULT 0,
      roles_scanned     INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS tick_log (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id           TEXT    NOT NULL,
      tick_n              INTEGER NOT NULL,
      tokens_spent        INTEGER NOT NULL,
      dispatches_emitted  INTEGER NOT NULL,
      no_op               INTEGER NOT NULL DEFAULT 0,
      started_at          TEXT    NOT NULL,
      finished_at         TEXT    NOT NULL,
      rescues_emitted     INTEGER NOT NULL DEFAULT 0,
      stalls_emitted      INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_tick_log_thread ON tick_log(thread_id);

    CREATE TABLE IF NOT EXISTS wave_queue (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id  TEXT    NOT NULL,
      wave       INTEGER NOT NULL,
      title      TEXT,
      status     TEXT    NOT NULL CHECK(status IN ('queued','active','blocked','done')) DEFAULT 'queued',
      priority   INTEGER NOT NULL DEFAULT 0,
      notes      TEXT,
      updated_at INTEGER NOT NULL,
      UNIQUE(thread_id, wave)
    );
    CREATE INDEX IF NOT EXISTS idx_wave_queue_thread ON wave_queue(thread_id, priority);

    CREATE TABLE IF NOT EXISTS pr_status (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id     TEXT    NOT NULL,
      pr_number     INTEGER NOT NULL,
      title         TEXT,
      status        TEXT    NOT NULL CHECK(status IN ('open','merged','closed','conflicting')) DEFAULT 'open',
      sha           TEXT,
      closes_issues TEXT,
      updated_at    INTEGER NOT NULL,
      UNIQUE(thread_id, pr_number)
    );
    CREATE INDEX IF NOT EXISTS idx_pr_status_thread ON pr_status(thread_id);

    CREATE TABLE IF NOT EXISTS peer_idle (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id      TEXT    NOT NULL,
      role           TEXT    NOT NULL,
      is_idle        INTEGER NOT NULL CHECK(is_idle IN (0,1)) DEFAULT 1,
      last_active_at INTEGER,
      updated_at     INTEGER NOT NULL,
      UNIQUE(thread_id, role)
    );
    CREATE INDEX IF NOT EXISTS idx_peer_idle_thread ON peer_idle(thread_id);

    CREATE TABLE IF NOT EXISTS pipeline_state (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id  TEXT    NOT NULL,
      key        TEXT    NOT NULL,
      value      TEXT,
      updated_at INTEGER NOT NULL,
      UNIQUE(thread_id, key)
    );
    CREATE INDEX IF NOT EXISTS idx_pipeline_state_thread ON pipeline_state(thread_id);

    CREATE TABLE IF NOT EXISTS stall_event (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id     TEXT    NOT NULL,
      detected_at   TEXT    NOT NULL,
      last_merge_at TEXT,
      stall_age_ms  INTEGER NOT NULL,
      backlog_count INTEGER NOT NULL,
      hourly_tokens INTEGER NOT NULL,
      acknowledged  INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_stall_event_thread ON stall_event(thread_id, acknowledged);
  `);
  // Additive migrations — idempotent via try/catch (column-already-exists throws, which is fine)
  try { conn.exec(`ALTER TABLE thread_config ADD COLUMN workspace TEXT`); } catch {}
  try { conn.exec(`ALTER TABLE tick_log ADD COLUMN rescues_emitted INTEGER NOT NULL DEFAULT 0`); } catch {}
  try { conn.exec(`ALTER TABLE tick_log ADD COLUMN stalls_emitted INTEGER NOT NULL DEFAULT 0`); } catch {}
  _db = conn;
  return conn;
}

export function appendMessage(
  threadId: string,
  author: MessageAuthor,
  content: string,
): ChatMessage {
  const createdAt = Date.now();
  const info = db()
    .prepare(
      `INSERT INTO messages (thread_id, author_json, content, created_at)
       VALUES (?, ?, ?, ?)`,
    )
    .run(threadId, JSON.stringify(author), content, createdAt);
  return {
    id: Number(info.lastInsertRowid),
    threadId,
    author,
    content,
    createdAt,
  };
}

// Most recent thread that has any messages — used as a fallback for the
// dashboard when the in-memory `activeThreadId` is unset (e.g. after a
// server restart). Returns null on an empty DB.
export function getMostRecentThreadId(): string | null {
  const row = db()
    .prepare(`SELECT thread_id FROM messages ORDER BY id DESC LIMIT 1`)
    .get() as { thread_id: string } | undefined;
  return row?.thread_id ?? null;
}

export function listMessages(threadId: string): ChatMessage[] {
  const rows = db()
    .prepare(
      `SELECT id, thread_id, author_json, content, created_at
       FROM messages WHERE thread_id = ? ORDER BY id ASC`,
    )
    .all(threadId) as Array<{
    id: number;
    thread_id: string;
    author_json: string;
    content: string;
    created_at: number;
  }>;
  return rows.map((r) => ({
    id: r.id,
    threadId: r.thread_id,
    author: JSON.parse(r.author_json) as MessageAuthor,
    content: r.content,
    createdAt: r.created_at,
  }));
}

export function getAgentState(threadId: string, role: RoleId): AgentState {
  const row = db()
    .prepare(
      `SELECT thread_id, role, handoff_doc, updated_at
       FROM agent_state WHERE thread_id = ? AND role = ?`,
    )
    .get(threadId, role) as
    | {
        thread_id: string;
        role: string;
        handoff_doc: string;
        updated_at: number;
      }
    | undefined;
  if (!row) {
    return { threadId, role, handoffDoc: "", updatedAt: 0 };
  }
  return {
    threadId: row.thread_id,
    role: row.role as RoleId,
    handoffDoc: row.handoff_doc,
    updatedAt: row.updated_at,
  };
}

export function setAgentHandoffDoc(
  threadId: string,
  role: RoleId,
  handoffDoc: string,
): AgentState {
  const updatedAt = Date.now();
  db()
    .prepare(
      `INSERT INTO agent_state (thread_id, role, handoff_doc, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(thread_id, role) DO UPDATE SET
         handoff_doc = excluded.handoff_doc,
         updated_at  = excluded.updated_at`,
    )
    .run(threadId, role, handoffDoc, updatedAt);
  return { threadId, role, handoffDoc, updatedAt };
}

export function getThreadAgentModels(threadId: string): Record<string, string> | null {
  const row = db()
    .prepare(`SELECT agent_models FROM thread_config WHERE thread_id = ?`)
    .get(threadId) as { agent_models: string } | undefined;
  if (!row) return null;
  try {
    return JSON.parse(row.agent_models) as Record<string, string>;
  } catch {
    return null;
  }
}

export function setThreadAgentModels(
  threadId: string,
  models: Record<string, string>,
): void {
  db()
    .prepare(
      `INSERT INTO thread_config (thread_id, agent_models) VALUES (?, ?)
       ON CONFLICT(thread_id) DO UPDATE SET agent_models = excluded.agent_models`,
    )
    .run(threadId, JSON.stringify(models));
}

export function getThreadWorkspace(threadId: string): string | null {
  const row = db()
    .prepare(`SELECT workspace FROM thread_config WHERE thread_id = ?`)
    .get(threadId) as { workspace: string | null } | undefined;
  return row?.workspace ?? null;
}

export function setThreadWorkspace(threadId: string, workspace: string): void {
  db()
    .prepare(
      `INSERT INTO thread_config (thread_id, agent_models, workspace) VALUES (?, '{}', ?)
       ON CONFLICT(thread_id) DO UPDATE SET workspace = excluded.workspace`,
    )
    .run(threadId, workspace);
}

export function listAllAgentStates(threadId: string): AgentState[] {
  const rows = db()
    .prepare(
      `SELECT thread_id, role, handoff_doc, updated_at FROM agent_state WHERE thread_id = ?`,
    )
    .all(threadId) as Array<{
    thread_id: string;
    role: string;
    handoff_doc: string;
    updated_at: number;
  }>;
  return rows.map((r) => ({
    threadId: r.thread_id,
    role: r.role as RoleId,
    handoffDoc: r.handoff_doc,
    updatedAt: r.updated_at,
  }));
}

export interface UsageCapture {
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
}

export function recordTurnUsage(
  threadId: string,
  role: RoleId,
  model: string,
  usage: UsageCapture,
): void {
  const costUsd = estimateCostUsd(model, {
    input: usage.inputTokens,
    output: usage.outputTokens,
    cacheCreation: usage.cacheCreationTokens,
    cacheRead: usage.cacheReadTokens,
  });
  db()
    .prepare(
      `INSERT INTO turn_usage
         (thread_id, role, model, input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens, cost_usd, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      threadId,
      role,
      model,
      usage.inputTokens,
      usage.outputTokens,
      usage.cacheCreationTokens,
      usage.cacheReadTokens,
      costUsd,
      Date.now(),
    );
}

export function getThreadSpend(threadId: string): Array<{ role: RoleId; usd: number; tokensIn: number; tokensOut: number }> {
  try {
    const rows = db()
      .prepare(
        `SELECT role,
           COALESCE(SUM(cost_usd), 0)      as usd,
           COALESCE(SUM(input_tokens), 0)  as tokens_in,
           COALESCE(SUM(output_tokens), 0) as tokens_out
         FROM turn_usage WHERE thread_id = ? GROUP BY role`,
      )
      .all(threadId) as Array<{ role: string; usd: number; tokens_in: number; tokens_out: number }>;
    return rows.map((r) => ({
      role: r.role as RoleId,
      usd: r.usd,
      tokensIn: r.tokens_in,
      tokensOut: r.tokens_out,
    }));
  } catch {
    return [];
  }
}

export function getTodaySpend(): number {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const row = db()
      .prepare(`SELECT COALESCE(SUM(cost_usd), 0) as total FROM turn_usage WHERE created_at >= ?`)
      .get(todayStart.getTime()) as { total: number };
    return row.total;
  } catch {
    return 0;
  }
}

export interface SpendSummary {
  todayUsd: number;
  threadUsd: number;
  perRole: Array<{ role: RoleId; usd: number; tokensIn: number; tokensOut: number }>;
}

export function getSpendSummary(threadId: string): SpendSummary {
  const zero: SpendSummary = { todayUsd: 0, threadUsd: 0, perRole: [] };
  try {
    const conn = db();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayMs = todayStart.getTime();
    const todayRow = conn
      .prepare(
        `SELECT COALESCE(SUM(cost_usd), 0) as total FROM turn_usage WHERE created_at >= ?`,
      )
      .get(todayMs) as { total: number };
    const threadRow = conn
      .prepare(
        `SELECT COALESCE(SUM(cost_usd), 0) as total FROM turn_usage WHERE thread_id = ?`,
      )
      .get(threadId) as { total: number };
    const perRoleRows = conn
      .prepare(
        `SELECT role,
           COALESCE(SUM(cost_usd), 0)       as usd,
           COALESCE(SUM(input_tokens), 0)   as tokens_in,
           COALESCE(SUM(output_tokens), 0)  as tokens_out
         FROM turn_usage WHERE thread_id = ? GROUP BY role`,
      )
      .all(threadId) as Array<{
      role: string;
      usd: number;
      tokens_in: number;
      tokens_out: number;
    }>;
    return {
      todayUsd: todayRow.total,
      threadUsd: threadRow.total,
      perRole: perRoleRows.map((r) => ({
        role: r.role as RoleId,
        usd: r.usd,
        tokensIn: r.tokens_in,
        tokensOut: r.tokens_out,
      })),
    };
  } catch {
    return zero;
  }
}

export function getScoutMeta(): { lastRunAt: number | null; proposalsLast7Days: number } {
  try {
    const conn = db();
    const lastRow = conn
      .prepare(`SELECT ran_at, proposals_filed FROM scout_runs ORDER BY ran_at DESC LIMIT 1`)
      .get() as { ran_at: number; proposals_filed: number } | undefined;
    if (!lastRow) return { lastRunAt: null, proposalsLast7Days: 0 };
    const week = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weekRow = conn
      .prepare(`SELECT COALESCE(SUM(proposals_filed), 0) as total FROM scout_runs WHERE ran_at >= ?`)
      .get(week) as { total: number };
    return { lastRunAt: lastRow.ran_at, proposalsLast7Days: weekRow.total };
  } catch {
    return { lastRunAt: null, proposalsLast7Days: 0 };
  }
}

// Output tokens spent by a thread since sinceMs (epoch ms). Used by the
// tick scheduler to enforce the per-hour budget cap without a separate table.
export function getThreadSpendSince(threadId: string, sinceMs: number): number {
  try {
    const row = db()
      .prepare(
        `SELECT COALESCE(SUM(output_tokens), 0) as total
         FROM turn_usage WHERE thread_id = ? AND created_at >= ?`,
      )
      .get(threadId, sinceMs) as { total: number };
    return row.total;
  } catch {
    return 0;
  }
}

export function logTick(
  threadId: string,
  tickN: number,
  tokensSpent: number,
  dispatchesEmitted: number,
  noOp: boolean,
  startedAt: string,
  finishedAt: string,
  rescuesEmitted = 0,
  stallsEmitted = 0,
): void {
  db()
    .prepare(
      `INSERT INTO tick_log
         (thread_id, tick_n, tokens_spent, dispatches_emitted, no_op, started_at, finished_at, rescues_emitted, stalls_emitted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(threadId, tickN, tokensSpent, dispatchesEmitted, noOp ? 1 : 0, startedAt, finishedAt, rescuesEmitted, stallsEmitted);
}

// ─── Wave queue ──────────────────────────────────────────────────────────────

export interface WaveQueueRow {
  id: number;
  threadId: string;
  wave: number;
  title: string | null;
  status: "queued" | "active" | "blocked" | "done";
  priority: number;
  notes: string | null;
  updatedAt: number;
}

export function upsertWaveQueue(
  threadId: string,
  wave: number,
  fields: { title?: string; status?: WaveQueueRow["status"]; priority?: number; notes?: string },
): void {
  const updatedAt = Date.now();
  db()
    .prepare(
      `INSERT INTO wave_queue (thread_id, wave, title, status, priority, notes, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(thread_id, wave) DO UPDATE SET
         title      = COALESCE(excluded.title, title),
         status     = COALESCE(excluded.status, status),
         priority   = COALESCE(excluded.priority, priority),
         notes      = COALESCE(excluded.notes, notes),
         updated_at = excluded.updated_at`,
    )
    .run(threadId, wave, fields.title ?? null, fields.status ?? "queued", fields.priority ?? 0, fields.notes ?? null, updatedAt);
}

export function listWaveQueue(threadId: string): WaveQueueRow[] {
  const rows = db()
    .prepare(`SELECT id, thread_id, wave, title, status, priority, notes, updated_at FROM wave_queue WHERE thread_id = ? ORDER BY priority ASC, wave ASC`)
    .all(threadId) as Array<{ id: number; thread_id: string; wave: number; title: string | null; status: string; priority: number; notes: string | null; updated_at: number }>;
  return rows.map((r) => ({
    id: r.id,
    threadId: r.thread_id,
    wave: r.wave,
    title: r.title,
    status: r.status as WaveQueueRow["status"],
    priority: r.priority,
    notes: r.notes,
    updatedAt: r.updated_at,
  }));
}

// ─── PR status ───────────────────────────────────────────────────────────────

export interface PrStatusRow {
  id: number;
  threadId: string;
  prNumber: number;
  title: string | null;
  status: "open" | "merged" | "closed" | "conflicting";
  sha: string | null;
  closesIssues: string | null;
  updatedAt: number;
}

export function upsertPrStatus(
  threadId: string,
  prNumber: number,
  fields: { title?: string; status?: PrStatusRow["status"]; sha?: string; closesIssues?: string },
): void {
  const updatedAt = Date.now();
  db()
    .prepare(
      `INSERT INTO pr_status (thread_id, pr_number, title, status, sha, closes_issues, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(thread_id, pr_number) DO UPDATE SET
         title         = COALESCE(excluded.title, title),
         status        = COALESCE(excluded.status, status),
         sha           = COALESCE(excluded.sha, sha),
         closes_issues = COALESCE(excluded.closes_issues, closes_issues),
         updated_at    = excluded.updated_at`,
    )
    .run(threadId, prNumber, fields.title ?? null, fields.status ?? "open", fields.sha ?? null, fields.closesIssues ?? null, updatedAt);
}

export function listPrStatus(threadId: string, includeAll = false): PrStatusRow[] {
  const rows = db()
    .prepare(
      includeAll
        ? `SELECT id, thread_id, pr_number, title, status, sha, closes_issues, updated_at FROM pr_status WHERE thread_id = ? ORDER BY pr_number DESC`
        : `SELECT id, thread_id, pr_number, title, status, sha, closes_issues, updated_at FROM pr_status WHERE thread_id = ? AND status = 'open' ORDER BY pr_number DESC`,
    )
    .all(threadId) as Array<{ id: number; thread_id: string; pr_number: number; title: string | null; status: string; sha: string | null; closes_issues: string | null; updated_at: number }>;
  return rows.map((r) => ({
    id: r.id,
    threadId: r.thread_id,
    prNumber: r.pr_number,
    title: r.title,
    status: r.status as PrStatusRow["status"],
    sha: r.sha,
    closesIssues: r.closes_issues,
    updatedAt: r.updated_at,
  }));
}

// ─── Peer idle ───────────────────────────────────────────────────────────────

export interface PeerIdleRow {
  id: number;
  threadId: string;
  role: string;
  isIdle: boolean;
  lastActiveAt: number | null;
  updatedAt: number;
}

export function markRoleActive(threadId: string, role: string): void {
  const now = Date.now();
  db()
    .prepare(
      `INSERT INTO peer_idle (thread_id, role, is_idle, last_active_at, updated_at)
       VALUES (?, ?, 0, ?, ?)
       ON CONFLICT(thread_id, role) DO UPDATE SET
         is_idle        = 0,
         last_active_at = excluded.last_active_at,
         updated_at     = excluded.updated_at`,
    )
    .run(threadId, role, now, now);
}

export function markRoleIdle(threadId: string, role: string): void {
  const now = Date.now();
  db()
    .prepare(
      `INSERT INTO peer_idle (thread_id, role, is_idle, last_active_at, updated_at)
       VALUES (?, ?, 1, NULL, ?)
       ON CONFLICT(thread_id, role) DO UPDATE SET
         is_idle    = 1,
         updated_at = excluded.updated_at`,
    )
    .run(threadId, role, now);
}

export function listPeerIdle(threadId: string, role?: string): PeerIdleRow[] {
  const rows = (
    role
      ? db()
          .prepare(`SELECT id, thread_id, role, is_idle, last_active_at, updated_at FROM peer_idle WHERE thread_id = ? AND role = ?`)
          .all(threadId, role)
      : db()
          .prepare(`SELECT id, thread_id, role, is_idle, last_active_at, updated_at FROM peer_idle WHERE thread_id = ? ORDER BY role ASC`)
          .all(threadId)
  ) as Array<{ id: number; thread_id: string; role: string; is_idle: number; last_active_at: number | null; updated_at: number }>;
  return rows.map((r) => ({
    id: r.id,
    threadId: r.thread_id,
    role: r.role,
    isIdle: r.is_idle === 1,
    lastActiveAt: r.last_active_at,
    updatedAt: r.updated_at,
  }));
}

// ─── Pipeline state (KV) ─────────────────────────────────────────────────────

export interface PipelineStateRow {
  id: number;
  threadId: string;
  key: string;
  value: string | null;
  updatedAt: number;
}

export function setPipelineState(threadId: string, key: string, value: string): void {
  const now = Date.now();
  db()
    .prepare(
      `INSERT INTO pipeline_state (thread_id, key, value, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(thread_id, key) DO UPDATE SET
         value      = excluded.value,
         updated_at = excluded.updated_at`,
    )
    .run(threadId, key, value, now);
}

export function getPipelineState(threadId: string, key: string): PipelineStateRow | null {
  const row = db()
    .prepare(`SELECT id, thread_id, key, value, updated_at FROM pipeline_state WHERE thread_id = ? AND key = ?`)
    .get(threadId, key) as { id: number; thread_id: string; key: string; value: string | null; updated_at: number } | undefined;
  if (!row) return null;
  return { id: row.id, threadId: row.thread_id, key: row.key, value: row.value, updatedAt: row.updated_at };
}

export function listPipelineState(threadId: string): PipelineStateRow[] {
  const rows = db()
    .prepare(`SELECT id, thread_id, key, value, updated_at FROM pipeline_state WHERE thread_id = ? ORDER BY key ASC`)
    .all(threadId) as Array<{ id: number; thread_id: string; key: string; value: string | null; updated_at: number }>;
  return rows.map((r) => ({ id: r.id, threadId: r.thread_id, key: r.key, value: r.value, updatedAt: r.updated_at }));
}

// ─── Stall events ────────────────────────────────────────────────────────────

export interface StallEventRow {
  id: number;
  threadId: string;
  detectedAt: string;
  lastMergeAt: string | null;
  stallAgeMs: number;
  backlogCount: number;
  hourlyTokens: number;
  acknowledged: boolean;
}

export function insertStallEventRow(
  event: Omit<StallEventRow, "id" | "acknowledged">,
): void {
  db()
    .prepare(
      `INSERT INTO stall_event
         (thread_id, detected_at, last_merge_at, stall_age_ms, backlog_count, hourly_tokens)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      event.threadId,
      event.detectedAt,
      event.lastMergeAt ?? null,
      event.stallAgeMs,
      event.backlogCount,
      event.hourlyTokens,
    );
}

export function getLatestUnackedStallRow(threadId: string): StallEventRow | null {
  const row = db()
    .prepare(
      `SELECT id, thread_id, detected_at, last_merge_at, stall_age_ms, backlog_count, hourly_tokens, acknowledged
       FROM stall_event WHERE thread_id = ? AND acknowledged = 0
       ORDER BY id DESC LIMIT 1`,
    )
    .get(threadId) as {
    id: number;
    thread_id: string;
    detected_at: string;
    last_merge_at: string | null;
    stall_age_ms: number;
    backlog_count: number;
    hourly_tokens: number;
    acknowledged: number;
  } | undefined;
  if (!row) return null;
  return {
    id: row.id,
    threadId: row.thread_id,
    detectedAt: row.detected_at,
    lastMergeAt: row.last_merge_at,
    stallAgeMs: row.stall_age_ms,
    backlogCount: row.backlog_count,
    hourlyTokens: row.hourly_tokens,
    acknowledged: row.acknowledged === 1,
  };
}

export function markStallEventAcked(threadId: string): void {
  db()
    .prepare(`UPDATE stall_event SET acknowledged = 1 WHERE thread_id = ? AND acknowledged = 0`)
    .run(threadId);
}

// ─── Tick log queries ─────────────────────────────────────────────────────────

export function listActiveTickThreads(windowMs: number): string[] {
  const cutoff = new Date(Date.now() - windowMs).toISOString();
  const rows = db()
    .prepare(
      `SELECT DISTINCT thread_id FROM tick_log WHERE finished_at >= ? ORDER BY thread_id`,
    )
    .all(cutoff) as Array<{ thread_id: string }>;
  return rows.map((r) => r.thread_id);
}

// ─── Pending inbox ────────────────────────────────────────────────────────────

// Pending inbox = handoff messages addressed to this role that arrived
// after the role's most recent agent turn. We use the message id
// ordering as the "did this role see it yet" cursor.
export function listPendingInbox(
  threadId: string,
  role: RoleId,
): ChatMessage[] {
  const all = listMessages(threadId);
  // Find the last id where this role authored a reply — handoffs after
  // that haven't been seen by the role yet.
  let lastSeen = 0;
  for (const m of all) {
    if (m.author.kind === "agent" && m.author.role === role) {
      lastSeen = Math.max(lastSeen, m.id);
    }
  }
  return all.filter(
    (m) =>
      m.id > lastSeen &&
      m.author.kind === "handoff" &&
      m.author.to === role,
  );
}
