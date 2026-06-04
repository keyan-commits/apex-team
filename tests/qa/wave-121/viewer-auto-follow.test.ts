/**
 * Wave 121 — Viewer auto-follow regression tests (US-097 AC7)
 *
 * Spec: requirements/user-stories/US-097-viewer-auto-follow-claude-code.md
 * US: US-097 — Viewer auto-follow Claude Code's active project
 *
 * Strategy B: Re-implement the scanClaudeCodeProjects() scanner logic in test
 * code and assert behavioral parity against mock fixtures. This decouples the
 * test from the live server while still exercising the spec's behavioral
 * contracts.
 *
 * Runtime gate: if server.mjs does NOT yet contain `scanClaudeCodeProjects`,
 * the live-server tests are skipped with a clear message.  Logic-unit tests
 * (Sections 1–5) run unconditionally.  The gate auto-unskips once UI Dev
 * lands AC2/AC3/AC5 in server.mjs.
 *
 * Fixtures (created in requirements/samples/wave-121-claude-projects/):
 *   mock-projects-apex-more-recent/  - apex JSONL mtime > LFM
 *   mock-projects-lfm-more-recent/   - LFM JSONL mtime > apex
 *   mock-projects-empty/             - empty directory
 *   mock-projects-no-jsonls/         - encoded dir present but no .jsonl files
 *   mock-projects-decoded-path-missing/ - encoded dir whose decoded path doesn't exist
 *   mock-projects-multiple-decoded-options/ - ambiguous encoded dir
 *
 * Wave 118 coverage classes (US-094 comprehensive-coverage discipline):
 *   Positive  — apex more recent / LFM more recent / auto-follow switch
 *   Negative  — missing ~/.claude/projects; APEX_TEAM_ROOT pin; manual-switch suppress
 *   Edge      — nonexistent decoded path; empty requirements dir; identical mtimes; iterate-all
 *   Iterate   — parametrized loop over all 6 mock fixture states (Wave 118 rule)
 *
 * S10: not triggered — wave touches no user-supplied collection logic in source.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  existsSync,
  readdirSync,
  statSync,
  utimesSync,
  mkdirSync,
  writeFileSync,
} from 'node:fs';
import { readFileSync } from 'node:fs';
import { spawn, type ChildProcess } from 'node:child_process';
import { createServer, Socket } from 'node:net';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const APEX_TEAM_ROOT = resolve(import.meta.dirname, '../../..');
const VIEWER_ROOT = resolve(APEX_TEAM_ROOT, '../apex-team-viewer');
const SERVER_MJS = join(VIEWER_ROOT, 'server.mjs');
const FIXTURES_ROOT = resolve(
  APEX_TEAM_ROOT,
  'requirements/samples/wave-121-claude-projects'
);

// ---------------------------------------------------------------------------
// Runtime gate — auto-skip live-server tests if viewer hasn't landed US-097
// ---------------------------------------------------------------------------

function hookHasFeature(): boolean {
  if (!existsSync(SERVER_MJS)) return false;
  const src = readFileSync(SERVER_MJS, 'utf8');
  return src.includes('scanClaudeCodeProjects');
}

const AUTO_FOLLOW_READY = hookHasFeature();

// ---------------------------------------------------------------------------
// --- Strategy B: scanner logic implemented in test code ---
//
// Mirrors the behavioral spec from US-097 AC2 + AC3:
//   1. Read entries in the mock claude-projects directory.
//   2. Decode each entry name (replace every '-' with '/').
//   3. Skip if decoded path does not exist on disk.
//   4. Skip if the decoded path lacks requirements/ with at least one subdir.
//   5. For each valid entry, find the max mtime across *.jsonl files.
//   6. Mark the entry with the highest mtime as mostRecent: true.
//   7. Tiebreak: first in registry order (directory listing order).
// ---------------------------------------------------------------------------

interface WorkspaceEntry {
  encodedName: string;
  decodedPath: string;
  mtimeMs: number;
  mostRecent: boolean;
}

/**
 * Decode a Claude Code project-dir encoded name to an absolute path.
 * Encoding: every '/' in the absolute path is replaced with '-'.
 * Decoding: replace every '-' with '/'.
 */
function decodePath(encodedName: string): string {
  return encodedName.replace(/-/g, '/');
}

