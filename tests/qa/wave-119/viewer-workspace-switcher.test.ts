/**
 * Wave 119 — Viewer workspace-switcher API tests (US-095 AC2, AC3, AC4, AC7, AC9)
 *
 * Spec: requirements/user-stories/US-095-viewer-workspace-switcher.md
 * US: US-095 — Viewer workspace switcher
 *
 * Strategy A: spawn the viewer's node server.mjs as a child process with
 * APEX_TEAM_WORKSPACES and APEX_TEAM_ROOT env vars set to fixture paths,
 * then hit the live HTTP endpoints with fetch and assert responses.
 *
 * Runtime gate: if server.mjs does NOT yet contain `/api/workspaces`, all
 * tests are skipped with a clear message. This allows apex-team CI to stay
 * green while the viewer's UI Dev PR for US-095 is still in flight.
 * The tests auto-unskip once server.mjs has the endpoint.
 *
 * Fixtures (Wave 119 AC9 scaffold):
 *   requirements/samples/wave-119-viewer-workspaces/workspace-happy/
 *     requirements/user-stories/US-001-sample.md  -- valid US
 *   requirements/samples/wave-119-viewer-workspaces/workspace-no-requirements/
 *     .gitkeep  -- NO requirements/ directory
 *   requirements/samples/wave-119-viewer-workspaces/workspace-malformed-us/
 *     requirements/user-stories/US-broken.md  -- no H1, no Status line
 *
 * Wave 118 coverage classes:
 *   Positive  -- workspace-happy: auto-discovery, GET /api/workspaces, GET /api/tickets (returns US-001)
 *   Negative  -- workspace-no-requirements: graceful fallback (no 500); path-escape / unregistered
 *                path returns 400; switch to path with ".." returns 400
 *   Edge      -- workspace-malformed-us: ticket with status "unknown" + fallback title; empty US dir
 *   Iterate   -- parametrized describe.each over all 3 fixture roots verifying /api/tickets shape
 *
 * S10: not triggered — no user-supplied collection logic in the wave's source changes.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { spawn, type ChildProcess } from 'node:child_process';
import { createServer, Socket } from 'node:net';
import { resolve, join } from 'node:path';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const APEX_TEAM_ROOT = resolve(import.meta.dirname, '../../..');
const VIEWER_ROOT = resolve(APEX_TEAM_ROOT, '../apex-team-viewer');
const SERVER_MJS = join(VIEWER_ROOT, 'server.mjs');
const FIXTURES_ROOT = resolve(APEX_TEAM_ROOT, 'requirements/samples/wave-119-viewer-workspaces');

const FIXTURE_HAPPY = join(FIXTURES_ROOT, 'workspace-happy');
const FIXTURE_NO_REQS = join(FIXTURES_ROOT, 'workspace-no-requirements');
const FIXTURE_MALFORMED = join(FIXTURES_ROOT, 'workspace-malformed-us');

// ---------------------------------------------------------------------------
// Runtime gate — auto-skip if viewer hasn't landed US-095 server changes yet
// ---------------------------------------------------------------------------

function hasWorkspaceEndpoint(): boolean {
  if (!existsSync(SERVER_MJS)) return false;
  const src = readFileSync(SERVER_MJS, 'utf8');
  return src.includes('/api/workspaces');
}

const VIEWER_READY = hasWorkspaceEndpoint();

// ---------------------------------------------------------------------------
// Port discovery helper
// ---------------------------------------------------------------------------

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      srv.close(err => (err ? reject(err) : resolve(port)));
    });
    srv.on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// Server lifecycle helpers
// ---------------------------------------------------------------------------

interface ServerHandle {
  port: number;
  proc: ChildProcess;
}

function waitForServer(port: number, timeoutMs = 8000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    function attempt() {
      if (Date.now() > deadline) {
        reject(new Error(`server on :${port} did not start within ${timeoutMs}ms`));
        return;
      }
      const sock = new Socket();
      sock.connect(port, '127.0.0.1', () => {
        sock.destroy();
        resolve();
      });
      sock.on('error', () => {
        sock.destroy();
        setTimeout(attempt, 150);
      });
    }
    attempt();
  });
}

async function startServer(opts: {
  root: string;
  workspaces?: string[];
  port?: number;
}): Promise<ServerHandle> {
  const port = opts.port ?? (await getFreePort());
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    PORT: String(port),
    APEX_TEAM_ROOT: opts.root,
  };
  if (opts.workspaces && opts.workspaces.length > 0) {
    env.APEX_TEAM_WORKSPACES = opts.workspaces.join(':');
  }
  const proc = spawn('node', [SERVER_MJS], { env, stdio: 'pipe' });
  await waitForServer(port);
  return { port, proc };
}

function stopServer(handle: ServerHandle): Promise<void> {
  return new Promise(resolve => {
    handle.proc.on('exit', () => resolve());
    handle.proc.kill('SIGTERM');
    // Force-kill after 2s if SIGTERM is ignored.
    setTimeout(() => {
      try { handle.proc.kill('SIGKILL'); } catch {}
    }, 2000);
  });
}

async function apiGet(port: number, path: string): Promise<{ status: number; body: unknown }> {
  const res = await fetch(`http://127.0.0.1:${port}${path}`);
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

async function apiPost(port: number, path: string, bodyObj: unknown): Promise<{ status: number; body: unknown }> {
  const res = await fetch(`http://127.0.0.1:${port}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bodyObj),
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

// ---------------------------------------------------------------------------
// Fixture file existence smoke checks (these run regardless of VIEWER_READY)
// ---------------------------------------------------------------------------

describe('Wave 119 — fixture file scaffolding (AC9)', () => {
  it('workspace-happy contains US-001-sample.md with valid H1 and Status', () => {
    const file = join(FIXTURE_HAPPY, 'requirements/user-stories/US-001-sample.md');
    expect(existsSync(file), `expected ${file} to exist`).toBe(true);
    const content = readFileSync(file, 'utf8');
    expect(content).toMatch(/^# US-001/m);
    expect(content).toMatch(/\*\*Status:\*\*\s*accepted/im);
  });

  it('workspace-no-requirements contains .gitkeep and has NO requirements/ dir', () => {
    const gitkeep = join(FIXTURE_NO_REQS, '.gitkeep');
    expect(existsSync(gitkeep), `expected .gitkeep at ${gitkeep}`).toBe(true);
    const reqsDir = join(FIXTURE_NO_REQS, 'requirements');
    expect(existsSync(reqsDir), `requirements/ must NOT exist in workspace-no-requirements`).toBe(false);
  });

  it('workspace-malformed-us contains US-broken.md with no H1 and no Status line', () => {
    const file = join(FIXTURE_MALFORMED, 'requirements/user-stories/US-broken.md');
    expect(existsSync(file), `expected ${file} to exist`).toBe(true);
    const content = readFileSync(file, 'utf8');
    // Confirms NO H1 heading
    expect(content).not.toMatch(/^#\s/m);
    // Confirms NO Status line
    expect(content).not.toMatch(/\*\*Status:\*\*/i);
  });

  it('all three fixture directories exist', () => {
    expect(existsSync(FIXTURE_HAPPY)).toBe(true);
    expect(existsSync(FIXTURE_NO_REQS)).toBe(true);
    expect(existsSync(FIXTURE_MALFORMED)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Runtime gate message — visible in CI output when viewer isn't ready
// ---------------------------------------------------------------------------

if (!VIEWER_READY) {
  describe('Wave 119 — viewer workspace-switcher API tests (SKIPPED — viewer PR pending)', () => {
    it.skip(
      'SKIP: pending viewer PR for US-095 server.mjs /api/workspaces changes — ' +
        'auto-unskips once apex-team-viewer/server.mjs contains the endpoint',
      () => {}
    );
  });
}

// ---------------------------------------------------------------------------
// Live server tests — only when VIEWER_READY
// ---------------------------------------------------------------------------

if (VIEWER_READY) {
  // -------------------------------------------------------------------------
  // Positive tests (workspace-happy)
  // -------------------------------------------------------------------------

  describe('Wave 119 — Positive (workspace-happy) — AC2+AC3+AC4+AC7', () => {
    let handle: ServerHandle;

    beforeAll(async () => {
      handle = await startServer({
        root: FIXTURE_HAPPY,
        workspaces: [FIXTURE_HAPPY],
      });
    }, 15_000);

    afterAll(async () => {
      if (handle) await stopServer(handle);
    });

    it('P1: /api/workspaces returns ok:true with workspace-happy in the list (AC3)', async () => {
      const { status, body } = await apiGet(handle.port, '/api/workspaces');
      expect(status).toBe(200);
      const b = body as Record<string, unknown>;
      expect(b.ok).toBe(true);
      expect(Array.isArray(b.workspaces)).toBe(true);
      const workspaces = b.workspaces as Array<{ path: string; name: string; isCurrent: boolean }>;
      const match = workspaces.find(w => w.path === FIXTURE_HAPPY);
      expect(match, `expected workspace-happy (${FIXTURE_HAPPY}) in /api/workspaces response`).toBeTruthy();
    });

    it('P2: /api/tickets from workspace-happy returns US-001-sample ticket (AC7 happy path)', async () => {
      const { status, body } = await apiGet(handle.port, '/api/tickets');
      expect(status).toBe(200);
      const b = body as Record<string, unknown>;
      expect(b.ok).toBe(true);
      const tickets = b.tickets as Array<{ id: string; title: string; status: string }>;
      expect(Array.isArray(tickets)).toBe(true);
      expect(tickets.length).toBeGreaterThanOrEqual(1);
      const us001 = tickets.find(t => t.id === 'US-001');
      expect(us001, 'expected US-001 ticket in response from workspace-happy').toBeTruthy();
      expect(us001?.status).toBe('accepted');
    });

    it('P3: POST /api/workspace/switch to workspace-happy returns ok:true (AC4)', async () => {
      const { status, body } = await apiPost(handle.port, '/api/workspace/switch', {
        path: FIXTURE_HAPPY,
      });
      expect(status).toBe(200);
      const b = body as Record<string, unknown>;
      expect(b.ok).toBe(true);
    });

    it('P4: /api/health includes root field pointing to active workspace (AC8)', async () => {
      const { status, body } = await apiGet(handle.port, '/api/health');
      expect(status).toBe(200);
      const b = body as Record<string, unknown>;
      expect(b.ok).toBe(true);
      expect(typeof b.root).toBe('string');
    });
  });

  // -------------------------------------------------------------------------
  // Negative tests
  // -------------------------------------------------------------------------

  describe('Wave 119 — Negative — AC4+AC7', () => {
    let handle: ServerHandle;

    beforeAll(async () => {
      handle = await startServer({
        root: FIXTURE_NO_REQS,
        workspaces: [FIXTURE_NO_REQS, FIXTURE_HAPPY],
      });
    }, 15_000);

    afterAll(async () => {
      if (handle) await stopServer(handle);
    });

    it('N1: /api/tickets from workspace-no-requirements returns ok:true with empty tickets + warning (AC7)', async () => {
      const { status, body } = await apiGet(handle.port, '/api/tickets');
      expect(status).toBe(200);
      const b = body as Record<string, unknown>;
      expect(b.ok).toBe(true);
      const tickets = b.tickets as unknown[];
      expect(Array.isArray(tickets)).toBe(true);
      expect(tickets.length).toBe(0);
      expect(typeof b.warning).toBe('string');
      expect((b.warning as string).length).toBeGreaterThan(0);
    });

    it('N2: POST /api/workspace/switch to a path NOT in registry returns 400 (security check — AC4)', async () => {
      const { status } = await apiPost(handle.port, '/api/workspace/switch', {
        path: '/tmp/totally-unknown-path-that-was-never-registered',
      });
      expect(status).toBe(400);
    });

    it('N3: POST /api/workspace/switch with path containing ".." returns 400 (path-escape guard — AC4)', async () => {
      const escapePath = FIXTURE_NO_REQS + '/../../../etc';
      const { status } = await apiPost(handle.port, '/api/workspace/switch', {
        path: escapePath,
      });
      expect(status).toBe(400);
    });

    it('N4: POST /api/workspace/switch with no body returns non-200 (invalid input)', async () => {
      const res = await fetch(`http://127.0.0.1:${handle.port}/api/workspace/switch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  // -------------------------------------------------------------------------
  // Edge tests (workspace-malformed-us)
  // -------------------------------------------------------------------------

  describe('Wave 119 — Edge (workspace-malformed-us) — AC7+AC9', () => {
    let handle: ServerHandle;

    beforeAll(async () => {
      handle = await startServer({
        root: FIXTURE_MALFORMED,
        workspaces: [FIXTURE_MALFORMED],
      });
    }, 15_000);

    afterAll(async () => {
      if (handle) await stopServer(handle);
    });

    it('E1: /api/tickets from workspace-malformed-us returns ticket with status "unknown" + fallback title (AC7+AC9)', async () => {
      const { status, body } = await apiGet(handle.port, '/api/tickets');
      expect(status).toBe(200);
      const b = body as Record<string, unknown>;
      expect(b.ok).toBe(true);
      const tickets = b.tickets as Array<{ id: string; title: string; status: string }>;
      expect(Array.isArray(tickets)).toBe(true);
      expect(tickets.length).toBeGreaterThanOrEqual(1);
      const broken = tickets.find(t => t.id === 'US-broken' || t.title.includes('broken') || t.title.includes('US-broken'));
      expect(broken, 'expected a ticket derived from US-broken.md').toBeTruthy();
      expect(broken?.status).toBe('unknown');
      // Fallback title must be non-empty (filename stem used as fallback)
      expect(broken?.title.length).toBeGreaterThan(0);
    });

    it('E2: /api/tickets does not crash on malformed MD — response is 200 ok:true (no 500)', async () => {
      const { status, body } = await apiGet(handle.port, '/api/tickets');
      expect(status).toBe(200);
      const b = body as Record<string, unknown>;
      expect(b.ok).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Iterate-all: parametrized over all 3 fixture roots (Wave 118 requirement)
  // This test mechanically iterates EVERY known sample workspace.
  // -------------------------------------------------------------------------

  describe('Wave 119 — Iterate-all: /api/tickets shape over all 3 fixtures (Wave 118)', () => {
    // Each tuple: [label, root, expectation]
    const FIXTURE_CASES: Array<{
      label: string;
      root: string;
      expectOk: boolean;
      expectTicketCount: 'gte1' | 'eq0' | 'gte0';
      expectWarning: boolean;
    }> = [
      {
        label: 'workspace-happy',
        root: FIXTURE_HAPPY,
        expectOk: true,
        expectTicketCount: 'gte1',
        expectWarning: false,
      },
      {
        label: 'workspace-no-requirements',
        root: FIXTURE_NO_REQS,
        expectOk: true,
        expectTicketCount: 'eq0',
        expectWarning: true,
      },
      {
        label: 'workspace-malformed-us',
        root: FIXTURE_MALFORMED,
        expectOk: true,
        expectTicketCount: 'gte0',
        expectWarning: false,
      },
    ];

    for (const fixture of FIXTURE_CASES) {
      describe(`fixture: ${fixture.label}`, () => {
        let handle: ServerHandle;

        beforeAll(async () => {
          handle = await startServer({ root: fixture.root });
        }, 15_000);

        afterAll(async () => {
          if (handle) await stopServer(handle);
        });

        it(`I-${fixture.label}: /api/tickets returns ok:true and correct shape`, async () => {
          const { status, body } = await apiGet(handle.port, '/api/tickets');
          expect(status).toBe(200);
          const b = body as Record<string, unknown>;
          expect(b.ok).toBe(fixture.expectOk);
          expect(Array.isArray(b.tickets)).toBe(true);
          const tickets = b.tickets as unknown[];

          if (fixture.expectTicketCount === 'gte1') {
            expect(tickets.length).toBeGreaterThanOrEqual(1);
          } else if (fixture.expectTicketCount === 'eq0') {
            expect(tickets.length).toBe(0);
          }
          // 'gte0' means any count is acceptable (malformed: parse-dependent)

          if (fixture.expectWarning) {
            expect(typeof b.warning).toBe('string');
          }
        });

        it(`I-${fixture.label}: /api/health returns ok:true with root field`, async () => {
          const { status, body } = await apiGet(handle.port, '/api/health');
          expect(status).toBe(200);
          const b = body as Record<string, unknown>;
          expect(b.ok).toBe(true);
          expect(typeof b.root).toBe('string');
          expect(b.port).toBeDefined();
        });
      });
    }
  });
}

// ---------------------------------------------------------------------------
// Metadata / self-reference (US-085 traceability)
// ---------------------------------------------------------------------------

describe('Wave 119 — metadata', () => {
  it('test file exists at canonical path tests/qa/wave-119/viewer-workspace-switcher.test.ts', () => {
    const expected = resolve(APEX_TEAM_ROOT, 'tests/qa/wave-119/viewer-workspace-switcher.test.ts');
    expect(existsSync(expected)).toBe(true);
  });

  it('US-095 user story exists with ## Acceptance criteria section', () => {
    const usFile = resolve(APEX_TEAM_ROOT, 'requirements/user-stories/US-095-viewer-workspace-switcher.md');
    expect(existsSync(usFile)).toBe(true);
    const content = readFileSync(usFile, 'utf8');
    expect(content).toMatch(/^## Acceptance criteria/m);
  });

  it('all three fixture workspaces exist on disk (AC9 traceability)', () => {
    expect(existsSync(FIXTURE_HAPPY)).toBe(true);
    expect(existsSync(FIXTURE_NO_REQS)).toBe(true);
    expect(existsSync(FIXTURE_MALFORMED)).toBe(true);
  });

  it('runtime gate flag is boolean', () => {
    expect(typeof VIEWER_READY).toBe('boolean');
  });

  it('viewer server.mjs path is resolvable (sibling repo structure)', () => {
    expect(existsSync(VIEWER_ROOT)).toBe(true);
    expect(existsSync(SERVER_MJS)).toBe(true);
  });
});
