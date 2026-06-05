---
ticket: US-102
parent_feat: FEAT-0005
role: business-analyst
status: done
---

# US-102 — Retroactive FEAT Backfill Command

**Story:** As a team member, I want a CLI command that inspects existing workspace artifacts
and groups them retroactively under FEAT-XXXX identifiers, so that the viewer renders legacy
docs under FEAT cards just like FEAT-0001/0002/0003/0004 already do.

**Parent feature:** [FEAT-0005 — FEAT Backfill Command](../features/FEAT-0005-feat-backfill-command.md)

**Status:** in-flight (Wave 126)

---

## Acceptance criteria

### AC1 — CLI shape

The command is invocable as:

```
pnpm run feat:backfill [--all | --feat=FEAT-XXXX] [--role=<r>...] [--apply] [--out=<path>] [--workspace=<path>]
```

- `--all` — scan all roles for all known FEAT-XXXX numbers in `requirements/features/INDEX.md` plus ungrouped.
- `--feat=FEAT-XXXX` — scope to one feature only (see AC8 for mode constraints).
- `--role=<r>` — optional; restricts scanning to listed roles (repeatable). Valid values: `business-analyst`, `architect`, `ux-designer`, `qa`, `devsecops`, `ui-developer`, `backend-developer`. Omit to scan all roles.
- `--apply` — write frontmatter mutations (see AC6). Omitted = dry-run (see AC2).
- `--out=<path>` — override the output directory for proposal + dispatch-plan + audit log. Default: `<workspace>/coordination/feat-backfill/`.
- `--workspace=<path>` — run against a different workspace root. Default: current working directory. Enables cross-workspace invocation: `node /path/to/apex-team/scripts/feat-backfill.mjs --workspace=/path/to/other/repo`.

Calling with neither `--all` nor `--feat=FEAT-XXXX` is a usage error; the command prints help and exits non-zero.

**Cross-workspace clause:** The script MUST work on any workspace that follows the standard
directory layout (`requirements/`, `architecture/`, `design/`, `tests/`, `ops/`). The
workspace root is resolved from `--workspace=<path>` if provided, otherwise from CWD. No
apex-team-specific hardcoding in workspace-path resolution.

---

### AC2 — Dry-run is default

Without `--apply`, the script runs in dry-run mode:

- No files are modified.
- Proposal and dispatch-plan files ARE written to the output directory (these are read artifacts, not mutations).
- Audit log entries for dry-run are tagged with `mode=dry-run`.
- The script exits 0 after emitting the proposal/dispatch-plan.

`--apply` is the explicit opt-in to perform frontmatter mutations. Without it, the only side
effects are the output artifacts in `coordination/feat-backfill/`.

---

### AC3 — Proposal report

On every run (dry-run or apply), the script writes:

```
coordination/feat-backfill/proposal-<ISO-datetime>.md
```

Where `<ISO-datetime>` is `YYYY-MM-DDTHH-MM-SSZ` (colons replaced with hyphens for
filename safety).

Structure of the proposal file:

```markdown
# FEAT Backfill Proposal — <ISO-datetime>

## Summary
- Mode: dry-run | apply
- Workspace: <absolute path>
- FEAT scope: --all | FEAT-XXXX
- Roles scanned: <list>

## <FEAT-XXXX> — <slug>
### <role>
- `<relative-path>` → FEAT-XXXX (confidence: <high|medium|low>; reason: <one line>)

## Ungrouped (manual review required)
### <role>
- `<relative-path>` — reason: <one line why it was not assigned>
```

Each role section appears only when that role has findings. The `## Ungrouped` section
appears only when at least one asset could not be confidently assigned.

---

### AC4 — Dispatch-plan emission

On every run (dry-run or apply), the script also writes:

```
coordination/feat-backfill/dispatch-plan-<ISO-datetime>.md
```

Structure:

```markdown
# FEAT Backfill Dispatch Plan — <ISO-datetime>

Instructions for the outer Claude Code orchestrator:

Fan out these role briefs as parallel Agent tool calls. Each brief is self-contained.

---

## Role: business-analyst
**Task:** Apply frontmatter to the following files assigning them to FEAT-XXXX:
...

## Role: architect
...
```

Each role section contains a complete, self-contained brief that the outer Claude Code
session can pass verbatim as the `prompt` argument of an `Agent` tool call with
`subagent_type: <role-id>`.

