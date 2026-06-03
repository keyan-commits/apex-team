# ADR-017 — Self-Heal L3: Auto-Merge Gate Contract

**Date:** 2026-06-03
**Status:** Proposed
**Requirement:** #318 / US-#318 (pending)
**Layer:** L3 of the 3-layer self-heal architecture (L1 = US-079 / ADR launchd; L2 = US-080 multi-signal stall detector)
**Owner role:** devsecops

---

## Context

DevSecOps currently merges PRs manually after receiving HANDOFF messages containing gate verdicts. This is reliable but blocks forward progress whenever DevSecOps is occupied (merge train queued behind an in-flight turn). With L1 launchd respawn (US-079) and L2 stall-exit (US-080) shipping, the remaining single-point-of-failure is human-gated merges: the team can restart itself but cannot unblock its own queue without a DevSecOps turn.

**Risk:** Automated merge authority is the highest-privilege action in the system — a mis-merge that reds `main` halts the entire team for a wave. The gate contract must be conservative, auditable, and interruptible.

---

## Decision

DevSecOps MUST implement a hardened auto-merge gate that runs as part of the DevSecOps turn logic. The gate is **opt-in per PR** (not a global mode) and is **user-off-aware** at every check point.

---

## "Green" definition — ALL six conditions required

A PR is eligible for auto-merge only when ALL of the following hold at merge time (not cached from gate-verdict time):

| # | Condition | Check method |
|---|---|---|
| G1 | All required CI status checks show `success` | `gh pr checks <number> --json name,state` — all entries `state=SUCCESS`; none `PENDING`/`QUEUED`/`FAILURE` |
| G2 | Architect PASS present in PR | PR contains a review comment or HANDOFF fragment with literal string `PASS` attributed to `architect` role; OR Architect's HANDOFF fragment in `_handoff-pending/` within the branch includes `PASS` for this PR number |
| G3 | UX PASS present in PR (UI-touching PRs only) | Same check for `ux-designer`; non-UI PRs skip this condition |
| G4 | QA PASS present in PR | PR contains QA's explicit PASS comment or QA HANDOFF fragment includes `PASS` for this PR |
| G5 | Mergeable state MERGEABLE | `gh pr view <number> --json mergeable` → `"MERGEABLE"` re-fetched ≤ 30s before merge call |
| G6 | In-PR HANDOFF present | Branch contains either a `_handoff-pending/<wave>-<role>.md` fragment or a modified `HANDOFF.md` — enforced by the pre-push hook; DevSecOps re-verifies by checking the diff |

If any condition is false at merge time, auto-merge aborts with a `SKIPPED` log entry. It does NOT retry that PR in the same turn.

---

## User-off bypass (non-negotiable)

The L1 user-off sentinel (`data/.user-off`) MUST be checked before EACH merge attempt — not once at the start of a DevSecOps turn.

```
[auto-merge] SKIP pr=<number> reason=user-off-active
```

- If `data/.user-off` exists: skip the entire auto-merge queue for this turn, emit one log line, exit cleanly.
- The sentinel is written by L1's double-Ctrl-C escalation (US-079 AC5). Its presence means the user explicitly wants the system idle.
- Do NOT merge while user-off even if all six green conditions are met. This is an invariant, not a soft preference.

---

## Hardened-gate preconditions

Beyond the six green conditions:

**P1 — Target branch must be `main`.** Auto-merge never targets feature branches. If a matched PR's base branch is not `main`, skip with reason `non-main-target`.

**P2 — No concurrent merge in flight.** Check via a `data/.auto-merge-lock` file with TTL = 120s. If the lock file exists and its timestamp is < 120s old, skip. If > 120s old (stale), remove and proceed. This prevents two DevSecOps turns racing on the same queue.

**P3 — Re-assert CI at call site.** G1 is re-checked ≤30s before `gh pr merge`. If CI flipped to `PENDING` or `FAILURE` in the window, abort. This is not paranoia — GitHub's `mergeable` calculation and CI status can lag behind push events.

**P4 — Single PR per turn.** Auto-merge processes at most one PR per DevSecOps turn. The queue is ordered by PR number (lowest first). This bounds blast radius: a misconfigured wave can only reds `main` once before human review catches it.

---

## Audit and observability

Every auto-merge event (attempt, success, or skip) MUST emit a structured log line:

```
[auto-merge] <ACTION> pr=<number> title="<title>" sha=<merge-sha|none> reason=<ok|skip-user-off|skip-ci|skip-conflict|skip-no-pass|skip-lock>
```

