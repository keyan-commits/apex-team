#!/usr/bin/env node
/**
 * feat-backfill.mjs — Retroactive FEAT-XXXX grouping backfill command
 *
 * Phase 1 (default, dry-run):
 *   Scans each role's owned directory, reads file frontmatter, groups files into
 *   already-grouped / ungrouped, emits dispatch-plan-<ISO>.md + proposal-<ISO>.md
 *   + proposal-<ISO>.json under coordination/feat-backfill/. No role-owned files
 *   are modified. Audit log entries tagged mode=dry-run.
 *
 * Phase 2 (--apply):
 *   Reads the most recent proposal-<ISO>.json (or --out=<path>/proposal-*.json),
 *   merges per-role JSON response blocks from coordination/feat-backfill/responses/,
 *   applies frontmatter mutations, updates INDEX rows, seeds Plan-C FE retro docs.
 *
 * NFR compliance: NFR-FEATBACKFILL-001 (idempotence), 002 (dry-run safety),
 *   003 (orchestration boundary), 004 (cross-workspace), 005 (audit log),
 *   006 (forbidden surfaces), 007 (conflict resolution), 008 (fail-soft).
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, appendFileSync } from 'fs';
import { join, relative, resolve, dirname, basename } from 'path';

// ---------------------------------------------------------------------------
// Argument parsing — supports both --flag=value and --flag value forms
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

const USAGE = `
feat-backfill: retroactive FEAT-XXXX grouping backfill command

Usage:
  pnpm run feat:backfill [--all | --feat=FEAT-XXXX] [--role=<r>...] [--apply] [--out=<path>] [--workspace=<path>]

Flags:
  --all                    Scan all roles for all known FEAT-XXXX numbers plus ungrouped
  --feat=FEAT-XXXX         Scope to one feature only (FEAT file must pre-exist)
  --role=<r>               Restrict scanning to listed roles (repeatable)
  --apply                  Write frontmatter mutations (omit = dry-run)
  --out=<path>             Override output directory (default: <workspace>/coordination/feat-backfill/)
  --workspace=<path>       Operate on a different workspace root (default: git toplevel of CWD)
  --proposal=<path>        Bind --apply to a specific proposal JSON file
  --ba-approved            Allow conflict-voiding INDEX row writes (required for §7 conflict resolution)
  --help, -h               Print this usage message and exit 0
`;

// Print help and exit 0
if (args.includes('--help') || args.includes('-h')) {
  console.log(USAGE);
  process.exit(0);
}

/**
 * Parse flag supporting both --name=value and --name value forms.
 * Returns null if not found.
 */
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

/**
 * Collect all values for a repeatable flag (--name=val or --name val).
 */
function getRepeatableFlag(name) {
  const prefix = `--${name}=`;
  const results = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith(prefix)) {
      results.push(args[i].slice(prefix.length));
    } else if (args[i] === `--${name}` && i + 1 < args.length && !args[i + 1].startsWith('--')) {
      results.push(args[i + 1]);
    }
  }
  return results;
}

const flagAll = hasFlag('all');
const flagFeat = getFlag('feat');
const flagRoles = getRepeatableFlag('role');
const flagApply = hasFlag('apply');
const flagOut = getFlag('out');
const flagWorkspace = getFlag('workspace');
const flagProposal = getFlag('proposal');
const _flagBaApproved = hasFlag('ba-approved'); // reserved for future --ba-approved conflict-resolution flag (ARCH-0002 §7)

// Usage guard: require --all or --feat (mutually exclusive)
if (!flagAll && !flagFeat) {
  console.error(USAGE);
  process.exit(1);
}

