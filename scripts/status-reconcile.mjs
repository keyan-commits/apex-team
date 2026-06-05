#!/usr/bin/env node
/**
 * status-reconcile.mjs — Frontmatter status drift reconciliation
 *
 * Walks workspace artifacts (tests, requirements, architecture, design, ops,
 * frontend, backend) and bumps `status: in-flight` to `status: done` when the
 * file's parent PR has been merged into main.
 *
 * Two-phase flow:
 *   Phase 1 (--dry-run, default): scan + report to
 *     coordination/status-reconcile/proposal-<ISO>.md
 *     No role-owned files are written.
 *   Phase 2 (--apply): rewrite frontmatter status fields.
 *     Reads from most recent proposal or re-derives from disk.
 *
 * Idempotent: a second --apply on an already-reconciled workspace is a no-op.
 *
 * Usage:
 *   pnpm run status:reconcile [--dry-run] [--workspace=<path>] [--apply] [--bump-accepted]
 */

import { execSync } from 'child_process';
import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
  appendFileSync,
} from 'fs';
import { join, relative, resolve } from 'path';

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

const USAGE = `
status-reconcile: bump status: in-flight → done when parent PR is merged

Usage:
  pnpm run status:reconcile [--dry-run] [--workspace=<path>] [--apply] [--bump-accepted]

Flags:
  --dry-run         (default) Scan + report; write nothing to role-owned files.
                    Emits coordination/status-reconcile/proposal-<ISO>.md.
  --apply           Rewrite frontmatter status fields where drift is detected.
  --bump-accepted   Also bump status: accepted → done when parent PR merged.
                    Default off.
  --workspace=<p>   Operate on a different workspace root.
                    Default: git rev-parse --show-toplevel (CWD-relative).
  --help, -h        Print this message and exit 0.
`;

if (args.includes('--help') || args.includes('-h')) {
  console.log(USAGE);
  process.exit(0);
}

function getFlag(name) {
  const prefix = `--${name}=`;
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith(prefix)) return args[i].slice(prefix.length);
    if (args[i] === `--${name}` && i + 1 < args.length && !args[i + 1].startsWith('--')) {
      return args[i + 1];
    }
  }
  return null;
}

function hasFlag(name) {
  return args.includes(`--${name}`);
}

const flagApply = hasFlag('apply');
// --dry-run is the default; if neither is given, dry-run applies.
// Explicit --dry-run is accepted but doesn't change the default behaviour.
const flagBumpAccepted = hasFlag('bump-accepted');
const flagWorkspace = getFlag('workspace');

// ---------------------------------------------------------------------------
// Workspace resolution
// ---------------------------------------------------------------------------

let workspace;
if (flagWorkspace) {
  workspace = resolve(flagWorkspace);
  if (!existsSync(workspace)) {
    console.error(`status-reconcile: workspace path does not exist: ${workspace}`);
    process.exit(1);
  }
} else {
  try {
    workspace = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
  } catch {
    workspace = process.cwd();
  }
}

// ---------------------------------------------------------------------------
// Output directory
// ---------------------------------------------------------------------------

const outDir = join(workspace, 'coordination', 'status-reconcile');
mkdirSync(outDir, { recursive: true });
const auditLogPath = join(outDir, 'audit.log');

// ---------------------------------------------------------------------------
// ISO helpers
// ---------------------------------------------------------------------------

function isoNow() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function isoFileSafe(iso) {
  return iso.replace(/:/g, '-');
}

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

/**
 * Append one TSV row: ts, file, old_status, new_status, pr_number, merge_sha
 */
function audit(filePath, oldStatus, newStatus, prNumber, mergeSha) {
  const ts = isoNow();
  const relFile = relative(workspace, filePath);
  const row = [ts, relFile, oldStatus, newStatus, String(prNumber), mergeSha].join('\t');
  appendFileSync(auditLogPath, row + '\n');
}

// ---------------------------------------------------------------------------
// File extension filter
// ---------------------------------------------------------------------------

const CANDIDATE_EXTENSIONS = new Set([
  '.md',
  '.test.ts',
  '.test.tsx',
  '.spec.ts',
  '.spec.tsx',
]);

