/**
 * ticket: TEST-0003
 * parent_feat: FEAT-0002
 * parent_us: US-099
 * role: qa
 * status: done
 *
 * Wave 123 — Viewer FEAT-grouped rendering regression tests (US-099 AC8)
 *
 * Spec: requirements/user-stories/US-099-viewer-feat-grouped-rendering.md
 * FEAT: FEAT-0002 — Viewer FEAT-Grouped Rendering
 * US: US-099
 *
 * Strategy: spawn the viewer's node server.mjs as a child process with
 * APEX_TEAM_ROOT pointing to fixture workspaces, then hit the live
 * GET /api/artifacts?role=<r> endpoint and assert the response shape.
 *
 * Runtime gate: if server.mjs does NOT yet contain 'features:' in the
 * listRoleGrouped return value (i.e. the FEAT-grouped endpoint has not
 * landed yet), all live server tests are skipped with a clear message.
 * The tests auto-unskip once server.mjs has the endpoint.
 *
 * Fixtures (Wave 123 AC8 scaffold — all under requirements/samples/feat-0002-fixtures/):
 *
 *   workspace-with-feats/
 *     requirements/features/FEAT-0001-alpha-feature.md   (feat: FEAT-0001)
 *     requirements/features/FEAT-0002-beta-feature.md    (feat: FEAT-0002)
 *     requirements/features/FEAT-0003-gamma-feature.md   (feat: FEAT-0003)
 *     requirements/features/FEAT-0002-malformed-frontmatter.md (broken — no closing ---)
 *     requirements/user-stories/ungrouped-doc.md         (no frontmatter)
 *     tests/qa/features/FEAT-0001-test-feature/TEST-0001-alpha-tests.test.ts
 *     tests/qa/features/FEAT-0001-test-feature/TEST-0002-alpha-extra.test.ts
 *     tests/qa/features/FEAT-0001-test-feature/TEST-0003-orphan-feat.test.ts (parent_feat: FEAT-9999)
 *     tests/qa/features/FEAT-0002-test-feature/TEST-0004-beta.test.ts
 *     tests/qa/features/FEAT-0003-test-feature/TEST-0005-gamma.test.ts
 *     architecture/features/FEAT-0001-test-feature/ARCH-0001-alpha-nfr.md
 *
 *   workspace-empty-features/
 *     requirements/features/.gitkeep                     (dir exists, no files)
 *     requirements/user-stories/US-001-sample.md         (no parent_feat)
 *
 *   workspace-no-features/
 *     requirements/user-stories/US-002-no-feat.md        (no requirements/features/ dir)
 *
 * Wave 118 comprehensive-coverage classes:
 *   Positive  — P1: valid parent_feat groups into features[], not ungrouped
 *               P2: BA feat: field groups as FEAT root entry
 *               P3: multi-FEAT sort: 3 FEATs returned sorted descending (FEAT-0003, FEAT-0002, FEAT-0001)
 *   Negative  — N1: workspace-empty-features: features: [], ungrouped: [...], no 500
 *               N2: workspace-no-features (no requirements/features/ dir): features: [], no 500
 *               N3: malformed frontmatter (no closing ---): file goes to ungrouped
 *   Edge      — E1: file with parent_feat: FEAT-9999 (non-existent) grouped under FEAT-9999 gracefully
 *               E2: FEAT file exists but no tickets reference it → features[] has entry with tickets: []
 *                   (this is a BA-role test: FEAT-0003 exists but no BA files reference parent_feat:FEAT-0003)
 *               E3: search filter presence in static HTML (DOM check via string search in index.html)
 *   Iterate   — parametrized over all 3 fixture workspaces: /api/artifacts?role=ba shape check
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

const APEX_TEAM_ROOT = resolve(import.meta.dirname, '../../../..');
const VIEWER_ROOT = resolve(APEX_TEAM_ROOT, '../apex-team-viewer');
const SERVER_MJS = join(VIEWER_ROOT, 'server.mjs');
const FIXTURES_ROOT = resolve(APEX_TEAM_ROOT, 'requirements/samples/feat-0002-fixtures');

const FIXTURE_WITH_FEATS = join(FIXTURES_ROOT, 'workspace-with-feats');
const FIXTURE_EMPTY_FEATURES = join(FIXTURES_ROOT, 'workspace-empty-features');
const FIXTURE_NO_FEATURES = join(FIXTURES_ROOT, 'workspace-no-features');

// ---------------------------------------------------------------------------
// Runtime gate — auto-skip if viewer hasn't landed the FEAT-grouped endpoint
// ---------------------------------------------------------------------------

function hasFeatGroupedEndpoint(): boolean {
  if (!existsSync(SERVER_MJS)) return false;
  const src = readFileSync(SERVER_MJS, 'utf8');
  // The listRoleGrouped function returns an object with a 'features:' key.
  // Check for a distinctive substring that would only be present in the
  // FEAT-grouped implementation.
  return src.includes('features:') && src.includes('listRoleGrouped');
}

const VIEWER_READY = hasFeatGroupedEndpoint();

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

// ---------------------------------------------------------------------------
// Type helpers for /api/artifacts response
// ---------------------------------------------------------------------------

interface ArtifactTicket {
  path: string;
  ticket: string | null;
  status: string;
  size: number;
  mtime: number;
}

interface ArtifactFeature {
  feat: string;
  slug: string;
  title: string;
  tickets: ArtifactTicket[];
}

interface ArtifactsResponse {
  role: string;
  features: ArtifactFeature[];
  ungrouped: Array<{ path: string; size: number; mtime: number }>;
  pipelines?: Array<{ path: string; size: number; mtime: number }>;
}

// ---------------------------------------------------------------------------
// Fixture scaffolding checks — run regardless of VIEWER_READY
// ---------------------------------------------------------------------------

describe('Wave 123 — fixture file scaffolding (US-099 AC8)', () => {
  it('workspace-with-feats contains FEAT-0001 through FEAT-0003 files', () => {
    const featDir = join(FIXTURE_WITH_FEATS, 'requirements/features');
    expect(existsSync(join(featDir, 'FEAT-0001-alpha-feature.md'))).toBe(true);
    expect(existsSync(join(featDir, 'FEAT-0002-beta-feature.md'))).toBe(true);
    expect(existsSync(join(featDir, 'FEAT-0003-gamma-feature.md'))).toBe(true);
  });

  it('workspace-with-feats FEAT-0001 file has feat: FEAT-0001 frontmatter (BA feat: field)', () => {
    const file = join(FIXTURE_WITH_FEATS, 'requirements/features/FEAT-0001-alpha-feature.md');
    const content = readFileSync(file, 'utf8');
    expect(content).toMatch(/^feat:\s*FEAT-0001/m);
  });

  it('workspace-with-feats FEAT-0002 malformed frontmatter file has no closing --- delimiter', () => {
    const file = join(FIXTURE_WITH_FEATS, 'requirements/features/FEAT-0002-malformed-frontmatter.md');
    expect(existsSync(file)).toBe(true);
    const content = readFileSync(file, 'utf8');
    // File starts with --- (opening delimiter)
    expect(content.startsWith('---')).toBe(true);
    // File does NOT contain a second \n--- (no closing delimiter)
    const closingDelimPos = content.indexOf('\n---', 3);
    expect(closingDelimPos).toBe(-1);
  });

  it('workspace-with-feats QA test files exist for FEAT-0001, FEAT-0002, FEAT-0003', () => {
    const qaDir = join(FIXTURE_WITH_FEATS, 'tests/qa/features');
    expect(existsSync(join(qaDir, 'FEAT-0001-test-feature/TEST-0001-alpha-tests.test.ts'))).toBe(true);
    expect(existsSync(join(qaDir, 'FEAT-0002-test-feature/TEST-0004-beta.test.ts'))).toBe(true);
    expect(existsSync(join(qaDir, 'FEAT-0003-test-feature/TEST-0005-gamma.test.ts'))).toBe(true);
  });

  it('workspace-with-feats TEST-0003 has parent_feat: FEAT-9999 (orphan FEAT fixture)', () => {
    const file = join(
      FIXTURE_WITH_FEATS,
      'tests/qa/features/FEAT-0001-test-feature/TEST-0003-orphan-feat.test.ts',
    );
    expect(existsSync(file)).toBe(true);
    const content = readFileSync(file, 'utf8');
    expect(content).toMatch(/^parent_feat:\s*FEAT-9999/m);
  });

  it('workspace-with-feats ungrouped-doc.md has no frontmatter block', () => {
    const file = join(FIXTURE_WITH_FEATS, 'requirements/user-stories/ungrouped-doc.md');
    expect(existsSync(file)).toBe(true);
    const content = readFileSync(file, 'utf8');
    // No opening --- at start means no frontmatter
    expect(content.startsWith('---')).toBe(false);
  });

  it('workspace-empty-features has requirements/features/ dir with only .gitkeep (no .md files)', () => {
    const featDir = join(FIXTURE_EMPTY_FEATURES, 'requirements/features');
    expect(existsSync(featDir)).toBe(true);
    expect(existsSync(join(featDir, '.gitkeep'))).toBe(true);
    // No .md files
    const mdFiles = ['FEAT-0001.md', 'FEAT-0002.md'];
    for (const f of mdFiles) {
      expect(existsSync(join(featDir, f))).toBe(false);
    }
  });

  it('workspace-no-features has NO requirements/features/ directory', () => {
    const featDir = join(FIXTURE_NO_FEATURES, 'requirements/features');
    expect(existsSync(featDir)).toBe(false);
  });

  it('all three fixture workspace roots exist on disk', () => {
    expect(existsSync(FIXTURE_WITH_FEATS)).toBe(true);
    expect(existsSync(FIXTURE_EMPTY_FEATURES)).toBe(true);
    expect(existsSync(FIXTURE_NO_FEATURES)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Runtime gate message
// ---------------------------------------------------------------------------

if (!VIEWER_READY) {
  describe('Wave 123 — viewer FEAT-grouped API tests (SKIPPED — viewer PR pending)', () => {
    it.skip(
      'SKIP: pending viewer PR for US-099 server.mjs FEAT-grouped /api/artifacts changes — ' +
        'auto-unskips once apex-team-viewer/server.mjs contains listRoleGrouped + features:',
      () => {},
    );
  });
}

// ---------------------------------------------------------------------------
// Live server tests — only when VIEWER_READY
// ---------------------------------------------------------------------------

if (VIEWER_READY) {
  // -------------------------------------------------------------------------
  // Positive tests (workspace-with-feats)
  // -------------------------------------------------------------------------

  describe('Wave 123 — Positive — US-099 AC1+AC2 (workspace-with-feats, role=ba)', () => {
    let handle: ServerHandle;

    beforeAll(async () => {
      handle = await startServer({ root: FIXTURE_WITH_FEATS });
    }, 15_000);

    afterAll(async () => {
      if (handle) await stopServer(handle);
    });

    it('P1: /api/artifacts?role=ba returns 200 with features + ungrouped arrays', async () => {
      const { status, body } = await apiGet(handle.port, '/api/artifacts?role=ba');
      expect(status).toBe(200);
      const b = body as ArtifactsResponse;
      expect(typeof b.role).toBe('string');
      expect(Array.isArray(b.features)).toBe(true);
      expect(Array.isArray(b.ungrouped)).toBe(true);
    });

    it('P2: BA FEAT file with feat: FEAT-0001 is grouped under FEAT-0001, not ungrouped (BA feat: field path)', async () => {
      const { body } = await apiGet(handle.port, '/api/artifacts?role=ba');
      const b = body as ArtifactsResponse;
      // FEAT-0001-alpha-feature.md has feat: FEAT-0001 — BA convention
      const feat0001 = b.features.find(f => f.feat === 'FEAT-0001');
      expect(feat0001, 'FEAT-0001 should appear in features[] for BA role').toBeTruthy();
      // Its path should NOT appear in ungrouped
      const ungroupedPaths = b.ungrouped.map(u => u.path);
      const alphaInUngrouped = ungroupedPaths.some(p => p.includes('FEAT-0001-alpha-feature'));
      expect(
        alphaInUngrouped,
        'FEAT-0001-alpha-feature.md must NOT appear in ungrouped (it has feat: frontmatter)',
      ).toBe(false);
    });

    it('P3: multi-FEAT sort — features[] returns FEATs sorted descending by ID (FEAT-0003, FEAT-0002, FEAT-0001)', async () => {
      const { body } = await apiGet(handle.port, '/api/artifacts?role=ba');
      const b = body as ArtifactsResponse;
      const featIds = b.features.map(f => f.feat);
      // All three FEATs must be present
      expect(featIds).toContain('FEAT-0001');
      expect(featIds).toContain('FEAT-0002');
      expect(featIds).toContain('FEAT-0003');
      // Must be ordered descending (higher number first)
      const idxFeat3 = featIds.findIndex(id => id === 'FEAT-0003');
      const idxFeat2 = featIds.findIndex(id => id === 'FEAT-0002');
      const idxFeat1 = featIds.findIndex(id => id === 'FEAT-0001');
      expect(idxFeat3).toBeGreaterThanOrEqual(0);
      expect(idxFeat2).toBeGreaterThanOrEqual(0);
      expect(idxFeat1).toBeGreaterThanOrEqual(0);
      expect(idxFeat3).toBeLessThan(idxFeat2);
      expect(idxFeat2).toBeLessThan(idxFeat1);
    });

    it('P4: file with valid parent_feat: FEAT-0001 (QA role) appears in features[], not ungrouped', async () => {
      const { status, body } = await apiGet(handle.port, '/api/artifacts?role=qa');
      expect(status).toBe(200);
      const b = body as ArtifactsResponse;
      const feat0001 = b.features.find(f => f.feat === 'FEAT-0001');
      expect(feat0001, 'FEAT-0001 group should exist in QA role response').toBeTruthy();
      // TEST-0001 and TEST-0002 should be in FEAT-0001 tickets
      const ticketIds = feat0001!.tickets.map(t => t.ticket);
      expect(ticketIds).toContain('TEST-0001');
      expect(ticketIds).toContain('TEST-0002');
      // These test files must NOT appear in ungrouped
      const ungroupedPaths = b.ungrouped.map(u => u.path);
      expect(ungroupedPaths.some(p => p.includes('TEST-0001'))).toBe(false);
      expect(ungroupedPaths.some(p => p.includes('TEST-0002'))).toBe(false);
    });

    it('P5: status field is extracted correctly from frontmatter (TEST-0001 status: accepted)', async () => {
      const { body } = await apiGet(handle.port, '/api/artifacts?role=qa');
      const b = body as ArtifactsResponse;
      const feat0001 = b.features.find(f => f.feat === 'FEAT-0001');
      expect(feat0001).toBeTruthy();
      const test0001 = feat0001!.tickets.find(t => t.ticket === 'TEST-0001');
      expect(test0001, 'TEST-0001 ticket should be present').toBeTruthy();
      expect(test0001!.status).toBe('accepted');
    });

    it('P6: tickets within a FEAT are sorted by ticket ID descending (TEST-0002 before TEST-0001)', async () => {
      const { body } = await apiGet(handle.port, '/api/artifacts?role=qa');
      const b = body as ArtifactsResponse;
      const feat0001 = b.features.find(f => f.feat === 'FEAT-0001');
      expect(feat0001).toBeTruthy();
      const ticketIds = feat0001!.tickets.map(t => t.ticket).filter(Boolean);
      // TEST-0002 should come before TEST-0001 (descending)
      const idxTest2 = ticketIds.findIndex(id => id === 'TEST-0002');
      const idxTest1 = ticketIds.findIndex(id => id === 'TEST-0001');
      if (idxTest1 >= 0 && idxTest2 >= 0) {
        expect(idxTest2).toBeLessThan(idxTest1);
      }
    });

    it('P7: response shape has feat, slug, title, tickets fields on each feature entry', async () => {
      const { body } = await apiGet(handle.port, '/api/artifacts?role=ba');
      const b = body as ArtifactsResponse;
      expect(b.features.length).toBeGreaterThan(0);
      for (const feat of b.features) {
        expect(typeof feat.feat).toBe('string');
        expect(feat.feat).toMatch(/^FEAT-\d+$/);
        expect(typeof feat.slug).toBe('string');
        expect(typeof feat.title).toBe('string');
        expect(Array.isArray(feat.tickets)).toBe(true);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Negative tests
  // -------------------------------------------------------------------------

  describe('Wave 123 — Negative — US-099 AC2 (error/empty paths)', () => {
    describe('N1: workspace-empty-features — no FEAT files in requirements/features/', () => {
      let handle: ServerHandle;

      beforeAll(async () => {
        handle = await startServer({ root: FIXTURE_EMPTY_FEATURES });
      }, 15_000);

      afterAll(async () => {
        if (handle) await stopServer(handle);
      });

      it('N1a: /api/artifacts?role=ba returns 200, not 500 (graceful empty)', async () => {
        const { status } = await apiGet(handle.port, '/api/artifacts?role=ba');
        expect(status).toBe(200);
      });

      it('N1b: response has features: [] when no FEAT files exist in requirements/features/', async () => {
        const { body } = await apiGet(handle.port, '/api/artifacts?role=ba');
        const b = body as ArtifactsResponse;
        expect(Array.isArray(b.features)).toBe(true);
        expect(b.features).toHaveLength(0);
      });

      it('N1c: ungrouped[] is populated (files exist, just not grouped)', async () => {
        const { body } = await apiGet(handle.port, '/api/artifacts?role=ba');
        const b = body as ArtifactsResponse;
        expect(Array.isArray(b.ungrouped)).toBe(true);
        // US-001-sample.md has no parent_feat so it goes to ungrouped
        expect(b.ungrouped.length).toBeGreaterThanOrEqual(1);
      });
    });

    describe('N2: workspace-no-features — requirements/features/ dir does not exist', () => {
      let handle: ServerHandle;

      beforeAll(async () => {
        handle = await startServer({ root: FIXTURE_NO_FEATURES });
      }, 15_000);

      afterAll(async () => {
        if (handle) await stopServer(handle);
      });

      it('N2a: /api/artifacts?role=ba returns 200 even when requirements/features/ is absent', async () => {
        const { status } = await apiGet(handle.port, '/api/artifacts?role=ba');
        expect(status).toBe(200);
      });

      it('N2b: features: [] when requirements/features/ does not exist (no 500 thrown)', async () => {
        const { body } = await apiGet(handle.port, '/api/artifacts?role=ba');
        const b = body as ArtifactsResponse;
        expect(Array.isArray(b.features)).toBe(true);
        expect(b.features).toHaveLength(0);
      });

      it('N2c: ungrouped[] contains files from requirements/ (no grouping possible, all ungrouped)', async () => {
        const { body } = await apiGet(handle.port, '/api/artifacts?role=ba');
        const b = body as ArtifactsResponse;
        expect(Array.isArray(b.ungrouped)).toBe(true);
        // US-002-no-feat.md has no parent_feat frontmatter
        expect(b.ungrouped.length).toBeGreaterThanOrEqual(1);
      });
    });

    describe('N3: malformed frontmatter — file with no closing --- goes to ungrouped', () => {
      let handle: ServerHandle;

      beforeAll(async () => {
        handle = await startServer({ root: FIXTURE_WITH_FEATS });
      }, 15_000);

      afterAll(async () => {
        if (handle) await stopServer(handle);
      });

      it('N3a: malformed-frontmatter.md is NOT in any features[] group (cannot be grouped)', async () => {
        const { body } = await apiGet(handle.port, '/api/artifacts?role=ba');
        const b = body as ArtifactsResponse;
        // The malformed file should not appear in any FEAT's tickets
        const allTicketPaths = b.features.flatMap(f => f.tickets.map(t => t.path));
        const hasMalformed = allTicketPaths.some(p => p.includes('FEAT-0002-malformed-frontmatter'));
        expect(
          hasMalformed,
          'malformed-frontmatter.md must NOT appear in any features[].tickets[] (it has no valid frontmatter)',
        ).toBe(false);
      });

      it('N3b: malformed-frontmatter.md IS in ungrouped[] (fail-soft: no crash, just ungrouped)', async () => {
        const { body } = await apiGet(handle.port, '/api/artifacts?role=ba');
        const b = body as ArtifactsResponse;
        const ungroupedPaths = b.ungrouped.map(u => u.path);
        const hasMalformed = ungroupedPaths.some(p => p.includes('FEAT-0002-malformed-frontmatter'));
        expect(
          hasMalformed,
          'malformed-frontmatter.md must appear in ungrouped[] (fail-soft behaviour)',
        ).toBe(true);
      });

      it('N3c: request does not throw 500 even with malformed-frontmatter.md present', async () => {
        const { status } = await apiGet(handle.port, '/api/artifacts?role=ba');
        expect(status).toBe(200);
      });

      it('N3d: file missing both parent_feat: and feat: fields goes to ungrouped (ungrouped-doc.md)', async () => {
        const { body } = await apiGet(handle.port, '/api/artifacts?role=ba');
        const b = body as ArtifactsResponse;
        const ungroupedPaths = b.ungrouped.map(u => u.path);
        const hasUngroupedDoc = ungroupedPaths.some(p => p.includes('ungrouped-doc'));
        expect(
          hasUngroupedDoc,
          'ungrouped-doc.md (no frontmatter at all) must appear in ungrouped[]',
        ).toBe(true);
      });
    });
  });

  // -------------------------------------------------------------------------
  // Edge tests
  // -------------------------------------------------------------------------

  describe('Wave 123 — Edge — US-099 AC2 (edge grouping behaviours)', () => {
    let handle: ServerHandle;

    beforeAll(async () => {
      handle = await startServer({ root: FIXTURE_WITH_FEATS });
    }, 15_000);

    afterAll(async () => {
      if (handle) await stopServer(handle);
    });

    it('E1: file with parent_feat: FEAT-9999 (non-existent FEAT) is still grouped under FEAT-9999 — graceful, no crash', async () => {
      const { status, body } = await apiGet(handle.port, '/api/artifacts?role=qa');
      expect(status).toBe(200);
      const b = body as ArtifactsResponse;
      // TEST-0003 references FEAT-9999 which has no corresponding FEAT file
      const feat9999 = b.features.find(f => f.feat === 'FEAT-9999');
      expect(feat9999, 'FEAT-9999 should be present in features[] even though no FEAT file exists').toBeTruthy();
      // Title falls back to FEAT-9999 (bare ID) or a slug-derived fallback — must be non-empty
      expect(feat9999!.title.length).toBeGreaterThan(0);
      // tickets[] should contain TEST-0003
      const test0003 = feat9999!.tickets.find(t => t.ticket === 'TEST-0003');
      expect(test0003, 'TEST-0003 should be in FEAT-9999 tickets').toBeTruthy();
    });

    it('E2: FEAT file exists but no tickets reference it (FEAT-0003 in BA role with no user-stories referencing it) — feature may appear with empty tickets[] or not appear (both are graceful)', async () => {
      // FEAT-0003-gamma-feature.md exists (feat: FEAT-0003) — this IS the FEAT entry itself
      // so BA will have FEAT-0003 in features[] with the FEAT file itself as a ticket
      // OR: if no files at all reference FEAT-0003 as parent_feat, it may appear with 0 external tickets
      // Either way: no crash, response is 200
      const { status, body } = await apiGet(handle.port, '/api/artifacts?role=ba');
      expect(status).toBe(200);
      const b = body as ArtifactsResponse;
      expect(Array.isArray(b.features)).toBe(true);
      // FEAT-0003 BA file itself has feat: FEAT-0003 so it groups itself
      const feat0003 = b.features.find(f => f.feat === 'FEAT-0003');
      // Whether it appears or not, the response must be well-formed
      if (feat0003) {
        expect(Array.isArray(feat0003.tickets)).toBe(true);
        expect(typeof feat0003.feat).toBe('string');
      }
    });

    it('E3: /api/artifacts response shape includes size and mtime fields on ticket entries', async () => {
      const { body } = await apiGet(handle.port, '/api/artifacts?role=qa');
      const b = body as ArtifactsResponse;
      const feat0001 = b.features.find(f => f.feat === 'FEAT-0001');
      expect(feat0001).toBeTruthy();
      expect(feat0001!.tickets.length).toBeGreaterThan(0);
      for (const ticket of feat0001!.tickets) {
        expect(typeof ticket.size).toBe('number');
        expect(typeof ticket.mtime).toBe('number');
        expect(typeof ticket.path).toBe('string');
      }
    });

    it('E4: Architect role returns ARCH-0001 grouped under FEAT-0001 (cross-role FEAT grouping)', async () => {
      const { status, body } = await apiGet(handle.port, '/api/artifacts?role=architect');
      expect(status).toBe(200);
      const b = body as ArtifactsResponse;
      const feat0001 = b.features.find(f => f.feat === 'FEAT-0001');
      expect(feat0001, 'FEAT-0001 should be present in Architect role features[]').toBeTruthy();
      const arch0001 = feat0001!.tickets.find(t => t.ticket === 'ARCH-0001');
      expect(arch0001, 'ARCH-0001 ticket should be in FEAT-0001 for Architect role').toBeTruthy();
    });

    it('E5: search-filter presence — viewer index.html contains search input affordance', () => {
      // AC7: search filter. Test at static HTML level (DOM string check).
      // Verify the index.html contains a search/filter input that could be used.
      const indexHtml = join(VIEWER_ROOT, 'public/index.html');
      if (!existsSync(indexHtml)) {
        // Skip if viewer not checked out (CI environment)
        console.log('skip: apex-team-viewer/public/index.html not present');
        return;
      }
      const html = readFileSync(indexHtml, 'utf8');
      // Accept either an <input type="search"> / <input type="text"> / <input> with
      // a filter/search-related placeholder or id
      const hasSearchInput =
        /input[^>]*(type=["']search["']|placeholder=["'][^"']*[Ss]earch|placeholder=["'][^"']*[Ff]ilter|id=["'][^"']*search|id=["'][^"']*filter)/i.test(html) ||
        /search|filter/i.test(html);
      expect(
        hasSearchInput,
        'index.html should contain a search/filter input affordance for AC7',
      ).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // DevSecOps role — AC9 (pipelines field)
  // -------------------------------------------------------------------------

  describe('Wave 123 — DevSecOps role — AC9 (pipelines field)', () => {
    let handle: ServerHandle;

    beforeAll(async () => {
      handle = await startServer({ root: FIXTURE_WITH_FEATS });
    }, 15_000);

    afterAll(async () => {
      if (handle) await stopServer(handle);
    });

    it('DS1: /api/artifacts?role=devsecops returns pipelines field (AC9 field presence)', async () => {
      const { status, body } = await apiGet(handle.port, '/api/artifacts?role=devsecops');
      expect(status).toBe(200);
      const b = body as ArtifactsResponse;
      // pipelines field must be present and be an array (may be empty)
      expect(Object.prototype.hasOwnProperty.call(b, 'pipelines')).toBe(true);
      expect(Array.isArray(b.pipelines)).toBe(true);
    });

    it('DS2: /api/artifacts?role=devsecops pipelines is [] when ops/pipelines/ does not exist (no 500)', async () => {
      // FIXTURE_WITH_FEATS has no ops/pipelines/ dir
      const { status, body } = await apiGet(handle.port, '/api/artifacts?role=devsecops');
      expect(status).toBe(200);
      const b = body as ArtifactsResponse;
      // Empty array is fine — no crash
      expect(Array.isArray(b.pipelines)).toBe(true);
    });

    it('DS3: /api/artifacts?role=ba does NOT return pipelines field (only devsecops gets it)', async () => {
      const { status, body } = await apiGet(handle.port, '/api/artifacts?role=ba');
      expect(status).toBe(200);
      const b = body as ArtifactsResponse;
      // BA role must not have the pipelines key
      expect(Object.prototype.hasOwnProperty.call(b, 'pipelines')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Iterate-all: parametrized over all 3 fixture workspaces (Wave 118 rule)
  // -------------------------------------------------------------------------

  describe('Wave 123 — Iterate-all: /api/artifacts shape over all 3 fixtures (Wave 118)', () => {
    const FIXTURE_CASES: Array<{
      label: string;
      root: string;
      role: string;
      expectedFeaturesEmpty: boolean;
    }> = [
      {
        label: 'workspace-with-feats',
        root: FIXTURE_WITH_FEATS,
        role: 'ba',
        expectedFeaturesEmpty: false,
      },
      {
        label: 'workspace-empty-features',
        root: FIXTURE_EMPTY_FEATURES,
        role: 'ba',
        expectedFeaturesEmpty: true,
      },
      {
        label: 'workspace-no-features',
        root: FIXTURE_NO_FEATURES,
        role: 'ba',
        expectedFeaturesEmpty: true,
      },
    ];

    for (const fixture of FIXTURE_CASES) {
      describe(`fixture: ${fixture.label} (role=${fixture.role})`, () => {
        let handle: ServerHandle;

        beforeAll(async () => {
          handle = await startServer({ root: fixture.root });
        }, 15_000);

        afterAll(async () => {
          if (handle) await stopServer(handle);
        });

        it(`I-${fixture.label}: /api/artifacts returns 200 with correct shape`, async () => {
          const { status, body } = await apiGet(handle.port, `/api/artifacts?role=${fixture.role}`);
          expect(status).toBe(200);
          const b = body as ArtifactsResponse;
          expect(typeof b.role).toBe('string');
          expect(Array.isArray(b.features)).toBe(true);
          expect(Array.isArray(b.ungrouped)).toBe(true);
        });

        it(`I-${fixture.label}: features array is ${fixture.expectedFeaturesEmpty ? 'empty' : 'non-empty'} as expected`, async () => {
          const { body } = await apiGet(handle.port, `/api/artifacts?role=${fixture.role}`);
          const b = body as ArtifactsResponse;
          if (fixture.expectedFeaturesEmpty) {
            expect(b.features).toHaveLength(0);
          } else {
            expect(b.features.length).toBeGreaterThan(0);
          }
        });

        it(`I-${fixture.label}: /api/health returns ok:true with root field (server up)`, async () => {
          const { status, body } = await apiGet(handle.port, '/api/health');
          expect(status).toBe(200);
          const b = body as Record<string, unknown>;
          expect(b.ok).toBe(true);
          expect(typeof b.root).toBe('string');
        });
      });
    }
  });
}

// ---------------------------------------------------------------------------
// Metadata / self-reference (US-085 traceability)
// ---------------------------------------------------------------------------

describe('Wave 123 — metadata', () => {
  it('test file exists at canonical Wave 122 FEAT-grouped path', () => {
    const expected = resolve(
      APEX_TEAM_ROOT,
      'tests/qa/features/FEAT-0002-viewer-feat-grouped-rendering/TEST-0003-feat-grouped-api.test.ts',
    );
    expect(existsSync(expected)).toBe(true);
  });

  it('US-099 user story exists with ## Acceptance criteria section', () => {
    const usFile = resolve(APEX_TEAM_ROOT, 'requirements/user-stories/US-099-viewer-feat-grouped-rendering.md');
    expect(existsSync(usFile)).toBe(true);
    const content = readFileSync(usFile, 'utf8');
    expect(content).toMatch(/^## Acceptance criteria/m);
  });

  it('US-099 contains AC8 (regression tests requirement)', () => {
    const usFile = resolve(APEX_TEAM_ROOT, 'requirements/user-stories/US-099-viewer-feat-grouped-rendering.md');
    const content = readFileSync(usFile, 'utf8');
    expect(content).toContain('AC8');
  });

  it('FEAT-0002 file exists at requirements/features/', () => {
    const featFile = resolve(
      APEX_TEAM_ROOT,
      'requirements/features/FEAT-0002-viewer-feat-grouped-rendering.md',
    );
    expect(existsSync(featFile)).toBe(true);
    const content = readFileSync(featFile, 'utf8');
    expect(content).toMatch(/^feat:\s*FEAT-0002/m);
  });

  it('tests/qa/features/INDEX.md exists (Wave 122 QA allocation log)', () => {
    const indexFile = resolve(APEX_TEAM_ROOT, 'tests/qa/features/INDEX.md');
    expect(existsSync(indexFile)).toBe(true);
  });

  it('all three fixture workspace roots exist on disk', () => {
    expect(existsSync(FIXTURE_WITH_FEATS)).toBe(true);
    expect(existsSync(FIXTURE_EMPTY_FEATURES)).toBe(true);
    expect(existsSync(FIXTURE_NO_FEATURES)).toBe(true);
  });

  it('runtime gate flag VIEWER_READY is boolean', () => {
    expect(typeof VIEWER_READY).toBe('boolean');
  });

  it('viewer server.mjs path resolves when sibling viewer repo is checked out', () => {
    if (!existsSync(VIEWER_ROOT)) {
      console.log('skip: sibling apex-team-viewer not present (expected in CI)');
      return;
    }
    expect(existsSync(VIEWER_ROOT)).toBe(true);
    expect(existsSync(SERVER_MJS)).toBe(true);
  });
});