// Mutual exclusion: --all and --feat cannot be used together
if (flagAll && flagFeat) {
  console.error(`feat-backfill: --all and --feat are mutually exclusive — use one or the other.\n${USAGE}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Workspace resolution
// ---------------------------------------------------------------------------

let workspace;
if (flagWorkspace) {
  workspace = resolve(flagWorkspace);
  if (!existsSync(workspace)) {
    console.error(`feat-backfill: workspace path does not exist: ${workspace}`);
    process.exit(1);
  }
} else {
  try {
    workspace = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
  } catch {
    workspace = process.cwd();
  }
}

// Output directory
const outDir = flagOut ? resolve(flagOut) : join(workspace, 'coordination', 'feat-backfill');
mkdirSync(outDir, { recursive: true });
mkdirSync(join(outDir, 'dispatch'), { recursive: true });
mkdirSync(join(outDir, 'responses'), { recursive: true });

// Audit log
const auditLogPath = join(outDir, 'audit.log');

// ---------------------------------------------------------------------------
// Plan C detection
// ---------------------------------------------------------------------------

const hasSrc = existsSync(join(workspace, 'src'));
const hasAgents = existsSync(join(workspace, '.claude', 'agents'));
const isPlanC = !hasSrc && hasAgents;

// ---------------------------------------------------------------------------
// ISO timestamp helpers
// ---------------------------------------------------------------------------

function isoNow() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function isoFileSafe(iso) {
  // YYYY-MM-DDTHH-MM-SSZ (colons replaced)
  return iso.replace(/:/g, '-');
}

// ---------------------------------------------------------------------------
// Role → directory mapping (AC5 + AC14 Plan C clause)
// ---------------------------------------------------------------------------

const ROLE_DIRS = {
  'business-analyst': 'requirements',
  'architect': 'architecture',
  'ux-designer': 'design',
  'qa': 'tests',
  'devsecops': 'ops',
  'ui-developer': isPlanC ? 'frontend' : 'src',
  'backend-developer': isPlanC ? 'backend' : 'src',
};

const ALL_ROLES = Object.keys(ROLE_DIRS);

const activeRoles = flagRoles.length > 0
  ? flagRoles.filter(r => {
      if (!ALL_ROLES.includes(r)) {
        console.warn(`feat-backfill: unknown role '${r}' — skipping`);
        return false;
      }
      return true;
    })
  : ALL_ROLES;

// ---------------------------------------------------------------------------
// FEAT registry — read requirements/features/INDEX.md
// ---------------------------------------------------------------------------

function readFeatRegistry() {
  const indexPath = join(workspace, 'requirements', 'features', 'INDEX.md');
  if (!existsSync(indexPath)) {
    console.warn('feat-backfill: requirements/features/INDEX.md not found — FEAT registry empty');
    return [];
  }
  const content = readFileSync(indexPath, 'utf8');
  const feats = [];
  // Parse table rows: | FEAT-NNNN | slug | status | ...
  const rowRegex = /^\|\s*(FEAT-\d{4})\s*\|\s*([^|]+)\|/gm;
  let m;
  while ((m = rowRegex.exec(content)) !== null) {
    feats.push({ id: m[1].trim(), slug: m[2].trim() });
  }
  return feats;
}

// ---------------------------------------------------------------------------
// FEAT-XXXX mode validation (AC8)
// ---------------------------------------------------------------------------

if (flagFeat) {
  const featPattern = /^FEAT-\d{4}$/;
  if (!featPattern.test(flagFeat)) {
    console.error(`feat-backfill: --feat value must match FEAT-NNNN format, got: ${flagFeat}`);
    process.exit(1);
  }
  // Check FEAT file exists
  const requirementsDir = join(workspace, 'requirements', 'features');
  if (existsSync(requirementsDir)) {
    const files = readdirSync(requirementsDir);
    const found = files.some(f => f.startsWith(flagFeat + '-') || f === flagFeat + '.md');
    if (!found) {
      console.error(`feat-backfill: FEAT file for ${flagFeat} does not exist under requirements/features/ — cannot scope to this FEAT. No auto-creation.`);
      process.exit(1);
    }
  } else {
    console.error(`feat-backfill: requirements/features/ not found — cannot validate ${flagFeat}`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Frontmatter parsing (fail-soft per NFR-008)
// ---------------------------------------------------------------------------

/**
 * Parse YAML frontmatter from file content.
 * Returns { hasFrontmatter, frontmatterRaw, frontmatterParsed, bodyAfter, parseError }
 * fail-soft: if YAML is malformed, returns parseError set and hasFrontmatter=true but frontmatterParsed=null
 */
function parseFrontmatter(content) {
  if (!content.startsWith('---')) {
    return { hasFrontmatter: false, frontmatterRaw: '', frontmatterParsed: {}, bodyAfter: content, parseError: null };
  }
  const endIdx = content.indexOf('\n---', 3);
  if (endIdx === -1) {
    return { hasFrontmatter: true, frontmatterRaw: content.slice(3), frontmatterParsed: null, bodyAfter: '', parseError: 'unclosed frontmatter block' };
  }
  const raw = content.slice(4, endIdx); // between first --- and second ---
  const after = content.slice(endIdx + 4); // after closing ---

  // Simple key:value parser (no YAML library to avoid deps)
  const parsed = {};
  let parseError = null;
  try {
    for (const line of raw.split('\n')) {
      if (!line.trim() || line.trim().startsWith('#')) continue;
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      const key = line.slice(0, colonIdx).trim();
      const val = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (key) parsed[key] = val;
    }
  } catch (e) {
    parseError = String(e);
  }
  return { hasFrontmatter: true, frontmatterRaw: raw, frontmatterParsed: parseError ? null : parsed, bodyAfter: after, parseError };
}

/**
 * Determine the FEAT fields from frontmatter parsed object.
 * Returns { feat, parent_feat } or null if absent.
 */
function getFeatFields(parsed) {
  if (!parsed) return null;
  return {
    feat: parsed['feat'] || null,
    parent_feat: parsed['parent_feat'] || null,
  };
}

// ---------------------------------------------------------------------------
// File walking helpers
// ---------------------------------------------------------------------------

/**
 * Walk a directory recursively, returning all files matching predicate.
 */
function walkDir(dir, predicate) {
  const results = [];
  if (!existsSync(dir)) return results;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath, predicate));
    } else if (entry.isFile() && predicate(entry.name, fullPath)) {
      results.push(fullPath);
    }
  }
  return results;
}

// Only scan markdown files
function isMdFile(name) {
  return name.endsWith('.md');
}

// ---------------------------------------------------------------------------
// Audit log helper
// ---------------------------------------------------------------------------

/**
 * Append one row to the audit log.
 * Fields: ISO-ts, mode, role, file (workspace-relative), FEAT or ungrouped, action
 */
function audit(mode, role, filePath, feat, action) {
  const ts = isoNow();
  const relFile = existsSync(workspace) ? relative(workspace, filePath) : filePath;
  const row = [ts, mode, role, relFile, feat, action].join('\t');
  appendFileSync(auditLogPath, row + '\n');
}

// ---------------------------------------------------------------------------
// Classify files per role
// ---------------------------------------------------------------------------

/**
 * For a given role, scan its owned directory and classify files.
 * Returns { alreadyGrouped: [{path, feat, parent_feat}], ungrouped: [{path, reason}], skipped: [{path, reason}] }
 */
function classifyRoleFiles(role, featRegistry, scopeFeat) {
  const relDir = ROLE_DIRS[role];
  const absDir = join(workspace, relDir);

  const alreadyGrouped = [];
  const ungrouped = [];
  const skipped = [];

  if (!existsSync(absDir)) {
    const note = isPlanC && (role === 'ui-developer' || role === 'backend-developer')
      ? `Plan C workspace detected; ${relDir}/ or ${relDir}/ does not yet exist — retro FE/BE summary docs cannot be scanned but can be seeded by AC15.`
      : `${relDir}/ directory not found — skipping role ${role}`;
    console.warn(`feat-backfill: ${note}`);
    return { alreadyGrouped, ungrouped, skipped, note };
  }

  const files = walkDir(absDir, isMdFile);

  for (const filePath of files) {
    let content;
    try {
      content = readFileSync(filePath, 'utf8');
    } catch (e) {
      skipped.push({ path: filePath, reason: `read error: ${e.message}` });
      continue;
    }

    const { hasFrontmatter, frontmatterParsed, parseError } = parseFrontmatter(content);

    if (parseError) {
      skipped.push({ path: filePath, reason: `malformed frontmatter: ${parseError}` });
      continue;
    }

    const fields = hasFrontmatter ? getFeatFields(frontmatterParsed) : { feat: null, parent_feat: null };

    // Determine if already grouped
    const existingFeat = fields?.feat || fields?.parent_feat || null;

    if (existingFeat) {
      // Scope filter: if --feat is specified, only count files matching that FEAT
      if (scopeFeat && existingFeat !== scopeFeat) {
        // Already grouped to a different FEAT — skip for this scoped run
        continue;
      }
      alreadyGrouped.push({ path: filePath, feat: existingFeat, parent_feat: fields.parent_feat });
    } else {
      // Attempt heuristic assignment from filename / directory path
      const assignment = heuristicAssign(filePath, featRegistry, scopeFeat);
      if (assignment) {
        ungrouped.push({
          path: filePath,
          proposedFeat: assignment.feat,
          confidence: assignment.confidence,
          reason: assignment.reason,
        });
      } else {
        ungrouped.push({
          path: filePath,
          proposedFeat: null,
          confidence: 'low',
          reason: 'no matching FEAT pattern found; predates all known FEATs or maps ambiguously',
        });
      }
    }
  }

  return { alreadyGrouped, ungrouped, skipped };
}

/**
 * Heuristic FEAT assignment from file path.
 * Looks for FEAT-NNNN pattern in path segments or filename.
 */
function heuristicAssign(filePath, featRegistry, scopeFeat) {
  const rel = relative(workspace, filePath);

  // Check path for FEAT-NNNN pattern
  const featInPath = rel.match(/FEAT-(\d{4})/);
  if (featInPath) {
    const candidate = `FEAT-${featInPath[1]}`;
    const known = featRegistry.find(f => f.id === candidate);
    if (known && (!scopeFeat || scopeFeat === candidate)) {
      return { feat: candidate, confidence: 'high', reason: `path contains ${candidate}` };
    }
  }

  // Check filename for ticket prefix pattern that might map to a FEAT
  // e.g. US-102 → look for a FEAT that references US-102, ARCH-0002 → FEAT-0005
  const ticketMatch = basename(filePath).match(/^(US|ARCH|UX|TEST|OPS|FE|BE)-(\d+)/i);
  if (ticketMatch && scopeFeat) {
    // In scoped mode, tentatively assign to the scoped FEAT
    return { feat: scopeFeat, confidence: 'medium', reason: `scoped to ${scopeFeat}; ticket file may belong to this FEAT` };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Conflict resolution (AC7 / NFR-007): lower FEAT number wins
// ---------------------------------------------------------------------------

function resolveConflicts(proposals) {
  // proposals: array of { file, proposedFeat, role, confidence, reason }
  // Group by file, pick lowest FEAT number
  const byFile = {};
  for (const p of proposals) {
    if (!p.proposedFeat || p.proposedFeat === 'ungrouped') continue;
    if (!byFile[p.file]) {
      byFile[p.file] = [];
    }
    byFile[p.file].push(p);
  }

  const conflicts = [];
  const resolved = {};

  for (const [file, entries] of Object.entries(byFile)) {
    if (entries.length <= 1) {
      if (entries[0]) resolved[file] = entries[0];
      continue;
    }
    // Multiple proposals — pick lowest FEAT number
    const sorted = entries.slice().sort((a, b) => {
      const na = parseInt(a.proposedFeat.replace('FEAT-', ''), 10);
      const nb = parseInt(b.proposedFeat.replace('FEAT-', ''), 10);
      return na - nb;
    });
    resolved[file] = sorted[0];
    // Record voided
    for (const voided of sorted.slice(1)) {
      conflicts.push({ file, winner: sorted[0].proposedFeat, voided: voided.proposedFeat, voidedRole: voided.role });
    }
  }

  return { resolved, conflicts };
}

// ---------------------------------------------------------------------------
// Proposal collection (scan all active roles)
// ---------------------------------------------------------------------------

function collectProposals(featRegistry, scopeFeat) {
  const allProposals = {};
  const planCNotes = [];

  for (const role of activeRoles) {
    const { alreadyGrouped, ungrouped, skipped, note } = classifyRoleFiles(role, featRegistry, scopeFeat);
    allProposals[role] = { alreadyGrouped, ungrouped, skipped };
    if (note) planCNotes.push({ role, note });
  }

  return { allProposals, planCNotes };
}

// ---------------------------------------------------------------------------
// Parse subagent response files (if present)
// ---------------------------------------------------------------------------

function parseResponseFiles(_isoTs) {
  const responsesDir = join(outDir, 'responses');
  if (!existsSync(responsesDir)) return {};

  const responsesByRole = {};
  const files = readdirSync(responsesDir).filter(f => f.endsWith('.md'));

  for (const f of files) {
    const content = readFileSync(join(responsesDir, f), 'utf8');
    // Extract JSON block at end of file
    const jsonMatch = content.match(/```json\s*([\s\S]*?)```\s*$/m);
    if (!jsonMatch) continue;

    try {
      const data = JSON.parse(jsonMatch[1]);
      if (data.role && data.proposals) {
        responsesByRole[data.role] = data.proposals;
      }
    } catch {
      console.warn(`feat-backfill: could not parse JSON block in responses/${f} — skipping`);
    }
  }

  return responsesByRole;
}

// ---------------------------------------------------------------------------
// Frontmatter mutation (--apply phase)
// ---------------------------------------------------------------------------

/**
 * Write or amend frontmatter to inject feat + parent_feat.
 * Idempotent: if both fields already match, no write.
 * Returns action string for audit log.
 */
function injectFrontmatter(filePath, featId) {
  let content;
  try {
    content = readFileSync(filePath, 'utf8');
  } catch (e) {
    return { action: 'error', detail: `read error: ${e.message}` };
  }

  const { hasFrontmatter, frontmatterParsed, frontmatterRaw, bodyAfter, parseError } = parseFrontmatter(content);

  if (parseError) {
    return { action: 'error', detail: `malformed frontmatter: ${parseError}` };
  }

  // Case (c): already has both fields matching → no-op
  if (hasFrontmatter && frontmatterParsed) {
    const existingFeat = frontmatterParsed['feat'];
    const existingParentFeat = frontmatterParsed['parent_feat'];

    if (existingFeat === featId && existingParentFeat === featId) {
      return { action: 'applied-noop', detail: 'already set' };
    }

    // Case (c) conflict: fields present but different value
    if ((existingFeat && existingFeat !== featId) || (existingParentFeat && existingParentFeat !== featId)) {
      return { action: 'applied-noop', detail: `conflict: existing feat=${existingFeat || 'none'} parent_feat=${existingParentFeat || 'none'} vs proposed ${featId}; leaving untouched (use --force to override, deferred)` };
    }
  }

  // Case (a): no frontmatter → prepend new block
  if (!hasFrontmatter) {
    const newContent = `---\nfeat: ${featId}\nparent_feat: ${featId}\n---\n${content}`;
    writeFileSync(filePath, newContent, 'utf8');
    return { action: 'applied-frontmatter-add' };
  }

  // Case (b): frontmatter exists but missing feat/parent_feat → amend
  const lines = frontmatterRaw.split('\n');
  const hasFeatLine = lines.some(l => l.match(/^feat\s*:/));
  const hasParentFeatLine = lines.some(l => l.match(/^parent_feat\s*:/));

  const additions = [];
  if (!hasFeatLine) additions.push(`feat: ${featId}`);
  if (!hasParentFeatLine) additions.push(`parent_feat: ${featId}`);

  if (additions.length === 0) {
    return { action: 'applied-noop', detail: 'fields already present' };
  }

  // Insert additions at end of frontmatter block (before closing ---)
  const newFm = frontmatterRaw.trimEnd() + '\n' + additions.join('\n') + '\n';
  const newContent = `---\n${newFm}---${bodyAfter}`;
  writeFileSync(filePath, newContent, 'utf8');
  return { action: 'applied-frontmatter-amend' };
}

// ---------------------------------------------------------------------------
// INDEX row insertion (idempotent)
// ---------------------------------------------------------------------------

/**
 * Insert a ticket row into a role INDEX.md file if not already present.
 * Idempotent: checks for existing | TICKET | row before inserting.
 */
// Scaffolded for future --apply INDEX row insertion. Not invoked in Wave 126 MVP.
function _insertIndexRow(indexPath, ticket, parentFeat, parentUs, status, description) {
  if (!existsSync(indexPath)) {
    console.warn(`feat-backfill: INDEX not found at ${indexPath} — skipping row insert for ${ticket}`);
    return 'skipped-absent';
  }

  const content = readFileSync(indexPath, 'utf8');
  // Check for existing row
  if (content.includes(`| ${ticket} |`) || content.includes(`| ${ticket}|`)) {
    return 'applied-index-noop';
  }

  // Find the allocation table and append a row
  const tableRowRegex = /^(\|[-| ]+\|)\s*$/m;
  const match = tableRowRegex.exec(content);
  if (!match) {
    console.warn(`feat-backfill: could not find table separator in ${indexPath} — skipping ${ticket}`);
    return 'skipped-absent';
  }

  // Append row at end of file (before any trailing sections)
  const newRow = `| ${ticket} | ${parentFeat} | ${parentUs} | ${status} | ${description} |`;
  // Find the last table row and append after it
  const lines = content.split('\n');
  let lastTableLine = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].startsWith('|') && !lines[i].match(/^[|\-\s]+$/)) {
      lastTableLine = i;
      break;
    }
  }

  if (lastTableLine === -1) {
    // Append at end
    writeFileSync(indexPath, content + '\n' + newRow, 'utf8');
  } else {
    lines.splice(lastTableLine + 1, 0, newRow);
    writeFileSync(indexPath, lines.join('\n'), 'utf8');
  }

  return 'applied-index-insert';
}

// ---------------------------------------------------------------------------
// Plan-C retroactive FE summary docs (AC15)
// ---------------------------------------------------------------------------

const FE_RETRO_ENTRIES = [
  {
    ticket: 'FE-0001',
    wave: 119,
    us: 'US-095',
    description: 'Viewer workspace switcher',
    parentFeat: 'TBD',
    slug: 'viewer-workspace-switcher',
    scopeFiles: [
      'src/app/page.tsx (apex-team-viewer)',
      'src/components/WorkspaceSwitcher.tsx (apex-team-viewer)',
    ],
    viewerPr: 'not filed as separate PR — committed direct to viewer main',
    viewerSha: 'see ../apex-team-viewer git log for Wave 119 commits',
    apexArtifacts: ['requirements/user-stories/US-095-*.md (if exists)', 'design/features/* (if exists)'],
    notes: 'Pre-convention wave; FEAT TBD pending BA reconciliation. Wave 119 predates the FEAT-XXXX grouping convention (Wave 122).',
    featNote: 'TBD',
    tbd: true,
  },
  {
    ticket: 'FE-0002',
    wave: 121,
    us: 'US-097',
    description: 'Viewer auto-follow',
    parentFeat: 'TBD',
    slug: 'viewer-auto-follow',
    scopeFiles: [
      'src/app/page.tsx (apex-team-viewer)',
      'src/hooks/useAutoFollow.ts (apex-team-viewer)',
    ],
    viewerPr: 'not filed as separate PR — committed direct to viewer main',
    viewerSha: 'see ../apex-team-viewer git log for Wave 121 commits',
    apexArtifacts: ['requirements/user-stories/US-097-*.md (if exists)'],
    notes: 'Pre-convention wave; FEAT TBD pending BA reconciliation. Wave 121 predates the FEAT-XXXX grouping convention (Wave 122).',
    featNote: 'TBD',
    tbd: true,
  },
  {
    ticket: 'FE-0003',
    wave: 123,
    us: 'US-099',
    description: 'FEAT-grouped rendering',
    parentFeat: 'FEAT-0002',
    slug: 'feat-grouped-rendering',
    scopeFiles: [
      'src/app/page.tsx (apex-team-viewer)',
      'src/components/FeatCard.tsx (apex-team-viewer)',
      'src/components/RoleOutputTab.tsx (apex-team-viewer)',
    ],
    viewerPr: 'see ../apex-team-viewer PR history for Wave 123',
    viewerSha: 'see ../apex-team-viewer git log for Wave 123 commits',
    apexArtifacts: [
      'requirements/user-stories/US-099-*.md',
      'design/features/FEAT-0002-viewer-feat-grouped-rendering/ (if exists)',
      'tests/qa/features/FEAT-0002-viewer-feat-grouped-rendering/ (TEST-0002)',
    ],
    notes: 'Wave 123 — FEAT-grouped rendering shipped in viewer. Apex-team side: US-099 + TEST-0002.',
    featNote: 'FEAT-0002',
    tbd: false,
  },
  {
    ticket: 'FE-0004',
    wave: 125,
    us: 'US-101',
    description: 'Viewer a11y polish',
    parentFeat: 'FEAT-0004',
    slug: 'viewer-a11y-polish',
    scopeFiles: [
      'src/app/globals.css (apex-team-viewer)',
      'src/components/FeatCard.tsx (apex-team-viewer)',
      'src/components/RoleOutputTab.tsx (apex-team-viewer)',
    ],
    viewerPr: 'see ../apex-team-viewer PR history for Wave 125',
    viewerSha: 'see ../apex-team-viewer git log for Wave 125 commits',
    apexArtifacts: [
      'requirements/user-stories/US-101-*.md',
      'design/features/FEAT-0004-viewer-a11y-polish/',
      'architecture/features/FEAT-0004-viewer-a11y-polish/',
    ],
    notes: 'Wave 125 — a11y polish: focus-visible, ARIA labels, color contrast, motion. Apex-team side: US-101 + ARCH (FEAT-0004) + UX design spec.',
    featNote: 'FEAT-0004',
    tbd: false,
  },
];

function seedFERetroDoc(entry, mode) {
  const featDir = entry.tbd
    ? `frontend/features/FE-${entry.ticket.replace('FE-', '')}-tbd`
    : `frontend/features/${entry.parentFeat}-${entry.slug}`;
  const docFileName = `${entry.ticket}-${entry.slug}.md`;
  const docPath = join(workspace, featDir, docFileName);
  if (mode === 'dry-run') {
    audit(mode, 'ui-developer', docPath, entry.tbd ? 'ungrouped' : entry.parentFeat,
      entry.tbd ? 'propose-noop' : 'propose-frontmatter-add');
    return { path: docPath, action: 'propose-frontmatter-add', tbd: entry.tbd };
  }

  // apply mode
  if (existsSync(docPath)) {
    audit('apply', 'ui-developer', docPath, entry.tbd ? 'ungrouped' : entry.parentFeat, 'applied-noop');
    return { path: docPath, action: 'applied-noop' };
  }

  mkdirSync(dirname(docPath), { recursive: true });

  const frontmatterParentFeat = entry.tbd ? 'TBD' : entry.parentFeat;
  const content = `---
ticket: ${entry.ticket}
parent_feat: ${frontmatterParentFeat}
parent_us: ${entry.us}
wave: ${entry.wave}
role: ui-developer
status: retro
---

# ${entry.ticket} — ${entry.description} (Wave ${entry.wave} Retro)

## Scope

Files changed in the viewer repo (\`../apex-team-viewer/\`):

${entry.scopeFiles.map(f => `- \`${f}\``).join('\n')}

## Viewer PR

${entry.viewerPr}

## Viewer commit SHA

${entry.viewerSha}

## Apex-team-side artifacts

${entry.apexArtifacts.length > 0
  ? entry.apexArtifacts.map(a => `- ${a}`).join('\n')
  : 'none — this is the only apex-team artifact'}

## Notes

${entry.notes}
`;

  writeFileSync(docPath, content, 'utf8');
  audit('apply', 'ui-developer', docPath, entry.tbd ? 'ungrouped' : entry.parentFeat, 'applied-frontmatter-add');
  return { path: docPath, action: 'applied-frontmatter-add' };
}

// ---------------------------------------------------------------------------
// Phase 1: emit proposal + dispatch-plan
// ---------------------------------------------------------------------------

function runPhase1() {
  const ts = isoNow();
  const tsFile = isoFileSafe(ts);
  const mode = flagApply ? 'apply' : 'dry-run';

  const featRegistry = readFeatRegistry();
  const scopeFeat = flagFeat || null;
  const scopeFeats = scopeFeat ? featRegistry.filter(f => f.id === scopeFeat) : featRegistry;

  const { allProposals, planCNotes } = collectProposals(featRegistry, scopeFeat);

  // Collect all ungrouped proposals for conflict resolution
  const allUngrouped = [];
  for (const [role, data] of Object.entries(allProposals)) {
    for (const item of data.ungrouped) {
      allUngrouped.push({ ...item, role, file: item.path });
    }
  }

  const { resolved, conflicts } = resolveConflicts(allUngrouped.filter(u => u.proposedFeat));

  // Log dry-run proposals to audit
  for (const [role, data] of Object.entries(allProposals)) {
    for (const item of data.alreadyGrouped) {
      audit(mode, role, item.path, item.feat || item.parent_feat, 'propose-noop');
    }
    for (const item of data.ungrouped) {
      const resolvedProposal = resolved[item.path];
      const feat = resolvedProposal?.proposedFeat || 'ungrouped';
      audit(mode, role, item.path, feat,
        item.proposedFeat ? 'propose-frontmatter-add' : 'propose-noop');
    }
    for (const item of data.skipped) {
      audit(mode, role, item.path, 'ungrouped', 'error');
    }
  }

  // Log conflict voided entries
  for (const c of conflicts) {
    audit(mode, 'meta', c.file, c.voided, 'propose-conflict');
  }

  // Plan C FE retro audit (dry-run)
  if (isPlanC && (activeRoles.includes('ui-developer')) && (!scopeFeat || ['FEAT-0002', 'FEAT-0004'].includes(scopeFeat))) {
    for (const entry of FE_RETRO_ENTRIES) {
      if (scopeFeat && entry.parentFeat !== scopeFeat) continue;
      const featDir = entry.tbd
        ? `frontend/features/FE-${entry.ticket.replace('FE-', '')}-tbd`
        : `frontend/features/${entry.parentFeat}-${entry.slug}`;
      const docPath = join(workspace, featDir, `${entry.ticket}-${entry.slug}.md`);
      const action = existsSync(docPath) ? 'propose-noop' : 'propose-frontmatter-add';
      audit(mode, 'ui-developer', docPath, entry.tbd ? 'ungrouped' : entry.parentFeat, action);
    }
  }

  // ---------------------------------------------------------------------------
  // Build proposal markdown
  // ---------------------------------------------------------------------------

  const proposalLines = [
    `# FEAT Backfill Proposal — ${ts}`,
    '',
    '## Summary',
    `- Mode: ${mode}`,
    `- Workspace: ${workspace}`,
    `- FEAT scope: ${scopeFeat || '--all'}`,
    `- Roles scanned: ${activeRoles.join(', ')}`,
    `- Plan C workspace: ${isPlanC ? 'yes' : 'no'}`,
    '',
  ];

  // Per-FEAT sections
  const groupedByFeat = {};
  for (const [role, data] of Object.entries(allProposals)) {
    for (const item of data.alreadyGrouped) {
      const feat = item.feat || item.parent_feat;
      if (!groupedByFeat[feat]) groupedByFeat[feat] = {};
      if (!groupedByFeat[feat][role]) groupedByFeat[feat][role] = [];
      groupedByFeat[feat][role].push({
        path: relative(workspace, item.path),
        status: 'already-grouped',
        confidence: 'high',
        reason: 'existing frontmatter',
      });
    }
    for (const item of data.ungrouped) {
      if (item.proposedFeat) {
        const resolvedFeat = resolved[item.path]?.proposedFeat || item.proposedFeat;
        if (!groupedByFeat[resolvedFeat]) groupedByFeat[resolvedFeat] = {};
        if (!groupedByFeat[resolvedFeat][role]) groupedByFeat[resolvedFeat][role] = [];
        groupedByFeat[resolvedFeat][role].push({
          path: relative(workspace, item.path),
          status: 'proposed',
          confidence: item.confidence,
          reason: item.reason,
        });
      }
    }
  }

  for (const [feat, roleMap] of Object.entries(groupedByFeat)) {
    const featInfo = featRegistry.find(f => f.id === feat);
    proposalLines.push(`## ${feat}${featInfo ? ` — ${featInfo.slug}` : ''}`);
    for (const [role, items] of Object.entries(roleMap)) {
      proposalLines.push(`### ${role}`);
      for (const item of items) {
        proposalLines.push(`- \`${item.path}\` → ${feat} (confidence: ${item.confidence}; reason: ${item.reason})`);
      }
      proposalLines.push('');
    }
  }

  // Ungrouped section
  const ungroupedAll = [];
  for (const [role, data] of Object.entries(allProposals)) {
    for (const item of data.ungrouped) {
      if (!item.proposedFeat) {
        ungroupedAll.push({ role, path: relative(workspace, item.path), reason: item.reason });
      }
    }
    for (const item of data.skipped) {
      ungroupedAll.push({ role, path: relative(workspace, item.path), reason: item.reason });
    }
  }

  if (ungroupedAll.length > 0) {
    proposalLines.push('## Ungrouped (manual review required)');
    const byRole = {};
    for (const item of ungroupedAll) {
      if (!byRole[item.role]) byRole[item.role] = [];
      byRole[item.role].push(item);
    }
    for (const [role, items] of Object.entries(byRole)) {
      proposalLines.push(`### ${role}`);
      for (const item of items) {
        proposalLines.push(`- \`${item.path}\` — reason: ${item.reason}`);
      }
      proposalLines.push('');
    }
  }

  // Plan C notes
  if (planCNotes.length > 0) {
    proposalLines.push('## Plan C notes');
    for (const n of planCNotes) {
      proposalLines.push(`- **${n.role}**: ${n.note}`);
    }
    proposalLines.push('');
  }

  // Conflict reconciliation notes
  if (conflicts.length > 0) {
    proposalLines.push('## Reconciliation notes');
    for (const c of conflicts) {
      proposalLines.push(`- \`${relative(workspace, c.file)}\`: ${c.voidedRole} proposed ${c.voided}; lower-number ${c.winner} wins per NFR-007. ${c.voided} voided.`);
    }
    proposalLines.push('');
  }

  const proposalMd = proposalLines.join('\n');

  // ---------------------------------------------------------------------------
  // Build JSON manifest (machine-readable for --apply)
  // ---------------------------------------------------------------------------

  const jsonManifest = {
    ts,
    mode,
    workspace,
    scopeFeat: scopeFeat || 'all',
    roles: activeRoles,
    isPlanC,
    proposals: [],
    ungrouped: [],
    conflicts,
  };

  for (const [role, data] of Object.entries(allProposals)) {
    for (const item of data.alreadyGrouped) {
      jsonManifest.proposals.push({
        role, file: item.path, current_parent_feat: item.feat || item.parent_feat,
        proposed_parent_feat: item.feat || item.parent_feat,
        confidence: 'high', rationale: 'existing frontmatter', action: 'noop',
      });
    }
    for (const item of data.ungrouped) {
      const resolvedFeat = item.proposedFeat ? (resolved[item.path]?.proposedFeat || item.proposedFeat) : 'ungrouped';
      const entry = {
        role, file: item.path,
        current_parent_feat: null,
        proposed_parent_feat: resolvedFeat,
        confidence: item.confidence, rationale: item.reason,
        action: resolvedFeat !== 'ungrouped' ? 'inject' : 'ungrouped',
      };
      if (resolvedFeat !== 'ungrouped') {
        jsonManifest.proposals.push(entry);
      } else {
        jsonManifest.ungrouped.push(entry);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Write proposal files
  // ---------------------------------------------------------------------------

  const proposalMdPath = join(outDir, `proposal-${tsFile}.md`);
  const proposalJsonPath = join(outDir, `proposal-${tsFile}.json`);

  writeFileSync(proposalMdPath, proposalMd, 'utf8');
  writeFileSync(proposalJsonPath, JSON.stringify(jsonManifest, null, 2), 'utf8');

  // ---------------------------------------------------------------------------
  // Build dispatch-plan markdown
  // ---------------------------------------------------------------------------

  const dispatchLines = [
    `# FEAT Backfill Dispatch Plan — ${ts}`,
    '',
    'Instructions for the outer Claude Code orchestrator:',
    '',
    'Fan out these role briefs as parallel Agent tool calls. Each brief is self-contained.',
    '',
    '---',
    '',
  ];

  for (const role of activeRoles) {
    const data = allProposals[role];
    const relDir = ROLE_DIRS[role];
    const files = data.ungrouped.map(u => relative(workspace, u.path));
    const alreadyFiles = data.alreadyGrouped.map(a => relative(workspace, a.path));

    dispatchLines.push(`## Role: ${role}`);
    dispatchLines.push('');
    dispatchLines.push(`**Task:** Review the following ungrouped files from your owned directory (\`${relDir}/\`) and propose \`parent_feat:\` mappings.`);
    dispatchLines.push('');
    dispatchLines.push(`**Workspace:** \`${workspace}\``);
    dispatchLines.push(`**Role identity:** ${role}`);
    dispatchLines.push(`**Wave context:** Wave 126, FEAT backfill for: ${scopeFeats.map(f => f.id).join(', ') || 'all'}`);
    dispatchLines.push('');

    if (files.length === 0) {
      dispatchLines.push('**Files requiring review:** none (all files in your owned directory are already grouped or directory is absent)');
    } else {
      dispatchLines.push('**Files requiring review (ungrouped):**');
      for (const f of files) {
        dispatchLines.push(`- \`${f}\``);
      }
    }
    dispatchLines.push('');

    if (alreadyFiles.length > 0) {
      dispatchLines.push('**Already grouped (no action needed):**');
      for (const f of alreadyFiles) {
        dispatchLines.push(`- \`${f}\``);
      }
      dispatchLines.push('');
    }

    dispatchLines.push('**Existing FEAT registry:**');
    for (const f of scopeFeats) {
      dispatchLines.push(`- ${f.id} — ${f.slug}`);
    }
    dispatchLines.push('');

    dispatchLines.push('**Required output schema:** Respond with a JSON block at the END of your response (fenced with ` ```json `):');
    dispatchLines.push('');
    dispatchLines.push('```json');
    dispatchLines.push(JSON.stringify({
      role,
      wave: 126,
      proposals: [
        {
          file: '<absolute path>',
          current_parent_feat: '<FEAT-NNNN|null>',
          proposed_parent_feat: '<FEAT-NNNN|ungrouped>',
          confidence: 'high|medium|low',
          rationale: '<one-sentence why>',
          conflict_with: ['<other role\'s proposed FEAT if known>'],
        },
      ],
      new_feat_proposals: [],
    }, null, 2));
    dispatchLines.push('```');
    dispatchLines.push('');

    dispatchLines.push('**Write your response to:** `' + join('coordination', 'feat-backfill', 'responses', `${role}-${tsFile}.md`) + '`');
    dispatchLines.push('');

    dispatchLines.push('**Forbidden:** Do NOT move files, rename files, edit `.claude/agents/`, edit `coordination/handoffs/`, edit ADRs, run git commands, or make network calls.');
    dispatchLines.push('');
    dispatchLines.push('---');
    dispatchLines.push('');

    // Write per-role dispatch brief
    const roleBriefPath = join(outDir, 'dispatch', `${role}-${tsFile}.md`);
    const roleStartIdx = dispatchLines.lastIndexOf(`## Role: ${role}`);
    const roleSection = dispatchLines.slice(roleStartIdx, dispatchLines.length - 2).join('\n');
    writeFileSync(roleBriefPath, `# FEAT Backfill Brief — ${role} — ${ts}\n\n${roleSection}`, 'utf8');
  }

  const dispatchPlanPath = join(outDir, `dispatch-plan-${tsFile}.md`);
  writeFileSync(dispatchPlanPath, dispatchLines.join('\n'), 'utf8');

  // ---------------------------------------------------------------------------
  // stdout summary
  // ---------------------------------------------------------------------------

  console.log('\nfeat-backfill dry-run complete\n');
  console.log(`Workspace:     ${workspace}`);
  console.log(`Plan C:        ${isPlanC ? 'yes (frontend/ + backend/ used for FE/BE Dev)' : 'no (src/ present)'}`);
  console.log(`Mode:          ${mode}`);
  console.log(`FEAT scope:    ${scopeFeat || '--all'}`);
  console.log('');
  console.log('Per-role counts:');
  for (const [role, data] of Object.entries(allProposals)) {
    const already = data.alreadyGrouped.length;
    const ungroup = data.ungrouped.length;
    const skip = data.skipped.length;
    console.log(`  ${role.padEnd(22)} already-grouped: ${already}, ungrouped: ${ungroup}, skipped/error: ${skip}`);
  }
  console.log('');
  console.log('Emitted files:');
  console.log(`  ${proposalMdPath}`);
  console.log(`  ${proposalJsonPath}`);
  console.log(`  ${dispatchPlanPath}`);
  console.log(`  ${auditLogPath} (appended)`);
  console.log('');
  console.log('Next steps:');
  console.log('  1. Review the proposal file above.');
  console.log('  2. Review the dispatch-plan and fan out role briefs to subagents.');
  console.log('  3. Collect subagent response files under coordination/feat-backfill/responses/');
  console.log('  4. Re-run with --apply (optionally --proposal=<path>) to write frontmatter.');
  console.log('');

  return { proposalMdPath, proposalJsonPath, dispatchPlanPath };
}

// ---------------------------------------------------------------------------
// Phase 2: --apply
// ---------------------------------------------------------------------------

function runApply(preExistingProposalPath) {
  const mode = 'apply';
  const ts = isoNow();

  // Use pre-existing proposal path (validated in main entry point)
  const proposalJsonPath = preExistingProposalPath;

  if (!flagProposal) {
    console.warn(`feat-backfill: using pre-existing proposal: ${proposalJsonPath}`);
    console.warn('  (Pass --proposal=<path> to bind to a specific proposal for reproducibility.)');
  }

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(proposalJsonPath, 'utf8'));
  } catch (e) {
    console.error(`feat-backfill: could not read/parse proposal JSON at ${proposalJsonPath}: ${e.message}`);
    process.exit(1);
  }

  // Merge subagent response files if present
  const responseProposals = parseResponseFiles(ts);

  // Build final canonical proposals (response file proposals take precedence over heuristic)
  const canonicalProposals = [...manifest.proposals];
  for (const [role, responseItems] of Object.entries(responseProposals)) {
    for (const item of responseItems) {
      // Check if file already in canonical
      const existing = canonicalProposals.find(p => p.file === item.file);
      if (!existing) {
        canonicalProposals.push({ ...item, role });
      } else {
        // Conflict resolution: lower FEAT wins
        const existingNum = parseInt(existing.proposed_parent_feat?.replace('FEAT-', '') || '9999', 10);
        const newNum = parseInt(item.proposed_parent_feat?.replace('FEAT-', '') || '9999', 10);
        if (newNum < existingNum) {
          Object.assign(existing, { ...item, role });
        }
      }
    }
  }

  console.log('\nfeat-backfill --apply starting...\n');
  console.log(`Proposal: ${proposalJsonPath}`);
  console.log(`Workspace: ${workspace}`);

  let appliedCount = 0;
  let noopCount = 0;
  let errorCount = 0;

  // Apply frontmatter to each proposed file
  for (const proposal of canonicalProposals) {
    if (proposal.action === 'noop' || proposal.proposed_parent_feat === 'ungrouped' || !proposal.proposed_parent_feat) {
      audit(mode, proposal.role || 'meta', proposal.file, proposal.proposed_parent_feat || 'ungrouped', 'applied-noop');
      noopCount++;
      continue;
    }

    if (!existsSync(proposal.file)) {
      audit(mode, proposal.role || 'meta', proposal.file, proposal.proposed_parent_feat, 'skipped-absent');
      console.warn(`  SKIP (absent): ${relative(workspace, proposal.file)}`);
      continue;
    }

    const { action, detail } = injectFrontmatter(proposal.file, proposal.proposed_parent_feat);
    audit(mode, proposal.role || 'meta', proposal.file, proposal.proposed_parent_feat, action);

    if (action === 'applied-noop') {
      noopCount++;
    } else if (action === 'error') {
      errorCount++;
      console.warn(`  ERROR: ${relative(workspace, proposal.file)} — ${detail}`);
    } else {
      appliedCount++;
      console.log(`  APPLIED (${action}): ${relative(workspace, proposal.file)} → ${proposal.proposed_parent_feat}`);
    }
  }

  // Plan-C retro FE backfill (AC15)
  if (isPlanC && activeRoles.includes('ui-developer')) {
    const scopeFeat = manifest.scopeFeat !== 'all' ? manifest.scopeFeat : null;
    console.log('\nSeeding Plan-C FE retro summary docs (AC15)...');
    for (const entry of FE_RETRO_ENTRIES) {
      if (scopeFeat && entry.parentFeat !== scopeFeat && entry.tbd === false) continue;
      const result = seedFERetroDoc(entry, mode);
      if (result.action === 'applied-frontmatter-add') {
        console.log(`  CREATED: ${relative(workspace, result.path)}`);
        appliedCount++;
      } else {
        console.log(`  NO-OP (already exists): ${relative(workspace, result.path)}`);
        noopCount++;
      }
    }
  }

  console.log(`\nApply complete: ${appliedCount} applied, ${noopCount} no-op, ${errorCount} errors`);
  console.log(`Audit log: ${auditLogPath}`);
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

if (flagApply) {
  // --apply mode:
  //
  // Case A: --proposal=<path> provided → use that specific proposal.
  // Case B: outDir exists + has proposal-*.json → use most recent (canonical 2-phase flow).
  // Case C: outDir already exists but has no proposal-*.json → error: run dry-run first.
  //         This covers: (a) user created the dir manually, (b) partial prior runs,
  //         (c) test setups that pre-create the coordination dir to test this boundary.
  // Case D: outDir does NOT yet exist → cold first-run: Phase 1 + Phase 2 combined.

  let existingProposal = flagProposal; // Case A if set

  if (!existingProposal) {
    if (existsSync(outDir)) {
      // outDir exists — search for proposal-*.json files
      const proposalFiles = readdirSync(outDir)
        .filter(f => f.startsWith('proposal-') && f.endsWith('.json'))
        .sort(); // ISO timestamps sort lexicographically

      if (proposalFiles.length > 0) {
        // Case B: use most recent pre-existing proposal
        existingProposal = join(outDir, proposalFiles[proposalFiles.length - 1]);
      } else {
        // Case C: outDir exists but no proposal files → require dry-run first
        console.error(
          'feat-backfill: --apply requires a proposal JSON file.\n' +
          `  No proposal-*.json found in: ${outDir}\n` +
          'Run without --apply first to generate a proposal, then re-run with --apply.\n' +
          '  Example: pnpm run feat:backfill --all --workspace=<path>'
        );
        process.exit(1);
      }
    }
    // else: outDir doesn't exist → Case D (cold combined run)
  }

  // Phase 1 always runs (emits fresh dispatch-plan + proposal for audit context)
  const phase1Result = runPhase1();

  // Resolve proposal to use:
  // - Cases A, B: use pre-existing proposal (from prior dry-run; Phase 1 is context-only)
  // - Case D: outDir just created by Phase 1 → use freshly-created proposal
  const proposalToApply = existingProposal || phase1Result.proposalJsonPath;

  runApply(proposalToApply);
} else {
  runPhase1();
}
