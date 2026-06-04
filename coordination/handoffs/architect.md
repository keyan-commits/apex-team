# architect — HANDOFF

## ⏭️ NOW — 2026-06-04 — Wave 109 Slice 1 (review-gate hardening, docs-only)

**Closes / addresses:**
- #335 — `architecture/` co-authorship rule (8 files edited: `architect.md` + 6 implementer bodies + `LESSONS.md`)
- #314 — Pre-verdict SHA sync for review gates (Architect + UX Designer review-gate sections + `LESSONS.md`)

**Verification (all green this turn):**
- `pnpm vitest run tests/qa/wave-108/subagent-body-cleanliness.test.ts` → 153/153 PASS (ADR-017 allowlist/denylist still clean)
- `pnpm lint --max-warnings 0` → clean
- `pnpm type-check` → clean
- Manual grep for legacy patterns (ADR-017 denylist + dangling src/lib pointers + Plan C header marker) → 0 matches
- Allowlist sanity: exactly 8 `mcp__apex-team__` occurrences total (one per file), all on "You do NOT have" lines

### Co-authorship clause text (canonical — grep this if a future reviewer wants to verify reuse)

Architect's review-rubric gate (step 4 in "Code review responsibility"):

> **Co-authorship gate (`architecture/` files).** If the PR diff modifies any file under `architecture/` and the PR author is NOT the Architect, **FAIL** the review unless a prior `[[HANDOFF: architect]]` exists in the PR description, commit messages, or `coordination/handoffs/architect.md` approving the change. Rationale: `architecture/` is the durable single source of truth for NFRs, ADRs, and coding standards; unilateral modifications by implementers create silent drift. The HANDOFF requirement makes the cross-role approval auditable. Trivial Architect-authored fixups (typos, ADR status flips you would have made yourself) are not violations — they're your own lane.

