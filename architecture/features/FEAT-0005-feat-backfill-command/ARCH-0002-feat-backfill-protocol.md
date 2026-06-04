---
ticket: ARCH-0002
parent_feat: FEAT-0005
parent_us: US-102
role: architect
status: accepted
---

# ARCH-0002 — FEAT backfill command (NFR posture + orchestration protocol)

**Wave:** 126
**Date:** 2026-06-04
**Owner:** Architect
**Scope:** NFR posture + orchestration protocol for a retroactive FEAT-grouping
backfill command. Authoritative ratification of safety, portability, and
subagent-orchestration boundaries. No source code, no fixture data — those
land in Lane 2 (BE Dev + QA + DevSecOps).
**Companion artifacts:**
- `requirements/features/FEAT-0005-feat-backfill-command.md` (BA, in-flight Lane 1)
- `requirements/user-stories/US-102-*.md` (BA, in-flight Lane 1)
- `design/features/FEAT-0005-feat-backfill-command/UX-0002-*.md` (UX, in-flight Lane 1 — expected no-impact CLI surface)
- `tests/qa/features/FEAT-0005-feat-backfill-command/TEST-0005-*.test.ts` (QA, Lane 2)
- Script source lands at `scripts/feat-backfill/` (BE Dev / DevSecOps, Lane 2)

---

## 1. NFR posture — idempotence is the hard requirement

**NFR-FEATBACKFILL-001 (idempotence, MUST):** Two consecutive invocations of
`pnpm run feat:backfill --apply` against the same workspace state MUST produce
byte-identical on-disk state after the second run. A third run MUST be a no-op
(zero file writes outside `coordination/feat-backfill/audit.log`).

**Why it's load-bearing:** the backfill command operates on Architect-owned,
BA-owned, UX-owned, QA-owned, and DevSecOps-owned files simultaneously. A
non-idempotent backfill would silently corrupt artifacts on accidental
re-invocation — a worse failure mode than the drift it exists to repair.
Idempotence is the property that lets a user run `--apply` a second time
"just to be sure" without consequence.

**Frontmatter detection — fail-soft tolerance (the three cases):**

| Input state | Required handling |
|---|---|
| (a) No existing frontmatter block | Insert canonical frontmatter block at file head |
| (b) Partial frontmatter — block present, `parent_feat:` missing | Add `parent_feat:` line in declared key order; do not reorder or rewrite other keys |
| (c) Fully-formed frontmatter — `parent_feat:` already present | NO-OP. Even if the existing value disagrees with the proposal, the script MUST log a conflict warning to the audit log and leave the file untouched. Conflict resolution belongs to §7, not to silent overwrite |

**Audit log idempotence:** the audit log is append-only by design (see §5), so
re-runs add new rows rather than rewriting. The "byte-identical state after
re-run" rule is qualified: `coordination/feat-backfill/audit.log` is allowed
to grow on each run (each run records its no-op verdict for traceability),
but the line counts of role-owned files (under `architecture/`, `requirements/`,
`design/`, `tests/`, `ops/`, `src/`) MUST NOT change between runs 2 and N.

**INDEX row de-dup:** when the script touches `requirements/features/INDEX.md`,
`architecture/features/INDEX.md`, or any other role INDEX, it MUST de-dup by
ticket id. Re-running an `--apply` that has already inserted `ARCH-0042 |
FEAT-0007 | …` MUST NOT insert a second row for `ARCH-0042`. The check is
exact-match on the leading `| ARCH-NNNN |` cell of the registry table; column
order is stable per the Wave 122 INDEX convention.

**Fitness function (TEST-0005 AC):** QA writes a test that invokes the script
twice in sequence against a fixture workspace and asserts `git status` reports
zero changes after the second run (excluding `coordination/feat-backfill/audit.log`).

---

## 2. Dry-run-first NFR — the default mode is read-only

