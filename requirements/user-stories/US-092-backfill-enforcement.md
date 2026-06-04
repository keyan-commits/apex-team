# US-092 — Backfill enforcement for ADR-018 PR #0 placeholders

- **Status:** in-flight
- **Wave:** 113
- **Owners:** DevSecOps (AC1–AC3), QA (AC4)
- **Traceability:** ADR-018 §"2026-06-04 amendment" (Wave 111b), US-088 (PASS-verdict format), US-090 AC5 (TTL check introduced Wave 111c)
- **Closes:** n/a (new capability; no prior GitHub issue — gap exposed by Wave 112 incident)
- **Related:** `architecture/decisions/ADR-018-pass-verdict-format.md`, `.github/workflows/pass-verdict-format-check.yml`, `scripts/check-placeholder-ttl.py`

---

## Story

As DevSecOps, I want the placeholder TTL check to run on a nightly schedule and on every push to main, so that `PR #0` placeholder verdicts whose parent PRs merged >1h ago surface as soft-warnings even when no subsequent PR touches `coordination/handoffs/**` (the current TTL check only fires on `pull_request` events, missing the gap Wave 112 exposed where DevSecOps's Wave 111c backfill was forgotten until QA caught it).

**Background:** The existing `.github/workflows/pass-verdict-format-check.yml` runs two checks:
1. A format check — requires a `pull_request` event context (PR number, title, body).
2. A placeholder TTL check — checks for `PR #0` verdicts on PRs merged >1h ago; does NOT require PR context.

The TTL check is purely a scan of files on disk against the GitHub merged-PR list. It can safely run on non-PR triggers (cron, push) with no architectural change. The format check cannot (it requires `github.event.pull_request.*`); it must remain PR-only.

**Incident motivation:** After Wave 111c merged (PR #388), DevSecOps's `PR #0` placeholder in `coordination/handoffs/qa.md` was never backfilled. Because no subsequent PR touched `coordination/handoffs/**`, the `pull_request`-only TTL check never fired again. QA caught the missed backfill manually during Wave 112 review. The nightly + push-to-main triggers close this surveillance gap.

---

## Acceptance criteria

### AC1 — Nightly cron trigger

`.github/workflows/pass-verdict-format-check.yml` gains a `schedule:` trigger:
- Cron expression: `0 6 * * *` (06:00 UTC daily — off-peak, avoids overlap with typical active-dev hours).
- The cron trigger runs **only** the placeholder-TTL check job (`check-placeholder-ttl` job or equivalent). It does NOT run the format check job.
- Separation mechanism: either two named jobs (`pass-verdict-format-check` + `check-placeholder-ttl`) with `if:` conditions keyed on `github.event_name`, or split into two separate workflows. DevSecOps may choose either; the test (AC4) validates the resulting YAML structure.

### AC2 — Push-to-main trigger

`.github/workflows/pass-verdict-format-check.yml` gains a `push: branches: [main]` trigger that runs **only** the placeholder-TTL check job (same separation rule as AC1).

**Rationale:** every DevSecOps backfill commit lands on main as a push event — this trigger fires the TTL check immediately after each backfill, confirming cleanup and catching any lingering `PR #0` entries from the same or prior waves.

### AC3 — Soft-fail semantics preserved

The TTL check preserves existing soft-fail semantics on ALL triggers (cron, push-to-main, and the existing pull_request trigger):
- If one or more `PR #0` verdicts have been waiting >1h since the parent PR merged: emit a warning message to the workflow log and exit 0 (non-blocking).
- The step/job must NOT use `exit 1` on TTL expiry on any trigger. Only the format check (AC1/AC2 do not touch this) uses `exit 1`.
- The warning message must include: the file, the verdict heading line, the PR that merged, and the elapsed time since merge.

**Invariant:** no new CI trigger ever converts the TTL check from soft-fail to hard-fail. The TTL check is advisory — it surfaces forgotten backfills; it does not block main.

### AC4 — QA regression test

`tests/qa/wave-113/backfill-enforcement.test.ts` asserts AC1–AC3 mechanically against the workflow YAML structure:

- **AC1 assertion:** the workflow YAML includes a `schedule:` trigger entry with a cron expression matching `0 6 * * *`.
- **AC2 assertion:** the workflow YAML includes a `push:` trigger with `branches: [main]` (or `["main"]`).
- **AC3 assertion:** the job(s) or step(s) that run on cron/push triggers do not contain `exit 1` without a preceding `format` or `verdict-format` context guard (i.e., `exit 1` is only reachable in the format-check path, not the TTL-check path). Acceptable approximation: assert that the TTL-check step script does not call `exit 1` (it calls `exit 0` or no explicit exit on the TTL-expiry branch).
- **Structure assertion:** the YAML has either (a) two distinct jobs where the format-check job has an `if: github.event_name == 'pull_request'` guard, or (b) the single combined job's format-check step has an equivalent guard. At least one guard expression referencing `pull_request` event name must appear to protect the format check from running on cron/push without PR context.

Test location: `tests/qa/wave-113/backfill-enforcement.test.ts`. Uses `vitest`. Parses the workflow YAML with `js-yaml` (already a dev dependency or added as one) or as raw string assertions — QA's choice.

---

## Out of scope

- **Option B (verdicts in PR descriptions):** deferred indefinitely (ADR-018 §"Why not Option (b)" — violates files-on-disk invariant).
- **#332 positional bound in user-directive-supremacy test:** closed wont-fix in Wave 113 (Architect's call from Wave 112 scoping).
- **#205 supply-chain pin for community UX skills:** deferred to Wave 114 (likely moot — Wave 111b UX-skill evaluations all rejected the candidate skills).
- **Restructuring `coordination/handoffs/<role>.md` workflow or the split between format-check and TTL-check jobs** beyond what's needed for the new triggers.
- **`scripts/emit-verdict.sh` backfill helper** (parked as Wave 111+ candidate in ADR-018 §Follow-ups) — not this wave.
- **Hard-failing on missed backfills** — the TTL check is permanently soft-fail by design (AC3); escalation to hard-fail is out of scope and would require a new ADR amendment.
