// Same globalThis-bridging pattern as event-bus.ts: tsx loads MCP tools once,
// Next.js App Router loads API routes in a separate module instance. Storing
// under a registered symbol gives both copies the same pointer.

const GLOBAL_KEY = Symbol.for("apex-team.active-thread");
const globalAny = globalThis as unknown as Record<symbol, { id: string | null }>;
if (!globalAny[GLOBAL_KEY]) {
  globalAny[GLOBAL_KEY] = { id: null };
}
const state = globalAny[GLOBAL_KEY];

export function setActiveThread(threadId: string): void {
  state.id = threadId;
}

export function getActiveThread(): string | null {
  return state.id;
}