**NFR-FEATBACKFILL-002 (dry-run safety, MUST):** Invoked without `--apply`,
the command MUST be a pure read-only operation. ZERO writes to any path
outside `coordination/feat-backfill/`. `--apply` is the ONLY mode that writes
to owned-role files (under `architecture/`, `requirements/`, `design/`,
`tests/`, `ops/`, `src/`).

**Why it's load-bearing:** the backfill command is a once-per-wave repair
operation that touches dozens of files across five owners. A user invoking
the wrong flag MUST NOT cause silent on-disk drift. The dry-run-first
discipline is the safety boundary that makes the command reviewable before
it commits.

**Dry-run output shape (canonical):**

- A single proposal markdown file at
  `coordination/feat-backfill/proposal-<ISO-ts>.md` summarizing every proposed
  change as a diff-style listing. The proposal file is the human-readable
  dispatch plan AND the machine-readable manifest for `--apply` (see §3).
- A companion JSON file at
  `coordination/feat-backfill/proposal-<ISO-ts>.json` carrying the same
  manifest in structured form. `--apply` reads the JSON, not the markdown.
- A row appended to the audit log (see §5) recording the dry-run invocation.
- Nothing else. No edits to `architecture/`, `requirements/`, `design/`,
  `tests/`, `ops/`, `src/`, `coordination/handoffs/`, root-level files, or
  git state.

**Reproducibility:** dry-run output MUST be deterministic given identical
input. The same workspace at the same commit produces the same proposal file
(modulo the ISO timestamp in the filename — content is byte-identical). This
is the property that lets reviewers diff a Tuesday proposal against a
Wednesday proposal and see only the workspace changes, not script
nondeterminism.

**`--apply` precondition (RECOMMENDED — not blocking):** the canonical user
flow is `dry-run` → review the proposal → `--apply --proposal=<path>`. The
script SHOULD accept `--proposal=<path>` to bind apply-time decisions to a
specific dry-run manifest. Invocation without `--proposal` is permitted (the
script generates a fresh manifest on the fly) but the audit log SHOULD flag
the un-bound invocation for human reviewability.

**Fitness function (TEST-0005 AC):** QA writes a test that invokes the script
without `--apply` against a fixture workspace and asserts the only files
written are under `coordination/feat-backfill/`.

---

## 3. Subagent-orchestration boundary — script does FS IO; subagents return proposals

**NFR-FEATBACKFILL-003 (orchestration shape, MUST):** All filesystem reads
and writes against role-owned directories (`architecture/`, `requirements/`,
`design/`, `tests/`, `ops/`, `src/`) flow through the backfill script. Role
subagents invoked by the backfill workflow MUST NOT mutate workspace files
in Wave 126 — they return structured proposal text to stdout/file, the
script parses it, and the script (deterministically, idempotently) applies
the merged proposal under `--apply`.

**Why it's load-bearing:** five-owner concurrent mutation under a subagent
runtime is a race condition by construction. Subagents fired in parallel
that each edit `requirements/features/INDEX.md` would race on the same row
table. Centralizing FS IO in a deterministic script eliminates the race and
preserves the de-dup invariant (§1). Subagents become judgment-bearing
proposal generators; the script becomes the dumb, deterministic applier.

**Canonical decision — dispatch-plan markdown over CLI invocation:**

The script MUST emit a dispatch-plan markdown file for the outer Claude Code
orchestrator to consume. The script MUST NOT shell out to invoke subagents
itself (e.g. via `claude --agents <role> --prompt "..."`).

**Rationale:**

1. No precedent for Claude Code CLI subagent invocation exists in apex-team
   scripts. Every multi-subagent wave in Wave 107+ has been driven by the
   outer Claude Code orchestrator fanning out via the Agent tool. Inventing
   a second invocation pattern doubles the surface area for race conditions,
   auth failures, and prompt-contract drift.
2. The outer orchestrator already owns API-key context, model selection, and
   parallel-dispatch budget — context the backfill script would have to
   re-derive (and would get wrong, given the user's standing no-API-key
   constraint memory).