Actions: `MERGED`, `SKIPPED`, `FAILED`.

Failures (unexpected `gh pr merge` error) additionally write to `data/.auto-merge-failures.log` (append-only, one JSON line per failure) so post-mortems have a durable record independent of stdout.

`agent_state` for the DevSecOps role MUST include a summary of the last auto-merge action per thread — the dashboard shows it without requiring a log tail.

---

## Runaway / cascade-protection contract

Shared state with L2's `data/.exit-history.json`:

**Auto-merge cascade sentinel: `data/.merge-history.json`**
Tracks the last 10 merge events: `{ prNumber, mergedAt, mainCiStatus }`. Written after each successful `gh pr merge` + post-merge CI check.

**Post-merge CI watch:**
After each auto-merge, DevSecOps MUST queue a follow-up probe of `main`'s CI status within 2 minutes (next tick or scheduled re-check). If `main` CI is `FAILURE` after a merge:
1. Write `data/.auto-merge-paused` sentinel immediately.
2. Log `[auto-merge] PAUSED reason=main-ci-failure pr=<number>`.
3. Fire a macOS notification: `osascript -e 'display notification "auto-merge paused: main CI red after PR #<N>" with title "apex-team"'`.
4. Write a sticky banner state to `agent_state` for the DevSecOps pane.

**Cascade threshold:**
If 3+ consecutive merges within 5 minutes all produce `main` CI `FAILURE`, auto-merge enters **permanent-pause mode** (sentinel `data/.auto-merge-paused` is sticky). Resume only via explicit `pnpm auto-merge:resume` or manual deletion of the sentinel. This mirrors L2's `STALL_CASCADE_LIMIT` semantics — both share the same "3 failures in 5 min → manual intervention" threshold.

**Resume command:**
`pnpm auto-merge:resume` — removes `data/.auto-merge-paused`. Must log `[auto-merge] RESUMED by=user` when invoked.

---

## Worst failure mode

**Merging a PR that reds `main`.**

Attack surface: PR's CI passed on base `main@SHA-N`; a new commit lands on `main` (squash merge from another PR) between CI completion and `gh pr merge`; the merged combination fails CI.

Mitigations applied:
- G5 re-fetch ≤30s before merge (catches `CONFLICTING` from the new base commit)
- G1 re-check at call site (if CI has gone `PENDING` due to new base, block)
- Post-merge CI watch (if the merge still slips through, auto-pause fires within 2 min)

Residual risk: GitHub's API can lag. A MERGEABLE state seen 30s before merge may already be stale if a concurrent merge is in flight (the `data/.auto-merge-lock` reduces but does not eliminate this). This is accepted; the post-merge CI watch is the final safety net.

**DevSecOps MUST NOT auto-merge more than one PR before checking post-merge CI status on `main`.** P4 (single PR per turn) enforces this at the agent level.

---

## What this ADR defers to BA (open questions for US-#318)

**OQ-318-001:** Is `PASS` string matching in PR comments sufficient for gate verification, or must gate verdicts be structured (a specific comment format or `agent_state` DB field)? String matching is brittle to paraphrase.

**OQ-318-002:** Should auto-merge scope include PRs from DevSecOps's own branch, or only PRs where DevSecOps is not the author? (Conflict-of-interest gate.)

**OQ-318-003:** `pnpm auto-merge:resume` — is this a script in `package.json`, or a `pnpm dev:on`-adjacent shell script? Align with US-079's control-surface convention.

**OQ-318-004:** Does the user-off check also suppress the post-merge CI watch? (Conservative answer: yes — watch implies readiness to act, and user-off means the user wants silence.)

---

## Consequences

**Positive:**
- Merge queue drains without blocking a full DevSecOps turn per PR.
- All six gate conditions are re-verified at merge time — stale pass verdicts cannot slip through.
- User-off bypass respects L1's explicit-idle semantics everywhere, not just at the process level.
- Post-merge CI watch catches the worst failure mode within 2 minutes.

**Negative / guardrails:**
- P4 (one merge per turn) means a 6-PR queue takes 6 DevSecOps turns to drain. This is intentional — each merge+CI-watch cycle is a separate safety checkpoint.
- String-matching for gate verdicts (OQ-318-001) is the weakest link. If BA's US-#318 resolves toward structured verdicts, this ADR must be updated before DevSecOps implements.
- `data/.auto-merge-paused` is a file sentinel, not a DB flag — consistent with user-off convention but means the sentinel survives server restarts (intentional: a paused auto-merge should stay paused after respawn).
