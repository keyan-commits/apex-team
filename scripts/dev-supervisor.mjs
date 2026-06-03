#!/usr/bin/env node
/**
 * Supervisor for apex-team dev server (US-079 / #316 — L1 self-heal).
 *
 * Responsibilities:
 *   - Spawn the Next.js server as a child process (tsx server.ts).
 *   - Respawn on unexpected exit (exit-nonzero or signal kill from OS).
 *   - Watch .restart-trigger for hot-restart requests from agents.
 *   - Handle SIGTERM/SIGINT/SIGHUP with 15s graceful grace (AC4).
 *   - Double-signal escalation: 2nd signal within 8s → SIGKILL child +
 *     write data/.user-off sentinel + process.exit(0) (AC5).
 *   - Third signal → bare process.exit(1).
 *   - Stale-child detection in killChild(): check pid alive before waiting (AC6).
 *   - Startup orphan detection: kill leftover child PID from crashed prior run.
 *   - Single-supervisor invariant (US-084 AC2): refuse to spawn if another
 *     supervisor is alive (detected via SELF_PID_FILE + kill -0).
 *
 * launchd KeepAlive={Crashed:true, SuccessfulExit:false} invariant:
 *   - clean process.exit(0) → launchd does NOT respawn (user intent respected).
 *   - exit-nonzero or SIGKILL → launchd DOES respawn.
 *
 * Exported as a class so unit tests can inject mocks without touching disk.
 *
 * Kill pattern (US-084 AC3):
 *   pkill -f apex-team-supervisor    # matches process.title set at startup
 *   — or —
 *   kill $(cat data/apex-team-supervisor.pid)
 */

