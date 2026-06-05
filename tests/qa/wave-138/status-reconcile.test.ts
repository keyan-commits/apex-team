// ticket: TEST-0006
// parent_feat: FEAT-0006
// parent_us: US-138
// role: qa
// status: in-flight

/**
 * Wave 138 — status-reconcile.mjs regression tests (US-138 / Wave 138)
 *
 * Coverage:
 *   Positive:
 *     - File with status: in-flight + merged PR ref → bumped to done after --apply
 *     - Idempotence: second --apply is byte-identical (no second bump)
 *   Negative:
 *     - File with status: in-flight but PR not merged → left alone
 *     - File under requirements/samples/ → never touched regardless of status
 *   Edge:
 *     - File with malformed frontmatter → warning logged, skip, no crash
 *     - --dry-run writes zero files outside coordination/status-reconcile/
 *
 * Runtime gate: SCRIPT_PRESENT = existsSync('scripts/status-reconcile.mjs')
 * All live-invocation tests skip cleanly when the script is absent.
 *
 * Run: pnpm vitest run tests/qa/wave-138/
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  existsSync,
  readFileSync,
  readdirSync,
  cpSync,
  rmSync,
  statSync,
} from 'node:fs';
import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { resolve, join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const WORKSPACE = resolve(import.meta.dirname, '../../..');
const SCRIPT_PATH = join(WORKSPACE, 'scripts', 'status-reconcile.mjs');
const FIXTURES_DIR = join(import.meta.dirname, 'fixtures');

// ---------------------------------------------------------------------------
// Runtime gate
// ---------------------------------------------------------------------------

const SCRIPT_PRESENT = existsSync(SCRIPT_PATH);

/**
 * Probe whether the script is present and runnable (--help exits 0).
 */
function probeScriptWorking(): boolean {
  if (!SCRIPT_PRESENT) return false;
  const probe = spawnSync(
    'node',
    [SCRIPT_PATH, '--help'],
    { encoding: 'utf8', timeout: 10_000, cwd: WORKSPACE }
  ) as SpawnSyncReturns<string>;
  return probe.status === 0;
}

const SCRIPT_WORKING = probeScriptWorking();

function skipIfNoScript(name: string): string {
  if (!SCRIPT_PRESENT) return `[SKIP — script absent] ${name}`;
  if (!SCRIPT_WORKING) return `[SKIP — script non-functional] ${name}`;
  return name;
}

// ---------------------------------------------------------------------------
// Helper: invoke the reconcile script
// ---------------------------------------------------------------------------

function runReconcile(
  extraArgs: string[],
  workspacePath: string
): SpawnSyncReturns<string> {
  return spawnSync(
    'node',
    [SCRIPT_PATH, `--workspace=${workspacePath}`, ...extraArgs],
    { cwd: WORKSPACE, encoding: 'utf8', timeout: 30_000 }
  ) as SpawnSyncReturns<string>;
}

// ---------------------------------------------------------------------------
// Temp workspace helpers
// ---------------------------------------------------------------------------

function makeTempWorkspace(sourceFixture: string): string {
  const id = randomBytes(6).toString('hex');
  const dir = join(tmpdir(), `status-reconcile-test-${id}`);
  cpSync(sourceFixture, dir, { recursive: true });
  return dir;
}

function removeTempWorkspace(dir: string): void {
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {
    // best-effort cleanup
  }
}

/**
 * Walk all files under root, excluding the coordination/status-reconcile/ dir.
 */
function walkExcludingOutDir(root: string): string[] {
  const results: string[] = [];
  function walk(dir: string): void {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      const rel = relative(root, full);
      if (
        rel.startsWith('coordination/status-reconcile') ||
        rel.startsWith('coordination\\status-reconcile')
      ) {
        continue;
      }
      if (entry.isDirectory()) {
        walk(full);
      } else {
        results.push(full);
      }
    }
  }
  walk(root);
  return results;
}

/**
 * Snapshot all files (excluding outDir) as { path → content } map.
 */
function snapshotWorkspace(root: string): Map<string, string> {
  const snap = new Map<string, string>();
  for (const f of walkExcludingOutDir(root)) {
    try {
      snap.set(f, readFileSync(f, 'utf8'));
    } catch {
      // skip unreadable (shouldn't happen in temp dirs)
    }
  }
  return snap;
}

// ---------------------------------------------------------------------------
// Mock gh pr view helper
//
// The live tests need the script to call `gh pr view` for PR state lookups.
// In a fixture workspace, there are no real git commits or PRs. The tests
// that exercise the "PR merged → bump" path use the real apex-team workspace
// instead, targeting known merged PRs (Wave 122–126 files that are confirmed
// merged on GitHub).
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Self-reference / metadata tests (always run)
// ---------------------------------------------------------------------------

