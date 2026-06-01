// Per-thread async mutex. Serializes concurrent runTurn calls on the same
// thread so a tick + an external MCP call cannot produce doubled dispatches.
// Uses a promise-chain queue: each caller chains onto the previous lock,
// releases it in finally, and the chain GC's when idle.

const locks = new Map<string, Promise<void>>();

export async function withThreadLock<T>(
  threadId: string,
  fn: () => Promise<T>,
): Promise<T> {
  const prev = locks.get(threadId) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((r) => {
    release = r;
  });
  locks.set(threadId, current);
  await prev;
  try {
    return await fn();
  } finally {
    release();
    // Drop the entry only if no new caller has already replaced it.
    if (locks.get(threadId) === current) locks.delete(threadId);
  }
}
