---
id: US-047
title: Towncrier-style HANDOFF fragment pattern — eliminate doc-collision class (Wave 93)
status: superseded
wave: 93
closes: "#212"
owner: BE Dev (fold script + pre-commit hook) + DevSecOps (pre-commit hook) + all roles (skill edits)
created: 2026-06-02
accepted: 2026-06-02
---

## Resolution — superseded by Wave 112

The `_handoff-pending/` fragment pattern was introduced and then retired within the same wave chain. AC1 of US-091 (Wave 112, PR #392, `8ba1bbb`) deleted the `_handoff-pending/` directory and rewrote the pre-commit hook to check `coordination/handoffs/*.md` directly. `scripts/fold-handoff.ts` and `pnpm fold-handoff` no longer exist. The direct-HANDOFF-edit model replaced the fragment pattern. Additionally, ACs targeting `src/lib/skills/*.ts` body edits are moot — those monolith files retired at Plan C cutover (PRs #373 + #374).

## Story

As the team, I want HANDOFF and INDEX updates to be per-role fragment files (`_handoff-pending/<wave>-<role>.md`) that PO folds into the canonical files at wave close, so that no two PRs ever touch HANDOFF.md simultaneously and the doc-collision merge-conflict class disappears regardless of whether the merge is local or via GitHub's server-side button.

## Background

US-046 (Wave 92) patches DevSecOps to invoke the `merge=union` driver locally. This fixes ONE failure mode (GitHub bypasses the driver). It does NOT fix:
- Multiple PRs inserting new NOW blocks at the top of HANDOFF.md — `merge=union` concatenates in arbitrary order, scrambling the canonical "newest on top" structure.
- Merge paths that bypass the driver (CI tooling, 3rd-party integrations, GitHub web UI).

The fragment pattern — used by Twisted, pytest, pip, and attrs via `towncrier` — eliminates the conflict class: if no two PRs ever touch the same file, conflicts cannot occur. Each role writes a small fragment; PO folds all fragments into a single consolidated NOW block at wave close.

## Acceptance criteria

1. **`scripts/fold-handoff.ts`** (~40 LOC) — reads all `_handoff-pending/*.md` files, prepends a consolidated wave-close entry to HANDOFF.md's NOW block, then `git rm`s the fragments. Idempotent (safe to run twice). Invoked as `pnpm fold-handoff`.

2. **`.githooks/pre-commit` update** — during the transition, accept either a HANDOFF.md direct change OR a `_handoff-pending/*.md` addition for source-code PRs. Pure tiny-ops PRs (housekeeping exception) may omit both.

3. **Role skill amendments** in `src/lib/skills/*.ts` — for all 7 implementer roles (BA, Architect, UI Dev, BE Dev, QA, DevSecOps, UX Designer): replace "update HANDOFF.md NOW block" with "write fragment to `_handoff-pending/<wave>-<role>.md` using the structured 4-section format (Done · In flight · Next · Notes)". PO's skill/prompt receives the complementary instruction: at wave close, run `pnpm fold-handoff` and commit the result. PO does NOT write a fragment — the fold commit itself is PO's state update for that wave. Multi-wave PRs use the primary implementation wave in the fragment filename.

4. **Wave-close trigger** — when the last PR of a wave merges, PO runs `pnpm fold-handoff` and commits the consolidation (commit message: "chore: fold Wave <N> HANDOFF fragments"). This replaces the current "each PR amends HANDOFF.md" pattern.

5. **Migration safety** — existing HANDOFF.md format is preserved; the pre-commit hook accepts both old (direct HANDOFF.md edit) and new (fragment) approaches during the transition wave. The old approach is not broken until all roles have been updated.

6. **Unit tests** — test suite covers: (a) 3 fragments → 1 consolidated NOW block in correct order, (b) fragments deleted after fold, (c) idempotent: fold with no fragments is a no-op.

7. **LESSONS.md entry** — append: "Wave 93 — fragment pattern (towncrier-inspired) for HANDOFF.md prevents doc-collision merge conflicts by ensuring no two PRs touch the same file; PO folds fragments at wave close with `pnpm fold-handoff`."

8. **Wave 64 dev-smoke applies** — `pnpm build` (exit 0) + `GET /api/health` (200, mcpMounted:true) on `:3100` before QA PASS.

## Out of scope

- Rewriting historical HANDOFF.md entries.
- Removing `merge=union` from `.gitattributes` (keep as belt-and-braces; US-046 remains valid).
- Multi-wave concurrent fold (single PO process is the fold orchestrator; parallelism deferred).
- Extending the fragment pattern to `requirements/INDEX.md` and `architecture/INDEX.md` (possible future enhancement; out of scope for Wave 93).

## Dependencies

- US-046 (Wave 92) should ship first — it unblocks today's merge jam; US-047 prevents the next class.
- BE Dev's Wave 93 technical design (fold script schema + fragment format) must reconcile with these ACs before status moves to `accepted`. BE Dev designing in parallel this wave.

## Open questions

| ID | Question | Resolution |
|----|----------|------------|
| OQ-US047-1 | Fragment file format — free-form MD or structured sections (Done/In flight/Next/Notes)? | **RESOLVED 2026-06-02** — Structured 4-section format confirmed by BE Dev Wave 93 design. AC3 updated accordingly. |
| OQ-US047-2 | Does the fold script need to handle `requirements/INDEX.md` fragments too, or just HANDOFF.md? | **RESOLVED 2026-06-02** — HANDOFF.md only for Wave 93. INDEX.md deferred (`.gitattributes` union driver already covers it). Out of scope added to AC Out of Scope section. |
| OQ-US047-3 | Who triggers fold-handoff — PO manually or auto-triggered by DevSecOps post-last-merge? | **RESOLVED 2026-06-02** — PO manually runs `pnpm fold-handoff` at wave close for Wave 93. Automated trigger deferred to a future wave; defining "last PR of a wave" programmatically requires wave-PR registry (not worth building now). AC4 already captures this. |

## Notes

- This story's ACs are intentionally impl-shape-agnostic. BE Dev Wave 93 technical design owns the fold script's internal logic; the ACs define the observable contract (what it does, not how).
- Composes with ADR-013 (`merge=union`): belt-and-braces. Fragment pattern prevents new collisions; union driver catches any legacy misses on rebase of older branches.
- **Fold date vs PR date (Q5, resolved):** The NOW block header date in the folded HANDOFF.md reflects when `fold-handoff` ran (wave-close date), not when each fragment PR was written. This is intentional — the fold date is the canonical wave-close timestamp. Fragment content carries its own temporal context implicitly from the Done/In flight/Next sections.
- **Multi-wave PRs (Q3, resolved):** Fragment filename uses the primary implementation wave. Convention documented in AC3.
- **INDEX.md scope (Q4, resolved):** Out of scope for Wave 93 per Out of Scope section. Address in a future wave only if union-merge collisions on INDEX.md recur despite `.gitattributes`.