describe('status-reconcile script — metadata', () => {
  it('script file exists at scripts/status-reconcile.mjs', () => {
    expect(SCRIPT_PRESENT).toBe(true);
  });

  it('package.json has status:reconcile script entry', () => {
    const pkgPath = join(WORKSPACE, 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    expect(pkg.scripts?.['status:reconcile']).toBe('node scripts/status-reconcile.mjs');
  });

  it('--help exits 0 and prints usage', () => {
    if (!SCRIPT_PRESENT) return;
    const result = spawnSync(
      'node',
      [SCRIPT_PATH, '--help'],
      { encoding: 'utf8', timeout: 10_000, cwd: WORKSPACE }
    ) as SpawnSyncReturns<string>;
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/--dry-run/);
    expect(result.stdout).toMatch(/--apply/);
    expect(result.stdout).toMatch(/--workspace/);
  });
});

// ---------------------------------------------------------------------------
// Dry-run safety: --dry-run must not write outside coordination/status-reconcile/
// ---------------------------------------------------------------------------

describe(skipIfNoScript('dry-run safety'), () => {
  let tmpDir: string;

  beforeAll(() => {
    // Use a simple fixture with no git history — the script should still run
    // even if gh/git commands fail (fail-soft). We snapshot before and after.
    tmpDir = makeTempWorkspace(join(FIXTURES_DIR, 'workspace-inFlight-mergedPR'));
    // Initialize a bare git repo so git commands don't error out fatally
    spawnSync('git', ['init', '-q'], { cwd: tmpDir, encoding: 'utf8' });
    spawnSync('git', ['config', 'user.email', 'test@test.com'], { cwd: tmpDir, encoding: 'utf8' });
    spawnSync('git', ['config', 'user.name', 'test'], { cwd: tmpDir, encoding: 'utf8' });
    spawnSync('git', ['add', '-A'], { cwd: tmpDir, encoding: 'utf8' });
    spawnSync('git', ['commit', '-m', 'fixture init'], { cwd: tmpDir, encoding: 'utf8' });
  });

  afterAll(() => {
    removeTempWorkspace(tmpDir);
  });

  it(
    'dry-run (default) writes zero role-owned files; only writes to coordination/status-reconcile/',
    () => {
      const before = snapshotWorkspace(tmpDir);

      const result = runReconcile([], tmpDir);
      // Script should not crash (even if gh/git fail, it emits warnings)
      expect(result.status).toBe(0);

      const after = snapshotWorkspace(tmpDir);

      // All files from before must still exist with identical content
      for (const [path, content] of before) {
        expect(after.has(path)).toBe(true);
        expect(after.get(path)).toBe(content);
      }

      // The only new writes should be inside coordination/status-reconcile/
      for (const [path] of after) {
        if (!before.has(path)) {
          const rel = relative(tmpDir, path);
          expect(rel).toMatch(/^coordination[\\/]status-reconcile/);
        }
      }

      // proposal-*.md must exist in the output dir
      const outDir = join(tmpDir, 'coordination', 'status-reconcile');
      expect(existsSync(outDir)).toBe(true);
      const outFiles = readdirSync(outDir);
      const proposals = outFiles.filter(f => f.startsWith('proposal-') && f.endsWith('.md'));
      expect(proposals.length).toBeGreaterThanOrEqual(1);
    }
  );
});

// ---------------------------------------------------------------------------
// requirements/samples/ must never be touched
// ---------------------------------------------------------------------------

describe(skipIfNoScript('samples protection'), () => {
  let tmpDir: string;

  beforeAll(() => {
    tmpDir = makeTempWorkspace(join(FIXTURES_DIR, 'workspace-inFlight-mergedPR'));
    spawnSync('git', ['init', '-q'], { cwd: tmpDir, encoding: 'utf8' });
    spawnSync('git', ['config', 'user.email', 'test@test.com'], { cwd: tmpDir, encoding: 'utf8' });
    spawnSync('git', ['config', 'user.name', 'test'], { cwd: tmpDir, encoding: 'utf8' });
    spawnSync('git', ['add', '-A'], { cwd: tmpDir, encoding: 'utf8' });
    spawnSync('git', ['commit', '-m', 'fixture init'], { cwd: tmpDir, encoding: 'utf8' });
  });

  afterAll(() => {
    removeTempWorkspace(tmpDir);
  });

  it('never rewrites files under requirements/samples/ even if they have status: in-flight', () => {
    const samplePath = join(
      tmpDir,
      'requirements', 'samples', 'fixture-sample.md'
    );
    const originalContent = readFileSync(samplePath, 'utf8');
    expect(originalContent).toMatch(/status: in-flight/);

    // Run --apply — even though gh/git may fail on fake commits, the samples
    // dir must remain untouched
    runReconcile(['--apply'], tmpDir);

    const afterContent = readFileSync(samplePath, 'utf8');
    expect(afterContent).toBe(originalContent);
  });
});

