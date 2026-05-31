#!/usr/bin/env node
/**
 * Supervisor for apex-team dev server.
 * Watches .restart-trigger for changes; on change: SIGTERM child, wait 5s,
 * SIGKILL if still alive, then respawn. Agents append a timestamp line to
 * .restart-trigger when they ship MCP-side changes that need the module
 * graph re-loaded (src/mcp/**, run-turn.ts, providers.ts, etc.).
 */
import { spawn } from 'child_process';
import { watchFile } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SENTINEL = join(ROOT, '.restart-trigger');
const GRACE_MS = 5000;

let child = null;
let restarting = false;

function spawnChild() {
  console.log('[supervisor] starting server...');
  child = spawn('tsx', ['server.ts'], { stdio: 'inherit', cwd: ROOT });
  child.on('exit', (code, signal) => {
    if (!restarting) {
      console.log(`[supervisor] child exited (code=${code} signal=${signal}), respawning in 1s...`);
      setTimeout(spawnChild, 1000);
    }
  });
}

function killChild() {
  if (!child) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      console.log('[supervisor] grace period expired, sending SIGKILL');
      child.kill('SIGKILL');
    }, GRACE_MS);
    child.once('exit', () => {
      clearTimeout(timer);
      child = null;
      resolve();
    });
    child.kill('SIGTERM');
  });
}

watchFile(SENTINEL, { interval: 1000 }, async () => {
  if (restarting) return;
  restarting = true;
  console.log('[supervisor] restart requested');
  await killChild();
  restarting = false;
  spawnChild();
});

async function shutdown() {
  console.log('[supervisor] shutting down');
  restarting = true;
  await killChild();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

spawnChild();
