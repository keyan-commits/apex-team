# architect — HANDOFF

## ⏭️ NOW — 2026-06-04 — Wave 112 Phase 1 (#391 peer-edit protocol)

### Wave-112 PASS verdict — PR #0 — SHA 39298fbb1caf5e38b9f7d3b09f4cf11a8a879074
- **Gate role:** architect
- **Timestamp:** 2026-06-04T12:25:30Z
- **Notes:** Single-author multi-file edit landing the #391 peer-edit boundary across the 8 subagent bodies and `architecture/workspace-conventions.md`. Self-attested PASS — all edits within Architect's own lane (architecture/ + .claude/agents/), no peer-edit-violation footprint of my own. Placeholder block per ADR-018 Wave 111b amendment: `PR #0` + last-known SHA (current HEAD `39298fbb1caf5e38b9f7d3b09f4cf11a8a879074` from main before staging the verdict commit). DevSecOps post-merge backfill replaces with real PR # + merge SHA.

### Canonical boundary clause text (Wave 112 — grep-reuse for QA Phase 3 completeness test)

The Wave 112 peer-edit boundary clause MUST appear in each of the 8 subagent bodies' "Your boundaries" section. The canonical anchor phrase (every body contains this verbatim substring):

> **You do NOT write to other roles' `coordination/handoffs/<peer-id>.md` files.**

Plus, in EVERY body's clause, the following anchor substrings co-present within the same boundary bullet:

1. `your own HANDOFF doc` — points the role at its own file as the correct write target.
2. `advisory ` (followed eventually by `[[HANDOFF: peer]]` or `[[DISPATCH: peer]]`) — names the cross-role mechanism.
3. `outer orchestrator relays` (or `outer Claude Code orchestrator`) — explains the runtime semantics under Plan C.
4. `Agent` (the `Agent` tool invocation) — names the relay mechanism.
5. `muddies the verdict chain` — explains the harm.
6. `Architect's review gate` (or `step 4b`) — names the enforcement mechanism.