3. The dispatch-plan markdown file is human-reviewable. A user inspecting
   the file before re-dispatching has a clear preview of every subagent
   brief; a script-driven CLI invocation hides that preview behind
   subprocess output.
4. The dispatch plan is itself an idempotent artifact: if the outer
   orchestrator interrupts mid-wave, the plan file persists on disk and the
   next session can resume from it.

**Prompt-contract shape (the script-to-subagent and subagent-to-script
contract):**

Each subagent dispatched by the workflow receives a self-contained brief
file at `coordination/feat-backfill/dispatch/<role>-<ISO-ts>.md` carrying:

- **Workspace path** (absolute) — for cross-workspace runs (§4).
- **Role identity** — which of the eight role-ids this dispatch targets.
- **Wave context** — Wave 126, the parent FEAT identifiers in scope.
- **File-set under review** — the explicit list of role-owned files the
  subagent must classify. The script enumerates this; the subagent does NOT
  scan the directory tree.
- **Existing FEAT registry snapshot** — the contents of
  `requirements/features/INDEX.md` registry table at brief-emit time, for
  the subagent to anchor proposals against.
- **Required output schema** — a JSON block (fenced under
  ` ```json` `) at the END of the subagent's response with the shape:

  ```json
  {
    "role": "<role-id>",
    "wave": 126,
    "proposals": [
      {
        "file": "<absolute path>",
        "current_parent_feat": "<FEAT-NNNN|null>",
        "proposed_parent_feat": "<FEAT-NNNN|ungrouped>",
        "confidence": "high|medium|low",
        "rationale": "<one-sentence why>",
        "conflict_with": ["<other role's proposed FEAT if known>"]
      }
    ],
    "new_feat_proposals": [
      {
        "feat_id": "<FEAT-NNNN>",
        "slug": "<lowercase-hyphenated>",
        "rationale": "<one-sentence>",
        "files_in_proposed_feat": ["<absolute path>", "..."]
      }
    ]
  }
  ```

- **Forbidden surfaces** (mirrors §6) — the brief includes the literal list
  of forbidden mutations so the subagent cannot accidentally propose them.

**Subagent return contract:**

The subagent writes its full response (including the JSON block) to
`coordination/feat-backfill/responses/<role>-<ISO-ts>.md`. The script reads
the response file, parses the JSON block at the bottom (using a
fenced-code-block extractor), and merges the proposals into the master
proposal manifest. If the JSON block is missing or malformed, the script
flags the response as ungrouped (fail-soft — see §8) and continues with the
other roles' responses.

**Wave 126 scope clarification:** Wave 126 ships only the script + the
prompt-contract spec + the test scaffolding. Actual orchestration of role
subagents to run the backfill in anger is a separate execution event, not a
Wave 126 deliverable. Wave 126's TEST-0005 exercises the script against a
fixture proposal manifest (no live subagent invocation).

---

## 4. Cross-workspace portability — `--workspace=<path>` is mandatory

**NFR-FEATBACKFILL-004 (portability, MUST):** The script MUST accept a
`--workspace=<path>` flag and operate on the named workspace's
`requirements/`, `architecture/`, `design/`, `tests/`, `ops/`, `src/`
directories — whichever subset exists. The script MUST NOT assume it is
running inside the apex-team repo and MUST NOT hard-code apex-team paths.

**Why it's load-bearing:** apex-team is a meta-project — the same eight-role
discipline is portable to any workspace that installs the subagents via
`scripts/install-agents-user-scope.sh`. The backfill command is most useful
on workspaces that adopted FEAT grouping LATE (after accumulating ungrouped
US/ARCH/UX/TEST/OPS files). Hard-coding apex-team paths would lock the
command to apex-team itself and defeat the meta-project value.

**Default value:** if `--workspace=<path>` is omitted, the script defaults
to the git toplevel of the current working directory (`git rev-parse
--show-toplevel`). This preserves the apex-team-local invocation path while
keeping the option open for cross-workspace use.

