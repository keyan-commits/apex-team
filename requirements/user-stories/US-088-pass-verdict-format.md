# US-088 — PASS-verdict format for coordination/handoffs/<role>.md

**Status:** accepted
**Wave:** 111a
**Owner:** Architect (ADR-018 authorship) + QA (conformance test) + all gating roles (cross-reference updates)
**Closes:** Wave 111a — Cluster 5 (PASS-verdict format standardization)

---

## Story

As a DevSecOps subagent / outer Claude Code orchestrator, I want a
standardized machine-readable PASS-verdict record written to
`coordination/handoffs/<role>.md` when a gating role issues a PASS,
so that I can reliably distinguish "no PASS recorded yet", "REVISE issued",
and "PASS recorded against an earlier SHA" when deciding whether a PR is
clear to merge.

---

## Acceptance criteria

1. **ADR-018 exists.**
   Given the path `architecture/decisions/ADR-018-pass-verdict-format.md`,
   when a reviewer checks for the spec, then the file exists and is
   non-empty. (Authored by Architect in parallel this wave — this AC is
   the traceability anchor; ownership is Architect's.)

2. **Required fields specified.**
   Given the PASS-verdict format defined in ADR-018, when a gating role
   writes a PASS record to their `coordination/handoffs/<role>.md`, then
   the record MUST include all of the following fields:
   - `wave`: the wave number or sub-wave identifier (e.g. `111a`)
   - `pr`: the GitHub PR number (e.g. `#385`)
   - `sha`: the full 40-character HEAD SHA the PASS applies to
   - `gate-role`: the role id of the gating subagent (one of:
     `architect`, `ux-designer`, `qa`)
   - `timestamp`: ISO 8601 datetime string (UTC, e.g.
     `2026-06-04T14:32:00Z`)
   - `notes` (optional): free-text field for caveats, partial verdicts, or
     conditions

3. **REVISE/FAIL counterpart format specified.**
   Given the PASS-verdict format defined in ADR-018, when a gating role
   issues a REVISE or FAIL verdict, then the format is structurally
   identical to the PASS record (same required fields) but with
   `verdict: REVISE` or `verdict: FAIL` replacing `verdict: PASS`, so
   that DevSecOps step 3 can programmatically distinguish:
   - **no verdict record present** → gate not yet run
   - **`verdict: REVISE` present** → revision requested; not clear to merge
   - **`verdict: FAIL` present** → hard failure; not clear to merge
   - **`verdict: PASS` present against a different SHA** → PASS is stale;
     not clear to merge without re-gate
   - **`verdict: PASS` present and SHA matches PR HEAD** → clear to merge

4. **Grep-able anchor regex specified.**
   Given the verdict record format in ADR-018, when a CI check (Wave
   111c-bound) or a DevSecOps subagent script greps for a PASS, then
   there is an anchor string / regex defined in ADR-018 that uniquely
   matches a PASS record and is documented with an example. The regex
   MUST be grep-compatible (POSIX ERE or basic RE) and MUST NOT match
   REVISE or FAIL records. (CI integration of this regex is US-090's
   scope — this AC only requires the regex to be specified in ADR-018.)

5. **QA conformance test exists and passes.**
   Given the file `tests/qa/wave-111/pass-verdict-format.test.ts`, when
   `pnpm test:run` is executed:
   a. The test asserts that
      `architecture/decisions/ADR-018-pass-verdict-format.md` exists at
      the expected absolute path.
   b. The test reads every `coordination/handoffs/<role>.md` file that
      contains any string matching `verdict:` and asserts that each such
      record either:
      i.  conforms fully to the required-fields spec from AC2 (all six
          required fields present and non-empty), OR
      ii. is annotated with a backward-compat exemption comment as defined
          in ADR-018 (exact exemption marker string is Architect's decision
          in ADR-018; this AC defers to that decision).
   c. The test itself is a file on disk (chat-bubble test code does not
      satisfy this AC).

6. **Cross-references updated in gating-role agent files.**
   Given the agent files `.claude/agents/devsecops.md` (step 3 merge
   checklist), `.claude/agents/architect.md` (code-review rubric),
   `.claude/agents/ux-designer.md` (critique/verdict workflow), and
   `.claude/agents/qa.md` (gate workflow), when those files reference
   gate verdicts, then each contains an explicit pointer to ADR-018 for
   the canonical verdict-record format.
   **Deferred-landing note:** This AC may land in Wave 111a or Wave 111b
   per Architect's HANDOFF. If Architect signals deferral in their
   Wave 111a output, this AC's landing wave is 111b and US-088 status
   remains `accepted` (not `done`) until AC6 ships.

---

## Out of scope

- Wave 111b skills + lessons (US-089 scope): LESSONS.md additions, UX
  skill proposals, 7-subagent skill-proposal issues.
- Wave 111c CI/process discipline (US-090 scope): actual CI integration
  of the grep-able anchor regex from AC4; CI workflow file changes.
- Viewer repo (`keyan-commits/apex-team-viewer`): verdict format for
  viewer subagents is out of scope; re-file if needed.
- Backward-compat migration of pre-111a PASS records to the new format:
  Architect decides the exemption-annotation strategy in ADR-018 (AC5b
  defers to that decision). BA does not prescribe the migration path.
- Retroactive enforcement on merged PRs: enforcement applies to future
  gate verdicts only, not retrospective audit of closed PRs.

---

## Open questions

None blocking. Architect's ADR-018 backward-compat decision (exemption
marker string) is needed before the QA test (AC5b) can be fully
implemented — QA should read ADR-018 before writing the test. This is an
ordering dependency, not a blocking OQ.

---

## Links

_(Filled in during and after implementation)_

- impl (ADR-018): pending Architect Wave 111a turn
- impl (QA test): pending QA Wave 111a/111b turn
- impl (agent cross-refs, AC6): pending — may land Wave 111a or 111b
- test: `tests/qa/wave-111/pass-verdict-format.test.ts` (pending QA)
- qa-pass-by: pending
- deployed-by: pending