The dispatch-plan is written regardless of `--apply` mode. It describes the work needed
whether or not `--apply` has already been run.

---

### AC5 — Role-scoped directory access

When the script fans out role-scoped analysis, each role subagent reads ONLY its own
owned directory:

| Role | Owned directory |
|---|---|
| `business-analyst` | `requirements/` |
| `architect` | `architecture/` |
| `ux-designer` | `design/` |
| `qa` | `tests/` |
| `devsecops` | `ops/` |
| `ui-developer` | `src/` (if extant; skip with warning if absent) |
| `backend-developer` | `src/` (if extant; skip with warning if absent) |

The script must not cross-read directories (e.g., the `architect` role step must not
read `requirements/` to determine FEAT assignments).

Each role step receives its FEAT-XXXX candidate list from the `requirements/features/INDEX.md`
file (which is the canonical FEAT registry, readable by all roles as a cross-role index).

---

### AC6 — Frontmatter-only mutation on `--apply`

When `--apply` is set, the script:

1. For each matched file, prepends or updates YAML frontmatter with at minimum:
   - `feat: FEAT-XXXX`
   - `parent_feat: FEAT-XXXX`
2. Does NOT move files from their current location.
3. Does NOT rename files.
4. Does NOT delete files.
5. Does NOT modify any content outside the YAML frontmatter block (lines between `---` delimiters at the start of the file).

If a file already has a frontmatter block, the script merges `feat` and `parent_feat` into
the existing block without disturbing other keys.

If a file has no frontmatter, the script prepends a minimal block:

```yaml
---
feat: FEAT-XXXX
parent_feat: FEAT-XXXX
---
```

---

### AC7 — PO reconciliation pass

The script includes a deterministic reconciliation step (not a subagent call; run in the
script itself) that merges cross-role proposals into canonical FEAT-XXXX numbers:

- If multiple roles propose different FEAT numbers for what appears to be the same artifact
  grouping, the **lower FEAT number wins**.
- The reconciliation step logs any conflicts to the proposal report under a
  `## Reconciliation notes` section.
- The final canonical mapping used for `--apply` is always the post-reconciliation mapping.

---

### AC8 — `--feat=FEAT-XXXX` mode constraints

When `--feat=FEAT-XXXX` is specified:

- The command operates ONLY on that one feature across all (or specified) roles.
- The FEAT-XXXX file MUST already exist at `requirements/features/FEAT-XXXX-<slug>.md`.
  If it does not exist, the script prints an error and exits non-zero. No auto-creation.
- The proposal and dispatch-plan are scoped to that single FEAT.
- `--apply` in this mode only injects frontmatter for files mapped to that FEAT-XXXX.

---

### AC9 — Ungrouped bucket

Assets that a role step cannot confidently assign to a FEAT-XXXX number are placed in the
`## Ungrouped (manual review required)` section of the proposal report, with:

