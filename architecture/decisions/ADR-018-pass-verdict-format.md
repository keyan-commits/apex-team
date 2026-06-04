# ADR-018 — Canonical PASS-verdict format for gate-role HANDOFF docs

- **Status:** Accepted
- **Date:** 2026-06-04
- **Wave:** 111a
- **Owner:** Architect
- **Supersedes:** none
- **Tracked by:** Wave 111 Cluster 5 (foundation = this ADR; 111b = subagent-body cross-references; 111c = CI check that grep-verifies the format)

---

## Context

Wave 110 added step 3 to `.claude/agents/devsecops.md` ("Deployment workflow (single turn)"):

> **Verify gate-role PASS is recorded in HANDOFF (mandatory pre-merge).** Open `coordination/handoffs/qa.md` and (if the PR touches UI) `coordination/handoffs/ux-designer.md`. Confirm a Wave-N PASS verdict is recorded against the PR's HEAD SHA. **If the gate role's HANDOFF doc does not record the PASS, HANDOFF back to the gate role asking them to record it before merging — do NOT merge on the implementer's claim of PASS alone.**

Wave 110 closed issue #383 by landing the instruction but DEFERRED the format spec. The current state of gate-role HANDOFF docs (`coordination/handoffs/qa.md`, `ux-designer.md`, `architect.md`) records PASS verdicts in **free-form prose**:

```
### Verdict: PASS
**Commit exercised:** HEAD of `feature/c1-plan-c-subagent-extraction` (main: `c068c58`; …)
…
```

Free-form prose is unmachine-readable. Three concrete problems follow:

