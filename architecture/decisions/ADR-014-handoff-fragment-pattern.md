# ADR-014 — Towncrier-style HANDOFF fragment pattern: eliminate the doc-collision conflict class at the source

- **Status:** Superseded by ADR-017 under the subagent runtime (Wave 108). Kept Accepted for the monolith-history record; new subagent work edits `coordination/handoffs/<role-id>.md` directly.
- **Date:** 2026-06-02
- **Wave:** 93
- **Issue:** #212 (US-047 `accepted`)
- **Relates / composes with:** ADR-013 (`merge=union` driver — belt-and-suspenders, see "Composition")
- **Superseded by:** ADR-017 (Wave 108) for `.claude/agents/*.md` subagent bodies. The fragment mechanism does not exist under the subagent runtime.

## Context

ADR-013 attacked the doc-only `CONFLICTING` class with a `merge=union` driver on
`HANDOFF.md` and friends. That is a real fix, but it has two structural holes that
keep the conflict class *alive*, not *eliminated*:

### Hole 1 — `merge=union` only fires on the driver path

`merge=union` is honored **only by a local 3-way merge/rebase with the driver
configured** (ADR-013 Consequences, last bullet). The paths that bypass it:

- **GitHub's server-side "Update branch" / squash-merge button** — runs on GitHub's
  servers with no custom driver. This is the exact path the merge-train cascade keeps
  hitting (#202, #209). DevSecOps must rebase *locally* for the driver to fire; any
  server-side action silently reverts to default 3-way and re-conflicts.
- Future CI tooling, web-UI edits, third-party integrations — none configure the driver.

So `merge=union` is liveness insurance **conditional on operator discipline**. The
moment a merge takes the server-side path, the conflict is back.

### Hole 2 — union scrambles the "newest NOW block on top" invariant

Even when the driver *does* fire, `merge=union` emits the line-union of both sides in
**arbitrary order**. The `HANDOFF.md` convention (global CLAUDE.md, Part A) requires the
current NOW block at the **top**. Two PRs each prepending a fresh NOW block produce a
union with two interleaved blocks in nondeterministic order — mergeable, but structurally
wrong, requiring a human/agent re-tidy every wave (ADR-013's "accepted tradeoff"). The
driver buys liveness at the cost of recurring cleanup toil.

The root cause behind both holes is the same: **every PR writes to one shared file.**
As long as that is true, conflict is a *merge-time* problem we can only ever *mitigate*.

## Decision

**Adopt the towncrier news-fragment pattern for `HANDOFF.md`: each role's PR writes its
own per-wave fragment file; the PO folds all fragments into the canonical `HANDOFF.md`
NOW block at wave close.** Because no two PRs ever touch the same path, the conflict
cannot form — it is eliminated at *author* time, not mitigated at *merge* time.

This is the same mechanism Twisted, pytest, pip, and attrs use via `towncrier`, and that
Changesets uses in the JS ecosystem. It is a well-worn pattern, not a novel invention —
naming it (rather than reinventing per-wave fixes) is the point.

### The convention — `_handoff-pending/<wave>-<role>.md`

Each implementer role, in its wave PR, **stops editing `HANDOFF.md` directly** and instead
adds one fragment file:

```
_handoff-pending/<wave>-<role>.md      e.g. _handoff-pending/93-architect.md
```

- Filename is `<primary-implementation-wave>-<role>`. Multi-wave PRs use the **primary**
  wave number (US-047 AC3).
- The fragment body uses a **structured 4-section format** (resolved OQ-US047-1):

  ```markdown
  ## Done
  - <what shipped this wave>
  ## In flight
  - <what's mid-stream / carrying forward>
  ## Next
  - <what's queued>
  ## Notes
  - <caveats, gotchas, links>
  ```

  Structured-not-free-form so the fold step can concatenate deterministically and the
  output reads as one coherent NOW block rather than a prose pile.

- **PO writes no fragment.** The fold commit itself *is* PO's state update for the wave
  (US-047 AC3). This avoids the PO racing its own consolidation.

### The fold mechanism — `pnpm fold-handoff`

`scripts/fold-handoff.ts` (~40 LOC, idempotent — BE Dev owns the internal logic; this ADR
fixes the observable contract):

1. Read every `_handoff-pending/*.md`.
2. Prepend **one consolidated NOW block** to `HANDOFF.md`, dated with the **fold/wave-close
   date** (not per-fragment dates — resolved Q5; the wave-close timestamp is canonical).
3. `git rm` the folded fragments.
4. Idempotent: a fold with **zero** pending fragments is a **no-op** (US-047 AC6c) — safe to
   run twice, safe to run on a clean tree.

**Trigger (Wave 93 scope):** PO runs `pnpm fold-handoff` **manually at wave close** (when the
last PR of a wave merges) and commits `chore: fold Wave <N> HANDOFF fragments`. Auto-triggering
on "last PR merged" is **deferred** — defining "last PR of a wave" programmatically needs a
wave-PR registry not worth building now (resolved OQ-US047-3).

### Migration safety (non-negotiable — no flag-day)

The pre-commit hook accepts **either** a direct `HANDOFF.md` edit **or** a
`_handoff-pending/*.md` addition for source-code PRs during the transition (US-047 AC2, AC5).
The old direct-edit path is **not broken** until all 7 roles' skills are updated. Pure
housekeeping / tiny-ops PRs may omit both (matches the existing `[exception: housekeeping]`
carve-out). This lets the convention roll out role-by-role without stalling in-flight branches.

### Scope boundary (this ADR / Wave 93)

- **`HANDOFF.md` only.** `requirements/INDEX.md` and `architecture/INDEX.md` stay on the
  `merge=union` driver (ADR-013) — they are line-oriented and union-clean, so the fragment
  overhead isn't justified yet (resolved OQ-US047-2). Revisit only if union collisions on
  INDEX files recur.
- **`merge=union` is NOT removed** (US-047 Out-of-scope). See Composition below.

## Composition — why we keep BOTH (belt-and-suspenders)

This is the crux the PO asked the ADR to nail. The two mechanisms cover **disjoint** failure
windows; neither is redundant:

| Mechanism | Failure window it covers | Window it CANNOT cover |
|---|---|---|
| **ADR-013 `merge=union`** | **Legacy** collisions on **rebase of older branches** that still carry direct `HANDOFF.md` edits — i.e. PRs authored *before* the fragment convention reached their role. Auto-resolves them on a **local** rebase. | Server-side merge path (GitHub "Update branch" button); NOW-block ordering. |
| **ADR-014 fragments** | **New** collisions — prevented outright, **regardless of merge method**, because the files are disjoint. Covers the **server-side `update-branch` path the union driver structurally cannot** reach, since "no shared file" is a property of the *diff*, not of the *merge driver*. | Branches authored before the convention landed (covered by union). |

Read together:

> **Fragments prevent the conflict from ever forming on new work (any merge path);
> `merge=union` cleans up the legacy/in-flight branches that still touch `HANDOFF.md`
> directly, on the local-rebase path. The fragment pattern is the durable fix; the union
> driver is the migration safety net and the catch-all for any direct-edit that slips
> through.**

Removing `merge=union` now would re-expose every not-yet-migrated branch to hard conflicts
during the transition wave. Keep both until every role is on fragments **and** no
direct-`HANDOFF.md` branches remain open — then `merge=union` becomes pure defense-in-depth
(harmless, retained).

## Standard encoded

> **Coordination docs that every PR appends to MUST move from shared-file edits to
> per-author fragment files folded at a barrier (wave close), once the append frequency
> makes merge-time resolution a recurring tax. Prevent the conflict at author time; do not
> keep paying to resolve it at merge time. A merge driver is a mitigation, a fragment
> pattern is the elimination — prefer elimination for the hot file, retain the driver for
> the long tail.**

## Consequences

**Positive**
- The doc-collision class is **eliminated for new work on any merge path** — including the
  server-side `update-branch` path that `merge=union` provably cannot cover. This is the
  durable fix #202/#209 kept dancing around.
- No more per-wave NOW-block re-tidy toil from union interleaving — the fold produces one
  ordered block deterministically.
- Pattern is industry-standard (towncrier) — onboarding cost is "read the towncrier docs,"
  not "learn our bespoke thing."

**Negative / follow-ups**
- Adds a **wave-close ritual** (`pnpm fold-handoff` + commit). If PO forgets, fragments
  accumulate in `_handoff-pending/` — visible drift, but harmless (fold is idempotent and
  catches up). A future auto-trigger (deferred) closes this.
- 7 role-skill edits (`src/lib/skills/*.ts`) + 1 PO-prompt edit must land together or the
  migration window stretches; the dual-accept pre-commit hook makes a partial rollout safe
  but not free.
- One more script + hook branch to maintain and test (fitness function below).

## Fitness functions

- **F1 (fold correctness):** unit test — 3 fragments fold into **1** consolidated NOW block in
  deterministic order, with the wave-close date in the header (US-047 AC6a). Wire into CI.
- **F2 (cleanup):** test — fragments are `git rm`'d after a successful fold (AC6b).
- **F3 (idempotency):** test — `fold-handoff` with **zero** pending fragments is a no-op and
  exits 0 (AC6c). Guards against double-run during the merge cascade.
- **F4 (migration gate):** pre-commit hook test — a source-code PR with **neither** a
  `HANDOFF.md` edit **nor** a `_handoff-pending/*.md` add is **rejected**; one with **either**
  passes; a housekeeping-tagged PR with neither passes (AC2/AC5).

## Out of scope (tracked separately)

- Auto-triggering the fold on "last PR of a wave merged" — needs a wave-PR registry
  (OQ-US047-3 deferred).
- Extending fragments to `requirements/INDEX.md` / `architecture/INDEX.md` (OQ-US047-2 —
  `merge=union` covers them adequately for now).
- Rewriting historical `HANDOFF.md` entries (US-047 Out-of-scope).
- Removing `merge=union` post-migration — a separate decision once no direct-edit branches
  remain; this ADR explicitly retains it.
