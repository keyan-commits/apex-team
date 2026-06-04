---
id: US-048
title: QA 9-skill upgrade (Wave 94)
status: superseded
wave: 94
owner: QA (implementation) — guided by Architect design doc
filed: 2026-06-02
---

## Resolution — superseded by Plan C cutover

All ACs target `src/lib/skills/qa.ts` — a monolith skill file retired at Plan C cutover (main `ebc83c5`, PRs #373 + #374). The S1–S9 skill upgrade discipline was absorbed into `.claude/agents/qa.md` during Wave 108 body rewrites (PR #379, `586ed8d`).

## Story

As a team peer, I want QA's skill file to encode nine verified failure-prevention checks (S1–S9) plus a 6-gate Definition of Done for visual artifacts, so that the class of 9 bugs that shipped through a QA PASS is structurally prevented from recurring.

## Context

Post-mortem on the QA-retro issue (≥#217, filed 2026-06-02): 9 bugs shipped while QA returned PASS. Root-cause analysis identified two checks (S1 render-and-look, S2 real-artifact-e2e) that would have caught 6 of 9 bugs unassisted. The remaining 7 skills address the residual 3 bugs plus systemic gaps in adversarial coverage, positional correctness, WCAG enforcement, reference diffing, deploy-verify, intent-vs-sample confusion, and silent-green risk. User has explicitly designated S1 and S2 as **HARD/blocking gates** — a QA PASS is invalid unless both are satisfied.

Source evidence: QA-retro issue ≥#217 + inline S1–S9 content in Wave 94 PO dispatch.

## Acceptance criteria

**S1 — Render-and-look (HARD gate, blocking)**

AC1. `qa.ts` encodes a `S1_RENDER_AND_LOOK` section with: the rule (QA must render the actual UI change in a browser and visually inspect it before returning any verdict), how-to steps, what-it-catches (rendering defects, layout breaks, invisible or wrong-placement elements), and FAIL conditions (any change to a visual surface that QA has not rendered and inspected = automatic FAIL regardless of other checks). A QA PASS on a visual artifact without S1 evidence is invalid and may be challenged by any peer.

**S2 — Real-artifact-e2e (HARD gate, blocking)**

AC2. `qa.ts` encodes a `S2_REAL_ARTIFACT_E2E` section with: the rule (QA must exercise the actual deployed artifact end-to-end on the `:3100` test instance, not a local-only build), how-to steps (start `pnpm dev:test`, navigate to the exact path exercised by the change, trigger the interaction), what-it-catches (validated-not-deployed gap, route mis-registration, MCP mount failures), and FAIL conditions (any PR that has not been exercised on a live `:3100` instance = automatic FAIL; `pnpm build` exit 0 alone is not sufficient for S2). This gate is independent of S1 — both must pass.

**S3 — Scaled/adversarial inputs**

AC3. `qa.ts` encodes a `S3_SCALED_ADVERSARIAL` section: rule (test with inputs at or beyond expected scale and with malformed/edge-case values, not just the happy path), how-to (long strings, empty values, concurrent requests, max-length message history), what-it-catches (truncation bugs, layout overflow, race conditions, crash-on-empty), FAIL conditions (only happy-path evidence = advisory flag; no adversarial attempt = REVISE).

**S4 — Positional and semantic correctness**

AC4. `qa.ts` encodes a `S4_POSITIONAL_SEMANTIC` section: rule (verify that elements appear at the correct position on screen AND carry the correct semantic meaning, not just that they are present somewhere), how-to (compare element placement against design spec; check ARIA roles, heading levels, label associations), what-it-catches (misplaced components, wrong semantic structure that passes visual inspection, screen-reader regressions), FAIL conditions (element present but wrong position = FAIL; wrong semantic role = FAIL).

**S5 — WCAG contrast gate**

AC5. `qa.ts` encodes a `S5_WCAG_CONTRAST` section: rule (every text/background combination in the changed surface must meet WCAG 2.1 AA contrast ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text), how-to (use browser DevTools accessibility panel or a contrast checker on the actual rendered colors, not design-file approximations), what-it-catches (white-on-light, low-opacity text, icon-only affordances without accessible labels), FAIL conditions (any ratio below threshold = FAIL; untested combination = REVISE).

**S6 — Side-by-side reference diff**

AC6. `qa.ts` encodes a `S6_REFERENCE_DIFF` section: rule (QA must compare the before and after state of every changed visual surface side by side against the spec or the prior-shipped screenshot), how-to (screenshot before, screenshot after, compare against `design/` spec file or prior evidence attached to the PR), what-it-catches (unintended visual regressions, spec drift, missing states that were present before), FAIL conditions (only after-state evidence without before/spec comparison = advisory flag; no comparison attempt for a visual change = REVISE).

**S7 — Validated ≠ deployed verify**

AC7. `qa.ts` encodes a `S7_VALIDATED_VS_DEPLOYED` section: rule (a change that passes `pnpm build` and `pnpm type-check` is validated but not deployed; QA must confirm the change is running on the live `:3100` instance and that the specific behavior under test reflects the new code, not a cached or stale build), how-to (check `GET /api/health` → `buildTime` or `gitSha` field to confirm the instance is running the expected revision; hard-reload before testing), what-it-catches (stale-build smoke, cached-route delivery, supervisor-reload lag), FAIL conditions (health endpoint SHA does not match the PR branch HEAD = QA must restart the instance before proceeding; proceeding without verification = S7 FAIL).

**S8 — Question intent (don't match the sample)**

AC8. `qa.ts` encodes a `S8_QUESTION_INTENT` section: rule (QA must verify that the implementation satisfies the *intent* of the acceptance criterion, not just that it produces output resembling the sample or the PR description), how-to (re-read the original user story and AC before running any test; ask "does this AC say what the user actually needs or just what the implementer did?"; flag intent mismatch as REVISE, not PASS), what-it-catches (implementer satisfies the letter of the AC while missing the functional goal; sample-matching without real validation), FAIL conditions (QA PASS issued based solely on output resembling an example, with no independent functional test = REVISE on re-audit).

**S9 — No silent green**

AC9. `qa.ts` encodes a `S9_NO_SILENT_GREEN` section: rule (every QA PASS must include explicit evidence for each gate checked: what was run, what was observed, what passed), how-to (PASS reply must enumerate: S1 evidence, S2 evidence, each applicable S3–S8 check with brief result; a PASS with no evidence is not a PASS), what-it-catches (rubber-stamp approvals, incomplete checks masked by a green summary, gaps that become post-mortem items), FAIL conditions (QA PASS reply with no per-check evidence = any peer may challenge; challenger routes to Architect for adjudication).

**DoD — 6-gate Definition of Done for visual artifacts**

AC10. `qa.ts` encodes a `VISUAL_ARTIFACT_DOD` block listing the six mandatory gates that must all be satisfied before a PASS is issued on any PR that touches visual output:
1. **Rendered** — change rendered in a real browser (S1)
2. **Looked-at** — QA visually inspected the rendered output (S1)
3. **AA-contrast** — WCAG 2.1 AA contrast verified on all text/background combinations in the changed surface (S5)
4. **Real-path** — exercised on the live `:3100` test instance via the actual user-facing route (S2, S7)
5. **Reference-diffed** — before/after or spec comparison performed (S6)
6. **Deploy-confirmed** — `GET /api/health` `gitSha` or `buildTime` matches PR branch revision (S7)

A PASS on a visual-artifact PR that does not cite all 6 gates is structurally invalid.

## Out of scope

- The prose wording and formatting of each skill section — that is Architect's design output and QA's implementation lane; BA owns the ACs, not the prose shape.
- Non-visual PRs (pure backend / config / skill-only): S1, S2, S6, and the DoD 6-gate do not apply. S3, S4, S7, S8, S9 remain applicable.
- Automated tooling to enforce S1/S2 at CI time — filed separately if Architect or QA proposes it; out of Wave 94 scope.
- Changes to other roles' skill files as a result of QA upgrade — Architect may cascade to Architect's code-review rubric; out of this story.

## Notes

- S1 + S2 designated HARD gates by user (Wave 94 dispatch). No peer may override this designation without an explicit user instruction.
- DoD 6-gate is a synthesis tool, not a replacement for the individual S checks. All 10 ACs must be satisfied; the DoD summarizes the visual-artifact subset.
- Glossary entries for `RENDER_AND_LOOK`, `REAL_ARTIFACT`, `VALIDATED_VS_DEPLOYED` added to `requirements/glossary.md` in this same wave.
- Architect is designing the skill-prose structure in parallel (Wave 94 D1). QA implements against Architect's design doc + these ACs. Neither blocks the other — Architect's design may augment how-to detail without changing the AC set.
