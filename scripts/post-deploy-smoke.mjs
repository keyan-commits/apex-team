#!/usr/bin/env node
// post-deploy-smoke.mjs — verify the live instance is healthy after a deploy.
// Usage: pnpm smoke
// Exits 0 on PASS, 1 on FAIL.

const HEALTH_URL = "http://localhost:3000/api/health";
const TIMEOUT_MS = 5000;

export async function checkHealth(url = HEALTH_URL) {
  let res;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (err) {
    return { pass: false, reason: `could not reach ${url} — ${err.message}` };
  }

  if (!res.ok) {
    return { pass: false, reason: `HTTP ${res.status} from ${url}` };
  }

  const body = await res.json();
  const failures = [];
  if (body.status !== "ok") failures.push(`status="${body.status}" (expected "ok")`);
  if (body.mcpMounted !== true) failures.push(`mcpMounted=${body.mcpMounted} (expected true)`);

  if (failures.length > 0) {
    return { pass: false, reason: failures.join("; "), body };
  }
  return { pass: true };
}

// Only run when invoked directly (not when imported by tests).
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const result = await checkHealth();
  if (!result.pass) {
    process.stderr.write(`SMOKE FAIL: ${result.reason}\n`);
    if (result.body) process.stderr.write(`Full response: ${JSON.stringify(result.body)}\n`);
    process.exit(1);
  }
  process.stdout.write(`SMOKE PASS: status=ok mcpMounted=true\n`);
  process.exit(0);
}
