# architect — HANDOFF

## ⏭️ NOW — 2026-06-04 — Wave 111a Cluster 5 foundation (ADR-018 canonical PASS-verdict format)

**Deliverable:** `architecture/decisions/ADR-018-pass-verdict-format.md`. Specifies the heading-anchored markdown block + 4 field lines that gate-role HANDOFF docs (`coordination/handoffs/qa.md`, `ux-designer.md`, `architect.md`) MUST emit on PASS / REVISE / FAIL verdicts dated >= Wave 111. Consumed by `.claude/agents/devsecops.md` line 58 (step 3, Wave 110); mechanically enforced by Wave 111c CI.

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

Capture groups (in order): wave number, verdict type, PR number, full 40-char HEAD SHA. The em-dash MUST be embedded as the literal U+2014 character — escape sequences (`—`) vary across grep dialects. macOS BSD `grep` users should invoke `rg` (ripgrep) which handles Unicode without flag fiddling.

After heading match, field-extraction regexes (lines 2-5 below the heading):

```regex
^- \*\*Gate role:\*\* (qa|ux-designer|architect)$
^- \*\*Timestamp:\*\* (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)$
^- \*\*Blocks:\*\* (\d+)$            # REVISE/FAIL only
^- \*\*Notes:\*\* (.*)$              # may be empty after colon
```

### Backward-compat decision: Option (c) — grandfather pre-Wave-111 entries; format binds Wave 111+ only

Existing PASS-shaped prose (`coordination/handoffs/qa.md` Waves 108/110; `ux-designer.md` Waves 107-110 advisory replies; `architect.md` historical prose) is **grandfathered**. No retroactive rewrite. Cluster 4 CI's regex scopes its check to verdicts where `wave >= 111` — pre-111 prose is invisible to the check by construction.

Reasoning: (a) annotate-inline adds reading noise and CI allowlist complexity for zero audit gain (pre-111 verdicts are for already-merged PRs); (b) sweep churns commit history and risks breaking external references citing the old prose by line; (c) forward-binding has zero migration cost — gate roles begin emitting the new format on Wave 111+ verdicts. Note: ux-designer's "Verdict: No UI impact — skip UX gate." replies are triad-phase advisory replies, NOT gate-role PASS verdicts under this ADR — they're explicitly out of scope.

### Cross-reference bundling decision: DEFERRED to Wave 111b

Bundled in 111a: ADR-018 + `architecture/INDEX.md` entry only. Atomic PR; spec-only.

Deferred to 111b: cross-references in `.claude/agents/devsecops.md` step 3, `.claude/agents/architect.md` review rubric step 7, `.claude/agents/ux-designer.md` Gate verdict format section (lines 360-377), `.claude/agents/qa.md` Deployment-gate verification section. Each role pastes the canonical block as a fill-in template into its own body.

Reasoning: (1) 111a's user prompt explicitly framed this as "Cluster 5 foundation. PASS-verdict format spec" — single deliverable focus. (2) Four subagent body edits enlarge this PR meaningfully and each is small + parallelizable in 111b. (3) DevSecOps step 3's instruction is already self-contained ("Confirm a Wave-N PASS verdict is recorded against the PR's HEAD SHA") — the format spec doesn't change WHAT DevSecOps verifies; until Wave 111c CI lands, DevSecOps reads by eye anyway. No pointer is dangling because step 3 doesn't reference the format spec — it just exists. (4) ADR-017 grep-test (`tests/qa/wave-108/subagent-body-cleanliness.test.ts`) gets nothing to evaluate this wave since no subagent files were touched; verified clean (153/153).

### Files landed this turn

1. `architecture/decisions/ADR-018-pass-verdict-format.md` (new) — full spec with rationale, regex, state semantics for DevSecOps step 3, backward-compat policy, follow-ups for 111b + 111c.
2. `architecture/INDEX.md` — added ADR-018 row to Decision Records table; updated "Last updated" line to Wave 111a.

### Verification (this turn)

- `pnpm vitest run tests/qa/wave-108/subagent-body-cleanliness.test.ts` → 153/153 PASS (no subagent files touched; sanity-check the ADR-018 templates contain no ADR-017-denylisted patterns).
- No subagent-body edits this wave → no ADR-017 co-authorship concerns; no architect.md self-review needed beyond ADR-018 itself, which is Architect-authored in Architect's own lane.

### In flight / next