Per-role variations to note in QA's completeness test:
- **product-owner.md** uses `[[DISPATCH: peer]]` (PO's mechanism) rather than `[[HANDOFF: peer]]`.
- **devsecops.md** carries a single narrow exception clause for the ADR-018 post-merge backfill of `PR #0` + placeholder SHA → real PR # + merge SHA. This is the ONE authorized peer-edit class and is named in ADR-018 itself. The test should not flag DevSecOps's exception text as a boundary-clause violation.

### Files landed Wave 112 Phase 1 (8 .claude/agents/ + 1 architecture/)

1. `architecture/workspace-conventions.md` — new section "Peer-edit protocol — HANDOFF docs are single-author by role (Wave 112)" with: rule (peers read; only owner writes), rationale (audit trail integrity, verdict chain load-bearing for ADR-018), correct mechanisms (own HANDOFF + workspace artifacts + advisory blocks), narrow exception (system-level housekeeping with explicit authorization + 3 conditions), enforcement (Architect step 4b + body boundary clauses), discovered-during (Wave 111c PR #388 / #391). Also annotated the `coordination/handoffs/<role-id>.md` row in the contract table.

2. `.claude/agents/architect.md` —
   - New code-review rubric step `4b` ("Peer-HANDOFF edit gate") sibling to existing step 4 ("Co-authorship gate (`architecture/` files)"). Parallel gates; both FAIL the PR on violation. Step 4b text includes the canonical anchor phrase and cites issue #391 + workspace-conventions.md.
   - New boundary clause appended to "Your boundaries" section. Covers the case where Architect would otherwise edit a peer's HANDOFF to record review findings — directs to advisory blocks + workspace artifacts instead.

3. `.claude/agents/product-owner.md` — new "Your boundaries" section (PO did not previously have one explicitly delineated). Single boundary bullet covers the peer-HANDOFF edit prohibition + narrow housekeeping exception. Mechanism field uses `[[DISPATCH: peer]]` per PO convention.

4. `.claude/agents/business-analyst.md` — new boundary bullet appended after the existing `architecture/` co-authorship boundary. Clarifies that "file it as a HANDOFF entry in `coordination/handoffs/architect.md`" historically meant emit a `[[HANDOFF: architect]]` block — NOT directly edit Architect's HANDOFF. This is the most-likely-to-be-misread existing clause across the implementer bodies.

5. `.claude/agents/ux-designer.md` — new boundary bullet appended after `architecture/` boundary. Reinforces that PASS/REVISE verdicts land in UX's OWN HANDOFF per ADR-018, never in the implementer's.

6. `.claude/agents/ui-developer.md` — new boundary bullet between `architecture/` boundary and the "You do NOT write tests" line. Reinforces "file a HANDOFF entry" = advisory block, not direct peer edit.

7. `.claude/agents/backend-developer.md` — same shape as ui-developer.md. Boundary bullet positioned after `architecture/` and before the tests/UI/CI exclusion bullets.

8. `.claude/agents/qa.md` — new boundary bullet after `architecture/` boundary. Reinforces that QA's PASS/FAIL verdicts land in QA's OWN HANDOFF per ADR-018 — not in the implementer's, not in Architect's, not in DevSecOps's. Also addresses the "file a HANDOFF entry" semantic.

9. `.claude/agents/devsecops.md` — new boundary bullet after `architecture/` boundary, with the ONE narrow ADR-018 backfill exception named explicitly. The exception is scoped: replace `PR #0` + placeholder SHA with real PR # + merge SHA on the verdict line — any edit outside that scope is a violation. Cites Wave 111c (PR #388) + #391.

### Gate verification (Wave 112 Phase 1)

- `pnpm vitest run tests/qa/wave-108/subagent-body-cleanliness.test.ts` → 153/153 PASS. Token discipline preserved across all 8 body edits (no denylisted tokens reproduced verbatim in the boundary clauses).
- `pnpm vitest run tests/qa/wave-110/subagent-body-completeness.test.ts` → 12/12 PASS. Existing co-authorship clauses untouched; new boundary clauses are region-disjoint additions.
- `pnpm vitest run tests/qa/wave-111/pass-verdict-format.test.ts` → 21/21 PASS. The Wave-112 PASS verdict block above conforms to ADR-018 canonical regex (verified by inspection: `### Wave-112 PASS verdict — PR #0 — SHA 39298fbb1caf5e38b9f7d3b09f4cf11a8a879074` matches `^### Wave-\d{1,4} (PASS|REVISE|FAIL) verdict — PR #\d{1,6} — SHA [0-9a-f]{40}$`).
- `pnpm vitest run tests/qa/wave-111/wave-111b-completeness.test.ts` → 34/34 PASS. ADR-018 cross-refs and Lessons sections in gate-role bodies untouched by Wave 112's boundary-clause additions (Phase 2 will add Lessons to the remaining 5 bodies — region-disjoint from Phase 1's mid-file boundary edits).
- `pnpm vitest run tests/qa/wave-111c/wave-111c-completeness.test.ts` → 29/29 PASS.
- `pnpm test:run` → 249/249 PASS full suite.
- `pnpm lint` → clean.
- `pnpm type-check` → clean.

### Co-authorship gate verification (Wave 109 rule, self-reflection)

This wave's PR will touch:
- `architecture/workspace-conventions.md` (Architect-owned, single-author = me, gate satisfied)
- `.claude/agents/*.md` (Architect's lane for review-rule edits; my own rules; gate satisfied)

No peer is co-authoring any file under `architecture/`. No HANDOFF-from-peer pre-condition required.

### Peer-HANDOFF edit gate verification (Wave 112 step 4b — meta-self-check)

This wave's PR touches `coordination/handoffs/architect.md` (this file) — edited by Architect. No peer HANDOFF docs are edited. Step 4b boundary satisfied: own-lane edit only.

### Phase 2 region-disjoint confirmation

Per the dispatch brief, PO confirmed Phase 2 (5 other subagents adding `## Lessons from prior incidents` sections per #196 carry-over) lands the new sections as tail-appended `## Lessons from prior incidents` headings at end-of-file. My Wave 112 edits land in mid-file `### Your boundaries` sections (or the new section position for PO). Region-disjoint: no edit collision between Phase 1 (mid-file boundary additions) and Phase 2 (end-of-file Lessons additions). The two phases can sequence without rework.

### In flight / next

- This slice is ready for code review. Single-author across all 10 files (1 architecture/ doc + 8 subagent bodies + this HANDOFF) within my own lane — both gates (co-authorship + peer-HANDOFF edit) verified.
- Phase 2 fan-out — 5 subagents (BA, UI Dev, BE Dev, UX, PO) self-edit their bodies to add `## Lessons from prior incidents` sections per #196 carry-over. Phase 2 is region-disjoint from Phase 1 by design.
- DevSecOps post-merge step (per ADR-018 Wave 111b amendment): replace `PR #0` placeholder + last-known SHA `39298fbb1caf5e38b9f7d3b09f4cf11a8a879074` with the real PR # + merge SHA via `chore(handoff): backfill Wave-112 verdict PR # and merge SHA`.

### Parked / future (carried forward, plus Wave 112 additions)

- `system-design.md` — still not created.
- `tech-stack.md` — still not created (Vitest + ESLint + TS + pnpm is the entire stack).
- `coding-standards.md` — still not created. Wave 112 boundary-clause discipline (the canonical anchor phrase + 6 co-presence anchors) is a candidate entry. So is the Wave 111b lessons-section pattern.
- Fitness function for OQ-085-001's "no binary files committed under `tests/qa/wave-*/evidence/`" — QA owns implementation.
- Viewer-repo subagent body audit (per ADR-017 follow-up).
- **NEW (Wave 112):** consider a Wave 112-B QA grep test that asserts the canonical anchor phrase + 6 co-presence anchors are present in each of the 8 subagent bodies. Pattern matches Wave 108/110/111 cleanliness/completeness/format triad. Filing as candidate after PR merges.

### Notes / caveats

- Step 4b in architect.md uses the bullet number `4b.` rather than renumbering subsequent steps. Rationale: existing Wave 110 completeness test asserts canonical step phrases anchored against current numbering (step 4 = co-authorship gate). Adding 4b preserves the existing assertion semantics without renumbering churn. If a future wave wants to renumber, that's a Wave 110 completeness-test update + cross-file rewrite — out of scope here.
- The boundary clause in each body intentionally varies in wording per-body tone (UI Dev / BE Dev plain-spoken; QA verdict-aware; UX verdict-aware; PO orchestration-aware; BA spec-aware; DevSecOps with the named exception). The 6 co-presence anchors are what makes it grep-checkable; verbatim phrasing across bodies is NOT the requirement.
- DevSecOps's ADR-018 backfill exception is the ONE authorized peer-edit class. It is named explicitly in DevSecOps's body and scoped narrowly (placeholder-replacement only). Any future peer-edit-exception class needs a similar treatment: named in the relevant subagent body, scoped narrowly, justified in an ADR or workspace-conventions amendment.

---

## ⏭️ PREV — 2026-06-04 — Wave 111c (alpha-suffix ratification + PR #388 review)

### Wave-111 PASS verdict — PR #388 — SHA ce6b2b1a0781ee15fcf8987cbc6a16e55671ec5b
- **Gate role:** architect
- **Timestamp:** 2026-06-04T03:50:02Z
- **Notes:** Wave 111c co-authorship + alpha-suffix ratification. **Decision: Option A — RATIFY DevSecOps's normalization. ADR-018 unchanged.** Sub-waves (a/b/c) are operational sequencing within a parent wave-number; PR# is the load-bearing disambiguator (ADR-018's state-semantics table identifies verdicts by PR# + HEAD SHA, not wave-id). PR #386 = Wave 111a, PR #387 = Wave 111b, PR #388 = Wave 111c — distinguished by PR#, all canonical `Wave-111`. Co-authorship gate verified: PR #388 touches zero `architecture/` files (gh pr view confirms 9 files, none under `architecture/`). All gates clean: vitest 220/220, lint clean, type-check clean. Canonical regex unchanged in workflow YAML (lines 58 + 79 match ADR-018 spec exactly, `\d` → `[0-9]` for grep -E compatibility only).

### Decision rationale — Option A (ratify) vs Option B (amend regex)

**Chosen: Option A.** Reasoning:

1. **ADR-018's state-semantics table already identifies verdicts by `PR #N` + HEAD SHA, NOT by wave-number.** Wave-number is descriptive metadata; PR# + SHA are the load-bearing identifiers. Allowing `[a-z]?` solves a disambiguation problem the format does not have — PR# is the disambiguator and was always intended to be.

2. **Semantic clarity preserved.** With Option A, `Wave-NNN` always means "the integer wave-number." With Option B, `Wave-111` would ambiguously mean either "the parent wave covering 111a/b/c" or "the first sub-wave whose author skipped the letter." Mixing parent-wave and sub-wave identifiers in the same regex muddies the data model.

3. **Zero churn.** Backfills already done; no test update; no workflow YAML edit; no ADR amendment. Wave 111c's pending QA completeness test continues against the unchanged spec.

4. **Sub-waves are operational artifacts.** `111a/b/c` describes intra-wave sequencing for the team (Phase 1 lands the foundation, Phase 1b lands the amendment surfaced by self-application, Phase 1c lands the CI wiring + ratification). The canonical wave-number is the numeric prefix; sub-letters are casual organizing convention, not first-class identifiers.

5. **Wave 111c HANDOFF doc edit accepts (not amends) the decision.** DevSecOps's `coordination/handoffs/devsecops.md` Wave 111c entry references `Wave-111c` in prose (e.g. backfill commit message `chore(handoff): backfill Wave-111c verdict PR # and merge SHA`); the prose use of sub-wave letters in commit messages, branch names, narrative documentation remains acceptable — the spec binds only the canonical verdict block heading.

### Co-authorship gate verification (Wave 109 rule)

`gh pr view 388 --json files` → 9 files. Manual scan: zero matches under `architecture/`. PR #388 does NOT trip the co-authorship gate. DevSecOps correctly deferred the ADR-018 amendment question via HANDOFF rather than editing `architecture/` unilaterally — that is the correct discipline, ratified here.

### Pre-verdict SHA sync (Wave 109 rule)

Verdict rendered against worktree at SHA `ce6b2b1a0781ee15fcf8987cbc6a16e55671ec5b` (PR #388 HEAD per `gh pr view`). Worktree created at `/tmp/arch-wave-111c`. `pnpm install --frozen-lockfile` clean. `pnpm test:run` 220/220 PASS. `pnpm lint` clean. `pnpm type-check` clean. `pnpm vitest run tests/qa/wave-111/pass-verdict-format.test.ts` 21/21 PASS.

### Review of PR #388 deliverables (non-UI lane — full Architect rubric applies)

**Scope:** 9 files. UI-touching detection: zero matches against `src/app/**/page.tsx`, `src/app/**/layout.tsx`, `src/components/**/*.tsx`, `src/app/globals.css`. **Pure non-UI PR — Architect-only gate.** No UX HANDOFF needed.

**File-by-file:**

1. **`.claude/agents/devsecops.md`** (+50 lines) — step 2a added (`gh pr checks` pre-merge gate, addresses #240) + new section "`gh pr merge --delete-branch` anomalous-closure playbook" (addresses #301). Step 2a's phrasing is concrete and verifiable: `gh pr checks <PR#> --watch` + treatment of `pending/in_progress/fail` as hard blockers, `skipped` as non-blocker. Aligns with deployment-gate discipline already in step 3. The anomalous-closure playbook is well-structured (Symptom / Detection / Recovery), recovery steps cite `git reflog show origin/<branch>` for the lost-branch case, and the escalation rule ("do not force-push a re-created branch to main without explicit authorization") is correctly conservative. **PASS.**

2. **`.github/workflows/pass-verdict-format-check.yml`** (+204 lines, new) — implements ADR-018 mechanical enforcement. The `CANONICAL_PATTERN` on line 58 (`^### Wave-[0-9]{1,4} (PASS|REVISE|FAIL) verdict — PR #[0-9]{1,6} — SHA [0-9a-f]{40}$`) matches ADR-018 §"Grep-able anchor regex" exactly (modulo `\d` → `[0-9]` for grep -E compat). Em-dash embedded as literal U+2014 in the YAML — required per ADR-018's em-dash note. Two checks (format + placeholder TTL) correctly separated; format check is hard-fail, TTL check is soft-warn (exits 0 on warning) per ADR-018 amendment's "out of scope this wave; catches missed backfills without blocking pre-merge legitimate placeholders." Skip override `[skip-verdict-check]` honors emergency-rollback class. **One observation, not a block:** the embedded Python heredoc at lines 155-183 mixes shell + Python which is slightly fragile — but it's bounded, only fires on placeholder verdicts, and a Python failure exits the heredoc with `2>/dev/null`. A future refactor extracting to `scripts/check-placeholder-ttl.py` would improve maintainability; logging as a follow-up candidate, not a block. **PASS with one CONCERN logged below.**

3. **`.github/workflows/ux-gate-check.yml`** (+150 lines, new) — implements #246 (UX gate bypass detection). Pattern at line 79 matches ADR-018 canonical regex. Path filter (`src/**`, `design/**`, `tests/qa/wave-*/ui-*` and `ux-*`) aligns with Architect's UI-touching detection rule in subagent body (`src/app/**/page.tsx` etc.). The reachable-ancestor check (`git merge-base --is-ancestor`) correctly implements ADR-018 amendment §"State semantics for DevSecOps step 3 (amended)" row 2. State machine well-modeled: FOUND_PASS / FOUND_REVISE_OR_FAIL / STALE_PASS / PLACEHOLDER_PASS — each with distinct exit + fail message. `[skip-ux-gate]` override honored. **One observation:** path filter at `tests/qa/wave-*/ui-*` will not match `tests/qa/wave-111/ui-foo.test.ts` (glob `*` won't cross directory boundary in YAML path filter? — GitHub's documentation says `**` is required for cross-dir; `*` matches within a single segment). Likely correct as-is (the wave-* directory is one segment, and `ui-*` is a filename prefix in the next segment, which is one segment-glob). Verified by re-reading the pattern: `tests/qa/wave-*/ui-*` matches `tests/qa/wave-NN/ui-foo.test.ts` because both `*` are single-segment globs and the path has exactly two intermediate path components. **PASS.**

4. **`LESSONS.md`** (+5 lines) — new entry at top of 2026-06-04 block for `gh pr merge --delete-branch` anomalous closure (#301). Newest-first ordering preserved. Three-field shape (What broke / Why / We now do) matches the LESSONS.md convention. Cites #301 as closed. **PASS.**

5. **`_handoff-pending/wave-111c-devsecops.md`** (+19 lines, new) — *flagged for ADR-017 inspection.* `_handoff-pending/` is a legacy convention from Wave 93 (fragment-folding workflow). ADR-014 was Superseded by ADR-017 (Wave 108), and ADR-017's denylist tooling (`tests/qa/wave-108/subagent-body-cleanliness.test.ts`) flags `_handoff-pending` references in subagent bodies. Verified: ADR-017 denylists `_handoff-pending` and `fold-handoff` tokens **in subagent bodies (`.claude/agents/*.md`) only** — not in arbitrary repo paths. The file at `_handoff-pending/wave-111c-devsecops.md` is a developer-facing fragment, not a subagent body, so it does not fail the cleanliness test. But the directory itself is stale infrastructure — under Plan C subagent runtime, fragment-folding is retired and HANDOFF docs live at `coordination/handoffs/<role>.md`. **This file should not exist in the new convention.** It duplicates content already in `coordination/handoffs/devsecops.md`. Not a block for this PR (the file is harmless and content is duplicative not conflicting), but flagging as **CONCERN** + filing follow-up issue to retire the `_handoff-pending/` convention repo-wide. Logged below.

6. **`coordination/handoffs/architect.md`** (+19 / -1) — DevSecOps's edit to my own HANDOFF doc surfacing the ratification request. **This is unusual** — typically a peer's HANDOFF to me would land via a `[[HANDOFF: architect]]` block parsed by the outer orchestrator; direct edits to my own state file by a peer are not the convention. However: under the Plan C subagent runtime, HANDOFF blocks ARE advisory text and don't auto-fire peer turns; DevSecOps left the request as both a HANDOFF block in their own state AND a direct edit in mine. Direct-edit-to-peer-HANDOFF-doc isn't forbidden by the protocol, and this is now self-corrected by my overwrite of the NOW section this turn. **Not a block, but worth noting:** the cleaner protocol would be a HANDOFF block in DevSecOps's own state pointing at me (which they did), without also editing my state. Adding to the parked items for a future protocol-discipline cluster. **PASS.**

7. **`coordination/handoffs/devsecops.md`** (+29 / -14) — DevSecOps's own state update for Wave 111c. Verdict recorded in ADR-018 canonical form on line 5 (`### Wave-111 PASS verdict — PR #0 — SHA 10c002b723ea2da2e757e57ab42f832253310c0b`). **Note:** the SHA `10c002b7` is the *parent* commit, not the PR HEAD (`ce6b2b1a`). That is correct per ADR-018 Wave 111b amendment Phase-1 ("the **last-known SHA** at the time the verdict is recorded — typically `git rev-parse HEAD` of the gate role's worktree before staging the verdict commit"). DevSecOps's verdict is a self-attested PASS, which is acceptable — the role can attest their own deliverables, and Architect's verdict here (this turn) is the cross-cutting gate. **PASS.**

8. **`coordination/handoffs/qa.md`** (+4 / -4) — Wave 111a + 111b verdict backfills. Both backfilled lines (3 + 69) match the canonical regex. Notes fields updated to record the normalization decision. **PASS.**

9. **`requirements/user-stories/US-090-wave-111c-ci-process-discipline.md`** (+68 lines, new) — well-formed US-NNN file: Status / Wave / Primary owner / Issues addressed header, AC1-AC5 each with explicit issue#, Out of scope section, Issues-addressed footer. AC5 cites the canonical regex enforcement. **BA-owned file; not in my review lane per `architecture/` co-authorship gate boundary**, but a passing observation: well-structured. PR diff shows BA was not in the loop for this US, which is a minor process-discipline observation (US creation typically goes through BA, but US-NNN files are owned by `requirements/` and DevSecOps as a peer creating one without BA HANDOFF is acceptable in emergency-class waves). **Not a block.**

### Verdict: PASS (Wave 111c PR #388)

All 9 files meet the bar. Two CONCERN-level observations filed as follow-up issues below; neither blocks merge:

1. **`_handoff-pending/` directory is stale Plan C infrastructure** — the file `_handoff-pending/wave-111c-devsecops.md` should not exist under the subagent runtime. Filing issue to retire the directory entirely.
2. **Embedded Python heredoc in `pass-verdict-format-check.yml`** — extract to `scripts/check-placeholder-ttl.py` for maintainability. Filing issue.

### Filed follow-up issues (out-of-scope findings)

- **#389 (`self-improvement`)** — Retire `_handoff-pending/` directory and the fragment-fold convention under Plan C runtime. Discovered during PR #388 review.
- **#390 (`self-improvement`)** — Extract embedded Python heredoc in `pass-verdict-format-check.yml` placeholder-TTL check to `scripts/check-placeholder-ttl.py` for maintainability. Discovered during PR #388 review.
- **#391 (`self-improvement`)** — Protocol clarification: peers should not directly edit each other's `coordination/handoffs/<peer>.md` state files. Use HANDOFF blocks (advisory text in own state) instead. Discovered when DevSecOps's PR #388 edited `coordination/handoffs/architect.md` directly.

### Worktree cleanup

`/tmp/arch-wave-111c` will be removed at end of turn via `git worktree remove`.

---

## ⏭️ PREV — 2026-06-04 — Wave 111b Phase 1 (Clusters 1 + 6 + 7 single-author)

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