import { spawn } from 'node:child_process';
import { watchFile, rmSync, writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RESTART_SENTINEL = join(ROOT, '.restart-trigger');
const USER_OFF_PATH = join(ROOT, 'data', '.user-off');
// Stores the child server's PID (for orphan detection on restart).
const PID_FILE = join(ROOT, 'data', '.supervisor.pid');
// Stores the supervisor's OWN PID (for duplicate-supervisor detection, US-084 AC2).
const SELF_PID_FILE = join(ROOT, 'data', 'apex-team-supervisor.pid');
const GRACE_MS = 15_000;
const DOUBLE_SIGNAL_WINDOW_MS = 8_000;

function cleanDevLock(root) {
  try {
    rmSync(join(root, '.next/dev'), { recursive: true, force: true });
    console.log('[supervisor] cleaned .next/dev lockfile');
  } catch (err) {
    console.log('[supervisor] .next/dev cleanup skipped:', err.message);
  }
}

export class Supervisor {
  constructor(opts = {}) {
    this.root = opts.root ?? ROOT;
    this.graceMs = opts.graceMs ?? GRACE_MS;
    this.doubleSignalWindowMs = opts.doubleSignalWindowMs ?? DOUBLE_SIGNAL_WINDOW_MS;
    this.userOffPath = opts.userOffPath ?? USER_OFF_PATH;
    this.pidFile = opts.pidFile ?? PID_FILE;
    this.selfPidFile = opts.selfPidFile ?? SELF_PID_FILE;
    this.restartSentinel = opts.restartSentinel ?? RESTART_SENTINEL;
    this.exitFn = opts.exitFn ?? ((code) => process.exit(code));

    this.child = null;
    // State machine: 'running' | 'grace' | 'escalated'
    this._shutdownState = 'running';
    this._firstSignalAt = 0;
  }

  // US-084 AC2: refuse to start if another supervisor is already alive.
  // Returns true if a live duplicate was found (caller should exit).
  checkDuplicateSupervisor() {
    if (!existsSync(this.selfPidFile)) return false;
    try {
      const raw = readFileSync(this.selfPidFile, 'utf8').trim();
      const pid = parseInt(raw, 10);
      if (isNaN(pid)) return false;
      try {
        process.kill(pid, 0); // ESRCH if dead
        console.error(
          `[supervisor] ERROR: another supervisor is already running (pid=${pid}).\n` +
          `  Kill it first:  pkill -f apex-team-supervisor\n` +
          `  — or —         kill $(cat ${this.selfPidFile})`
        );
        return true;
      } catch {
        // Stale pidfile — process is gone, safe to proceed.
        return false;
      }
    } catch {
      return false;
    }
  }

  writeSupervisorPid() {
    try {
      mkdirSync(dirname(this.selfPidFile), { recursive: true });
      writeFileSync(this.selfPidFile, String(process.pid));
    } catch (err) {
      console.error('[supervisor] failed to write self pidfile:', err.message);
    }
  }

  cleanSupervisorPid() {
    try {
      rmSync(this.selfPidFile, { force: true });
    } catch {}
  }

  // AC6: stale-child guard — resolve immediately if child PID no longer exists.
  killChild() {
    if (!this.child) return Promise.resolve();
    const c = this.child;

    return new Promise((resolve) => {
      try {
        process.kill(c.pid, 0); // throws ESRCH if process is gone
      } catch {
        this.child = null;
        return resolve();
      }

      const timer = setTimeout(() => {
        console.log('[supervisor] grace period expired, sending SIGKILL');
        try { c.kill('SIGKILL'); } catch {}
      }, this.graceMs);

      c.once('exit', () => {
        clearTimeout(timer);
        this.child = null;
        resolve();
      });

      c.kill('SIGTERM');
    });
  }

  writeUserOff(signal) {
    try {
      mkdirSync(dirname(this.userOffPath), { recursive: true });
      writeFileSync(this.userOffPath, JSON.stringify({
        reason: 'double-signal',
        signal,
        at: new Date().toISOString(),
      }));
      console.log(`[supervisor] user-off sentinel written: ${this.userOffPath}`);
    } catch (err) {
      console.error('[supervisor] failed to write user-off sentinel:', err.message);
    }
  }

  // AC4/AC5: unified signal handler for SIGTERM, SIGINT, SIGHUP.
  handleSignal(sig) {
    const now = Date.now();

    if (this._shutdownState === 'running') {
      this._shutdownState = 'grace';
      this._firstSignalAt = now;
      console.log(`[supervisor] ${sig} (1): graceful shutdown (${this.graceMs}ms grace)...`);
      void this._gracefulShutdown(); // not awaited — second signal can interrupt
      return;
    }

    if (
      this._shutdownState === 'grace' &&
      now - this._firstSignalAt < this.doubleSignalWindowMs
    ) {
      this._shutdownState = 'escalated';
      console.log(`[supervisor] ${sig} (2): double-signal within ${this.doubleSignalWindowMs}ms — SIGKILL + user-off`);
      if (this.child) {
        try { this.child.kill('SIGKILL'); } catch {}
        this.child = null;
      }
      this.writeUserOff(sig);
      this.cleanSupervisorPid();
      this.exitFn(0);
      return;
    }

    // Third signal, or second signal after window expired.
    console.log(`[supervisor] ${sig} (3+): hard exit`);
    this.exitFn(1);
  }

  async _gracefulShutdown() {
    await this.killChild();
    this.cleanSupervisorPid();
    // Don't exit if escalation already handled it.
    if (this._shutdownState !== 'escalated') {
      this.exitFn(0);
    }
  }

  // Check for orphaned child PID from a previous supervisor run that crashed
  // without cleaning up.
  checkStaleChildOnStartup() {
    try {
      const raw = readFileSync(this.pidFile, 'utf8').trim();
      const savedPid = parseInt(raw, 10);
      if (isNaN(savedPid)) return;

      try {
        process.kill(savedPid, 0);
        // PID is alive — orphan from crashed prior supervisor
        process.kill(savedPid, 'SIGKILL');
        console.log(`[supervisor] killed stale child from previous run: pid=${savedPid}`);
      } catch {
        // ESRCH — already gone; nothing to do
      }
    } catch {
      // PID file missing — normal first start
    }
  }

  _writePidFile(pid) {
    try {
      mkdirSync(dirname(this.pidFile), { recursive: true });
      writeFileSync(this.pidFile, String(pid));
    } catch (err) {
      console.error('[supervisor] failed to write pid file:', err.message);
    }
  }

  spawnChild() {
    console.log('[supervisor] starting server...');
    this.child = spawn('tsx', ['server.ts'], { stdio: 'inherit', cwd: this.root });
    if (this.child.pid != null) {
      this._writePidFile(this.child.pid);
    }

    this.child.on('exit', (code, signal) => {
      if (this._shutdownState === 'running') {
        console.log(`[supervisor] child exited (code=${code} signal=${signal}), respawning in 1s...`);
        cleanDevLock(this.root);
        setTimeout(() => this.spawnChild(), 1000);
      }
    });
  }

  start() {
    // US-084 AC2: bail out if a live supervisor is already running.
    if (this.checkDuplicateSupervisor()) {
      this.exitFn(1);
      return;
    }
    this.writeSupervisorPid();

    this.checkStaleChildOnStartup();

    watchFile(this.restartSentinel, { interval: 1000 }, async () => {
      if (this._shutdownState !== 'running') return;
      console.log('[supervisor] restart requested via sentinel');
      await this.killChild();
      cleanDevLock(this.root);
      this.spawnChild();
    });

    const sigHandler = (sig) => this.handleSignal(sig);
    process.on('SIGTERM', () => sigHandler('SIGTERM'));
    process.on('SIGINT', () => sigHandler('SIGINT'));
    process.on('SIGHUP', () => sigHandler('SIGHUP'));

    this.spawnChild();
  }
}

// ── Entry point ──────────────────────────────────────────────────────────────

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  // US-084 AC3: set process title so `pkill -f apex-team-supervisor` matches.
  process.title = 'apex-team-supervisor';
  new Supervisor().start();
}