**Directory tolerance:** the script MUST tolerate any subset of the six
canonical directories being absent. A workspace with only `requirements/`
and `tests/` (e.g. a minimal pilot) backfills only those two surfaces. A
workspace with all six surfaces backfills all six. The script logs which
directories it found and which it skipped in the audit log.

**Subagent invocation = outer orchestrator's decision:** per §3, the script
itself does not invoke subagents. The dispatch-plan markdown emitted by the
script is workspace-agnostic in shape — the outer orchestrator handles the
mechanics of pointing subagents at the named workspace (e.g. by passing the
workspace path in the subagent prompt).

**Fitness function (TEST-0005 AC, deferrable):** a fixture workspace under
`tests/qa/features/FEAT-0005-feat-backfill-command/fixtures/` exercises the
`--workspace=<path>` flag against a synthetic project tree. The fixture
mirrors the apex-team directory shape but with minimal files; the test
asserts the script discovers the expected file list and produces the
expected proposal manifest.

---

## 5. Audit log shape — append-only, line-oriented, survives across runs

**NFR-FEATBACKFILL-005 (audit log, MUST):** The script MUST maintain an
append-only audit log at `<workspace>/coordination/feat-backfill/audit.log`.
The log MUST NOT be rewritten, rotated, or truncated by the script. Each
invocation appends one block of rows representing the actions taken (or
proposed, for dry-run) in that run.

**Why it's load-bearing:** the backfill command is the rare meta-tool that
edits files across five owners simultaneously. When a user later asks "why
does `architecture/features/FEAT-0042/ARCH-0091-foo.md` carry
`parent_feat: FEAT-0042` when the BA's INDEX says FEAT-0042 doesn't exist?",
the audit log is the answer-of-record. Without it, the backfill becomes a
silent rewrite of git history's natural intent.

**Canonical line format:**

```
<ISO-ts>\t<mode>\t<role>\t<file>\t<FEAT-XXXX|ungrouped>\t<action>
```

Field-by-field:

1. `ISO-ts` — `YYYY-MM-DDTHH:MM:SSZ`, UTC, second precision (matches
   ADR-018's verdict timestamp format).
2. `mode` — one of `dry-run` | `apply`. The mode the script was invoked in.
3. `role` — one of `business-analyst` | `architect` | `ux-designer` | `qa` |
   `devsecops` | `ui-developer` | `backend-developer` | `meta`. `meta` is
   reserved for cross-cutting actions (e.g. INDEX row insertion, FEAT
   number allocation).
4. `file` — workspace-relative path of the file the action targets. For
   cross-cutting actions targeting an INDEX row, this is the INDEX file
   path; the targeted ticket id appears in the action field.
5. `FEAT-XXXX|ungrouped` — the FEAT this action binds the file to, or
   `ungrouped` for files the backfill cannot confidently bind. `ungrouped`
   is a first-class outcome, not a failure.
6. `action` — one of:
   - `propose-frontmatter-add` (dry-run only) — file needs new frontmatter
   - `propose-frontmatter-amend` (dry-run only) — file needs `parent_feat:` added to existing frontmatter
   - `propose-noop` (dry-run only) — file already correctly bound
   - `propose-conflict` (dry-run only) — two roles propose different FEATs; see §7
   - `applied-frontmatter-add` (`--apply` only) — frontmatter added
   - `applied-frontmatter-amend` (`--apply` only) — `parent_feat:` added
   - `applied-noop` (`--apply` only) — file was already correct; no write
   - `applied-conflict-voided` (`--apply` only) — higher-number FEAT voided per §7
   - `applied-index-insert` (`--apply` only) — INDEX row inserted
   - `applied-index-noop` (`--apply` only) — INDEX row already present

**Tab-separated** — fields are separated by single literal tab characters
(`\t`, U+0009), not spaces. This matches typical UNIX log conventions and
lets `awk -F'\t'` parse the log without ambiguity (filenames may contain
spaces).

**Survives across runs:** the script MUST NOT delete or rotate the log.
Long-term, log size is bounded by run frequency (the backfill is a
once-per-wave operation) — a workspace running it monthly accumulates
~1 KB/year. A workspace with adversarial run frequency is itself a smell;
the log size signal is intentional, not a bug.

**Fitness function (TEST-0005 AC):** QA writes a test that invokes the
script twice and asserts the second invocation appends to the existing log
rather than overwriting it. A separate test asserts the line format
conforms to the regex `^[0-9T:Z-]+\t(dry-run|apply)\t[a-z-]+\t[^\t]+\t(FEAT-[0-9]{4}|ungrouped)\t[a-z-]+`.

---

## 6. Forbidden patterns — what the backfill MUST NOT do

**NFR-FEATBACKFILL-006 (forbidden surfaces, MUST):** The backfill command
MUST NOT perform any of the following actions, under either `dry-run` or
`--apply`:

1. **Move files.** Files retain their existing on-disk paths. The backfill
   binds files to FEATs via frontmatter only; it never relocates a file
   into a `features/FEAT-NNNN/` subdirectory.
2. **Rename existing US/FEAT/ARCH/UX/TEST/OPS files.** Filenames are stable
   identifiers. A `US-042-foo-bar.md` stays `US-042-foo-bar.md` regardless
   of which FEAT it gets bound to.
3. **Reassign FEAT numbers.** Existing `FEAT-0001` through `FEAT-0004`
   retain their assigned numbers. The backfill never renumbers a previously
   allocated FEAT.
4. **Modify the existing FEAT-0001 through FEAT-0004 parent documents** at
   `requirements/features/FEAT-NNNN-*.md`. The only allowed touch on these
   files is BA's own normal editorial workflow. The backfill writes to
   `parent_feat:` lines in legacy artifacts that point INTO these existing
   FEATs, never to the FEATs' own parent docs.
5. **Mutate `coordination/handoffs/*.md`.** HANDOFF docs are working memory
   owned by each role's per-turn self-edit. The backfill never touches them.
6. **Mutate `.claude/agents/*.md`.** Subagent bodies are ratified by the
   ADR-017 cleanliness gate and the Wave 109 co-authorship gate; the
   backfill has no business touching them.
7. **Mutate `architecture/decisions/ADR-*.md`.** ADRs are append-only by
   ADR-018 amendment discipline; the backfill respects that boundary.
8. **Touch git state.** The backfill never runs `git add`, `git commit`,
   `git branch`, `git push`. Staging and commit are the user's call after
   reviewing the on-disk diff.
9. **Network calls.** The backfill is offline. No `gh` invocations, no API
   calls. Workspace state is the only input.
10. **Delete files.** Even files the backfill cannot confidently classify
    are left in place with an `ungrouped` audit-log row.

**Allowed surfaces (the complement):**

- Frontmatter blocks at the head of role-owned files under
  `architecture/features/`, `requirements/user-stories/`, `design/features/`,
  `tests/qa/features/`, `ops/features/`, `src/features/` (where applicable).
  Only `parent_feat:` insertion is allowed; existing fields are not
  rewritten.
- Registry rows in `requirements/features/INDEX.md`,
  `architecture/features/INDEX.md`, and other role INDEXes. Only
  ticket-row insertion is allowed; existing rows are not rewritten.
- `coordination/feat-backfill/audit.log` — append-only.
- `coordination/feat-backfill/proposal-*.{md,json}` — created fresh per run.
- `coordination/feat-backfill/dispatch/<role>-*.md` — created fresh per run
  (when the script emits subagent briefs).
- `coordination/feat-backfill/responses/<role>-*.md` — read-only consumption
  by the script.

**Fitness function (TEST-0005 AC):** QA writes a test that invokes
`--apply` against a fixture workspace and asserts (a) no files under
`coordination/handoffs/` were touched, (b) no files under
`.claude/agents/` were touched, (c) no ADR file was touched, (d) `git status`
shows no changes to existing FEAT-0001 through FEAT-0004 parent documents.

---

## 7. Conflict resolution — lower FEAT number wins; higher voided in proposal report

**NFR-FEATBACKFILL-007 (conflict resolution, MUST):** When two role
subagents propose different FEAT numbers for files that the script's
clustering heuristic groups together (or that share a `parent_us:` link),
the lower-numbered FEAT wins. The higher-numbered FEAT is voided in the
proposal report.

**Why this rule (not "user picks"):** the alternative — pausing for human
disambiguation on every conflict — defeats the backfill's purpose (one-shot
retroactive repair). The lower-number rule is mechanical and deterministic.
Edge cases where the rule produces a bad outcome are flagged in the audit
log (action `applied-conflict-voided`) for the user to inspect post-run; if
the user disagrees, they can re-run with a manual override or hand-edit the
disputed files.

