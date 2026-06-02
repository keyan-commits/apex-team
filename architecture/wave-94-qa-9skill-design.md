# Wave 94 — QA 9-Skill Upgrade (Design Contract)

**Author:** Architect · **Date:** 2026-06-02 · **Spec:** issue #217 (QA retro — 9 bugs shipped while QA PASS'd)
**Implements:** US-048 · **Target:** `src/lib/skills/qa.ts`, ~150 LOC rewrite, single Wave 94 PR (QA owns impl)

## Context / forces
9 defects shipped under a green QA gate (LFM order-sheet retro, cross-Mac evidence). Root cause is **gate
shape, not gate effort**: the rubric validated *that a check ran*, not *that the artifact a user sees is
correct*. Post-mortem attributes **6 of 9** to two missing hard gates — the artifact was never rendered and
looked at (S1), and was validated on a stand-in rather than the real production path/data (S2). The remaining
3 trace to soft advisory checks that returned green without adversarial pressure (S3–S9).

## Decision
Encode **S1–S9** into `qa.ts` as a new `### Visual & artifact-correctness gates (Wave 94)` section, **each
skill a sub-section with four labelled fields**: `Rule:` / `How-to:` / `Catches:` / `FAIL when:`. S1 and S2
are authored as **HARD/blocking** (a non-satisfied S1/S2 is a FAIL, never a warn — no PASS may issue without
both). S3–S9 are mandatory checks whose violation is at least `warn`, escalating to `block` per the FAIL
conditions below. Add the **6-gate Definition of Done for visual artifacts** as a checklist block QA must
paste, filled, into every PASS on a visual artifact.

### The nine skills (rule + how-to + catches + FAIL-when)

| # | Skill | Rule (one line) | Catches | FAIL when |
|---|---|---|---|---|
| **S1** | **render-and-look** *(HARD)* | Render the artifact and visually inspect it before any verdict. | Layout, overflow, blank/garbled render, wrong component shown. | Verdict issued without a rendered view of the exact artifact under test. |
| **S2** | **real-artifact-e2e** *(HARD)* | Exercise the **real** path/data/artifact a user hits — not a fixture, mock, or sample. | Stub-passes-real-fails; happy-path fixture masking prod breakage. | PASS based on synthetic/sample input when a real path exists. |
| S3 | scaled / adversarial inputs | Test at realistic scale + hostile inputs, not the 1-row demo. | Pagination, truncation, N+1, overflow at volume; injection. | Only minimal/sample-size inputs exercised. |
| S4 | positional + semantic correctness | Verify each value is in the **right place** AND **means the right thing**. | Right number wrong column; correct-looking but mislabeled data. | Presence checked but position/label/units not asserted. |
| S5 | WCAG contrast gate | Measure AA contrast (≥4.5:1 text / ≥3:1 large) on every new/changed color pair. | White-on-gold (#213, 2.0:1) class of a11y regressions. | Color pair shipped without a measured ratio meeting AA. |
| S6 | side-by-side reference diff | Diff the output against an authoritative reference/golden. | Drift from spec example; silent format/shape changes. | No reference compared, or diff not inspected. |
| S7 | validated≠deployed verify | Confirm the **deployed** instance reflects the change, not just the validated branch. | "Passed locally, prod still old"; missing restart/rebuild. | Verdict claims deploy-correct without hitting the deployed target. |
| S8 | question-intent | Answer the *intent* of the AC, not just the literal sample given. | Matching the example while missing the general requirement. | Test only reproduces the sample, no generalized assertion. |
| S9 | no-silent-green | A skipped/unrunnable check is a FAIL, never an implicit pass. | Transport-dropped Playwright, skipped suite read as green. | Any gate skipped/errored is reported as PASS or omitted. |

### Definition of Done — 6-gate for visual artifacts
A PASS on any artifact rendering pixels a user sees MUST include this filled checklist (each ✓ with one-line
evidence; any ✗ ⇒ verdict cannot be PASS):

1. **Rendered** — artifact was actually rendered (S1).
2. **Looked-at** — a human-equivalent visual inspection occurred (S1).
3. **AA-contrast** — all color pairs measured ≥ AA (S5).
4. **Real-path** — exercised on the real artifact/data path (S2).
5. **Reference-diffed** — compared against the authoritative reference (S6).
6. **Deploy-confirmed** — verified on the deployed/`:3100` target, not just the branch (S7).

## Consequences
**+** Closes the 6-of-9 hole at the gate (S1/S2 hard). **+** Each skill is self-describing (FAIL conditions
are testable, satisfies US-048 AC-per-skill). **+** DoD checklist makes "silent green" structurally hard (S9).
**−** Visual PASSes get heavier — acceptable; the retro proves the cheaper gate cost more downstream.
**Follow-up:** #207 (browser_evaluate permission blocks localStorage seed) is a real S1/S2 enabler gap — QA
must note it as an S9 explicit-gap when the transport is unavailable, not silently skip. Tracked, out of scope
for this PR.

## Implementation contract (binding on QA's PR)
1. New section in `src/lib/skills/qa.ts` only; do not regress Legs A/B/C or the existing PASS/FAIL evidence
   blocks — S1/S2/S5/S7 **extend** Leg C and the deploy step, they don't replace them.
2. Each S1–S9 sub-section uses the exact 4-field shape (`Rule/How-to/Catches/FAIL when`).
3. **Escaping discipline (issue #155):** the skill is a backtick template literal — every literal backtick and
   `${...}` in prose MUST be escaped (`` \` ``, `\${`). Non-ASCII compiles fine; unescaped backticks/`${}` are
   the real compile-break class. `pnpm type-check` must exit 0.
4. AC8 (Wave 64 dev-smoke gate, Legs A+B since this is a `src/lib/skills/*.ts` change that the build
   transitively imports) and AC6 (unit tests for the rubric, if QA's harness covers skill-text invariants)
   remain binding.
5. ~150 LOC target; single bundled Wave 94 PR.