// Java suffixes handled separately (endsWith)
function isCandidateFile(name) {
  if (CANDIDATE_EXTENSIONS.has(`.${name.split('.').pop()}`)) return true;
  // .test.ts / .test.tsx are covered by the set; check multi-dot extensions
  if (name.endsWith('.test.ts') || name.endsWith('.test.tsx')) return true;
  if (name.endsWith('.spec.ts') || name.endsWith('.spec.tsx')) return true;
  if (name.endsWith('Test.java') || name.endsWith('Tests.java')) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Directories to scan
// ---------------------------------------------------------------------------

/**
 * Returns the list of absolute directory paths to scan.
 * Scans features/** subdirs + known top-level dirs per workspace.
 */
function getScanRoots() {
  return [
    join(workspace, 'tests', 'qa', 'features'),
    join(workspace, 'requirements', 'features'),
    join(workspace, 'requirements', 'user-stories'),
    join(workspace, 'architecture', 'features'),
    join(workspace, 'design', 'features'),
    join(workspace, 'frontend', 'features'),
    join(workspace, 'backend', 'features'),
    join(workspace, 'ops', 'features'),
  ];
}

/**
 * Directories that must NEVER be touched, regardless of status value.
 * Matches by prefix of the workspace-relative path.
 */
function isForbiddenPath(absPath) {
  const rel = relative(workspace, absPath);
  // requirements/samples/** — intentional fixture state
  if (rel.startsWith('requirements/samples') || rel.startsWith('requirements\\samples')) return true;
  // _archive/**
  if (rel.startsWith('_archive')) return true;
  // coordination/feat-backfill/**
  if (
    rel.startsWith('coordination/feat-backfill') ||
    rel.startsWith('coordination\\feat-backfill')
  ) return true;
  // coordination/status-reconcile/** — our own output dir
  if (
    rel.startsWith('coordination/status-reconcile') ||
    rel.startsWith('coordination\\status-reconcile')
  ) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Directory walker
// ---------------------------------------------------------------------------

function walkDir(dir, results = []) {
  if (!existsSync(dir)) return results;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (isForbiddenPath(full)) continue;
    if (entry.isDirectory()) {
      walkDir(full, results);
    } else if (entry.isFile() && isCandidateFile(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Frontmatter parsing (fail-soft)
// ---------------------------------------------------------------------------

/**
 * Parse YAML-style frontmatter from a file. Handles both `---` YAML blocks
 * and single-line `// key: value` comment headers (for .ts/.tsx/.java files).
 *
 * Returns:
 *   { status, hasFrontmatter, frontmatterType, parseError }
 *
 * frontmatterType: 'yaml' | 'line-comment' | null
 */
function parseStatus(content) {
  // YAML frontmatter: starts with ---
  if (content.trimStart().startsWith('---')) {
    const start = content.indexOf('---');
    const end = content.indexOf('\n---', start + 3);
    if (end === -1) {
      return { status: null, hasFrontmatter: true, frontmatterType: 'yaml', parseError: 'unclosed frontmatter' };
    }
    const raw = content.slice(start + 4, end);
    let status = null;
    for (const line of raw.split('\n')) {
      const m = line.match(/^status\s*:\s*(.+)$/);
      if (m) {
        status = m[1].trim().replace(/^["']|["']$/g, '');
        break;
      }
    }
    return { status, hasFrontmatter: true, frontmatterType: 'yaml', parseError: null };
  }

  // Block-comment frontmatter: /** ... */ or /* ... */ with key: value lines inside
  // e.g.:
  //   /**
  //    * ticket: TEST-0003
  //    * status: in-flight
  //    */
  const blockCommentMatch = content.match(/^\/\*\*?([\s\S]*?)\*\//);
  if (blockCommentMatch) {
    const blockContent = blockCommentMatch[1];
    let status = null;
    let hasAnyKey = false;
    for (const line of blockContent.split('\n')) {
      const m = line.match(/^\s*\*?\s*(\w[\w_-]*)\s*:\s*(.+)$/);
      if (m) {
        hasAnyKey = true;
        if (m[1] === 'status') {
          status = m[2].trim().replace(/^["']|["']$/g, '');
          break;
        }
      }
    }
    if (hasAnyKey) {
      return { status, hasFrontmatter: true, frontmatterType: 'block-comment', parseError: null };
    }
  }

  // Line-comment frontmatter: // key: value at the top of the file
  const lineCommentPattern = /^\/\/\s*(\w[\w_-]*)\s*:\s*(.+)$/;
  let status = null;
  let hasAnyLineComment = false;
  const lines = content.split('\n');
  // Only scan the first contiguous block of // comments + blank lines
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed === '*' || trimmed.startsWith('/*') || trimmed.startsWith('* ')) {
      // skip blank/jsdoc lines at the very top
      if (hasAnyLineComment) break; // past the header block
      continue;
    }
    const m = trimmed.match(lineCommentPattern);
    if (m) {
      hasAnyLineComment = true;
      if (m[1] === 'status') {
        status = m[2].trim().replace(/^["']|["']$/g, '');
        break;
      }
    } else {
      // Hit non-comment, non-blank line — end of header block
      break;
    }
  }

  if (hasAnyLineComment) {
    return { status, hasFrontmatter: true, frontmatterType: 'line-comment', parseError: null };
  }

  return { status: null, hasFrontmatter: false, frontmatterType: null, parseError: null };
}

// ---------------------------------------------------------------------------
// Frontmatter rewrite
// ---------------------------------------------------------------------------

/**
 * Rewrite the status field in-place. Preserves all other frontmatter keys +
 * ordering. Returns { action, detail }.
 *
 * action: 'bumped' | 'noop' | 'error'
 */
function rewriteStatus(filePath, newStatus) {
  let content;
  try {
    content = readFileSync(filePath, 'utf8');
  } catch (e) {
    return { action: 'error', detail: `read error: ${e.message}` };
  }

  const { status: currentStatus, hasFrontmatter, frontmatterType, parseError } = parseStatus(content);

  if (parseError) {
    return { action: 'error', detail: `parse error: ${parseError}` };
  }

  if (!hasFrontmatter || currentStatus === null) {
    return { action: 'noop', detail: 'no status field found' };
  }

  if (currentStatus === newStatus) {
    return { action: 'noop', detail: `already ${newStatus}` };
  }

  let updated;

  if (frontmatterType === 'yaml') {
    // Replace within the --- block
    // Replace the status line preserving any surrounding whitespace
    updated = content.replace(/^(\s*status\s*:\s*)(.+)$/m, `$1${newStatus}`);
    if (updated === content) {
      return { action: 'error', detail: 'failed to locate status line for replacement' };
    }
  } else if (frontmatterType === 'line-comment') {
    // Replace the // status: <value> line
    updated = content.replace(/^(\/\/\s*status\s*:\s*)(.+)$/m, `$1${newStatus}`);
    if (updated === content) {
      return { action: 'error', detail: 'failed to locate status line for replacement' };
    }
  } else if (frontmatterType === 'block-comment') {
    // Replace inside the leading /** ... */ block: `* status: <value>`
    // Match lines like " * status: in-flight" inside the first block comment
    updated = content.replace(
      /^(\/\*\*?[\s\S]*?)(^\s*\*\s*status\s*:\s*)(.+?)(\s*$)/m,
      (match, before, prefix, _val, after) => `${before}${prefix}${newStatus}${after}`
    );
    if (updated === content) {
      return { action: 'error', detail: 'failed to locate status line in block comment for replacement' };
    }
  } else {
    return { action: 'error', detail: `unknown frontmatter type: ${frontmatterType}` };
  }

  try {
    writeFileSync(filePath, updated, 'utf8');
  } catch (e) {
    return { action: 'error', detail: `write error: ${e.message}` };
  }

  return { action: 'bumped', detail: `${currentStatus} → ${newStatus}` };
}

// ---------------------------------------------------------------------------
// PR lookup via git log
// ---------------------------------------------------------------------------

/**
 * Find the PR number that introduced the file by walking merge commits
 * in the ancestry chain from the file's first commit to HEAD.
 *
 * Returns { prNumber, mergeSha } or null if not found.
 */
function findParentPR(filePath) {
  try {
    // Get the first (oldest) commit that introduced the file
    const logOutput = execSync(
      `git log --follow --format="%H" -- "${filePath}"`,
      { encoding: 'utf8', cwd: workspace }
    ).trim();

    if (!logOutput) return null;

    const commits = logOutput.split('\n').filter(Boolean);
    if (commits.length === 0) return null;

    const oldestCommit = commits[commits.length - 1];

    // Find the first merge commit in the ancestry path from that commit to HEAD
    // that matches the "Merge pull request #NNN" pattern
    const mergeLog = execSync(
      `git log --format="%H %s" --merges --ancestry-path "${oldestCommit}..HEAD"`,
      { encoding: 'utf8', cwd: workspace }
    ).trim();

    if (!mergeLog) return null;

    const lines = mergeLog.split('\n').filter(Boolean);
    // Take the LAST (oldest) merge commit in the path — that's the one that merged the file
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      const m = line.match(/^([0-9a-f]{40})\s+Merge pull request #(\d+)/);
      if (m) {
        return { mergeSha: m[1], prNumber: parseInt(m[2], 10) };
      }
    }

    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// PR state query
// ---------------------------------------------------------------------------

/**
 * Query gh to check if a PR is merged.
 * Returns { merged: boolean, mergedAt: string|null } or null on error.
 */
function getPRState(prNumber) {
  try {
    const out = execSync(
      `gh pr view ${prNumber} --json state,mergedAt`,
      { encoding: 'utf8', cwd: workspace }
    ).trim();
    const data = JSON.parse(out);
    return {
      merged: data.state === 'MERGED',
      mergedAt: data.mergedAt || null,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Candidate collection
// ---------------------------------------------------------------------------

/**
 * Determines whether a given status value is actionable for this run.
 */
function isActionableStatus(status) {
  if (status === 'in-flight') return true;
  if (flagBumpAccepted && status === 'accepted') return true;
  return false;
}

/**
 * Scan all candidate files and collect reconciliation candidates.
 * Returns array of { filePath, currentStatus, prNumber, mergeSha, prMerged }
 */
function collectCandidates() {
  const roots = getScanRoots();
  const candidates = [];
  const warnings = [];

  for (const root of roots) {
    const files = walkDir(root);
    for (const filePath of files) {
      let content;
      try {
        content = readFileSync(filePath, 'utf8');
      } catch (e) {
        warnings.push({ filePath, issue: `read error: ${e.message}` });
        continue;
      }

      const { status, hasFrontmatter, parseError } = parseStatus(content);

      if (parseError) {
        warnings.push({ filePath, issue: `frontmatter parse error: ${parseError}` });
        continue;
      }

      if (!hasFrontmatter || !isActionableStatus(status)) {
        continue;
      }

      // Find the parent PR
      const prRef = findParentPR(filePath);
      if (!prRef) {
        warnings.push({ filePath, issue: `could not determine parent PR for status: ${status}` });
        continue;
      }

      // Query PR state
      const prState = getPRState(prRef.prNumber);
      if (!prState) {
        warnings.push({ filePath, issue: `gh pr view ${prRef.prNumber} failed` });
        continue;
      }

      candidates.push({
        filePath,
        currentStatus: status,
        prNumber: prRef.prNumber,
        mergeSha: prRef.mergeSha,
        prMerged: prState.merged,
        mergedAt: prState.mergedAt,
      });
    }
  }

  return { candidates, warnings };
}

// ---------------------------------------------------------------------------
// Dry-run: emit proposal
// ---------------------------------------------------------------------------

function runDryRun() {
  const ts = isoNow();
  const tsFile = isoFileSafe(ts);

  console.log('\nstatus-reconcile dry-run starting...\n');
  console.log(`Workspace: ${workspace}`);
  console.log(`Mode:      dry-run (default)\n`);

  const { candidates, warnings } = collectCandidates();

  const willBump = candidates.filter(c => c.prMerged);
  const willLeave = candidates.filter(c => !c.prMerged);

  // Build proposal markdown
  const lines = [
    `# Status Reconcile Proposal — ${ts}`,
    '',
    '## Summary',
    `- Workspace: ${workspace}`,
    `- Mode: dry-run`,
    `- Candidates with actionable status: ${candidates.length}`,
    `- Will bump to done (PR merged): ${willBump.length}`,
    `- Will leave unchanged (PR not merged): ${willLeave.length}`,
    `- Warnings: ${warnings.length}`,
    '',
  ];

  if (willBump.length > 0) {
    lines.push('## Will bump to `done`');
    lines.push('');
    for (const c of willBump) {
      const rel = relative(workspace, c.filePath);
      lines.push(`- \`${rel}\``);
      lines.push(`  - current status: \`${c.currentStatus}\``);
      lines.push(`  - parent PR: #${c.prNumber} (merged ${c.mergedAt || 'unknown'})`);
      lines.push(`  - merge SHA: \`${c.mergeSha}\``);
      lines.push('');
    }
  }

  if (willLeave.length > 0) {
    lines.push('## Will leave unchanged (PR not merged)');
    lines.push('');
    for (const c of willLeave) {
      const rel = relative(workspace, c.filePath);
      lines.push(`- \`${rel}\` — status: \`${c.currentStatus}\`, PR #${c.prNumber} not yet merged`);
    }
    lines.push('');
  }

  if (warnings.length > 0) {
    lines.push('## Warnings');
    lines.push('');
    for (const w of warnings) {
      const rel = relative(workspace, w.filePath);
      lines.push(`- \`${rel}\`: ${w.issue}`);
    }
    lines.push('');
  }

  lines.push('## Next steps');
  lines.push('');
  lines.push('Run with `--apply` to write changes:');
  lines.push('```');
  lines.push('pnpm run status:reconcile --apply');
  lines.push('```');
  lines.push('');

  const proposalPath = join(outDir, `proposal-${tsFile}.md`);
  writeFileSync(proposalPath, lines.join('\n'), 'utf8');

  // Audit log: dry-run entries
  for (const c of willBump) {
    audit(c.filePath, c.currentStatus, 'done', c.prNumber, c.mergeSha);
  }
  for (const c of willLeave) {
    audit(c.filePath, c.currentStatus, c.currentStatus, c.prNumber, c.mergeSha);
  }

  console.log(`Candidates found: ${candidates.length}`);
  console.log(`  Will bump:   ${willBump.length}`);
  console.log(`  Leave alone: ${willLeave.length}`);
  console.log(`  Warnings:    ${warnings.length}`);
  console.log('');

  if (willBump.length > 0) {
    console.log('Files that would be bumped:');
    for (const c of willBump) {
      console.log(`  ${relative(workspace, c.filePath)} (PR #${c.prNumber})`);
    }
    console.log('');
  }

  if (warnings.length > 0) {
    console.log('Warnings:');
    for (const w of warnings) {
      console.log(`  [WARN] ${relative(workspace, w.filePath)}: ${w.issue}`);
    }
    console.log('');
  }

  console.log(`Proposal written to: ${proposalPath}`);
  console.log(`Audit log appended:  ${auditLogPath}`);
  console.log('');
  console.log('To apply: pnpm run status:reconcile --apply');
  console.log('');

  return { willBump, willLeave, warnings, proposalPath };
}

// ---------------------------------------------------------------------------
// Apply
// ---------------------------------------------------------------------------

function runApply() {
  const ts = isoNow();
  const tsFile = isoFileSafe(ts);

  console.log('\nstatus-reconcile --apply starting...\n');
  console.log(`Workspace: ${workspace}`);
  console.log('');

  const { candidates, warnings } = collectCandidates();

  let bumpedCount = 0;
  let noopCount = 0;
  let errorCount = 0;

  const reportLines = [
    `# Status Reconcile Apply Report — ${ts}`,
    '',
    `## Summary`,
    `- Workspace: ${workspace}`,
    `- Mode: apply`,
    '',
    '## Actions',
    '',
  ];

  for (const c of candidates) {
    if (!c.prMerged) {
      // PR not merged — leave alone
      audit(c.filePath, c.currentStatus, c.currentStatus, c.prNumber, c.mergeSha);
      noopCount++;
      continue;
    }

    const { action, detail } = rewriteStatus(c.filePath, 'done');
    audit(c.filePath, c.currentStatus, action === 'bumped' ? 'done' : c.currentStatus, c.prNumber, c.mergeSha);

    const rel = relative(workspace, c.filePath);
    if (action === 'bumped') {
      bumpedCount++;
      console.log(`  BUMPED: ${rel} — ${detail} (PR #${c.prNumber})`);
      reportLines.push(`- BUMPED \`${rel}\`: ${detail} — PR #${c.prNumber} merged ${c.mergedAt || 'unknown'}`);
    } else if (action === 'noop') {
      noopCount++;
      reportLines.push(`- NOOP \`${rel}\`: ${detail}`);
    } else {
      errorCount++;
      console.warn(`  ERROR: ${rel} — ${detail}`);
      reportLines.push(`- ERROR \`${rel}\`: ${detail}`);
    }
  }

  if (warnings.length > 0) {
    reportLines.push('');
    reportLines.push('## Warnings');
    reportLines.push('');
    for (const w of warnings) {
      const rel = relative(workspace, w.filePath);
      reportLines.push(`- \`${rel}\`: ${w.issue}`);
      console.warn(`  [WARN] ${rel}: ${w.issue}`);
    }
  }

  reportLines.push('');
  reportLines.push('## Counts');
  reportLines.push('');
  reportLines.push(`- Bumped: ${bumpedCount}`);
  reportLines.push(`- No-op: ${noopCount}`);
  reportLines.push(`- Errors: ${errorCount}`);
  reportLines.push(`- Warnings: ${warnings.length}`);

  const reportPath = join(outDir, `apply-${tsFile}.md`);
  writeFileSync(reportPath, reportLines.join('\n'), 'utf8');

  console.log('');
  console.log(`Apply complete: ${bumpedCount} bumped, ${noopCount} no-op, ${errorCount} errors, ${warnings.length} warnings`);
  console.log(`Report written: ${reportPath}`);
  console.log(`Audit log:      ${auditLogPath}`);
  console.log('');

  return { bumpedCount, noopCount, errorCount };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

if (flagApply) {
  runApply();
} else {
  runDryRun();
}
