---
ticket: FEAT-0005
parent_feat: FEAT-0005
parent_us: US-102
role: business-analyst
status: active
feat: FEAT-0005
title: "FEAT Backfill Command"
created: 2026-06-04
wave: 126
related-us: US-102
related-arch: "ARCH-0002 (pending — Wave 126 Architect lane)"
related-design: "TBD (UX impact TBD — Wave 126 UX lane)"
related-tests: "tests/qa/features/FEAT-0005-feat-backfill-command/TEST-0005-feat-backfill-command.test.ts"
related-ops: "OPS-0004 (DevSecOps `pnpm run feat:backfill` script + ops/pipelines/ integration; OPS-0001..0003 taken by Wave 124 pipeline templates)"
---

# FEAT-0005 — FEAT Backfill Command

This feature adds a CLI script (`scripts/feat-backfill.mjs`) and a `pnpm run feat:backfill`
convenience wrapper that retroactively groups existing workspace artifacts under FEAT-XXXX
identifiers, following the Wave 122 FEAT-XXXX grouping convention (US-098 / FEAT-0001).

The viewer already renders FEAT-0001/0002/0003/0004 under FEAT cards. This feature ensures
all legacy pre-Wave-122 artifacts that belong to a feature can be grouped retroactively via
YAML frontmatter injection, without any file moves.

---

## What this feature is

Every new feature since Wave 122 ships with YAML frontmatter and is placed under a per-role
`features/FEAT-XXXX-<slug>/` directory from the start. Legacy artifacts that predate Wave 122
have no frontmatter and live in flat directories. The viewer cannot associate them with a FEAT
unless frontmatter is injected.

The backfill command:

1. Dispatches role-scoped subagent tasks that scan each role's owned directory.
2. Each role proposes a mapping of its legacy artifacts to FEAT-XXXX numbers.
3. A PO reconciliation pass merges proposals into canonical FEAT-XXXX numbers.
4. The script emits a human-readable proposal report and a machine-readable dispatch plan.
5. On `--apply`, the script injects YAML frontmatter into matched files — no file moves.
6. Ungrouped assets are collected in a manual-review bucket for the user to triage.

The command works on ANY workspace with the standard directory layout, not just apex-team
itself. Cross-workspace invocation: `node /path/to/apex-team/scripts/feat-backfill.mjs
--workspace=/path/to/other/repo`.

---

## Driving user story

[US-102 — Retroactive FEAT Backfill Command](../user-stories/US-102-retroactive-feat-backfill-command.md)

See US-102 for the full 13 acceptance criteria. This FEAT doc is the feature parent;
US-102 is the child story specifying what "done" looks like.

---

## Scope of FEAT-0005

FEAT-0005 covers:

- `scripts/feat-backfill.mjs` — the CLI script; cross-workspace capable.
- `pnpm run feat:backfill` — convenience entry point in `package.json`.
- `coordination/feat-backfill/` — output directory for proposal + dispatch-plan + audit log.
- YAML frontmatter injection on `--apply` (additive only; no file moves, no renames).
- Dry-run mode (default) producing the proposal and dispatch-plan files without mutation.
- Idempotence: re-running `--apply` is a no-op when frontmatter is already present.
- Regression test (TEST-0005) asserting dry-run zero-write, frontmatter syntax, audit log
  format, idempotence, and fail-soft YAML parser.

Out of scope:

- File moves or renames (Wave 127+).
- Automatic FEAT-XXXX number reassignment.
- Viewer UI changes (viewer already renders FEAT cards; no new viewer work needed).
- Retroactive linking of git history (commit-SHA backfill not in scope).
- Auto-creation of new FEAT-XXXX numbers for unknown groupings (manual: user edits proposal).

---

## Per-role artifact links

| Role | Ticket | Path | Status |
|---|---|---|---|
| BA | FEAT-0005 (this file) + US-102 | `requirements/features/FEAT-0005-feat-backfill-command.md` + `requirements/user-stories/US-102-retroactive-feat-backfill-command.md` | active — Wave 126 |
| Architect | ARCH-0002 | `architecture/features/FEAT-0005-feat-backfill-command/ARCH-0002-feat-backfill-command.md` | pending — Wave 126 triad |
| UX Designer | TBD | `design/features/FEAT-0005-feat-backfill-command/` | pending — Wave 126 UX impact analysis |
| QA | TEST-0005 | `tests/qa/features/FEAT-0005-feat-backfill-command/TEST-0005-feat-backfill-command.test.ts` | pending — Wave 126 implementation |
| FE Dev | (not applicable — no UI surface) | — | not applicable |
| BE Dev | (not applicable — CLI script, no server) | — | not applicable |
| DevSecOps | OPS-0004 | `ops/features/FEAT-0005-feat-backfill-command/OPS-0004-feat-backfill-script.md` + `pnpm run feat:backfill` script wiring | done — Wave 126 shipped |

---

## Acceptance criteria summary

See US-102 for full testable ACs. Feature-level tracking:

- [ ] AC1 — CLI shape: `pnpm run feat:backfill [--all|--feat=FEAT-XXXX] [--role=<r>...] [--apply] [--out=<path>] [--workspace=<path>]`
- [ ] AC2 — Dry-run is default; `--apply` is opt-in
- [ ] AC3 — Proposal report at `coordination/feat-backfill/proposal-<ISO>.md`
- [ ] AC4 — Dispatch-plan at `coordination/feat-backfill/dispatch-plan-<ISO>.md`
- [ ] AC5 — Each role reads only its own owned directory
- [ ] AC6 — Frontmatter-only mutation on `--apply`; no file moves
- [ ] AC7 — PO reconciliation pass: deterministic FEAT-XXXX canonicalization (lower number wins)
- [ ] AC8 — `--feat=FEAT-XXXX` mode: FEAT file must pre-exist; no auto-creation
- [ ] AC9 — Ungrouped bucket with one-line reasons; user edits + re-runs `--apply`
- [ ] AC10 — Idempotence: re-running `--apply` is a no-op when frontmatter already present
- [ ] AC11 — Audit log at `coordination/feat-backfill/audit.log` (TSV, ISO-ts / mode / role / file / FEAT or ungrouped / action)
- [ ] AC12 — TEST-0005 regression: dry-run zero-write + frontmatter syntax + audit log format + idempotence + fail-soft YAML parser
- [ ] AC13 — Smoke check: after `--apply` on apex-team, viewer's `/api/artifacts?role=<r>` renders formerly-ungrouped legacy docs under FEAT cards

---

## Status history

| Date | Wave | Status | Note |
|---|---|---|---|
| 2026-06-04 | 126 | draft → active | BA authored FEAT-0005 + US-102. Wave 126 requirements phase (triad) in progress. Allocations verified: FEAT-0004 was highest (now FEAT-0005 allocated), US-101 was highest (now US-102 allocated). |