Implementer-body matching clause (verbatim across `business-analyst.md`, `ui-developer.md`, `backend-developer.md`, `qa.md`, `devsecops.md`, `ux-designer.md` — each file adapts the parenthetical example to the role's perspective):

> **You do NOT write to `architecture/` without a prior HANDOFF to Architect approving the change.** `architecture/` is the durable single source of truth for NFRs, ADRs, and coding standards. If you spot an architecture-level concern (e.g. <role-specific example>), file a HANDOFF entry in `coordination/handoffs/architect.md` and let Architect own the edit. Editing `architecture/` unilaterally will fail Architect's review gate.

Per-role example phrasing landed:
- BA: "a requirement that needs an NFR rider, a coding-standard gap exposed by an AC"
- UI Dev: "a missing ADR your implementation needs, a coding standard that contradicts the chosen tech stack"
- BE Dev: "a missing ADR your service design needs, an API-contract pattern that should be standardized"
- QA: "an ADR's allowlist needs a new exception, an NFR threshold should be tightened"
- DevSecOps: "an NFR that should be tightened given a CVE pattern, an ADR rider needed for a new deploy topology"
- UX Designer: "a visual-NFR threshold that should be codified, an a11y standard that belongs in `coding-standards.md`"

### Pre-verdict SHA sync text (canonical)

Architect (step 0 in "Code review responsibility", before reading the diff):

> **Pre-verdict SHA sync (mandatory before reading the diff).** Render verdicts only against the exact SHA the PR is at:
> ```bash
> gh pr view <PR#> --json headRefOid,headRefName  # capture HEAD SHA + branch
> git fetch origin <branch>
> git checkout <PR HEAD SHA>
> ```
> Skipping this step caused PR #311's false-REVISE — the verdict was rendered against an out-of-date local checkout that didn't include the fix commit; CI was already green on the actual PR HEAD. The fetch+checkout is cheap (<5s); the false verdict is expensive (revisited PR, eroded gate trust). If you are operating in a per-role worktree per WORKTREE_ISOLATION_PROTOCOL, run the fetch+checkout inside the worktree, not the primary tree.

UX Designer (top of "Critique workflow", before walking the user flow):

> **Pre-verdict SHA sync (mandatory before rendering any visual verdict).** Visual verdicts (screenshots, contrast checks, motion behavior, layout walks) MUST be captured against the exact SHA the PR is at:
> ```bash
> gh pr view <PR#> --json headRefOid,headRefName  # capture HEAD SHA + branch
> git fetch origin <branch>
> git checkout <PR HEAD SHA>
> ```
> PR #311 showed the failure mode end-to-end on the Architect lane (a false-REVISE rendered against an out-of-date checkout while CI was already green). UX is equally vulnerable since stale screenshots/renders cite the wrong code — and a stale visual verdict erodes gate trust faster than a stale logic verdict because the artifact looks authoritative. If you are operating in a per-role worktree per WORKTREE_ISOLATION_PROTOCOL, run the fetch+checkout inside the worktree, not the primary tree.

### LESSONS.md entries landed (top of file, under H1, ahead of 2026-06-03 block)

- **2026-06-04 — Wave 109 — PR #311 false-REVISE from stale local checkout; review gates now require pre-verdict SHA sync** (covers #314)
- **2026-06-04 — Wave 109 — `architecture/` co-authorship gate; implementers cannot edit Architect's lane unilaterally** (covers #335; also notes the DevSecOps pre-merge gap as a follow-up)

**Interpretation note re: prompt's "Add to the END of LESSONS.md" instruction.** LESSONS.md's own header reads "Append-only. Newest first." with `## YYYY-MM-DD` headers in reverse chronological order — the file's "end" for a chronologically-ordered "newest first" log is the TOP of the entry list (top of timeline = newest). I added the two Wave 109 entries above the 2026-06-03 block and preserved every existing entry verbatim (no reorders, no edits). If the PO intended literal file-bottom insertion, the new entries are easy to move; flag in re-dispatch and I'll relocate.

### Out-of-scope finding flagged for a future wave (DevSecOps merge-protocol gap)

The PR #231 LESSONS entry surfaces a gap I noticed while editing: `devsecops.md` "Deployment workflow (single turn)" step 2 says "Review that both gates are confirmed. Do not merge on a FAIL." There is no explicit check that the gating role's PASS is **recorded in `coordination/handoffs/<gate-role>.md`** before the merge. Today, DevSecOps trusts the implementer's HANDOFF claim ("QA returned PASS"). PR #231 shipped because that trust was implicit and the gate-role's HANDOFF doc was not actually updated with the verdict.

**Recommendation (out of scope this slice):** add a step 2a to DevSecOps's deployment workflow: "Open `coordination/handoffs/qa.md` and (if UI) `coordination/handoffs/ux-designer.md`. Confirm a Wave-N PASS verdict is recorded against the PR's HEAD SHA. If the gate role's HANDOFF doc does not record the PASS, HANDOFF back to the gate role asking them to record it before merging."

**Action:** I'll file this as a self-improvement issue on `keyan-commits/apex-team` in a follow-up turn (not done this turn — focusing on landing the slice; recording it here so PO can sequence). Tag: `self-improvement`. Title candidate: "DevSecOps merge protocol: require gate-role PASS recorded in HANDOFF doc before merge."

### Files landed this turn

1. `.claude/agents/architect.md` — added step 0 (pre-verdict SHA sync) and step 4 (architecture/ co-authorship gate) to "Code review responsibility" (steps 1-3 renumbered).
2. `.claude/agents/ux-designer.md` — added "Pre-verdict SHA sync" preamble to "Critique workflow"; added architecture/ co-authorship bullet to "Your boundaries".
3. `.claude/agents/business-analyst.md` — added architecture/ co-authorship bullet to "Your boundaries".
4. `.claude/agents/ui-developer.md` — added architecture/ co-authorship bullet to "Your boundaries".
5. `.claude/agents/backend-developer.md` — added architecture/ co-authorship bullet to "Your boundaries".
6. `.claude/agents/qa.md` — added architecture/ co-authorship bullet to "Your boundaries".
7. `.claude/agents/devsecops.md` — added architecture/ co-authorship bullet to "Your boundaries".
8. `LESSONS.md` — 2 new entries at the top of the timeline (under H1, ahead of 2026-06-03 block).

### In flight / next

- This slice is ready for code review. Since I am the author and the changes are to subagent body files (not `architecture/`), no co-authorship gate fires; standard Architect self-review applies, and the QA regression test + lint + type-check have all run green.
- Next slice (out of scope this turn): file the DevSecOps merge-protocol self-improvement issue.

### Parked / future (carried from Wave 108)

- `system-design.md` — still not created; would document the eight-subagent + workspace-directory contract. Stub when useful.
- `tech-stack.md` — still not created; Vitest + ESLint + TS + pnpm is the entire stack.
- `coding-standards.md` — still not created; relevant standards under the subagent runtime live in `.claude/agents/*.md` and per-test conventions in `tests/qa/`.
- Fitness function for OQ-085-001's "no binary files committed under `tests/qa/wave-*/evidence/`" — QA owns implementation.
- Viewer-repo subagent body audit (per ADR-017 follow-up).

### Notes / caveats

- Architect's "Code review responsibility" step list grew from 7 steps to 8 (added step 0 + step 4); renumbered the original 4-7 to 5-8 to keep numeric ordering meaningful.
- UX Designer's "Critique workflow" pre-verdict preamble is positioned before step 1 (mental layout reconstruction) so the SHA sync happens before any file is read — the same ordering Architect uses.
- The implementer co-authorship clauses are deliberately phrased to point at `coordination/handoffs/architect.md` as the canonical request channel, matching the ADR-017 allowlist for cross-role-HANDOFF text. The regression test stays green because both `coordination/handoffs/architect.md` and `architecture/` are workspace-convention paths, not legacy denylist patterns.

---

## PREV — 2026-06-04 — Wave 108 (subagent body rewrite rule pack + 8 file edits)

**Done that turn:**

- **ADR-017 landed** — `architecture/decisions/ADR-017-subagent-body-rewrite-rules.md`. Title: "Subagent prompt body rewrite rules (Plan C runtime)." This is the rule pack governing legacy-pattern removal from `.claude/agents/*.md` bodies. 15 named rewrite rules keyed by legacy pattern (Pattern → Action → Rationale), plus an inline-quote rule for the 4 retired-source protocols (`REQUIREMENTS_PHASE_PROTOCOL`, `DEPLOYMENT_GATES_PROTOCOL`, `WORKTREE_ISOLATION_PROTOCOL`, `SKILLS_SELF_ENRICHMENT_PROTOCOL`), plus the Open Question resolution (Plan C runtime adapter header REMOVED post-rewrite — see Decision section for both sides argued and rationale picked), plus an explicit allowlist with three concrete grep tests QA can copy verbatim.
- **8 subagent body rewrites executed** — `.claude/agents/{architect,backend-developer,business-analyst,devsecops,product-owner,qa,ui-developer,ux-designer}.md`. All four QA grep tests now pass with 0 non-allowlisted matches:
  1. `mcp__apex-team__` — only matches inside the allowlist sentence "You do NOT have ..." (1 per file × 8 files = 8 allowed lines; 0 violations elsewhere).
  2. broad denylist (dev:test / dev:supervised / .restart-trigger / _handoff-pending / fold-handoff / talk_to_* / /api/health / data/test-*.db / agent_state / :3100-:3130) — 0 matches across all 8 files.
  3. `src/lib/roles.ts|src/lib/protocols.ts|src/lib/skills/` (dangling pointers) — 0 matches.
  4. `## Plan C runtime adapter` (header marker) — 0 matches (removed per ADR-017 Decision).
- **Per-file legacy ref count: 11 → 0 (architect), 14 → 0 (backend-developer), 11 → 0 (business-analyst), 15 → 0 (devsecops), 7 → 0 (product-owner), 23 → 0 (qa), 12 → 0 (ui-developer), 12 → 0 (ux-designer).** Total 95 → 0 modulo the 8 allowlisted "You do NOT have mcp__apex-team__*" sentences.
- **Concrete fix for PR #376 class of bug:** DevSecOps body no longer instructs the agent to write `_handoff-pending/<wave>-devsecops.md` or run `pnpm fold-handoff`. The HANDOFF-state-update section in every subagent now directs the agent to edit `coordination/handoffs/<role-id>.md` directly.
- **ADR-014 status updated to Superseded by ADR-017** under the subagent runtime.
- **`architecture/workspace-conventions.md` cross-reference section amended** — ADR-017 added as a companion to the directory contract.
- **`architecture/INDEX.md` updated** — ADR-016 + ADR-017 rows added; ADR-014 status flipped; last-updated bumped.

### Wave 107 deliverable — `workspace-conventions.md` — **RATIFIED**

(Detailed Wave 107 history archived in earlier HANDOFF revisions.)
