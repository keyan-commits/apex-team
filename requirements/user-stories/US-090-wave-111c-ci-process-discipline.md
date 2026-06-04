# US-090 — Wave 111c CI/Process Discipline

**Status:** accepted
**Wave:** 111c
**Primary owner:** DevSecOps
**Issues addressed:** #240, #246, #301, #324

---

## Story

As DevSecOps, I want CI to mechanically enforce the ADR-018 PASS-verdict
format and the backfill convention, so that drift-prone handoff hygiene
is caught at PR time rather than relying on reviewer vigilance.

---

## Acceptance criteria

### AC1 (#240) — `gh pr checks` step in merge protocol

`.claude/agents/devsecops.md` merge protocol includes an explicit
`gh pr checks` step verifying all required CI checks PASS before merge.

### AC2 (#246) — UX-gate-bypass CI check

`.github/workflows/` includes a CI job that fires on PRs touching
UI-relevant paths and fails if no Wave-NNN UX PASS verdict in
`coordination/handoffs/ux-designer.md` matches ADR-018 canonical regex
against PR HEAD SHA.

### AC3 (#301) — Anomalous-closure playbook

`.claude/agents/devsecops.md` contains a `gh pr merge --delete-branch`
anomalous-closure playbook (symptom + detection + recovery).
`LESSONS.md` has a matching entry.

### AC4 (#324) — Deps verification

`pnpm outdated` re-run; deps bumped where safe OR #324 closed with
rationale citing current state.

### AC5 — ADR-018 CI wiring + Wave 111a/111b backfill

`.github/workflows/` includes a job/step enforcing ADR-018 canonical
regex on PR-touched HANDOFF docs AND flagging `PR #0` placeholders
on PRs merged >1h ago.
`coordination/handoffs/qa.md` Wave 111a + Wave 111b PASS verdicts
backfilled per ADR-018 Wave 111b amendment:
- Wave 111a: PR #386 + merge SHA a16c924
- Wave 111b: PR #387 + merge SHA ba0905f

---

## Out of scope

- Re-litigating ADR-018 itself (foundation Wave 111a, amended Wave 111b)
- New CI jobs unrelated to PASS-verdict discipline
- Issues outside Cluster 4 (#240, #246, #301, #324)

---

## Issues addressed

- #240 (CI/process: `gh pr checks` step)
- #246 (UX gate CI check)
- #301 (`gh pr merge --delete-branch` playbook + LESSONS)
- #324 (deps bump verification)