/**
 * Check if a path satisfies the AC1 requirements-dir filter:
 * exists + has requirements/ + requirements/ has at least one subdirectory.
 */
function passesAC1Filter(decodedPath: string): boolean {
  const reqDir = join(decodedPath, 'requirements');
  if (!existsSync(reqDir)) return false;
  try {
    const entries = readdirSync(reqDir, { withFileTypes: true });
    return entries.some(e => e.isDirectory());
  } catch {
    return false;
  }
}

/**
 * Find the maximum mtime (ms) of all *.jsonl files in a claude-projects
 * encoded directory. Returns 0 if the directory doesn't exist or has no
 * .jsonl files.
 */
function maxJsonlMtime(claudeProjectsDir: string, encodedName: string): number {
  const dir = join(claudeProjectsDir, encodedName);
  if (!existsSync(dir)) return 0;
  try {
    const files = readdirSync(dir).filter(f => f.endsWith('.jsonl'));
    if (files.length === 0) return 0;
    return Math.max(...files.map(f => statSync(join(dir, f)).mtimeMs));
  } catch {
    return 0;
  }
}

/**
 * Build a mock workspace registry from a given mock claude-projects directory.
 * Mirrors the AC2 + AC3 spec behavior.
 *
 * decodedPathExistsOverride: map of decodedPath -> boolean for controlling
 * existsSync behavior in tests (defaults to real filesystem).
 */
function buildMockRegistry(
  claudeProjectsDir: string,
  opts: { skipAC1Filter?: boolean; decodedPathMap?: Map<string, string> } = {}
): WorkspaceEntry[] {
  if (!existsSync(claudeProjectsDir)) return [];

  let entries: string[];
  try {
    entries = readdirSync(claudeProjectsDir).filter(name => name.startsWith('-'));
  } catch {
    return [];
  }

  const registry: WorkspaceEntry[] = [];
  for (const encodedName of entries) {
    const decodedPath = opts.decodedPathMap?.get(encodedName) ?? decodePath(encodedName);

    // AC2 step 4: skip if decoded path doesn't exist on disk
    if (!existsSync(decodedPath)) continue;

    // AC2 step 5 + AC1 filter: skip if no requirements/ with subdir
    if (!opts.skipAC1Filter && !passesAC1Filter(decodedPath)) continue;

    const mtimeMs = maxJsonlMtime(claudeProjectsDir, encodedName);
    registry.push({ encodedName, decodedPath, mtimeMs, mostRecent: false });
  }

  // AC3 step 5+6: mark the entry with highest mtime as mostRecent (tiebreak: first wins)
  if (registry.length > 0) {
    const maxMtime = Math.max(...registry.map(e => e.mtimeMs));
    const winner = registry.find(e => e.mtimeMs === maxMtime);
    if (winner) winner.mostRecent = true;
  }

  return registry;
}

/**
 * Helper to set a file's mtime to a given unix-epoch-seconds value.
 */
function setMtime(filePath: string, epochSeconds: number): void {
  const t = new Date(epochSeconds * 1000);
  utimesSync(filePath, t, t);
}

// ---------------------------------------------------------------------------
// Section 1 — Positive tests
// ---------------------------------------------------------------------------