- This slice is ready for code review. As Architect-authored `architecture/` edits (new ADR + INDEX row), this is single-author within my own lane — no co-authorship gate fires.
- Wave 111b (parallel candidate, deferred): four subagent body edits to embed the canonical block as a template in each gate role's body. Recommend parallel dispatch to qa + ux-designer + (self for architect.md + devsecops.md) — each edit is small and confined to one file's review/critique workflow section.
- Wave 111c (gated on 111b): DevSecOps wires the regex into CI. Workflow: fetch PR HEAD SHA, grep gate-role HANDOFF docs, fail PR if `Wave-N PASS — PR #<N> — SHA <HEAD_SHA>` missing for a runtime-code PR.

### Parked / future (carried forward)

- `system-design.md` — still not created.
- `tech-stack.md` — still not created (Vitest + ESLint + TS + pnpm is the entire stack).
- `coding-standards.md` — still not created.
- Fitness function for OQ-085-001's "no binary files committed under `tests/qa/wave-*/evidence/`" — QA owns implementation.
- Viewer-repo subagent body audit (per ADR-017 follow-up).
- Wave 111+ candidate (post-Cluster-5): a small `scripts/emit-verdict.sh` helper that takes `--wave --pr --sha --role --notes` and appends a canonical block to the role's HANDOFF doc, eliminating hand-typing errors.
- Wave 111+ candidate (post-Cluster-5): REVISE verdict `- **Re-review target SHA:** <SHA>` field — deferred since stale-PASS detection (`PASS heading exists but SHA mismatches current HEAD`) already covers the case without an extra field.

### Notes / caveats