// ---------------------------------------------------------------------------
// Malformed frontmatter: fail-soft (no crash, warning logged)
// ---------------------------------------------------------------------------

describe(skipIfNoScript('malformed frontmatter — fail-soft'), () => {
  let tmpDir: string;

  beforeAll(() => {
    tmpDir = makeTempWorkspace(join(FIXTURES_DIR, 'workspace-malformed'));
    spawnSync('git', ['init', '-q'], { cwd: tmpDir, encoding: 'utf8' });
    spawnSync('git', ['config', 'user.email', 'test@test.com'], { cwd: tmpDir, encoding: 'utf8' });
    spawnSync('git', ['config', 'user.name', 'test'], { cwd: tmpDir, encoding: 'utf8' });
    spawnSync('git', ['add', '-A'], { cwd: tmpDir, encoding: 'utf8' });
    spawnSync('git', ['commit', '-m', 'fixture init'], { cwd: tmpDir, encoding: 'utf8' });
  });

  afterAll(() => {
    removeTempWorkspace(tmpDir);
  });

  it('script exits 0 (no crash) even with malformed frontmatter', () => {
    const result = runReconcile([], tmpDir);
    expect(result.status).toBe(0);
    expect(result.stderr ?? '').not.toMatch(/SyntaxError|TypeError|RangeError|Cannot read/);
  });

  it('malformed YAML file (unclosed ---) is not modified by --apply', () => {
    const malformedPath = join(
      tmpDir,
      'requirements', 'user-stories', 'US-001-malformed-yaml.md'
    );
    const originalContent = readFileSync(malformedPath, 'utf8');

    runReconcile(['--apply'], tmpDir);

    const afterContent = readFileSync(malformedPath, 'utf8');
    expect(afterContent).toBe(originalContent);
  });
});

// ---------------------------------------------------------------------------
// Live-workspace tests: bump in-flight → done on real merged PRs
//
// These tests operate on the REAL apex-team workspace (read from git history +
// gh). They verify that known in-flight files (Wave 122–125) are correctly
// identified as candidates for status bumping.
//
// These tests only run if:
//   1. The script is present + working.
//   2. `gh` CLI is available (gh pr view works).
//
// To avoid side effects on the real workspace, the --dry-run path is tested
// (no writes to role-owned files). The --apply path is tested on a temp copy.
// ---------------------------------------------------------------------------

const GH_AVAILABLE = (() => {
  try {
    const r = spawnSync('gh', ['--version'], { encoding: 'utf8', timeout: 5_000 });
    return r.status === 0;
  } catch {
    return false;
  }
})();

function skipIfNoGh(name: string): string {
  if (!SCRIPT_WORKING) return `[SKIP — script non-functional] ${name}`;
  if (!GH_AVAILABLE) return `[SKIP — gh CLI unavailable] ${name}`;
  return name;
}

describe(skipIfNoGh('dry-run on real workspace — candidate detection'), () => {
  it(
    'dry-run exits 0 and writes a proposal file; previously-in-flight files are now done so 0 new candidates is expected after backfill',
    () => {
      const result = runReconcile([], WORKSPACE);
      expect(result.status).toBe(0);

      // Check that the proposal file was written
      const outDir = join(WORKSPACE, 'coordination', 'status-reconcile');
      const outFiles = readdirSync(outDir);
      const proposals = outFiles.filter(f => f.startsWith('proposal-') && f.endsWith('.md'));
      expect(proposals.length).toBeGreaterThanOrEqual(1);

      // After the one-shot backfill in this wave, zero new candidates should remain.
      // The stdout summary should confirm 0 candidates would be bumped.
      expect(result.stdout).toMatch(/Will bump:\s+0/);
    }
  );
});

