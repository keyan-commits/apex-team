// In-memory pub/sub for thread-scoped events. All turn events (UI- or
// MCP-initiated) flow through here; the web UI subscribes via
// /api/thread-events and renders whatever arrives.
//
// Process-local. Single-user single-machine app per CLAUDE.md, so no
// distributed pub/sub needed.
//
// HACK NOTE: this module is loaded twice — once by tsx for the custom
// server's MCP path, once by Next.js's bundler for the App Router
// routes. Each load creates its own module instance, so without
// sharing we end up with two separate `emitters` Maps and MCP-
// originated events never reach the browser's SSE subscriber.
// We stash the Map on globalThis under a registered symbol so both
// module copies cooperate.

import { EventEmitter } from "node:events";
import type { SseEvent } from "@/types";

const GLOBAL_KEY = Symbol.for("apex-team.event-bus.emitters");
const globalAny = globalThis as unknown as Record<symbol, Map<string, EventEmitter>>;
if (!globalAny[GLOBAL_KEY]) {
  globalAny[GLOBAL_KEY] = new Map<string, EventEmitter>();
}
const emitters = globalAny[GLOBAL_KEY];

function getEmitter(threadId: string): EventEmitter {
  let e = emitters.get(threadId);
  if (!e) {
    e = new EventEmitter();
    // Many browser tabs + the source publisher can all subscribe; the
    // default 10-listener warning is noise here.
    e.setMaxListeners(0);
    emitters.set(threadId, e);
  }
  return e;
}

export function publish(threadId: string, event: SseEvent): void {
  getEmitter(threadId).emit("event", event);
}

export function subscribe(
  threadId: string,
  listener: (event: SseEvent) => void,
): () => void {
  const e = getEmitter(threadId);
  e.on("event", listener);
  return () => {
    e.off("event", listener);
    if (e.listenerCount("event") === 0) emitters.delete(threadId);
  };
}