1. **DevSecOps step 3 is unverifiable mechanically.** A human can read "Verdict: PASS" and confirm a SHA; a CI check cannot, because the SHA token's position is unstable across role styles. QA writes `**Commit exercised:** HEAD of …`; UX writes `SHA reviewed (implementer's feature branch tip)`; Architect writes nothing structured at all in its HANDOFF doc.
2. **PR #231 class of bug (#383):** the gate role's HANDOFF was trusted by claim, not by audit. Even a careful human reader cannot distinguish "PASS recorded against THIS HEAD SHA" from "PASS recorded against an EARLIER SHA, now stale because the implementer pushed a fix commit after the verdict." The format must surface the SHA the verdict was rendered against so DevSecOps's step 3 can match it against `gh pr view --json headRefOid`.
3. **REVISE verdicts have no canonical shape either.** DevSecOps needs to distinguish three states: (a) no verdict yet — gate role hasn't run; (b) PASS recorded against a stale SHA — gate role must re-verify against current HEAD; (c) REVISE issued — implementer owes a fix before the gate role can re-issue PASS. Today, (b) and (c) are indistinguishable from prose alone.

Wave 111c will wire a CI check (DevSecOps lane) that grep-verifies the format on every PR. Wave 111c is **blocked on this spec**.

## Forces

1. **Grep-stability across roles.** The format must produce identical anchor lines whether QA, UX, or Architect emits the verdict, so a single regex catches all three.
2. **SHA fidelity over wave fidelity.** A wave number is shorthand; the HEAD SHA is the load-bearing identifier (a wave can span multiple force-pushes). DevSecOps's step 3 must match the SHA, not the wave.
3. **Human-skimmable.** The verdict block sits inside a HANDOFF doc that humans (and the viewer at `:3200`) read alongside narrative prose. A wholly machine-only format (e.g. embedded JSON blob) would degrade the human-reading experience the HANDOFF doc exists to serve.
4. **Append-only without rewriting history.** Existing PASS-shaped prose in `qa.md`, `ux-designer.md`, `architect.md` predates this format. Forcing a rewrite churns commit history and risks breaking PR audit trails that cite the old prose by line. The format must be backward-compatible — new entries adopt the canonical shape; old entries are grandfathered.
5. **Single regex for Cluster 4 CI.** Wave 111c needs ONE regex it can apply to `coordination/handoffs/*.md` and extract structured data (wave, PR, SHA, role, timestamp). Multi-pass parsing is fragile.

## Decision

**Adopt a Markdown heading-anchored block with a fixed key/value field list. One block per verdict event (PASS, REVISE, or FAIL). Heading line is the grep anchor; field lines are parsed by simple line-prefix matching.**

### Canonical PASS verdict format

```markdown
### Wave-111 PASS verdict — PR #999 — SHA abc1234567890abcdef1234567890abcdef12345
- **Gate role:** qa
- **Timestamp:** 2026-06-04T15:32:00Z
- **Notes:** Full vitest suite green (165/165). Leg A/B/C all clean.
```

**Required fields (every PASS verdict, all five present, in this order):**

1. **Heading line** (`### `-prefixed, single line, the grep anchor):
   - Literal token `Wave-NNN PASS verdict` — `NNN` is the wave number (zero-padded to 3 digits or unpadded; the regex accepts `\d{1,4}`).
   - Em-dash separator (` — `, U+2014 surrounded by single ASCII spaces).
   - Literal token `PR #N` — `N` is the GitHub PR number (1–6 digits).
   - Em-dash separator.
   - Literal token `SHA ` followed by the **full 40-character** lowercase hex HEAD SHA. Truncated SHAs (e.g. 7-char `abc1234`) are NOT permitted — DevSecOps must match against `gh pr view --json headRefOid`, which returns the full SHA.

2. **Gate role line** (`- **Gate role:** ` prefix):
   - One of: `qa`, `ux-designer`, `architect`. Lowercase, matches `.claude/agents/<role-id>.md`.

3. **Timestamp line** (`- **Timestamp:** ` prefix):
   - ISO 8601, UTC, second-precision, trailing `Z`. Example: `2026-06-04T15:32:00Z`.

4. **Notes line** (`- **Notes:** ` prefix):
   - One-line summary of verification evidence (test counts, files reviewed, viewport coverage, etc.). May be empty (`- **Notes:**` with nothing after the colon) if no additional context is useful; the field itself MUST be present so the regex's field-count check is uniform.

Multi-line free-form prose ABOUT the verdict (test output blocks, AC checklists, full evidence dumps) is permitted and encouraged BELOW the four required field lines. The CI check parses only the heading + four fields; everything below the four fields is human-only narrative.

### REVISE verdict format

```markdown
### Wave-111 REVISE verdict — PR #999 — SHA abc1234567890abcdef1234567890abcdef12345
- **Gate role:** ux-designer
- **Timestamp:** 2026-06-04T15:32:00Z
- **Blocks:** 2
- **Notes:** Spec drift on focus-ring color (block); copy mismatch on error pill (block). HANDOFF to ui-developer.
```

**Required fields (REVISE):**

1. **Heading line** — identical shape to PASS but with `REVISE` in place of `PASS`. Same SHA semantics (matches the SHA being rejected, not a target SHA).
2. **Gate role line** — same.
3. **Timestamp line** — same.
4. **Blocks line** (`- **Blocks:** ` prefix) — integer count of block-severity findings. Distinguishes REVISE-with-blocks from advisory CONCERNS prose.
5. **Notes line** — same shape as PASS; for REVISE, conventionally summarizes the blocking deltas and names the HANDOFF target.

### FAIL verdict format

Identical to REVISE in shape, with `FAIL` in the heading and `Blocks: N` field. FAIL vs REVISE is a semantic distinction inside the gate role's workflow (FAIL is terminal, REVISE invites re-submission) — the format is identical because Cluster 4's CI does not need to distinguish them at parse time. Both signal "this SHA is not merge-eligible."

### State semantics for DevSecOps step 3

Given the canonical format, DevSecOps's step 3 distinguishes the three failure modes:

| State | Detection (against `<HEAD_SHA>` from `gh pr view`) |
|---|---|
| **No verdict yet** — gate role hasn't run | No heading line matches `### Wave-\d+ (PASS|REVISE|FAIL) verdict — PR #<N> — SHA <HEAD_SHA>` in the relevant gate role's HANDOFF doc. |
| **PASS against earlier SHA — stale** | A PASS heading exists for `PR #<N>` but the SHA token is NOT the current HEAD SHA. HANDOFF back to gate role: "re-verify against current HEAD." |
| **REVISE or FAIL issued — implementer owes a fix** | A REVISE or FAIL heading is the most recent verdict for `PR #<N>` (latest by timestamp). HANDOFF back to implementer, not gate role. |
| **PASS against current HEAD — merge eligible** | A PASS heading exists for `PR #<N>` AND its SHA token matches the current HEAD SHA. Merge proceeds. |

"Most recent by timestamp" is the ordering rule — a later REVISE supersedes an earlier PASS for the same PR; a later PASS supersedes an earlier REVISE.

### Grep-able anchor regex

**One regex for the heading line, applicable to all three verdict types:**

```regex
^### Wave-(\d{1,4}) (PASS|REVISE|FAIL) verdict — PR #(\d{1,6}) — SHA ([0-9a-f]{40})$
```

Capture groups (in order): wave number, verdict type, PR number, full 40-char HEAD SHA.

**Em-dash note:** the separator is U+2014 EM DASH (`—`), NOT U+002D HYPHEN-MINUS (`-`) or U+2013 EN DASH (`–`). The regex above uses the literal em-dash character. Cluster 4's CI implementation MUST embed the em-dash directly (not `—` escape; that varies across grep dialects). On BSD `grep` (macOS default), use `grep -E` or invoke via `rg` (ripgrep) which handles Unicode correctly without flag fiddling.

**Field extraction (after the heading matches, for the next 3–4 lines):**

```regex
^- \*\*Gate role:\*\* (qa|ux-designer|architect)$
^- \*\*Timestamp:\*\* (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)$
^- \*\*Blocks:\*\* (\d+)$            # REVISE/FAIL only
^- \*\*Notes:\*\* (.*)$              # may be empty after colon
```

Cluster 4's CI parses each verdict by: (a) match the heading; (b) on the next 3–4 lines, match each field by prefix; (c) if any required field is missing, fail with a precise message citing the file + line + missing field name.

### Backward-compatibility policy

**Decision: Option (c) — require new format only for PASS / REVISE / FAIL records dated >= Wave 111. Older entries are grandfathered as "pre-format" prose and are NOT rewritten.**

**Why not (a) annotate inline:** Annotation adds reading noise to entries the viewer already renders. The annotation itself becomes another grep target the CI must allowlist. Net: more complexity, no audit gain — pre-Wave-111 verdicts are already history, not live merge gates.

**Why not (b) sweep:** Rewriting 5+ existing PASS verdicts across 3 HANDOFF docs:
- Churns commit history with verdict-rephrasing-only edits.
- Risks breaking external references (issue threads, PR audit comments that cite the old prose).
- Forces an Architect-authored "retroactive PASS" against SHAs that were merged days ago — the verdict re-render is technically false (it asserts a PASS against current state, not the historical state the original prose recorded).
- The only mechanical gain is "Cluster 4's CI can grep older entries too" — but those entries are FOR PRs already merged, so the CI gain is zero.

**Why (c):** the audit gain is forward-looking. Cluster 4's CI scopes its check to verdicts where `wave >= 111`. The regex `### Wave-(\d{1,4})` captures the wave; the CI rejects only entries where `wave >= 111` are missing required fields. Pre-Wave-111 prose is invisible to the check.

**Migration cost:** zero. Gate roles begin emitting the new format on their next verdict (Wave 111b implementations); old prose stays untouched.

**Existing entries (grandfathered, no rewrite):**

| File | Wave | Status |
|---|---|---|
| `coordination/handoffs/qa.md` | Wave 110 — `### Verdict: PASS` | Grandfathered (pre-Wave-111) |
| `coordination/handoffs/qa.md` | Wave 108 — `### Verdict: PASS` | Grandfathered (pre-Wave-111) |
| `coordination/handoffs/ux-designer.md` | Waves 107, 108, 109, 110 — `Verdict: No UI impact — skip UX gate.` | Grandfathered. Note: "no UI impact" advisory verdicts are NOT gate-role PASS verdicts under this ADR — they are triad-phase replies. The ADR-018 format does not apply to them. |
| `coordination/handoffs/architect.md` | All entries to date — no structured verdicts at all | Grandfathered. Architect's review-PASS verdicts have not been recorded in its own HANDOFF doc historically (they ship in PR review comments). Wave 111b will update `.claude/agents/architect.md` to require recording in `coordination/handoffs/architect.md` going forward. |

### Verdict scope clarification

This ADR governs **deployment-gate PASS / REVISE / FAIL verdicts** — the gate decisions DevSecOps step 3 reads. It does NOT govern:

- **Triad-phase replies** — Architect/UX Designer/BA's "no NFR impact" / "no UI impact, skip UX gate" / US-NNN-authored advisory replies. These have no SHA, no merge consequence, and are free-form by design.
- **Architect's CONCERNS verdicts during code review** — CONCERNS is advisory, allows ship-with-caveats, and is logged in `architecture/decisions/` per `.claude/agents/architect.md` line 50. CONCERNS does not block merge and is not consumed by DevSecOps step 3.
- **Informal prose status updates** ("test suite green", "lint clean") — these are narrative, not verdicts.

The format applies ONLY when the gate role intends "this verdict is the merge gate for PR #N at SHA X."

## Consequences

### Positive

- DevSecOps step 3 becomes mechanically verifiable. Cluster 4's CI can fail any PR where the gate role's HANDOFF doc lacks a PASS verdict matching the PR's current HEAD SHA. No more PR #231 / #383 class bugs.
- One regex captures all three verdict types across three gate roles. Cluster 4's implementation is small and uniform.
- Existing entries are grandfathered — zero churn, zero risk of breaking external citations.
- Format is human-skimmable: a markdown heading + four bullet fields. The viewer at `:3200` renders it natively. No JSON blob, no embedded YAML, no pseudo-syntax.
- SHA fidelity is enforced (full 40 chars, lowercase hex). Truncated-SHA prose ambiguity is structurally eliminated.

### Negative

- The format is rigid. A gate role typing the wrong dash character (hyphen instead of em-dash) emits a verdict the CI rejects. Mitigation: 111b updates each gate role's subagent body to include the literal canonical block as a template; the role pastes-and-fills rather than retypes. Cluster 4's CI failure message cites the exact field/char mismatch.
- ISO 8601 timestamp requires the gate role to fetch UTC. Acceptable: every subagent runs in a Claude Code session where `date -u +"%Y-%m-%dT%H:%M:%SZ"` is one bash call.
- "Most recent by timestamp" ordering means a clock-skew between gate roles could (in pathological cases) make a stale PASS appear newer than a current REVISE. In practice, Claude Code sessions use the host machine's clock and skew is bounded to seconds; the format intentionally records seconds, not milliseconds, to keep ordering deterministic at human-reading granularity.
- The CONCERNS verdict is deliberately excluded — Architect's CONCERNS (logged in `architecture/decisions/`) is advisory and ships caveats, not blocks. If a future wave decides CONCERNS should also be a structured verdict (e.g. for trend analysis), it's an additive change: add a fourth verdict type to the regex.

### Follow-ups

- **Wave 111b (subagent body cross-references):** update `.claude/agents/devsecops.md` step 3 to cite ADR-018 as the format spec; update `.claude/agents/architect.md` review rubric (step 7 — quality gate decision) and `.claude/agents/ux-designer.md` Gate verdict format section (line 360) and `.claude/agents/qa.md` Deployment-gate verification section to require the ADR-018 format on Wave 111+ verdicts. Each role pastes the canonical block (PASS / REVISE) into its own body as a fill-in template. Each edit is small and confined to one subagent body — easy parallel work across four roles in 111b.
- **Wave 111c (CI check):** DevSecOps adds a CI workflow (or a step inside the existing `.github/workflows/ci.yml`) that runs the regex against `coordination/handoffs/*.md` on every PR. For each PR, the workflow:
  1. Fetches `gh pr view --json headRefOid` to get the current HEAD SHA.
  2. Greps `coordination/handoffs/qa.md` (and `coordination/handoffs/ux-designer.md` if the PR touches UI files) for `### Wave-\d+ (PASS|REVISE|FAIL) verdict — PR #<N> — SHA <HEAD_SHA>`.
  3. If no PASS heading matches the current HEAD SHA AND the PR is targeted at main, fail the check with a message citing which gate doc lacks the verdict.
  4. Allowlists doc-only PRs (no runtime code in diff) and tag-emergency-rollback PRs from the check.
- **Wave 111+ candidate (out of scope this wave):** a small helper script `scripts/emit-verdict.sh` that takes `--wave --pr --sha --role --notes` and appends a canonical block to the role's HANDOFF doc. Reduces hand-typing errors. Not required — Wave 111b's body templates are sufficient.
- **Wave 111+ candidate:** REVISE verdict — should we add a `- **Re-review target SHA:** <SHA>` field so DevSecOps can detect "the implementer pushed a fix; gate role should re-verify"? Deferred — DevSecOps's "stale PASS" check (PASS heading exists but SHA mismatches current HEAD) already covers this case without an extra field on REVISE.

## 2026-06-04 amendment — commit-time placeholder pattern (Wave 111b)

### Problem surfaced by self-application

Wave 111a's QA gate exercised this ADR by recording its own verdict in `coordination/handoffs/qa.md`. Two of the four required fields (`PR #N` and the full 40-char HEAD SHA) **are not known at commit-time** for the commit that records the verdict:

- **PR #** doesn't exist until `gh pr create` runs, which is AFTER the verdict-recording commit lands.
- **HEAD SHA** of the commit recording the verdict can't be inside that commit's own content (Git circular reference).

QA's pragmatic workaround: use `PR #0` as a placeholder and the **last-known SHA** (the parent commit's SHA, which IS known at commit-time) for the SHA field. The canonical anchor regex (`^### Wave-(\d{1,4}) (PASS|REVISE|FAIL) verdict — PR #(\d{1,6}) — SHA ([0-9a-f]{40})$`) accepts `#0` (matches `\d{1,6}`) and accepts the parent SHA (matches `[0-9a-f]{40}`), so the format passes its own grep test in the placeholder state — but DevSecOps's step-3 "PASS-against-current-HEAD" semantic check would (correctly) flag the verdict as stale unless backfilled.

### Decision: Option (a) — Two-phase placeholder + post-merge backfill

Adopt a two-phase pattern. The verdict block lives in `coordination/handoffs/<role>.md` from the moment the gate role issues PASS; the real PR # and merge SHA replace the placeholders post-merge via a follow-up commit on main.

**Phase 1 — Commit-time (gate role emits verdict):**
- Gate role records the canonical block in `coordination/handoffs/<role>.md`.
- `PR #` field: literal `PR #0` (placeholder). `0` is the sentinel — never a real PR number.
- `SHA` field: the **last-known SHA** at the time the verdict is recorded — typically `git rev-parse HEAD` of the gate role's worktree before staging the verdict commit. This is the SHA the gate role's verification was rendered against; using the parent SHA is the closest accurate value available at commit-time.
- All other fields (`Gate role`, `Timestamp`, `Blocks` if REVISE/FAIL, `Notes`) are filled with real values. They are knowable at commit-time.

**Phase 2 — Post-merge backfill (DevSecOps merge step):**
- After the merge to main lands, DevSecOps amends the gate-role HANDOFF doc verdict block via a follow-up commit on main:
  - Replace `PR #0` with the real PR number (e.g. `PR #386`).
  - Replace the placeholder SHA with the **merge SHA** (the squash-merge commit's SHA on main, returned by `gh pr view <PR#> --json mergeCommit -q .mergeCommit.oid` or visible in `git log -1` on main immediately post-merge).
- The backfill commit message follows the convention `chore(handoff): backfill Wave-NNN verdict PR # and merge SHA`.
- DevSecOps step 3 enforces this backfill — see "DevSecOps step list (amended)" below.

**Backfill mechanism choice: DevSecOps merge step.**

Three candidates were considered:

| Mechanism | Decision | Why |
|---|---|---|
| Manual `git commit --amend` by the verdict author | Rejected | Only works pre-push (verdict author no longer owns the branch after HANDOFF to DevSecOps). |
| DevSecOps merge step (post-merge backfill commit) | **Accepted** | DevSecOps already merges + pushes; backfill is one additional commit on main. Single accountable role; no scheduled-job complexity; the file-on-disk audit trail stays intact. |
| Scheduled CI workflow scanning for `PR #0` placeholders | Rejected | Adds a stateful CI step. The grace window between merge and CI run leaks stale placeholders into the period where Wave 111c CI is auditing PRs. Couples backfill latency to CI cadence. |

DevSecOps is the natural backfill owner because the merge SHA is **only knowable post-merge by the merge author**. The amended `devsecops.md` step 3 (already landed Wave 110) is extended in Wave 111b's Cluster 7 cross-reference to require this backfill as part of the merge workflow.

### Why not Option (b) — PR-description verdicts

Considered and rejected:

- **File-on-disk discipline violation.** apex-team's CLAUDE.md hard-rule: "files on disk are the only state." PR descriptions are a GitHub-hosted mutable artifact outside the workspace's durable state. Moving verdicts there punctures the invariant for one workflow's convenience.
- **No version-control on PR-body edits.** A PR description can be silently edited post-merge (no commit, no audit trail). The current HANDOFF-doc location is `git log`-visible — every verdict edit is a commit.
- **Viewer / `:3200` dependency.** apex-team-viewer reads files from disk + `gh` for CI status. Reading PR-description content adds another `gh` API path; the disk-read path is simpler and cheaper.
- **DevSecOps step 3 already cites HANDOFF docs.** Wave 110 ratified `Open coordination/handoffs/qa.md and (if the PR touches UI) coordination/handoffs/ux-designer.md`. Option (b) would require rewriting that step. The two-phase pattern requires only an additive amendment.
- **In-flight migration cost.** Wave 111a's QA verdict already lives in `coordination/handoffs/qa.md`. Option (a) is a no-op for migrating that verdict (it just needs backfill). Option (b) would require moving the verdict body to PR #386's description AND keeping it consistent if anyone re-edits.

The two-phase pattern preserves the invariant ("files on disk are the only state") at the cost of one extra commit per merged PR. That cost is bounded, predictable, and assigned to a single role (DevSecOps).

### Canonical format is unchanged

**The canonical regex, field list, and field shapes specified in the original ADR-018 body REMAIN authoritative.** This amendment formalizes a usage pattern within the existing format, not a change to the format itself.

- `PR #0` is a reserved sentinel value — never a real PR number. The regex `PR #(\d{1,6})` accepts it.
- The Phase-1 SHA is a real 40-char lowercase hex SHA (parent commit). The regex `SHA ([0-9a-f]{40})` accepts it.
- The Phase-2 backfill replaces both tokens in-place; the surrounding heading shape and field block are unchanged.

No update is needed to Wave 111a's QA conformance test (`tests/qa/wave-111/pass-verdict-format.test.ts`) — the regex it asserts against already permits the placeholder values. AC5b's per-file check passes both before backfill (placeholder values match the regex) and after backfill (real values also match).

### DevSecOps step list amendment (Wave 111b — Cluster 7 cross-reference)

`.claude/agents/devsecops.md` step 3 will be amended in Cluster 7 to cite this ADR and to add the backfill sub-step:

> After merging the PR and pushing to main, **backfill the gate-role HANDOFF doc verdict block**: replace the `PR #0` placeholder with the real PR number and the placeholder SHA with the merge SHA. Use a single follow-up commit on main with message `chore(handoff): backfill Wave-NNN verdict PR # and merge SHA`. See ADR-018 §"2026-06-04 amendment — commit-time placeholder pattern" for the canonical pattern.

### State semantics for DevSecOps step 3 (amended)

The state-detection table in the original ADR body is extended with one new row to handle the placeholder state:

| State | Detection (against `<HEAD_SHA>` from `gh pr view`) |
|---|---|
| **No verdict yet** — gate role hasn't run | No heading line matches `### Wave-\d+ (PASS|REVISE|FAIL) verdict — PR #(\d{1,6}) — SHA <HEAD_SHA>` in the relevant gate role's HANDOFF doc. |
| **PASS with placeholder — pre-merge expected state** | A PASS heading exists with `PR #0` and a SHA that is the PR HEAD's parent SHA (or an earlier ancestor of HEAD on the PR branch). DevSecOps step 3 treats this as a valid PASS for merge purposes if the placeholder's SHA is reachable from the PR HEAD (`git merge-base --is-ancestor <placeholder-SHA> <HEAD_SHA>` exits 0). Backfill is queued for post-merge. |
| **PASS against earlier SHA — stale (non-placeholder)** | A PASS heading exists for `PR #<real-N>` but the SHA token is NOT the current HEAD SHA and is NOT a reachable ancestor of HEAD on the PR branch. HANDOFF back to gate role: "re-verify against current HEAD." |
| **REVISE or FAIL issued — implementer owes a fix** | A REVISE or FAIL heading is the most recent verdict for the PR (latest by timestamp). HANDOFF back to implementer, not gate role. |
| **PASS against current HEAD — merge eligible (post-backfill)** | A PASS heading exists for `PR #<real-N>` AND its SHA token matches the merge SHA. This is the post-backfill terminal state. |

The "reachable ancestor" check (`git merge-base --is-ancestor`) is the key safety check: it lets DevSecOps verify that the gate role's verdict was rendered against a commit that is part of the PR's lineage, not an unrelated SHA. If a force-push rewrote the PR branch after the verdict was recorded, the placeholder SHA may no longer be reachable from the new HEAD — in that case the verdict is stale and the gate role must re-verify.

### Migration for the in-flight Wave 111a verdict

`coordination/handoffs/qa.md` line 3 currently records:
```
### Wave-111 PASS verdict — PR #0 — SHA cae4a773e9bb0096d78062165f4c5a77959cedb6
```

This is the canonical Phase-1 form. When PR #386 (Wave 111a) was merged, the merge SHA replaced `cae4a77…` and `#0` was replaced with `386` via a backfill commit. (If the backfill has not yet happened on `main` at the time of reading this amendment, this is the open backfill action item.)

For future waves, the gate role emits the Phase-1 placeholder form; DevSecOps performs Phase-2 backfill as part of the merge workflow. No verdict is ever blocked on the chicken-and-egg gap surfaced in Wave 111a.

### Consequences of the amendment

**Positive:**
- The chicken-and-egg gap surfaced by Wave 111a is resolved without changing the canonical regex or field shape.
- File-on-disk invariant is preserved; verdicts continue to live in `coordination/handoffs/<role>.md`.
- Backfill ownership is unambiguous (DevSecOps) and bounded (one commit per merged PR).
- The "reachable ancestor" check gives DevSecOps step 3 a precise rule for treating placeholder verdicts as merge-eligible.

**Negative:**
- One additional commit per merged PR on main (the backfill commit). Acceptable: DevSecOps already commits the merge.
- If DevSecOps forgets the backfill, the verdict ages with `PR #0` and a stale SHA — visually misleading until the backfill lands. Mitigation: Wave 111c CI can include a "no `PR #0` verdicts on merged PRs older than 1h" check; out of scope for 111b.

**Follow-ups:**
- Wave 111c CI: extend the format check to assert no `PR #0` placeholder verdicts exist for PRs that have been merged for more than 1 hour. (Catches missed backfills without blocking pre-merge legitimate placeholders.)
- Wave 111+ candidate: a `scripts/emit-verdict.sh --backfill <PR#> <merge-SHA>` helper for DevSecOps's backfill step, complementing the Phase-1 `scripts/emit-verdict.sh` already parked as a future candidate.

## Cross-references

- `.claude/agents/devsecops.md` line 58 (step 3 in "Deployment workflow (single turn)") — the consumer of this format. Wave 111b will add a cross-reference to ADR-018 inline.
- `.claude/agents/architect.md` line 49 (review rubric step 7 — `PASS` verdict definition) — Wave 111b will require emitting the canonical block in `coordination/handoffs/architect.md` going forward.
- `.claude/agents/ux-designer.md` lines 360-377 ("Gate verdict format") — Wave 111b will replace the current bulleted "required fields" prose with the canonical ADR-018 block as the literal template.
- `.claude/agents/qa.md` lines 54-65 ("Deployment-gate verification") — Wave 111b will require the canonical block on every QA PASS / FAIL verdict.
- `architecture/INDEX.md` — ADR-018 added to the Decision Records table in the same wave (this PR).
- `architecture/decisions/ADR-017-subagent-body-rewrite-rules.md` — peer ADR governing subagent body cleanliness. ADR-018's 111b cross-reference edits to subagent bodies MUST keep ADR-017's grep-test (`tests/qa/wave-108/subagent-body-cleanliness.test.ts`) green. The literal canonical block (`### Wave-111 PASS verdict — PR #999 — SHA abc1234…`) contains no legacy patterns from ADR-017's denylist (no `pnpm dev:test`, no `_handoff-pending`, no `:3100`), so the templates are safe to embed.
- Issue #383 — closed by Wave 110 (DevSecOps step 3 instruction); this ADR specifies the format the step 3 grep depends on. Wave 111c's CI check is the mechanical enforcement layer #383 implicitly called for.
- PR #231 — the concrete failure (gate role's HANDOFF doc didn't record the PASS against current SHA; merge happened anyway on implementer's claim) that motivates the SHA-fidelity requirement in this format.