- Relative path of the asset.
- A one-line reason why it was not assigned (e.g., "predates all known FEATs; no clear
  feature boundary", "maps to multiple FEATs ambiguously", "role step had low confidence").

The user may:
1. Edit the proposal file to assign ungrouped assets to a FEAT.
2. Re-run with `--apply` — the script reads the updated proposal file as overrides.

A re-run with `--apply` after manual triage picks up any manual assignments the user
has added to the proposal file, applying frontmatter for those files on the second pass.

---

### AC10 — Idempotence

Re-running `--apply` on the same workspace is a no-op when frontmatter is already present:

- A file whose frontmatter already contains `feat: FEAT-XXXX` (matching the proposed
  assignment) is skipped.
- The audit log records a `no-op` action for skipped files.
- Re-running never overwrites a `feat:` value already present with a different FEAT-XXXX
  unless the user explicitly passes `--force` (out of scope for Wave 126; document as future
  flag).

---

### AC11 — Audit log

Every run appends entries to:

```
coordination/feat-backfill/audit.log
```

Line format (TSV):

```
<ISO-ts>\t<mode>\t<role>\t<file>\t<FEAT-XXXX|ungrouped>\t<action>
```

Where:
- `<ISO-ts>` — ISO 8601 timestamp, e.g. `2026-06-04T15:32:00Z`.
- `<mode>` — `dry-run` or `apply`.
- `<role>` — role id, e.g. `business-analyst`.
- `<file>` — workspace-relative file path.
- `<FEAT-XXXX|ungrouped>` — e.g. `FEAT-0001` or `ungrouped`.
- `<action>` — `proposed`, `applied`, `no-op`, `skipped-absent` (file not found), `error`.

The audit log is append-only. If the file does not exist, it is created.

---

### AC12 — Regression test (TEST-0005)

The QA test at `tests/qa/features/FEAT-0005-feat-backfill-command/TEST-0005-feat-backfill-command.test.ts`
MUST cover:

1. **Dry-run zero-write boundary:** Running in dry-run mode (no `--apply`) does not modify
   any file other than the output artifacts in `coordination/feat-backfill/`.
2. **Frontmatter syntax correctness:** After `--apply`, every mutated file has valid YAML
   frontmatter (parseable without error by a standard YAML parser; `feat` and `parent_feat`
   fields present and non-empty).
3. **Audit log format:** Every line in `audit.log` conforms to the 6-column TSV format
   specified in AC11. No extra columns. No missing columns. ISO timestamp in column 1.
4. **Idempotence:** Running `--apply` twice produces identical file states after the second
   run; the second run's audit log entries all show `action=no-op` for previously-applied
   files.
5. **Fail-soft YAML parser:** If a source file has malformed frontmatter, the script logs
   an `error` action in the audit log for that file but continues processing other files
   without aborting.

TEST-0005 is registered at `tests/qa/features/INDEX.md` under FEAT-0005 per Wave 122
convention (TEST-XXXX monotonic allocation; TEST-0004 is current high water; TEST-0005 is
the next allocation).

---

### AC13 — Smoke check (NOT a test)

After `--apply` is run against the apex-team workspace, a human verifier confirms:

- `GET http://localhost:3200/api/artifacts?role=business-analyst` (or equivalent viewer
  endpoint) returns previously-ungrouped legacy docs under FEAT cards.
- The viewer's per-role Output tab shows the formerly-flat legacy artifacts grouped under
  FEAT-XXXX headers, consistent with how FEAT-0001/0002/0003/0004 files already render.

This is documented as a user-facing acceptance step — not automated — because it requires
a running viewer instance and visual/API-response verification.

---

### AC14 — Plan C canonical paths

Under Plan C (apex-team workspace has no `src/` directory, only `.claude/agents/`), the canonical
artifact paths for FE Dev and BE Dev differ from the Wave 122 `src/features/` paths:

- **FE Dev canonical path:** `frontend/features/FEAT-NNNN-<slug>/FE-NNNN-<slug>.md`
  A summary markdown doc linking to the sibling-repo PR, commit SHA, and scope of change.
- **BE Dev canonical path:** `backend/features/FEAT-NNNN-<slug>/BE-NNNN-<slug>.md`
  Identical shape to the FE summary doc.

These Plan C paths SUPERSEDE the Wave 122 `src/features/` paths when the workspace is
Plan-C-shaped (no `src/` directory, has `.claude/agents/`).

**Script detection rule:** The backfill script MUST detect Plan-C-shaped workspaces by checking:
1. Does `<workspace>/src/` exist? If **no** → Plan C workspace.
2. Does `<workspace>/.claude/agents/` exist? If **yes** → confirms Plan C shape.

When Plan C is detected:
- The `ui-developer` role directory scanned is `frontend/` (not `src/`).
- The `backend-developer` role directory scanned is `backend/` (not `src/`).
- Role-scoped directory access table (AC5) entry for `ui-developer` and `backend-developer`
  reads `frontend/` and `backend/` respectively, with a warning printed when neither `src/`
  nor `frontend/`/`backend/` exists yet (no error — they may not have been created yet).

In dry-run mode, if `frontend/` or `backend/` is absent and Plan C is detected, the proposal
report notes: `"Plan C workspace detected; frontend/ or backend/ does not yet exist — retro
FE/BE summary docs cannot be scanned but can be seeded by AC15."`.

---

### AC15 — Retroactive FE Dev backfill

When `--all` or a `--feat` matching the relevant FEAT cluster runs against apex-team, the
script MUST seed retroactive FE summary docs for the following prior waves where UI Dev
performed work in the sibling viewer repo (`../apex-team-viewer/`) without leaving an
apex-team-side artifact:

| Wave | US | Description | FE ticket | Parent FEAT |
|---|---|---|---|---|
| Wave 119 | US-095 | Viewer workspace switcher | FE-0001 | FEAT TBD (see note) |
| Wave 121 | US-097 | Viewer auto-follow | FE-0002 | FEAT TBD (see note) |
| Wave 123 | US-099 | FEAT-grouped rendering | FE-0003 | FEAT-0002 |
| Wave 125 | US-101 | Viewer a11y polish | FE-0004 | FEAT-0004 |

**FEAT assignment note for Wave 119 + 121:** Waves 119 and 121 predate the FEAT-XXXX grouping
convention (Wave 122). In dry-run mode, the script reports these as:
`"Wave 119 viewer code → FEAT TBD (pre-convention wave; BA reconciliation required)"` and
`"Wave 121 viewer code → FEAT TBD (pre-convention wave; BA reconciliation required)"`.
The FEAT assignment for FE-0001 and FE-0002 is deferred to BA reconciliation — do not
auto-assign a FEAT number in `--apply` mode for these two.

**Retro summary doc shape** (30–80 lines, YAML frontmatter + markdown body):

```yaml
---
ticket: FE-NNNN
parent_feat: FEAT-NNNN   # or "TBD" for pre-convention waves
parent_us: US-NNN
wave: NNN
role: ui-developer
status: retro
---
```

Body sections (all required):
- `## Scope` — list of files changed in the viewer repo (`../apex-team-viewer/`).
- `## Viewer PR` — PR number (or "not filed as separate PR" if committed direct to viewer main).
- `## Viewer commit SHA` — the commit SHA in the viewer repo.
- `## Apex-team-side artifacts` — list of any apex-team artifacts already shipped in that wave
  (e.g. US-NNN file, design spec, QA test). If none: `"none — this is the only apex-team artifact"`.
- `## Notes` — any context (e.g. "pre-convention wave; FEAT TBD pending BA reconciliation").

---

### AC16 — Update Wave 122 standard in agent bodies

The `### FEAT-XXXX feature grouping standard (Wave 122 — MANDATORY)` section in BOTH
`.claude/agents/ui-developer.md` AND `.claude/agents/backend-developer.md` MUST be amended to
include a **Plan C clause** documenting the `frontend/features/` and `backend/features/`
canonical paths.

The exact amendment text to append (as a new sub-bullet or paragraph within the existing section):

> **Plan C workspaces (no `src/`):** When the workspace has no `src/` directory
> (e.g. apex-team under Plan C), use `frontend/features/FEAT-NNNN-<slug>/FE-NNNN-<slug>.md`
> (resp. `backend/features/FEAT-NNNN-<slug>/BE-NNNN-<slug>.md`) — a summary doc linking to
> the sibling-repo PR and commit. Author this artifact on every wave where you edit code in
> a sibling repo.

This amendment ensures the Wave 122 standard section is self-contained for Plan C operators
and does not require cross-referencing US-102 to understand the alternate path.

**Scope note:** `.claude/agents/ui-developer.md` and `.claude/agents/backend-developer.md`
are role-self-owned sections within role bodies. The amendment is scoped to the existing
Wave 122 standard section only — no other part of those files is in scope. Architect ratifies
the anchor phrase stability (byte-for-byte grep); the body edit itself is UI Dev's and BE Dev's
own lane per the peer-edit protocol.

---

## Out of scope (explicit)

The following are explicitly out of scope for US-102 and FEAT-0005:

- **File moves** — retroactive relocation of legacy assets into `features/FEAT-XXXX-<slug>/`
  subdirectories. Scheduled as Wave 127+.
- **Automatic FEAT-XXXX number reassignment** — the script never renumbers an existing FEAT.
- **Viewer UI changes** — the viewer already renders FEAT cards; no new viewer code in scope.
- **Retroactive linking of git history** — commit-SHA backfill is not in scope.
- **`--force` flag** — overwriting an existing `feat:` value with a different number is
  explicitly deferred.

---

## Cross-workspace clause

The script and all acceptance criteria apply equally when invoked against any workspace
with the standard directory layout. Cross-workspace invocation example:

```bash
node /path/to/apex-team/scripts/feat-backfill.mjs \
  --workspace=/path/to/other/repo \
  --all \
  --apply
```

No apex-team-specific path assumptions may be hardcoded in the script's workspace-path
resolution logic.
