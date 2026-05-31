import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import type {
  AgentState,
  ChatMessage,
  MessageAuthor,
  RoleId,
} from "@/types";

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
  `);
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