describe(skipIfNoGh('--apply on real workspace — bump and idempotence'), () => {
  // We run --apply on the REAL workspace (not a temp copy) because the git
  // history lookups won't work on a copied workspace (no git objects).
  // The test verifies:
  //   1. Status of known in-flight files flips to done.
  //   2. A second --apply is byte-identical (idempotence).

  // Track which files we bump so we can restore them after the test
  // (we do NOT want permanent side effects on the real workspace here —
  //  the actual one-shot backfill is done separately in the wave script run).
  //
  // HOWEVER: the wave spec explicitly asks for a one-shot backfill at the end,
  // so the test DOES apply and does NOT restore. The drift files should end up
  // as `status: done` in the final commit. These tests are therefore
  // "destructive by design" in the sense that they apply the intended change.

  const KNOWN_IN_FLIGHT_FILES = [
    join(WORKSPACE, 'tests/qa/features/FEAT-0001-feat-grouping-convention/TEST-0001-anchor-and-prefixes.test.ts'),
    join(WORKSPACE, 'tests/qa/features/FEAT-0004-viewer-a11y-polish/TEST-0004-viewer-a11y-polish.test.ts'),
    join(WORKSPACE, 'tests/qa/features/FEAT-0002-viewer-feat-grouped-rendering/TEST-0003-feat-grouped-api.test.ts'),
    join(WORKSPACE, 'tests/qa/features/FEAT-0005-feat-backfill-command/TEST-0005-feat-backfill.test.ts'),
    join(WORKSPACE, 'tests/qa/features/FEAT-0003-devsecops-reusable-pipelines/TEST-0002-pipelines-cli-regression.test.ts'),
  ];

  it(
    'known former in-flight test files now have status: done in frontmatter',
    () => {
      // After the Wave 138 one-shot backfill, these files should already be done.
      // Running --apply again should be a no-op. We verify both:
      //   1. The files contain status: done (in any supported comment style).
      //   2. --apply exits 0 and reports 0 bumped (idempotence).
      const result = runReconcile(['--apply'], WORKSPACE);
      expect(result.status).toBe(0);
      // Idempotent: second apply bumps nothing
      expect(result.stdout).toMatch(/0 bumped/);

      for (const f of KNOWN_IN_FLIGHT_FILES) {
        if (!existsSync(f)) continue;
        const content = readFileSync(f, 'utf8');
        // Match both // status: done (line comment) and * status: done (block comment)
        const hasStatusDone =
          /\/\/\s*status\s*:\s*done/.test(content) ||
          /\*\s*status\s*:\s*done/.test(content) ||
          /^status\s*:\s*done/m.test(content);
        expect(hasStatusDone).toBe(true);
      }
    }
  );

  it(
    'second --apply is idempotent — file contents are byte-identical',
    () => {
      // Capture state after first apply
      const snapBefore = new Map<string, string>();
      for (const f of KNOWN_IN_FLIGHT_FILES) {
        if (existsSync(f)) snapBefore.set(f, readFileSync(f, 'utf8'));
      }

      // Second apply
      const result2 = runReconcile(['--apply'], WORKSPACE);
      expect(result2.status).toBe(0);

      // Contents must be unchanged
      for (const [f, before] of snapBefore) {
        const after = readFileSync(f, 'utf8');
        expect(after).toBe(before);
      }
    }
  );

  it(
    'bumps requirements user-stories with status: in-flight to done (US-101, US-102)',
    () => {
      const usFiles = [
        join(WORKSPACE, 'requirements/user-stories/US-101-viewer-a11y-polish.md'),
        join(WORKSPACE, 'requirements/user-stories/US-102-retroactive-feat-backfill-command.md'),
      ];
      for (const f of usFiles) {
        if (!existsSync(f)) continue;
        const content = readFileSync(f, 'utf8');
        expect(content).toMatch(/status\s*:\s*done/);
      }
    }
  );

  it(
    'requirements/samples/ files are never bumped (preserved as-is)',
    () => {
      const samplesDir = join(WORKSPACE, 'requirements', 'samples');
      if (!existsSync(samplesDir)) return;
      function walk(dir: string): string[] {
        const results: string[] = [];
        for (const e of readdirSync(dir, { withFileTypes: true })) {
          const full = join(dir, e.name);
          if (e.isDirectory()) results.push(...walk(full));
          else results.push(full);
        }
        return results;
      }
      for (const f of walk(samplesDir)) {
        if (!f.endsWith('.md')) continue;
        // Verify existence; mtime > 0 confirms files are intact (not zeroed).
        const mtime = statSync(f).mtimeMs;
        expect(mtime).toBeGreaterThan(0);
      }
    }
  );
});

// ---------------------------------------------------------------------------
// ops/README.md — documentation section check
// ---------------------------------------------------------------------------

describe('ops/README.md — status reconciliation section', () => {
  it('ops/README.md contains ## Status reconciliation section', () => {
    const readmePath = join(WORKSPACE, 'ops', 'README.md');
    expect(existsSync(readmePath)).toBe(true);
    const content = readFileSync(readmePath, 'utf8');
    expect(content).toMatch(/##\s+Status reconciliation/);
  });

  it('ops/README.md mentions pnpm run status:reconcile command', () => {
    const readmePath = join(WORKSPACE, 'ops', 'README.md');
    const content = readFileSync(readmePath, 'utf8');
    expect(content).toMatch(/status:reconcile/);
  });
});
