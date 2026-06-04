# architect — HANDOFF

## ⏭️ NOW — 2026-06-04 — Wave 111b Phase 1 (Clusters 1 + 6 + 7 single-author)

**Deliverables (5 files, all single-author within Architect's own lane — no co-authorship gate fires):**

1. `architecture/decisions/ADR-018-pass-verdict-format.md` — Cluster 6 amendment landed: `## 2026-06-04 amendment — commit-time placeholder pattern (Wave 111b)`.
2. `architecture/INDEX.md` — ADR-018 row status updated to `Accepted (amended Wave 111b)`; "Last updated" footer refreshed.
3. `.claude/agents/architect.md` — Cluster 1 lessons section (5 incidents) + Cluster 7 ADR-018 citation in review rubric step 7.
4. `.claude/agents/qa.md` — Cluster 1 lessons section (5 incidents) + Cluster 7 ADR-018 citation in Deployment-gate verification step 5.
5. `.claude/agents/devsecops.md` — Cluster 1 lessons section (5 incidents) + Cluster 7 ADR-018 citation in Deployment workflow step 3 (including post-merge backfill sub-step).
6. `.claude/agents/ux-designer.md` — Cluster 7 ADR-018 citation only (no Cluster 1 per dispatch — UX not in top-3 drift list).

### Cluster 6 (a) vs (b) decision — Option (a) Two-phase pattern

Adopted: commit-time placeholder (`PR #0` + last-known SHA from parent commit) + DevSecOps post-merge backfill commit on main.

**Why (a) over (b):**
- **File-on-disk discipline.** CLAUDE.md hard rule: "files on disk are the only state." Moving verdicts to PR descriptions punctures this invariant. PR descriptions are mutable, not version-controlled, and require viewer-side `gh` API fetches.
- **DevSecOps step 3 already cites HANDOFF docs.** Wave 110 ratified `Open coordination/handoffs/qa.md and (if UI) coordination/handoffs/ux-designer.md`. Option (b) would require rewriting that step plus the four subagent bodies. Option (a) only adds an amendment.
- **Self-application proof.** Wave 111a's QA verdict already recorded in canonical-block form using `PR #0` + last-known SHA. The canonical regex (`PR #(\d{1,6})` + `SHA ([0-9a-f]{40})`) already accepts these values. Option (a) formalizes a usage pattern within the existing format, not a format change.
- **In-flight migration cost.** Option (a) is a no-op for Wave 111a's existing verdict (it just needs backfill). Option (b) would require relocating the verdict body.

**Backfill mechanism: DevSecOps merge step.**

Three candidates considered (table in ADR-018 amendment); DevSecOps step is the natural owner because the merge SHA is only knowable post-merge by the merge author. Manual amend rejected (verdict author no longer owns the branch). Scheduled CI rejected (leaks stale placeholders during the grace window).

Backfill commit message convention: `chore(handoff): backfill Wave-NNN verdict PR # and merge SHA`.

**State semantics for DevSecOps step 3 (amended):** the original 4-row table grew to 5 rows. New row "PASS with placeholder — pre-merge expected state" uses `git merge-base --is-ancestor <verdict-SHA> <HEAD_SHA>` to verify the placeholder's SHA is reachable from the PR HEAD — treats reachable placeholder as merge-eligible.

**Test impact: zero.** ADR-018's canonical regex is unchanged. The amendment is purely additive documentation. `tests/qa/wave-111/pass-verdict-format.test.ts` continues to pass 21/21 with no edits required. Verified.

### Cluster 1 lesson selections per body

**architect.md (5 incidents):**
1. Wave 109 / #335 — architecture/ co-authorship gate
2. Wave 108 / ADR-017 — legacy-ref sweep methodology
3. Wave 110 / #381 — docs-integrity findings on LESSONS.md
4. Wave 111a — self-application bug-catch (39-char SHA placeholder)
5. PR #138 / Wave 64 — `tsc` and `vitest` do not catch SWC parse errors (durable principle: compiler-independence in the verification matrix)

**qa.md (5 incidents):**
1. US-085 / Wave 53 — tests are files on disk, not chat artifacts
2. Wave 53 — mocking the component under visual test defeats verification
3. Wave 108 — cleanliness regression test pattern (self-applying gates)
4. Wave 109 / #314 — pre-verdict SHA sync prevents stale-checkout verdicts
5. Wave 111a — self-application surfaces format usability gaps (chicken-and-egg)

**devsecops.md (5 incidents):**
1. Wave 110 / PR #231 / #383 — merge protocol bypass on implementer's claim
2. Wave 109 / PR #311 — false-REVISE from stale checkout (upstream-aligned)
3. Wave 14 — direct-to-main "bootstrap exceptions"
4. Wave 93 → 108 — server-side "Update branch" bypasses union merge driver
5. Wave 110 step-list rationale — verifiable gates beat asserted gates

### Cluster 1 lesson-format discipline (post-mortem on first attempt)

Initial draft of architect.md lessons quoted retired patterns by name in backticks. ADR-017 cleanliness test (Wave 108) failed 4 assertions — the literal tokens for legacy patterns are denylisted across all subagent bodies, not just outside of lesson narrative. Corrected by rephrasing to describe the patterns (e.g. "dev-server commands, fragment-folding scripts, port literals") without naming the literal tokens. This is itself a lesson worth noting for Cluster 3 implementers: when documenting legacy incidents inside a subagent body, do not reproduce denylisted tokens verbatim — describe the class.

### Cluster 7 cross-references (inline citations, one-line each)

Suggested cite text (used consistently across 4 files): `see ADR-018 for canonical PASS-verdict block format; Wave 111b amendment formalizes the commit-time placeholder + DevSecOps post-merge backfill pattern.`

Locations:
- `.claude/agents/devsecops.md` step 3 (Deployment workflow) — citation + backfill sub-step text.
- `.claude/agents/architect.md` review rubric step 7 (PASS verdict definition) — citation inline.
- `.claude/agents/ux-designer.md` Gate verdict format / PASS verdict section — citation inline.
- `.claude/agents/qa.md` Deployment-gate verification step 5 — citation inline.

### Cluster 3 guidance for Phase 2 implementers (review-time only — recording here for Phase 2 fan-out)

Six implementers will land new skill sections in their own subagent bodies. Consistent structure recommendations:

- **Header level:** use `## Lessons from prior incidents` (level 2) at the END of the body, after all role-specific sections but BEFORE any auto-generated footer. This matches the position used in architect.md / qa.md / devsecops.md this wave.
- **Bullet shape:** per-incident format mandated in the Wave 111b dispatch:
  ```
  - **Date / Wave / Rule** — one-line incident summary
    - **Why:** root cause
    - **Apply:** concrete behavior the subagent should now exhibit
  ```
  Keep all three sub-fields (`**Date / Wave / Rule**`, `**Why:**`, `**Apply:**`) — the format consistency is what makes the section skimmable across roles.
- **Lesson count:** 3-5 per body. More than 5 dilutes attention; fewer than 3 suggests the role doesn't have enough drift history to warrant the section.
- **Token discipline (load-bearing):** do NOT reproduce ADR-017 denylisted tokens verbatim inside the lesson body. The Wave 108 cleanliness test (`tests/qa/wave-108/subagent-body-cleanliness.test.ts`) runs on every subagent body and fails on dev-server-command tokens, fragment-folding scripts, port literals, MCP-transport tokens, dangling `src/lib/` pointers. Describe the class instead. I caught this only by running the test; the test catches it for you mechanically.
- **Source discipline:** every lesson MUST be sourced from a real LESSONS.md entry, a real PR number, or a real wave incident. Do NOT invent lessons. If a role doesn't have 3 real incidents, the section is shorter — that's acceptable.
- **Verification:** every Cluster 3 contributor runs `pnpm vitest run tests/qa/wave-108/subagent-body-cleanliness.test.ts` BEFORE handing off. The test takes <200ms; failing it on commit is a self-inflicted REVISE.

### Verification (this turn)

- `pnpm vitest run tests/qa/wave-108/subagent-body-cleanliness.test.ts` → 153/153 PASS (post-fix; initial draft had 4 failures from quoted denylist tokens — fixed and re-verified).
- `pnpm vitest run tests/qa/wave-110/subagent-body-completeness.test.ts` → 12/12 PASS.
- `pnpm vitest run tests/qa/wave-111/pass-verdict-format.test.ts` → 21/21 PASS (ADR-018 amendment is purely additive; no test update needed — regex unchanged, fields unchanged, examples still match).
- `pnpm test:run` → 186/186 PASS full suite.
- `pnpm lint` → clean.
- `pnpm type-check` → clean.

### Architecture/ co-authorship gate

I AM the Architect. All `architecture/` edits this turn (ADR-018 amendment, INDEX.md refresh) are within my own lane. No HANDOFF required.

### In flight / next

- This slice is ready for code review. Single-author across all 6 files (5 modified + 1 INDEX) within my own lane — no co-authorship gate fires.
- Phase 2 (Cluster 3) fan-out — 6-subagent parallel work on lessons sections for: business-analyst.md, ui-developer.md, backend-developer.md, ux-designer.md (Cluster 1 portion if PO redispatches), product-owner.md, and any remaining drift bodies. PO orchestrates the fan-out; I review each PR diff in Phase 2 via Wave 109 co-authorship gate (none of those PRs should touch `architecture/`).
- Wave 111c (gated on 111b): DevSecOps wires the canonical regex into CI. Workflow: fetch PR HEAD SHA, grep gate-role HANDOFF docs, fail PR if `Wave-N PASS — PR #<N> — SHA <HEAD_SHA>` missing for a runtime-code PR. Add follow-up: detect `PR #0` placeholders on PRs merged >1h ago (catches missed backfills).
- Wave 111+ candidate (parked): `scripts/emit-verdict.sh --backfill <PR#> <merge-SHA>` helper for DevSecOps's backfill step.

### Parked / future (carried forward)

- `system-design.md` — still not created.
- `tech-stack.md` — still not created (Vitest + ESLint + TS + pnpm is the entire stack).
- `coding-standards.md` — still not created. Wave 111b lessons-section pattern is a candidate first-draft entry: "every subagent body carries a `## Lessons from prior incidents` section sourced from LESSONS.md" + the token-discipline rule.
- Fitness function for OQ-085-001's "no binary files committed under `tests/qa/wave-*/evidence/`" — QA owns implementation.
- Viewer-repo subagent body audit (per ADR-017 follow-up).
- Wave 111c CI: extend the canonical-format check to flag `PR #0` placeholders on PRs merged >1h ago (catches missed backfills without blocking pre-merge legitimate placeholders).

### Notes / caveats

- The ADR-018 amendment is purely additive — the canonical regex, field shape, and Phase-1 example block remain authoritative. The amendment formalizes a usage pattern (placeholder + backfill) inside the existing format.
- The Cluster 1 lesson narrative discipline (describe-class-not-token) is itself a candidate addition to coding-standards.md if/when that file is drafted. Recording in Wave 111b NOW for visibility.
- Wave 111b Phase 1 is single-author within my lane. Phase 2 (Cluster 3) is the parallel 6-subagent fan-out. The two phases are sequential by design: lessons-format consistency benefits from one role landing the pattern first (this wave's architect.md / qa.md / devsecops.md) before 6 roles attempt it in parallel.

---

## PREV — 2026-06-04 — Wave 111a Cluster 5 foundation (ADR-018 canonical PASS-verdict format)

**Deliverable:** `architecture/decisions/ADR-018-pass-verdict-format.md`. Specifies the heading-anchored markdown block + 4 field lines that gate-role HANDOFF docs (`coordination/handoffs/qa.md`, `ux-designer.md`, `architect.md`) MUST emit on PASS / REVISE / FAIL verdicts dated >= Wave 111. Consumed by `.claude/agents/devsecops.md` step 3 (Wave 110); mechanically enforced by Wave 111c CI.

### Canonical PASS verdict snippet (verbatim — for QA + BA grep-reuse)

```markdown
### Wave-111 PASS verdict — PR #999 — SHA abc1234567890abcdef1234567890abcdef12345
- **Gate role:** qa
- **Timestamp:** 2026-06-04T15:32:00Z
- **Notes:** Full vitest suite green (165/165). Leg A/B/C all clean.
```

Required fields, in order: heading line, `Gate role`, `Timestamp`, `Notes`. The 40-char lowercase hex SHA is the load-bearing identifier (matches `gh pr view --json headRefOid`). Em-dash separators are U+2014 (NOT U+002D hyphen or U+2013 en-dash). Multi-line free-form prose ABOUT the verdict (test output blocks, AC checklists, evidence dumps) is permitted and encouraged BELOW the four required field lines; CI parses only the heading + four fields.

### REVISE / FAIL counterpart

```markdown
### Wave-111 REVISE verdict — PR #999 — SHA abc1234567890abcdef1234567890abcdef12345
- **Gate role:** ux-designer
- **Timestamp:** 2026-06-04T15:32:00Z
- **Blocks:** 2
- **Notes:** Spec drift on focus-ring color (block); copy mismatch on error pill (block). HANDOFF to ui-developer.
```

REVISE and FAIL share the same shape (only the verdict token differs in the heading). Both add a `- **Blocks:** N` field above `Notes` — integer count of block-severity findings. Cluster 4 CI treats them identically at parse time; the FAIL vs REVISE semantic distinction is internal to the gate role's workflow.

### Grep-able anchor regex (Cluster 4's heading-line scan)

```regex
^### Wave-(\d{1,4}) (PASS|REVISE|FAIL) verdict — PR #(\d{1,6}) — SHA ([0-9a-f]{40})$
```

Capture groups (in order): wave number, verdict type, PR number, full 40-char HEAD SHA. The em-dash MUST be embedded as the literal U+2014 character.

### Backward-compat decision: Option (c) — grandfather pre-Wave-111 entries; format binds Wave 111+ only

Existing PASS-shaped prose (`coordination/handoffs/qa.md` Waves 108/110; `ux-designer.md` Waves 107-110 advisory replies; `architect.md` historical prose) is **grandfathered**. No retroactive rewrite. Cluster 4 CI's regex scopes its check to verdicts where `wave >= 111` — pre-111 prose is invisible to the check by construction.

### Files landed Wave 111a

1. `architecture/decisions/ADR-018-pass-verdict-format.md` (new) — full spec with rationale, regex, state semantics for DevSecOps step 3, backward-compat policy, follow-ups for 111b + 111c.
2. `architecture/INDEX.md` — added ADR-018 row to Decision Records table; updated "Last updated" line to Wave 111a.

### Verification (Wave 111a)

- `pnpm vitest run tests/qa/wave-108/subagent-body-cleanliness.test.ts` → 153/153 PASS.

---

## PREV — 2026-06-04 — Wave 110 Lanes A + D-#381 (DevSecOps merge protocol + LESSONS stale-ref sweep)

**Closed:** #383 (DevSecOps merge protocol step 3 landed in `.claude/agents/devsecops.md`), #381 (LESSONS stale-ref sweep).

### Canonical Wave 110-A clause text (grep-reuse for QA's Wave 110-B completeness test)

> **Verify gate-role PASS is recorded in HANDOFF (mandatory pre-merge).** Open `coordination/handoffs/qa.md` and (if the PR touches UI) `coordination/handoffs/ux-designer.md`. Confirm a Wave-N PASS verdict is recorded against the PR's HEAD SHA. **If the gate role's HANDOFF doc does not record the PASS, HANDOFF back to the gate role asking them to record it before merging — do NOT merge on the implementer's claim of PASS alone.** Rationale: PR #231 was merged before the UX Designer recorded the post-revision PASS verdict because the merge step trusted the implementer's HANDOFF claim. Parallel rule to step 0 in Architect/UX review-gate workflows (pre-verdict SHA sync, #314).

### Files landed Wave 110

1. `.claude/agents/devsecops.md` — new step 3 in "Deployment workflow (single turn)".
2. `LESSONS.md` — Wave 110 entry at top of 2026-06-04 section; Wave 93 fragment-pattern entry rewritten; 3 other stale-ops entries annotated with "Superseded by Wave 106 (Plan C)".

---

## PREV — 2026-06-04 — Wave 109 Slice 1 (review-gate hardening, docs-only)

**Closed (Wave 109):** #335 (`architecture/` co-authorship rule), #314 (Pre-verdict SHA sync for review gates).

### Canonical Wave 109 clause texts (grep-reuse)

Architect's review-rubric gate (step 4):

> **Co-authorship gate (`architecture/` files).** If the PR diff modifies any file under `architecture/` and the PR author is NOT the Architect, **FAIL** the review unless a prior `[[HANDOFF: architect]]` exists in the PR description, commit messages, or `coordination/handoffs/architect.md` approving the change.

Implementer-body matching clause (verbatim across `business-analyst.md`, `ui-developer.md`, `backend-developer.md`, `qa.md`, `devsecops.md`, `ux-designer.md`):

> **You do NOT write to `architecture/` without a prior HANDOFF to Architect approving the change.**

Pre-verdict SHA sync (Architect step 0 / UX Designer top-of-Critique-workflow):

> **Pre-verdict SHA sync (mandatory before reading the diff / rendering any visual verdict).** Render verdicts only against the exact SHA the PR is at.

**Files landed Wave 109:** `.claude/agents/{architect,ux-designer,business-analyst,ui-developer,backend-developer,qa,devsecops}.md` + `LESSONS.md` (2 entries at top of 2026-06-04 section).

---

## PREV — 2026-06-04 — Wave 108 (subagent body rewrite rule pack + 8 file edits)

ADR-017 landed; 8 subagent body rewrites; 4 QA grep tests all green; per-file legacy ref count 95 → 0 (modulo 8 allowlisted "You do NOT have `mcp__apex-team__*` tools" sentences). ADR-014 status flipped to Superseded by ADR-017. `architecture/workspace-conventions.md` + `architecture/INDEX.md` updated.