- The canonical block in ADR-018 deliberately uses an example PR number (`#999`) and a placeholder 40-char SHA (`abc1234567890abcdef1234567890abcdef12345`). When gate roles paste the block into their HANDOFF, they replace both with real values. The placeholder hex passes the regex (it's lowercase hex, 40 chars) but cannot collide with a real Git SHA in practice — `999` is way below current PR numbering (~380s) so even if a real PR #999 existed someday, its HEAD SHA would not be the placeholder.
- The format intentionally records seconds-precision timestamps, not milliseconds — ordering is human-skim-deterministic at second granularity, and machine clock skew between subagent invocations on the same host is sub-second in practice.
- CONCERNS verdicts (Architect's "ship with caveats" outcome from `.claude/agents/architect.md` line 50) are deliberately EXCLUDED from this format. CONCERNS is advisory and logged in `architecture/decisions/`, not consumed by DevSecOps step 3. If a future wave wants CONCERNS to be a structured fourth verdict type (for trend analysis), it's an additive change to the regex.

---

## PREV — 2026-06-04 — Wave 110 Lanes A + D-#381 (DevSecOps merge protocol + LESSONS stale-ref sweep)

**Closes / addresses:**
- #383 — DevSecOps merge protocol: require gate-role PASS recorded in HANDOFF doc before merge (newly filed this turn; ACs 1–3 all satisfied by this PR).
- #381 — LESSONS.md stale `_handoff-pending/` + `pnpm fold-handoff` references rewritten to reflect Plan C state.

**Verification (all green this turn):**
- `pnpm vitest run tests/qa/wave-108/subagent-body-cleanliness.test.ts` → 153/153 PASS (ADR-017 allowlist/denylist still clean after `devsecops.md` step-list edit).
- `pnpm lint` → clean.
- `pnpm type-check` → clean.

### Canonical Wave 110-A clause text (grep-reuse for QA's Wave 110-B completeness test)

**File:** `.claude/agents/devsecops.md`
**Line anchor:** line 58 (within "Deployment workflow (single turn)", as step 3; original steps 3–8 renumbered to 4–9).

Verbatim clause text (the load-bearing sentence is the bolded HANDOFF-back instruction; QA can grep on any stable substring such as `Verify gate-role PASS is recorded in HANDOFF` or `do NOT merge on the implementer's claim of PASS alone`):

> **Verify gate-role PASS is recorded in HANDOFF (mandatory pre-merge).** Open `coordination/handoffs/qa.md` and (if the PR touches UI) `coordination/handoffs/ux-designer.md`. Confirm a Wave-N PASS verdict is recorded against the PR's HEAD SHA. **If the gate role's HANDOFF doc does not record the PASS, HANDOFF back to the gate role asking them to record it before merging — do NOT merge on the implementer's claim of PASS alone.** Rationale: PR #231 was merged before the UX Designer recorded the post-revision PASS verdict because the merge step trusted the implementer's HANDOFF claim. The verdict-in-the-gate-role's-own-HANDOFF requirement makes the gate verifiable rather than asserted. Parallel rule to step 0 in Architect/UX review-gate workflows (pre-verdict SHA sync, #314).

Suggested grep targets for QA's completeness assertion:
1. `Verify gate-role PASS is recorded in HANDOFF` — exact step-title substring (most stable).
2. `do NOT merge on the implementer's claim of PASS alone` — load-bearing imperative.
3. `coordination/handoffs/qa.md` + `coordination/handoffs/ux-designer.md` co-presence — proves both gate paths are referenced.

### Files landed this turn

1. `.claude/agents/devsecops.md` — inserted new step 3 "Verify gate-role PASS is recorded in HANDOFF (mandatory pre-merge)" in "Deployment workflow (single turn)" (line 58); old steps 3–8 renumbered to 4–9.
2. `LESSONS.md` — added new Wave 110 entry at the top of 2026-06-04 section: "DevSecOps merge protocol must verify gate-role PASS is recorded in HANDOFF doc, not trust implementer's claim (closes #383)." Placed above Wave 109 entries per newest-first convention.
3. `LESSONS.md` — rewrote Wave 93 fragment-pattern entry per #381: title now "Wave 93 → Wave 108 — per-role HANDOFF state files (`coordination/handoffs/<role-id>.md`) prevent doc-collision merge conflicts (ADR-014 superseded by ADR-017)"; "We now do" line cites Plan C runtime + ADR-017; references PR #374 (`ebc83c5`) as the retirement commit; preserves the WHY (concurrent doc-collision conflicts on shared HANDOFF.md, server-side "Update branch" not applying the merge driver).
4. `LESSONS.md` — annotated three other stale-ops entries with "Superseded by Wave 106 (Plan C)" inline notes (preserves append-only narrative, redirects readers to current state):
   - "Mandatory pnpm build + boot smoke before QA PASS (Wave 64)" — `:3100` + `/api/health` boot Leg B no longer applies under Plan C; build-gate equivalent is now `pnpm test:run` + `pnpm type-check` + `pnpm lint`. User mandate (test-before-deploy) still binds — only the mechanism changed.
   - "`tsx watch` mid-edit kills the editing agent" — `.restart-trigger` + `scripts/dev-supervisor.mjs` retired; subagents are single-turn, no long-lived process to restart.
   - "MCP transport drops on long agent turns" — no MCP server, no SSE handler under Plan C.
   - "We now do" lines on these three rewritten to "We did (pre-cutover):" to make the historical scope explicit.

### Out-of-scope audit notes

- `LESSONS.md` line 1 footer "Append-only — never edit past entries" was inherited. I treated #381's explicit "rewrite stale references" mandate as a deliberate carveout — for the Wave 93 entry I performed a wholesale rewrite (the WHY is preserved verbatim; only the "we now do" is changed). For the three other stale-ops entries (Wave 64 boot-smoke, `tsx watch`, MCP transport), I used annotation + scope-narrowing language ("We did (pre-cutover):") rather than rewriting bodies. This keeps the historical narrative intact while redirecting readers to current state. If a future wave wants the bodies themselves trimmed, the annotation makes it cheap.
- No other stale-ops references found in `LESSONS.md` after the sweep. `:3100`-`:3130`, `.restart-trigger`, `_handoff-pending/`, `pnpm fold-handoff`, `pnpm dev:test*` no longer appear as live "we now do" claims — only as annotated historical incidents.

### Issue filed this turn

- #383 — `keyan-commits/apex-team` — title: "DevSecOps merge protocol: require gate-role PASS recorded in HANDOFF doc before merge." Labels: `self-improvement`, `bug`, `documentation`. User-story body per `feedback_user_story_format`. All three ACs satisfied by this same PR (AC1 — devsecops.md step landed; AC2 — explicit HANDOFF-back instruction landed; AC3 — Wave 110 LESSONS entry ties the rule to PR #231). Issue can be closed by DevSecOps's merge of this PR.

### In flight / next

- This slice is ready for code review. As Architect-authored docs-only edits to subagent body + LESSONS, no co-authorship gate fires (`architecture/` was not touched). Standard self-review + QA regression apply.
- QA's Wave 110-B completeness test (per prompt) will assert presence of: (a) Wave 109 co-authorship clauses across the 7 affected files (already landed Wave 109), (b) Wave 109 pre-verdict SHA-sync clauses in `architect.md` + `ux-designer.md` (already landed Wave 109), AND (c) the new Wave 110-A merge-protocol clause in `devsecops.md` at line 58 (landed this turn). The canonical clause text is recorded above for grep-reuse.

### Parked / future (carried from Wave 109)

- `system-design.md` — still not created; would document the eight-subagent + workspace-directory contract. Stub when useful.
- `tech-stack.md` — still not created; Vitest + ESLint + TS + pnpm is the entire stack.
- `coding-standards.md` — still not created; relevant standards under the subagent runtime live in `.claude/agents/*.md` and per-test conventions in `tests/qa/`.
- Fitness function for OQ-085-001's "no binary files committed under `tests/qa/wave-*/evidence/`" — QA owns implementation.
- Viewer-repo subagent body audit (per ADR-017 follow-up).

### Notes / caveats

- DevSecOps's "Deployment workflow (single turn)" step list grew from 8 steps to 9 (new step 3); steps 4–9 are the renumbered originals. Numeric ordering preserved.
- The new step 3 deliberately references `coordination/handoffs/qa.md` and `coordination/handoffs/ux-designer.md` by full path (not legacy `data/agent_state` etc.) so the ADR-017 regression test stays green — workspace-convention paths are in the allowlist.
- The Wave 110 LESSONS entry cites issue #383 as `closes #383`; merging this PR will trigger the auto-close. AC1–AC3 of #383 are all satisfied by this same PR's diff.

---

## PREV — 2026-06-04 — Wave 109 Slice 1 (review-gate hardening, docs-only)

**Closed / addressed (Wave 109):**
- #335 — `architecture/` co-authorship rule (8 files edited: `architect.md` + 6 implementer bodies + `LESSONS.md`)
- #314 — Pre-verdict SHA sync for review gates (Architect + UX Designer review-gate sections + `LESSONS.md`)

**Canonical Wave 109 clause texts (kept for grep-reuse by future audits):**

Architect's review-rubric gate (step 4 in "Code review responsibility"):

> **Co-authorship gate (`architecture/` files).** If the PR diff modifies any file under `architecture/` and the PR author is NOT the Architect, **FAIL** the review unless a prior `[[HANDOFF: architect]]` exists in the PR description, commit messages, or `coordination/handoffs/architect.md` approving the change. Rationale: `architecture/` is the durable single source of truth for NFRs, ADRs, and coding standards; unilateral modifications by implementers create silent drift. The HANDOFF requirement makes the cross-role approval auditable. Trivial Architect-authored fixups (typos, ADR status flips you would have made yourself) are not violations — they're your own lane.

Implementer-body matching clause (verbatim across `business-analyst.md`, `ui-developer.md`, `backend-developer.md`, `qa.md`, `devsecops.md`, `ux-designer.md`):

> **You do NOT write to `architecture/` without a prior HANDOFF to Architect approving the change.** `architecture/` is the durable single source of truth for NFRs, ADRs, and coding standards. If you spot an architecture-level concern (e.g. <role-specific example>), file a HANDOFF entry in `coordination/handoffs/architect.md` and let Architect own the edit. Editing `architecture/` unilaterally will fail Architect's review gate.

Pre-verdict SHA sync (Architect step 0 / UX Designer top-of-Critique-workflow):

> **Pre-verdict SHA sync (mandatory before reading the diff / rendering any visual verdict).** Render verdicts only against the exact SHA the PR is at:
> ```bash
> gh pr view <PR#> --json headRefOid,headRefName
> git fetch origin <branch>
> git checkout <PR HEAD SHA>
> ```
> PR #311's false-REVISE motivated this rule. If operating in a per-role worktree (WORKTREE_ISOLATION_PROTOCOL), run fetch+checkout inside the worktree.

**Files landed Wave 109:** `.claude/agents/{architect,ux-designer,business-analyst,ui-developer,backend-developer,qa,devsecops}.md` + `LESSONS.md` (2 entries at top of 2026-06-04 section).

---

## PREV — 2026-06-04 — Wave 108 (subagent body rewrite rule pack + 8 file edits)

ADR-017 landed (`architecture/decisions/ADR-017-subagent-body-rewrite-rules.md`); 8 subagent body rewrites executed; 4 QA grep tests all green; per-file legacy ref count went from 95 → 0 modulo 8 allowlisted "You do NOT have mcp__apex-team__*" sentences. ADR-014 status flipped to Superseded by ADR-017. `architecture/workspace-conventions.md` + `architecture/INDEX.md` updated. Detailed history archived in prior HANDOFF revisions.