**Tie-breaking when FEAT numbers are equal but slugs differ:** can only
arise if two role subagents both propose a *new* FEAT (i.e. they each pick
the same next-available number). In this case the script halts the apply
phase for the conflicting tickets and emits an audit-log row with action
`propose-conflict` (dry-run) or refuses to apply (`--apply`). The user
resolves by re-running with `--workspace=<path>` after editing the
proposal manifest by hand.

**Voiding mechanism — INDEX allocation log Notes column:** the voided
higher-number FEAT is recorded in `requirements/features/INDEX.md`'s
allocation log table under a new Notes column. The row carries the
allocated-and-voided FEAT number with rationale text. This makes the
"missing" FEAT number transparent (a future reader sees `FEAT-0042 |
2026-06-07 | <role> (Wave 130) | VOIDED — superseded by FEAT-0041 via
backfill conflict resolution`).

**BA cooperation required:** the backfill script proposes the INDEX
allocation-log row edit; the actual FEAT-numbering authority remains BA per
Wave 122. Under `--apply`, the script writes the row directly only with the
BA's explicit pre-approval (signified by a `--ba-approved` flag, or by the
user re-running with a pre-edited proposal manifest). Without the flag,
the conflict surfaces as `propose-conflict` in dry-run and halts the apply.

**Fitness function (TEST-0005 AC):** QA writes a test that constructs a
fixture proposal manifest with two roles claiming the same logical cluster
under different FEAT numbers and asserts the script picks the lower number,
records the higher as voided in the audit log, and (under `--ba-approved`)
writes the voided row into the fixture INDEX.

---

## 8. NFR test posture — TEST-0005 mandatory assertions

**TEST-0005 (the test ticket for FEAT-0005) MUST assert all four of:**

**(a) Dry-run writes zero files outside `coordination/feat-backfill/`.**
Invoke the script without `--apply` against a fixture workspace; assert
`find <workspace> -newer <reference-marker> -type f` returns only paths
under `coordination/feat-backfill/`. Equivalent to NFR-FEATBACKFILL-002.

**(b) `--apply` is idempotent under double-invocation.** Invoke the script
with `--apply` twice against the same fixture proposal manifest; assert the
second invocation produces zero file writes outside the audit log (`git
diff --stat HEAD` reports no role-owned file changes). Equivalent to
NFR-FEATBACKFILL-001.

**(c) Audit log is append-only.** Capture the audit log size after run 1;
re-run; assert the post-run-2 log size is strictly greater than post-run-1
(strict inequality — re-run MUST emit at least one row, even if every
action is `applied-noop`). Equivalent to NFR-FEATBACKFILL-005.

**(d) Frontmatter parser is fail-soft.** Provide a fixture file with
deliberately corrupt YAML at the frontmatter position (e.g. unclosed
quote, invalid indentation). Assert the script (1) does not crash, (2)
emits an audit-log row classifying the file as `ungrouped` with action
`propose-noop` (dry-run) or `applied-noop` (`--apply`), and (3) leaves the
corrupt file untouched on disk. Frontmatter parsing failure MUST be
"this file gets skipped" — never "this run aborts" or "this file gets
overwritten with valid frontmatter wiping the malformed content."

