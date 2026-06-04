# US-096 — Pre-commit verdict-format gate (ADR-018)

- **Status:** accepted
- **Wave:** 120
- **Authors:** business-analyst
- **Triggered by:** Verdict-format violations in Waves 112, 115, 117, 118, 119 (5+ times); each cost at least one CI cycle because the local pre-commit hook has no verdict-format check.

---

## Story

As any role authoring a PASS / REVISE / FAIL verdict in a HANDOFF doc,
I want the pre-commit hook to reject commits where a Wave-111+ verdict heading
violates the ADR-018 canonical format,
so that the violation cannot reach CI in the first place.

---

## Acceptance criteria

**AC1** — `.githooks/pre-commit` extended with a new ADR-018 verdict-format step that runs against any staged `coordination/handoffs/*.md` file (and `HANDOFF.md` if it ever contains a verdict heading).

- The step fires only when at least one `coordination/handoffs/*.md` or `HANDOFF.md` file is staged.
- On violation: exit code != 0, message cites the offending file, line number, and line text. Message also prints the canonical format string.
- On no violations: silent pass (no output added to normal commit flow).

**AC2** — The pre-commit step uses the SAME canonical regex as `.github/workflows/pass-verdict-format-check.yml` — no local-vs-CI drift.

- Canonical regex source of truth: `architecture/decisions/ADR-018-pass-verdict-format.md` §"Grep-able anchor regex":
  ```
  ^### Wave-(\d{1,4}) (PASS|REVISE|FAIL) verdict — PR #(\d{1,6}) — SHA ([0-9a-f]{40})$
  ```
  (Separators are U+2014 em-dash, not hyphen or en-dash.)
- The pre-commit implementation MUST embed the literal regex (including the em-dash) rather than a re-derived approximation.
- Verification test (AC5) asserts identical match behavior for at least the bad/good/grandfathered cases.

**AC3** — The pre-commit step honors the same backward-compat rule as the CI check: Wave-111+ verdict headings must match the canonical format; pre-Wave-111 verdict headings are grandfathered and silently skipped.

- Detection: extract the wave number from any line matching `^### Wave-[0-9]{1,4}[^0-9].*\b(PASS|REVISE|FAIL) verdict\b`. If wave < 111, skip. If wave >= 111, enforce canonical format.
- The detection pattern and wave threshold `111` must be consistent between pre-commit and CI.

**AC4** — Standard git `--no-verify` bypass works (git's built-in escape hatch); it is accepted and does not need to be blocked. The pre-commit hook MUST print, before exiting 1 on a violation, the bypass reminder:

  ```
  Bypass once: git commit --no-verify
  ```

  This matches the existing hook's convention for the HANDOFF freshness check. Emergency bypass is allowed but the user sees the message on every violation, keeping it visible without being a hard barrier.

**AC5** — `tests/qa/wave-120/pre-commit-verdict-gate.test.ts` asserts:

- (a) A staged `coordination/handoffs/*.md` containing a bad Wave-111+ verdict heading (e.g. `SHA (pending)`, short SHA, wrong separator, extra word after SHA) causes the hook logic to flag a violation (exit code != 0 equivalent, or matched violation set is non-empty).
- (b) A staged HANDOFF doc containing a good Wave-111+ verdict heading (full 40-char hex SHA, correct format, correct em-dash separators) passes without violation.
- (c) A staged HANDOFF doc containing a pre-Wave-111 verdict heading (e.g. `### Wave-110 PASS verdict ...` in old prose form) passes without violation (grandfathered).
- (d) All three cases covered — positive (b), negative (a), edge-case (c). Test iterates over at least the three representative lines in a single parameterized loop.
- (e) Prior-wave regression: `pnpm test:run` (all tests) remains green after this wave ships.

**AC6** — A short body clause added to each of the eight role subagent bodies (`.claude/agents/backend-developer.md`, `.claude/agents/ui-developer.md`, `.claude/agents/qa.md`, `.claude/agents/devsecops.md`, `.claude/agents/business-analyst.md`, `.claude/agents/architect.md`, `.claude/agents/ux-designer.md`, `.claude/agents/product-owner.md`) noting:

  > Before committing a PASS / REVISE / FAIL verdict to `coordination/handoffs/<role>.md`, the pre-commit hook will validate the heading format against the ADR-018 canonical regex. A malformed heading will block the commit. ADR-018 (`architecture/decisions/ADR-018-pass-verdict-format.md`) is the format source of truth.

  Placement: in each role's section that discusses verdicts or HANDOFF discipline (e.g. the gate-role verdict format section, the HANDOFF update clause, or the lessons section). Exact wording may be adapted per role voice; the semantic content above is the requirement.

---

## Failure history (trigger incidents)

| Wave | Violation | Detection point | Cost |
|---|---|---|---|
| 112 | BE Dev `SHA (pending)` placeholder | CI (1 cycle) | follow-up commit |
| 115 | BA `SHA (pending)` placeholder | CI (1 cycle) | follow-up commit |
| 117 | Architect zero-padded fake SHA | caught locally before push | inline fix |
| 118 | Architect zero-padded fake SHA (repeat) | caught locally before push | inline fix |
| 119 | UI Dev `viewer PR #3` extra word after SHA | CI (2 cycles incl. sibling-repo bug) | 2 follow-up commits |

Pattern: the local pre-commit hook checks lint + type-check + HANDOFF freshness but NOT verdict format. Violations escape to CI every time.

---

## Out of scope

- Bash regex parity with the CI workflow's GitHub-Actions YAML syntax — behavior must match (same regex string, same wave threshold), but the hook uses shell `grep -E`; behavior equivalence is what matters, not literal source identity.
- Replacing the CI check — the pre-commit gate is additive (defense-in-depth). The CI `pass-verdict-format-check.yml` workflow remains the server-side gate.
- A `scripts/emit-verdict.sh` helper (parked as a future candidate in ADR-018 Follow-ups) — still out of scope for this wave.
- Verdict format validation for non-handoff files (e.g. PR descriptions, architecture/decisions/). The check applies only to `coordination/handoffs/*.md` (and `HANDOFF.md` as a safety net).

---

## Dispatch routing (Wave 120 auto-routing clause)

- **DevSecOps:** owns `.githooks/pre-commit` extension (AC1–AC4). Also responsible for the AC6 body-clause additions to all 8 agent files (or may delegate AC6 body edits to Architect if Architect prefers to own the rubric language in `architect.md`; DevSecOps owns the other 7).
- **QA:** authors `tests/qa/wave-120/pre-commit-verdict-gate.test.ts` (AC5). May begin in parallel with DevSecOps.
- **Architect:** flag in HANDOFF whether Architect wants to own the AC6 body-clause text for `architect.md` or delegates to DevSecOps. No blocking dependency — Architect's ratification of the exact wording can be async; DevSecOps can draft and land; Architect can revise post-merge.
