# ADR-013 — Merge-Train Conflict Resilience (`merge=union` + mergeable-state rescue)

- **Status:** Accepted
- **Date:** 2026-05-30 (Wave 92)
- **Wave:** 92
- **Issue:** #209 (PR — `.gitattributes` union-merge driver + F1 fitness test)
- **Relates to:** ADR-014 (HANDOFF fragment pattern — composes with this; see "Composition" in ADR-014)
- **Superseded by:** nothing — ADR-014 RETAINS this decision as belt-and-suspenders.

## Context

The merge train frequently produced `CONFLICTING` PRs on `HANDOFF.md` and related
coordination docs (`requirements/INDEX.md`, `architecture/INDEX.md`). Both PRs in a
wave append to the same file (each prepends a NOW block, or appends a row); a standard
3-way merge treats these as conflicts even though the changes are semantically
non-overlapping append operations.

Manually resolving these per-wave was a recurring tax. The conflict pattern is
mechanical, not semantic — it is produced by two append operations to the same file.

## Decision

**Configure a `merge=union` custom git merge driver on `HANDOFF.md` and
append-only coordination index files via `.gitattributes`.** The union driver emits the
line-union of both sides rather than flagging a conflict, auto-resolving the
`CONFLICTING` state on a local rebase.

`.gitattributes` entries (D1, implemented in PR #209):
```
HANDOFF.md                  merge=union
requirements/INDEX.md       merge=union
architecture/INDEX.md       merge=union
```

Git global config (or repo `.git/config`): `merge.union.driver = true` (built-in).

**Fitness function F1:** a test asserts the `.gitattributes` entries exist for all three
paths — wired into CI in PR #209.

## Consequences

**Positive**
- Append-only conflicts on the three coordination files auto-resolve on local rebase
  without operator intervention.
- Covers the "legacy / in-flight branch" window: any PR authored before the ADR-014
  fragment convention reaches its role still benefits from the union driver on local
  rebase.

**Negative / accepted tradeoffs**
- `merge=union` is honored **only on local 3-way rebase** with the driver configured.
  GitHub's server-side "Update branch" / squash-merge path runs on GitHub's servers with
  no custom driver — the union driver is silently bypassed and the conflict re-forms.
  (ADR-014 attacks this gap at the source by eliminating the shared-file write entirely.)
- Two PRs both prepending a NOW block produce a union in **nondeterministic line order**,
  violating the "newest block on top" invariant in `HANDOFF.md`. A per-wave re-tidy is
  still required after a union merge. (ADR-014's fold step eliminates this for new work.)

Both tradeoffs are accepted: the union driver is retained post-ADR-014 as defense-in-depth
for the migration window and any direct-edit that slips through. See ADR-014 §Composition
for the detailed belt-and-suspenders rationale.

## Note (recovered stub)

This file was reconstructed from PR #209 commit history and ADR-014's detailed description
of the two-mechanism composition model. The original ADR-013 file was never committed to
disk — likely drafted in-session and lost before the PR was opened. The decision itself is
implemented (`.gitattributes` is live). If the original detailed spec is later found,
supersede this stub.
