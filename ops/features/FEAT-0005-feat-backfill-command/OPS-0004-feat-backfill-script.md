---
ticket: OPS-0004
parent_feat: FEAT-0005
parent_us: US-102
role: devsecops
status: done
wave: 126
---

# OPS-0004 — FEAT Backfill Script

**Wave:** 126
**Parent feature:** [FEAT-0005 — FEAT Backfill Command](../../../requirements/features/FEAT-0005-feat-backfill-command.md)
**Parent user story:** [US-102 — Retroactive FEAT Backfill Command](../../../requirements/user-stories/US-102-retroactive-feat-backfill-command.md)
**Architecture spec:** [ARCH-0002 — FEAT backfill protocol](../../../architecture/features/FEAT-0005-feat-backfill-command/ARCH-0002-feat-backfill-protocol.md)

---

## Script architecture summary

`scripts/feat-backfill.mjs` is a Node.js ESM CLI script that operates in two phases:

**Phase 1 (dry-run, default):**
Scans each role's owned directory, reads YAML frontmatter via simple regex (fail-soft on
malformed blocks), groups files into already-grouped vs ungrouped, applies heuristic FEAT
assignment, runs conflict reconciliation (lower FEAT number wins per NFR-007), and emits:
- `coordination/feat-backfill/proposal-<ISO>.md` — human-readable proposal report
- `coordination/feat-backfill/proposal-<ISO>.json` — machine-readable manifest
- `coordination/feat-backfill/dispatch-plan-<ISO>.md` — per-role subagent briefs
- `coordination/feat-backfill/dispatch/<role>-<ISO>.md` — individual role brief files
- Appended rows in `coordination/feat-backfill/audit.log`

**Phase 2 (`--apply`):**
Phase 1 runs first (for fresh audit context), then the script reads the most recent
`proposal-*.json`, merges any subagent response files from `coordination/feat-backfill/responses/`,
injects `feat:` + `parent_feat:` frontmatter into matched files (idempotent), seeds Plan-C
FE retro summary docs, and appends all actions to the audit log.

The script does ALL filesystem IO. Subagents are never invoked by the script itself — they
return structured JSON proposal blocks to `coordination/feat-backfill/responses/<role>-<ISO>.md`,
which the script reads and merges. This boundary is the NFR-003 orchestration invariant.

---

## Command surface

```bash
pnpm run feat:backfill [--all | --feat=FEAT-XXXX] [--role=<r>...] [--apply] [--out=<path>] [--workspace=<path>]
```

| Flag | Description |
|---|---|
| `--all` | Scan all roles for all known FEATs + ungrouped assets (required if `--feat` absent) |
| `--feat=FEAT-XXXX` | Scope to one feature only; FEAT file must pre-exist |
| `--role=<r>` | Restrict to listed roles (repeatable) |
| `--apply` | Write frontmatter mutations; omit = dry-run |
| `--out=<path>` | Override output directory (default: `<workspace>/coordination/feat-backfill/`) |
| `--workspace=<path>` | Operate on a different workspace root (default: git toplevel) |
| `--proposal=<path>` | Bind `--apply` to a specific proposal JSON file |
| `--ba-approved` | Allow conflict-voiding INDEX row writes (FEAT-007 resolution) |

Neither `--all` nor `--feat` = usage error (prints help, exits non-zero).

---

## NFR adherence checklist (linking to ARCH-0002)

| NFR | Reference | Implementation |
|---|---|---|
| NFR-FEATBACKFILL-001 (idempotence) | ARCH-0002 §1 | `injectFrontmatter()` checks existing values; skips if already set. Second `--apply` produces zero writes to role files. Audit log appends no-op rows for traceability. |
| NFR-FEATBACKFILL-002 (dry-run safety) | ARCH-0002 §2 | Without `--apply`, writes are limited to `coordination/feat-backfill/` only. No role-owned file is opened for writing in dry-run. |
| NFR-FEATBACKFILL-003 (orchestration boundary) | ARCH-0002 §3 | Script never shells out to invoke subagents. Subagent briefs are markdown files; subagent responses are read from `coordination/feat-backfill/responses/`. |
| NFR-FEATBACKFILL-004 (cross-workspace portability) | ARCH-0002 §4 | `--workspace=<path>` flag resolves all paths relative to named workspace. No apex-team-specific hardcoding. Directory-absent tolerance: missing role dirs logged and skipped. |
| NFR-FEATBACKFILL-005 (audit log) | ARCH-0002 §5 | `appendFileSync` on `coordination/feat-backfill/audit.log`. Never truncated or rotated. TSV format: `ISO-ts\tmode\trole\tfile\tFEAT-XXXX|ungrouped\taction`. |
| NFR-FEATBACKFILL-006 (forbidden surfaces) | ARCH-0002 §6 | No file moves, renames, FEAT renumbering. No `.claude/agents/` writes. No `coordination/handoffs/` writes. No ADR writes. No git commands. No network calls. |
| NFR-FEATBACKFILL-007 (conflict resolution) | ARCH-0002 §7 | `resolveConflicts()` sorts proposals by FEAT number and picks the lowest. Voided FEATs logged as `propose-conflict` in audit log. |
| NFR-FEATBACKFILL-008 (fail-soft) | ARCH-0002 §8 | `parseFrontmatter()` returns `parseError` without throwing; script logs `error` audit row and continues. Malformed file is never overwritten. |

---

## Retest steps

After any modification to `scripts/feat-backfill.mjs`:

```bash
# 1. Dry-run on apex-team itself (should only write to coordination/feat-backfill/)
node scripts/feat-backfill.mjs --all --workspace=$(pwd)

# 2. Second dry-run (fresh timestamped files; content shape identical)
node scripts/feat-backfill.mjs --all --workspace=$(pwd)

# 3. Verify only coordination/feat-backfill/ was written (no role-owned changes)
git status

# 4. Full test suite
pnpm test:run

# 5. Lint + type-check
pnpm lint
pnpm type-check

# 6. Verify audit.log format (each line must match 6-column TSV)
#    Columns: ISO-ts | mode | role | file | FEAT-XXXX|ungrouped | action
node -e "
const lines = require('fs').readFileSync('coordination/feat-backfill/audit.log', 'utf8').split('\n').filter(l => l.trim());
const re = /^[0-9T:Z-]+\t(dry-run|apply)\t[a-z-]+\t[^\t]+\t(FEAT-\d{4}|ungrouped)\t[a-z-]+/;
lines.forEach((l, i) => { if (!re.test(l)) console.error('FAIL line', i+1, l); });
console.log('All', lines.length, 'audit lines validated');
"
```

---

## Plan C clause

When workspace has no `src/` + has `.claude/agents/` (Plan C shape):
- `ui-developer` owned dir = `frontend/` (not `src/`)
- `backend-developer` owned dir = `backend/` (not `src/`)
- `--apply` seeds retro FE summary docs at `frontend/features/FEAT-NNNN-<slug>/FE-NNNN-<slug>.md`
  for Waves 119 (FE-0001), 121 (FE-0002), 123 (FE-0003), 125 (FE-0004)

Pre-convention waves (119, 121): `parent_feat: TBD` — BA reconciliation required before applying.

---

## Allocation note

OPS-0001 through OPS-0003 were allocated in Wave 124 for FEAT-0003 pipeline templates
(`ops/pipelines/dev.sh`, `staging.sh`, `prod.sh`). OPS-0004 is the next available number.
The FEAT-0005 parent doc references `OPS-0001 (pending)` — this was authored before the
Wave 124 allocation was visible. The correct ticket for this deliverable is OPS-0004.
