---
name: US-081-self-heal-l3-auto-merge
description: Self-heal L3 — DevSecOps auto-merge green PRs with hardened gate + user-off bypass; closes #318
metadata:
  type: user-story
  status: accepted
  owner: DevSecOps
  issue: "#318"
  wave: pending-triad
  last-modified: 2026-06-03
---

## Story

As an apex-team operator, when a PR is fully green (MERGEABLE + CLEAN + all gates PASS + closes a real open issue), I want the DevSecOps role to merge it automatically as part of its normal turn so the merge train doesn't stall waiting for a human button-press, without auto-merging anything ambiguous, flaky, or unverified.

## Acceptance criteria

### Gate predicate (all 6 conditions G1–G6 must hold, per ADR-017)

1. **G1 — Merge state:** `mergeable=MERGEABLE` AND `mergeStateStatus=CLEAN`.
2. **G2 — CI checks:** Every required check has `conclusion=success` (no `neutral`, `skipped`, `cancelled`).
3. **G3 — Closes real open issue:** PR body matches `\bcloses #(\d+)\b` AND `gh issue view <n>` returns OPEN issue.
4. **G4 — Not recently updated:** PR has NOT been updated in the last 5 min (avoids racing with active edits).
5. **G5 — Explicit gate PASS:** PR has at least one explicit PASS verdict from QA OR Architect recorded in the thread's `pr_status` row. UI-touching PRs additionally require UX PASS (per routing rule in US-016).
6. **G6 — Author role or label:** PR was opened by an apex-team agent role (not a human), OR is explicitly labeled `auto-merge-allowed`. **G6 also requires** `mergeable` and `mergeStateStatus` to be re-fetched ≤30s before the merge attempt (stale-state guard).

### Merge execution

7. **Atomic merge** — single `gh pr merge <n> --squash --delete-branch`. On any non-zero exit: log + open a follow-up issue + emit HANDOFF to PO. Do NOT retry.
8. **Single PR per turn (P4):** At most one auto-merge per DevSecOps turn.
9. **Cooldown:** Once auto-merge fires on a PR, DevSecOps must not attempt auto-merge again on ANY PR for 60 seconds (prevents thrash on stale gh CLI state).

### Audit and bypass

10. **Audit trail** — every auto-merge writes one row to `pr_status` with `mergedBy=devsecops-auto`, `mergeSha`, `timestamp`, and the list of gates it verified.
11. **User-off bypass (invariant, NFR-SEC-002):** `data/.user-off` sentinel suppresses auto-merge unconditionally, checked before each individual merge attempt.
12. **Global bypass:** env `DEVSECOPS_AUTO_MERGE=off` disables the skill globally. Per-PR escape: label `no-auto-merge`.

### Post-merge CI watch (NFR-SEC-003)

13. **Post-merge CI probe:** After each auto-merge, probe `main` CI within 2 min. If `FAILURE` → write `data/.auto-merge-paused` + macOS notification + dashboard banner. Resume via `pnpm auto-merge:resume`.
14. **Cascade threshold:** 3 consecutive merges producing `main` CI failure within 5 min → permanent pause. Uses `data/.merge-history.json`. Mirrors L2's `STALL_CASCADE_LIMIT`.

### Test coverage

15. **Unit tests for the gate predicate** covering each false case: mergeable=false, check=neutral, no `closes#`, `closes#` resolves to closed issue, recent update, missing QA/Architect verdict, missing role-author/label combo, bypass-on.

### Documentation

16. **Documented** in `src/lib/skills/devsecops.ts` and `docs/operations/auto-merge.md`.

## Open questions

| ID | Question | Working assumption | Status |
|---|---|---|---|
| OQ-318-001 | String-match vs structured gate verdicts — string matching in `pr_status` is the weakest link | String-match for MVP; Architect to ratify or spec structured schema | Open |
| OQ-318-002 | Self-authored PRs in scope? (DevSecOps merging its own PR is a conflict-of-interest) | Yes, in scope — DevSecOps agent is trusted; restrict via G6 author-role check | Open — Architect to confirm |
| OQ-318-003 | `pnpm auto-merge:resume` — package.json script or shell script convention? | package.json script per apex-team conventions | Open |
| OQ-318-004 | Does user-off (`data/.user-off`) also suppress the post-merge CI watch? | No — CI watch is read-only monitoring; only merge-action suppressed | Open |

## Out of scope

- L1 launchd plist install (US-079).
- L2 stall detector (US-080).
- Human-initiated merge flows.

## Notes

- L3 of the 3-layer self-heal. Eliminates the "human merge button" reason the outer claude-code session needed to keep polling.
- All four models in apex_synthesize 2026-06-03 flagged auto-merge as the highest-blast-radius piece of the bundle — gate hardening (G1–G6 + NFR-SEC-002/003) is the direct response.
- ADR-017 (`architecture/decisions/ADR-017-self-heal-l3-auto-merge-gate.md`) is the design authority for this story. Gate contract is derived from that ADR.
- Architect NFR brief received 2026-06-03 (Wave 121 inbox); ADR-017 on disk; OQs above reflect Architect's four open questions from the brief.
- Discovered during: 2026-06-03 self-heal architecture review.