**Beyond the four mandatory assertions:** QA SHOULD cover the seven-NFR
fitness functions enumerated in §§1–7 (one per NFR) but the four above are
the load-bearing assertions that gate the wave. Additional coverage is
welcome but not Architect-required.

**Test-running discipline:** TEST-0005 invokes the script as a Node
subprocess against fixture workspaces under
`tests/qa/features/FEAT-0005-feat-backfill-command/fixtures/`. No mocking;
the test exercises the real binary against real (fixture) on-disk state.
This matches QA's existing pattern for FEAT-0002 / FEAT-0003 tests, which
parse real artifact files rather than mocked input.

---

## 9. Deferrable follow-ups (out of scope this wave)

These are improvements surfaced by this ratification but explicitly out of
scope per the dispatch brief. Tracked here for future wave triage; the PO
sequences them.

1. **Live subagent orchestration.** Wave 126 ships the script + the
   prompt-contract spec. Actually running the backfill against an
   accumulated apex-team backlog of ungrouped files (and against any
   external workspace) is a downstream execution event, not a Wave 126
   deliverable. Trigger: any time the BA observes more than ~5 ungrouped
   role-owned files across the workspace.
2. **`--ba-approved` flag implementation.** §7 references this flag for
   FEAT-voiding under conflict. Wave 126's MVP can ship without the flag
   (always halts on conflict in `--apply`); the flag is a v2 enhancement.
   Trigger: first real backfill run that surfaces a conflict the user
   wants to resolve in-band.
3. **Cross-workspace dogfood.** Per §4, the `--workspace=<path>` flag
   targets external workspaces. The first non-apex-team workspace to
   adopt FEAT grouping is the dogfood target. Trigger: BA confirms a
   sibling repo (e.g. `apex-team-viewer`) has accumulated enough role-owned
   artifacts to benefit.
4. **Audit-log rotation policy.** §5 specifies append-only with no
   rotation. If a workspace ever exceeds a reasonable bound (>1 MB log,
   indicating the backfill is being run as a routine rather than a
   one-shot repair), the rotation policy needs definition. Trigger:
   audit-log size exceeds 1 MB in any workspace.

---

## 10. Cross-references

- `architecture/workspace-conventions.md` §"FEAT-XXXX feature grouping
  (Wave 122 — MANDATORY)" — convention this backfill exists to enforce
  retroactively.
- `architecture/decisions/ADR-018-pass-verdict-format.md` — PASS-verdict
  format the Lane 2 review verdicts will use.
- `architecture/decisions/ADR-017-subagent-body-rewrite-rules.md` — the
  cleanliness gate that the backfill MUST NOT cross (subagent bodies are
  forbidden surfaces per §6 item 6).
- `architecture/decisions/ADR-014-handoff-fragment-pattern.md` — historical
  HANDOFF fragment pattern (retired Wave 113); cited only as context for
  the script's `coordination/feat-backfill/` choice of directory name
  (parallel structure: a dedicated `coordination/` subdir per coordination
  surface).
- `architecture/INDEX.md` — Architect top-level index.
- `architecture/features/INDEX.md` — ARCH-0002 row added to registry +
  allocation log.
- `requirements/features/INDEX.md` — BA's FEAT registry; the backfill
  proposes new rows into this index.
- `requirements/features/FEAT-0005-feat-backfill-command.md` (BA, Lane 1)
  — parent FEAT document.
- `requirements/user-stories/US-102-*.md` (BA, Lane 1) — driving user story.
- `design/features/FEAT-0005-feat-backfill-command/UX-0002-*.md` (UX,
  Lane 1) — expected no-impact CLI surface.
- `tests/qa/features/FEAT-0005-feat-backfill-command/TEST-0005-*.test.ts`
  (QA, Lane 2) — the four mandatory assertions of §8.
- Script source `scripts/feat-backfill/` (BE Dev / DevSecOps, Lane 2)
  — implementation target.