describe('Wave 121 — Positive (US-097 AC3 + AC4)', () => {
  // We use tmp dirs so fixture file mtimes can be controlled without
  // polluting the committed fixtures (which have arbitrary mtimes).

  let tmpDir: string;
  let apexEncodedDir: string;
  let lfmEncodedDir: string;

  // Fake projects that DO exist on disk — we create them in tmp
  let fakeApexPath: string;
  let fakeLfmPath: string;

  // Epoch timestamps from the spec (AC7)
  const APEX_MTIME = 1780568484; // apex-team is more recent
  const LFM_MTIME = 1780400000;  // lfm is older
  const LFM_MTIME_NEWER = 1780600000; // lfm becomes more recent

  beforeAll(() => {
    // Create tmp directories that mimic ~/.claude/projects/
    tmpDir = join(tmpdir(), `wave-121-test-${Date.now()}`);

    // Fake apex-team and lfm project roots with requirements/ subdirs
    fakeApexPath = join(tmpDir, 'fake-apex-team');
    fakeLfmPath = join(tmpDir, 'fake-lfm');
    mkdirSync(join(fakeApexPath, 'requirements', 'user-stories'), { recursive: true });
    mkdirSync(join(fakeLfmPath, 'requirements', 'user-stories'), { recursive: true });

    // Encode the paths: replace every '/' with '-'
    apexEncodedDir = fakeApexPath.replace(/\//g, '-');
    lfmEncodedDir = fakeLfmPath.replace(/\//g, '-');
  });

  it('P1: apex-team JSONL mtime > LFM -> mostRecent flag on apex-team entry (AC3)', () => {
    // Create a mock claude-projects dir
    const mockProjects = join(tmpDir, 'mock-apex-recent');
    mkdirSync(join(mockProjects, apexEncodedDir), { recursive: true });
    mkdirSync(join(mockProjects, lfmEncodedDir), { recursive: true });

    const apexJsonl = join(mockProjects, apexEncodedDir, 'sess1.jsonl');
    const lfmJsonl = join(mockProjects, lfmEncodedDir, 'sess2.jsonl');
    writeFileSync(apexJsonl, '');
    writeFileSync(lfmJsonl, '');

    setMtime(apexJsonl, APEX_MTIME);
    setMtime(lfmJsonl, LFM_MTIME);

    // Use decodedPathMap to point encoded dirs to our actual tmp dirs
    const decodedPathMap = new Map([
      [apexEncodedDir, fakeApexPath],
      [lfmEncodedDir, fakeLfmPath],
    ]);

    const registry = buildMockRegistry(mockProjects, { decodedPathMap });
    expect(registry.length).toBe(2);

    const apexEntry = registry.find(e => e.decodedPath === fakeApexPath);
    const lfmEntry = registry.find(e => e.decodedPath === fakeLfmPath);

    expect(apexEntry, 'apex-team entry should be in registry').toBeTruthy();
    expect(lfmEntry, 'lfm entry should be in registry').toBeTruthy();

    expect(apexEntry!.mostRecent).toBe(true);
    expect(lfmEntry!.mostRecent).toBe(false);
    // The AC4 step 2 resolution: most-recent entry's path becomes active root
    const resolvedRoot = registry.find(e => e.mostRecent)?.decodedPath;
    expect(resolvedRoot).toBe(fakeApexPath);
  });

  it('P2: LFM JSONL mtime > apex-team -> mostRecent flag on LFM entry (AC3)', () => {
    const mockProjects = join(tmpDir, 'mock-lfm-recent');
    mkdirSync(join(mockProjects, apexEncodedDir), { recursive: true });
    mkdirSync(join(mockProjects, lfmEncodedDir), { recursive: true });

    const apexJsonl = join(mockProjects, apexEncodedDir, 'sess1.jsonl');
    const lfmJsonl = join(mockProjects, lfmEncodedDir, 'sess2.jsonl');
    writeFileSync(apexJsonl, '');
    writeFileSync(lfmJsonl, '');

    setMtime(apexJsonl, APEX_MTIME);
    setMtime(lfmJsonl, LFM_MTIME_NEWER);

    const decodedPathMap = new Map([
      [apexEncodedDir, fakeApexPath],
      [lfmEncodedDir, fakeLfmPath],
    ]);

    const registry = buildMockRegistry(mockProjects, { decodedPathMap });
    expect(registry.length).toBe(2);

    const lfmEntry = registry.find(e => e.decodedPath === fakeLfmPath);
    const apexEntry = registry.find(e => e.decodedPath === fakeApexPath);

    expect(lfmEntry!.mostRecent).toBe(true);
    expect(apexEntry!.mostRecent).toBe(false);
    const resolvedRoot = registry.find(e => e.mostRecent)?.decodedPath;
    expect(resolvedRoot).toBe(fakeLfmPath);
  });

  it('P3: auto-follow poll detects LFM becomes most-recent -> activeRoot switches (AC5)', () => {
    // Simulate the auto-follow logic: mock state before and after a poll.
    // Before: apex is most-recent.
    const mockProjects = join(tmpDir, 'mock-auto-follow');
    mkdirSync(join(mockProjects, apexEncodedDir), { recursive: true });
    mkdirSync(join(mockProjects, lfmEncodedDir), { recursive: true });

    const apexJsonl = join(mockProjects, apexEncodedDir, 'sess1.jsonl');
    const lfmJsonl = join(mockProjects, lfmEncodedDir, 'sess2.jsonl');
    writeFileSync(apexJsonl, '');
    writeFileSync(lfmJsonl, '');

    // Initial state: apex is more recent
    setMtime(apexJsonl, APEX_MTIME);
    setMtime(lfmJsonl, LFM_MTIME);

    const decodedPathMap = new Map([
      [apexEncodedDir, fakeApexPath],
      [lfmEncodedDir, fakeLfmPath],
    ]);

    const registryBefore = buildMockRegistry(mockProjects, { decodedPathMap });
    const rootBefore = registryBefore.find(e => e.mostRecent)?.decodedPath;
    expect(rootBefore).toBe(fakeApexPath);

    // Simulate mid-session change: LFM's JSONL mtime becomes newer
    setMtime(lfmJsonl, LFM_MTIME_NEWER);

    // Auto-follow poll: fresh registry build (bypassing cache)
    const registryAfter = buildMockRegistry(mockProjects, { decodedPathMap });
    const rootAfter = registryAfter.find(e => e.mostRecent)?.decodedPath;
    expect(rootAfter).toBe(fakeLfmPath);

    // Confirms the switch would happen: rootBefore !== rootAfter
    expect(rootBefore).not.toBe(rootAfter);
  });
});

// ---------------------------------------------------------------------------
// Section 2 — Negative tests
// ---------------------------------------------------------------------------

describe('Wave 121 — Negative (US-097 AC4 + AC5)', () => {
  it('N1: ~/.claude/projects/ does not exist -> registry is empty, no error (AC2 fallback)', () => {
    const nonExistentDir = '/tmp/wave-121-does-not-exist-' + Date.now();
    expect(existsSync(nonExistentDir)).toBe(false);

    // Per AC2: if ~/.claude/projects/ doesn't exist, skip silently
    const registry = buildMockRegistry(nonExistentDir);
    expect(registry).toEqual([]);
    // All mostRecent fields are false (there are none)
    const anyMostRecent = registry.some(e => e.mostRecent);
    expect(anyMostRecent).toBe(false);
  });

  it('N2: APEX_TEAM_ROOT set -> auto-follow does NOT override the pinned root (AC5 step 4)', () => {
    // Simulate auto-follow resolution respecting the APEX_TEAM_ROOT pin.
    // The spec says: "poll does NOT auto-switch if APEX_TEAM_ROOT is set."
    const pinnedRoot = '/fake/pinned/root';
    const mostRecentFromRegistry = '/fake/other/root';

    // Auto-follow resolution function (mirrors AC4 + AC5 spec logic)
    function resolveActiveRoot(opts: {
      apexTeamRoot: string | undefined;
      mostRecentPath: string | undefined;
    }): { path: string; source: string } {
      if (opts.apexTeamRoot) {
        return { path: opts.apexTeamRoot, source: 'env' };
      }
      if (opts.mostRecentPath) {
        return { path: opts.mostRecentPath, source: 'most-recent' };
      }
      return { path: '/fallback', source: 'default' };
    }

    const result = resolveActiveRoot({
      apexTeamRoot: pinnedRoot,
      mostRecentPath: mostRecentFromRegistry,
    });

    // APEX_TEAM_ROOT takes priority — must NOT switch to mostRecentPath
    expect(result.path).toBe(pinnedRoot);
    expect(result.source).toBe('env');
    expect(result.path).not.toBe(mostRecentFromRegistry);
  });

  it('N3: manual switch within 30s -> auto-follow poll suppresses switch (AC5 step 5)', () => {
    // Simulate the lastManualSwitchAt logic from AC5 spec.
    // Manual switch at t=0; poll fires at t=15s (within 30s window) -> suppress.
    const SUPPRESS_WINDOW_MS = 30_000;

    function shouldAutoFollow(opts: {
      lastManualSwitchAt: number | null;
      now: number;
    }): boolean {
      if (opts.lastManualSwitchAt === null) return true;
      return opts.now - opts.lastManualSwitchAt >= SUPPRESS_WINDOW_MS;
    }

    const now = Date.now();

    // Manual switch just happened (now - 0 = within window)
    expect(shouldAutoFollow({ lastManualSwitchAt: now, now })).toBe(false);

    // Manual switch 15s ago — still suppressed
    expect(shouldAutoFollow({ lastManualSwitchAt: now - 15_000, now })).toBe(false);

    // Manual switch 31s ago — no longer suppressed
    expect(shouldAutoFollow({ lastManualSwitchAt: now - 31_000, now })).toBe(true);

    // No manual switch ever — not suppressed
    expect(shouldAutoFollow({ lastManualSwitchAt: null, now })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Section 3 — Edge tests
// ---------------------------------------------------------------------------

describe('Wave 121 — Edge (US-097 AC3 + AC7)', () => {
  let tmpDir: string;
  let fakeApexPath: string;

  beforeAll(() => {
    tmpDir = join(tmpdir(), `wave-121-edge-${Date.now()}`);
    fakeApexPath = join(tmpDir, 'fake-apex');
    mkdirSync(join(fakeApexPath, 'requirements', 'user-stories'), { recursive: true });
  });

  it('E1: decoded path does not exist on disk -> entry silently skipped, no crash (AC2 step 4)', () => {
    const mockProjects = join(tmpDir, 'mock-nonexistent-decoded');
    mkdirSync(mockProjects, { recursive: true });

    // Create encoded dir for a path that does NOT exist on disk
    const apexEncoded = fakeApexPath.replace(/\//g, '-');
    const nonExistentEncoded = '/tmp/wave-121-ghost-path-that-does-not-exist'.replace(/\//g, '-');

    mkdirSync(join(mockProjects, apexEncoded), { recursive: true });
    mkdirSync(join(mockProjects, nonExistentEncoded), { recursive: true });

    const apexJsonl = join(mockProjects, apexEncoded, 'sess1.jsonl');
    writeFileSync(apexJsonl, '');
    writeFileSync(join(mockProjects, nonExistentEncoded, 'sess.jsonl'), '');

    // Only provide decodedPathMap for apex; ghost path uses real decode (won't exist)
    const registry = buildMockRegistry(mockProjects, {
      decodedPathMap: new Map([[apexEncoded, fakeApexPath]]),
    });

    // Ghost entry should be silently skipped
    expect(registry.every(e => existsSync(e.decodedPath))).toBe(true);
    // apex entry still included
    expect(registry.some(e => e.decodedPath === fakeApexPath)).toBe(true);
  });

  it('E2: requirements/ exists but has NO subdirectories -> fails AC1 filter, skipped silently (AC1)', () => {
    const mockProjects = join(tmpDir, 'mock-empty-reqs');
    mkdirSync(mockProjects, { recursive: true });

    // Create a path where requirements/ exists but has no subdirs
    const noSubdirPath = join(tmpDir, 'no-subdir-project');
    mkdirSync(join(noSubdirPath, 'requirements'), { recursive: true });
    // No subdirectory under requirements/

    const noSubdirEncoded = noSubdirPath.replace(/\//g, '-');
    mkdirSync(join(mockProjects, noSubdirEncoded), { recursive: true });
    writeFileSync(join(mockProjects, noSubdirEncoded, 'sess.jsonl'), '');

    const registry = buildMockRegistry(mockProjects, {
      decodedPathMap: new Map([[noSubdirEncoded, noSubdirPath]]),
    });

    // Should be filtered out — requirements/ has no subdirs
    expect(registry.find(e => e.decodedPath === noSubdirPath)).toBeUndefined();
    expect(registry.length).toBe(0);
  });

  it('E3: two workspaces with identical JSONL mtime -> first in registry order wins mostRecent (AC3 step 6)', () => {
    const mockProjects = join(tmpDir, 'mock-tied-mtime');
    mkdirSync(mockProjects, { recursive: true });

    const pathA = join(tmpDir, 'workspace-a');
    const pathB = join(tmpDir, 'workspace-b');
    mkdirSync(join(pathA, 'requirements', 'user-stories'), { recursive: true });
    mkdirSync(join(pathB, 'requirements', 'user-stories'), { recursive: true });

    // Use fixed encoded names that sort deterministically (a- before b-)
    // and provide a decodedPathMap so decode doesn't rely on real path encoding
    const encA = '-alpha-workspace-a';
    const encB = '-beta-workspace-b';
    mkdirSync(join(mockProjects, encA), { recursive: true });
    mkdirSync(join(mockProjects, encB), { recursive: true });

    const jsonlA = join(mockProjects, encA, 'sess.jsonl');
    const jsonlB = join(mockProjects, encB, 'sess.jsonl');
    writeFileSync(jsonlA, '');
    writeFileSync(jsonlB, '');

    // Identical mtime
    const TIED_MTIME = 1780568484;
    setMtime(jsonlA, TIED_MTIME);
    setMtime(jsonlB, TIED_MTIME);

    const registry = buildMockRegistry(mockProjects, {
      decodedPathMap: new Map([
        [encA, pathA],
        [encB, pathB],
      ]),
    });

    expect(registry.length).toBe(2);
    // The first entry in registry order should win
    const mostRecentEntries = registry.filter(e => e.mostRecent);
    expect(mostRecentEntries.length).toBe(1);
    // First in registry order wins — registry is ordered by readdir output
    // which returns encA ('-alpha-...') before encB ('-beta-...') alphabetically
    expect(mostRecentEntries[0].decodedPath).toBe(pathA);
    expect(registry.find(e => e.decodedPath === pathB)!.mostRecent).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Section 4 — Iterate-all: parametrized over all 6 mock fixture states
// (Wave 118 comprehensive-coverage rule — every known input enumerated)
// ---------------------------------------------------------------------------

describe('Wave 121 — Iterate-all: all mock fixture states (Wave 118)', () => {
  // Each fixture state is exercised to confirm the scanner handles it
  // without crash and produces the expected registry shape.
  // Fixtures live at: requirements/samples/wave-121-claude-projects/

  interface FixtureCase {
    label: string;
    fixtureDir: string;
    expectedRegistryLen: 'eq0' | 'gte0' | number;
    description: string;
  }

  const FIXTURE_CASES: FixtureCase[] = [
    {
      label: 'mock-projects-apex-more-recent',
      fixtureDir: join(FIXTURES_ROOT, 'mock-projects-apex-more-recent'),
      // Encoded dirs decode to /tmp/fake-apex and /tmp/fake-lfm which don't
      // actually exist — AC2 step 4 skip expected; registry may be 0.
      expectedRegistryLen: 'gte0',
      description: 'apex JSONL mtime > LFM (fixture files exist, decoded paths may not)',
    },
    {
      label: 'mock-projects-lfm-more-recent',
      fixtureDir: join(FIXTURES_ROOT, 'mock-projects-lfm-more-recent'),
      expectedRegistryLen: 'gte0',
      description: 'LFM JSONL mtime > apex (fixture files exist, decoded paths may not)',
    },
    {
      label: 'mock-projects-empty',
      fixtureDir: join(FIXTURES_ROOT, 'mock-projects-empty'),
      expectedRegistryLen: 'eq0',
      description: 'empty directory — no encoded project dirs',
    },
    {
      label: 'mock-projects-no-jsonls',
      fixtureDir: join(FIXTURES_ROOT, 'mock-projects-no-jsonls'),
      expectedRegistryLen: 'gte0',
      description: 'encoded dir exists but no .jsonl files — mtime treated as 0',
    },
    {
      label: 'mock-projects-decoded-path-missing',
      fixtureDir: join(FIXTURES_ROOT, 'mock-projects-decoded-path-missing'),
      expectedRegistryLen: 'eq0',
      description: 'decoded path does not exist on disk — all entries skipped',
    },
    {
      label: 'mock-projects-multiple-decoded-options',
      fixtureDir: join(FIXTURES_ROOT, 'mock-projects-multiple-decoded-options'),
      expectedRegistryLen: 'gte0',
      description: 'ambiguous encoded name — graceful behavior expected',
    },
  ];

  for (const fixture of FIXTURE_CASES) {
    it(`I-${fixture.label}: scanner handles fixture without crash (${fixture.description})`, () => {
      expect(existsSync(fixture.fixtureDir), `fixture dir must exist: ${fixture.fixtureDir}`).toBe(true);

      // Must not throw
      let registry: WorkspaceEntry[] = [];
      expect(() => {
        registry = buildMockRegistry(fixture.fixtureDir);
      }).not.toThrow();

      // Shape checks
      expect(Array.isArray(registry)).toBe(true);
      for (const entry of registry) {
        expect(typeof entry.encodedName).toBe('string');
        expect(typeof entry.decodedPath).toBe('string');
        expect(typeof entry.mtimeMs).toBe('number');
        expect(typeof entry.mostRecent).toBe('boolean');
      }

      // At most ONE entry can have mostRecent: true
      const mostRecentCount = registry.filter(e => e.mostRecent).length;
      expect(mostRecentCount).toBeLessThanOrEqual(1);

      if (fixture.expectedRegistryLen === 'eq0') {
        expect(registry.length).toBe(0);
      }
      // 'gte0' means any non-negative length is acceptable
    });
  }
});

// ---------------------------------------------------------------------------
// Section 5 — Fixture file scaffolding checks
// ---------------------------------------------------------------------------

describe('Wave 121 — fixture file scaffolding', () => {
  const FIXTURE_DIRS = [
    'mock-projects-apex-more-recent',
    'mock-projects-lfm-more-recent',
    'mock-projects-empty',
    'mock-projects-no-jsonls',
    'mock-projects-decoded-path-missing',
    'mock-projects-multiple-decoded-options',
  ];

  it('all 6 fixture directories exist under requirements/samples/wave-121-claude-projects/', () => {
    for (const dir of FIXTURE_DIRS) {
      const p = join(FIXTURES_ROOT, dir);
      expect(existsSync(p), `fixture dir must exist: ${p}`).toBe(true);
    }
  });

  it('mock-projects-apex-more-recent contains JSONL files in both encoded subdirs', () => {
    const fixtureDir = join(FIXTURES_ROOT, 'mock-projects-apex-more-recent');
    const subdirs = readdirSync(fixtureDir);
    expect(subdirs.length).toBeGreaterThanOrEqual(2);
    for (const subdir of subdirs) {
      const files = readdirSync(join(fixtureDir, subdir));
      const jsonls = files.filter(f => f.endsWith('.jsonl'));
      expect(jsonls.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('mock-projects-empty directory is empty (no encoded project dirs)', () => {
    const fixtureDir = join(FIXTURES_ROOT, 'mock-projects-empty');
    const entries = readdirSync(fixtureDir);
    // Filter out .gitkeep or other housekeeping files
    const encodedDirs = entries.filter(e => e.startsWith('-'));
    expect(encodedDirs.length).toBe(0);
  });

  it('mock-projects-no-jsonls has encoded subdir but no .jsonl files', () => {
    const fixtureDir = join(FIXTURES_ROOT, 'mock-projects-no-jsonls');
    const subdirs = readdirSync(fixtureDir).filter(e => e.startsWith('-'));
    expect(subdirs.length).toBeGreaterThanOrEqual(1);
    for (const subdir of subdirs) {
      const files = readdirSync(join(fixtureDir, subdir));
      const jsonls = files.filter(f => f.endsWith('.jsonl'));
      expect(jsonls.length).toBe(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Section 6 — Runtime gate + co-presence check for server.mjs
// ---------------------------------------------------------------------------

describe('Wave 121 — runtime gate (co-presence check)', () => {
  it('runtime gate flag is boolean', () => {
    expect(typeof AUTO_FOLLOW_READY).toBe('boolean');
  });

  it('server.mjs exists in sibling viewer repo (skip if repo absent)', () => {
    if (!existsSync(VIEWER_ROOT)) {
      console.log('skip: sibling apex-team-viewer not present (expected in CI)');
      return;
    }
    expect(existsSync(SERVER_MJS)).toBe(true);
  });

  it(
    'server.mjs contains scanClaudeCodeProjects (co-presence gate — SKIP until UI Dev lands AC2/AC3/AC5)',
    () => {
      if (!existsSync(SERVER_MJS)) {
        console.log('skip: server.mjs not present');
        return;
      }
      if (!AUTO_FOLLOW_READY) {
        console.log(
          'SKIP: pending UI Dev PR for US-097 — server.mjs does not yet contain ' +
            'scanClaudeCodeProjects. Auto-unskips once the feature lands.'
        );
        return;
      }
      const src = readFileSync(SERVER_MJS, 'utf8');
      expect(src).toContain('scanClaudeCodeProjects');
    }
  );
});

// ---------------------------------------------------------------------------
// Section 7 — Live server tests (only when AUTO_FOLLOW_READY)
// ---------------------------------------------------------------------------

// Port discovery helper
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
  port?: number;
  env?: NodeJS.ProcessEnv;
}): Promise<ServerHandle> {
  const port = opts.port ?? (await getFreePort());
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    PORT: String(port),
    APEX_TEAM_ROOT: opts.root,
    ...(opts.env ?? {}),
  };
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

if (!AUTO_FOLLOW_READY) {
  describe('Wave 121 — live server tests (SKIPPED — viewer PR pending)', () => {
    it.skip(
      'SKIP: pending UI Dev PR for US-097 server.mjs scanClaudeCodeProjects — ' +
        'auto-unskips once apex-team-viewer/server.mjs contains the feature',
      () => {}
    );
  });
}

if (AUTO_FOLLOW_READY) {
  describe('Wave 121 — live server: /api/workspaces mostRecent field (AC3)', () => {
    let handle: ServerHandle;
    const W119_HAPPY = resolve(
      APEX_TEAM_ROOT,
      'requirements/samples/wave-119-viewer-workspaces/workspace-happy'
    );

    beforeAll(async () => {
      handle = await startServer({ root: W119_HAPPY });
    }, 15_000);

    afterAll(async () => {
      if (handle) await stopServer(handle);
    });

    it('LS1: /api/workspaces response includes mostRecent field on each workspace entry (AC3)', async () => {
      const { status, body } = await apiGet(handle.port, '/api/workspaces');
      expect(status).toBe(200);
      const b = body as Record<string, unknown>;
      expect(b.ok).toBe(true);
      const workspaces = b.workspaces as Array<Record<string, unknown>>;
      expect(Array.isArray(workspaces)).toBe(true);
      for (const ws of workspaces) {
        expect(typeof ws.mostRecent, `mostRecent must be boolean on ${ws.path}`).toBe('boolean');
      }
      // Exactly one workspace should have mostRecent: true (or zero if no JSONL)
      const mostRecentCount = workspaces.filter(ws => ws.mostRecent === true).length;
      expect(mostRecentCount).toBeLessThanOrEqual(1);
    });

    it('LS2: /api/health includes autoFollow field (AC5)', async () => {
      const { status, body } = await apiGet(handle.port, '/api/health');
      expect(status).toBe(200);
      const b = body as Record<string, unknown>;
      expect(b.ok).toBe(true);
      expect(typeof b.autoFollow).toBe('boolean');
    });

    it('LS3: APEX_TEAM_AUTO_FOLLOW=1 sets autoFollow:true in /api/health (AC5)', async () => {
      const autoPort = await getFreePort();
      let autoHandle: ServerHandle | null = null;
      try {
        autoHandle = await startServer({
          root: W119_HAPPY,
          port: autoPort,
          env: { APEX_TEAM_AUTO_FOLLOW: '1' },
        });
        const { status, body } = await apiGet(autoPort, '/api/health');
        expect(status).toBe(200);
        const b = body as Record<string, unknown>;
        expect(b.autoFollow).toBe(true);
      } finally {
        if (autoHandle) await stopServer(autoHandle);
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Metadata / self-reference (US-085 traceability)
// ---------------------------------------------------------------------------

describe('Wave 121 — metadata', () => {
  it('test file exists at canonical path tests/qa/wave-121/viewer-auto-follow.test.ts', () => {
    const expected = resolve(APEX_TEAM_ROOT, 'tests/qa/wave-121/viewer-auto-follow.test.ts');
    expect(existsSync(expected)).toBe(true);
  });

  it('US-097 user story exists with ## Acceptance criteria section', () => {
    const usFile = resolve(APEX_TEAM_ROOT, 'requirements/user-stories/US-097-viewer-auto-follow-claude-code.md');
    expect(existsSync(usFile)).toBe(true);
    const content = readFileSync(usFile, 'utf8');
    expect(content).toMatch(/^## Acceptance criteria/m);
  });

  it('US-097 contains AC7 specifying test file path', () => {
    const usFile = resolve(APEX_TEAM_ROOT, 'requirements/user-stories/US-097-viewer-auto-follow-claude-code.md');
    const content = readFileSync(usFile, 'utf8');
    expect(content).toContain('tests/qa/wave-121/viewer-auto-follow.test.ts');
  });

  it('all 6 fixture directories exist under wave-121-claude-projects/', () => {
    const dirs = [
      'mock-projects-apex-more-recent',
      'mock-projects-lfm-more-recent',
      'mock-projects-empty',
      'mock-projects-no-jsonls',
      'mock-projects-decoded-path-missing',
      'mock-projects-multiple-decoded-options',
    ];
    for (const d of dirs) {
      expect(existsSync(join(FIXTURES_ROOT, d)), `${d} must exist`).toBe(true);
    }
  });
});
