# architect — HANDOFF

## ⏭️ NOW — 2026-06-04 — Wave 107 (first wave under subagent runtime)

**Done this turn:**

- **Ratified `architecture/workspace-conventions.md`** — the directory contract for the Plan C subagent runtime. Single source of truth for where every deliverable lives. Encodes the seven canonical paths (`requirements/`, `architecture/`, `design/`, `tests/`, `ops/`, `coordination/handoffs/`, plus the `.github/workflows/` carveout), the role-id naming rules, the `US-NNN-<slug>.md` / `ADR-NNN-<slug>.md` / `coordination/handoffs/<role-id>.md` naming conventions, and the three-layer enforcement model (subagent prompts → code review → CI hooks).
- **Format choice:** flat doc at `architecture/workspace-conventions.md`, NOT an ADR. Rationale: this is a *reference* doc every subagent reads daily, not a one-shot decision; it lives alongside `coding-standards.md` and `nfr.md`. Future amendments to it WILL each ship as ADRs (per the doc's "How to evolve this contract" section), but the contract itself is a flat doc, not an ADR. Decision recorded so a future architect doesn't second-guess it.
- **OQ-085-001 RESOLVED:** test code committed indefinitely; evidence binaries gitignored under `tests/qa/wave-NNN/evidence/` with a committed `README.md` audit trail. Snapshot files committed with the test code. Filed gitignore pattern for DevSecOps to land. Resolution text lives in the workspace-conventions doc; pointer added to `requirements/open-questions.md`.
- **OQ-085-002 CLOSED — original framing no longer applies:** the "skill slot in `src/lib/skills/qa.ts`" question is meaningless post-monolith-retirement. `.claude/agents/qa.md` IS the QA skill file under the subagent runtime. Closed with that reasoning in both the workspace-conventions doc and `requirements/open-questions.md`.
- **Cross-references landed:**
  - `CLAUDE.md` §"Engineering standards" item 2 now points at the new doc.
  - `architecture/INDEX.md` lists `workspace-conventions.md` under a new "Flat docs" table (created the table; was "Pending docs" with only `nfr.md`).
  - `requirements/open-questions.md` has OQ-085-001 + OQ-085-002 resolution entries pointing back at the new doc.
- **US-NNN cross-link placeholder** left in the doc as `<!-- US-NNN: TBD by BA -->` per PO brief. BA is writing the traceability US in parallel; pickup the id from `coordination/handoffs/business-analyst.md` next turn and patch the placeholder.

**Files landed this turn:**

1. `architecture/workspace-conventions.md` (new, the deliverable)
2. `architecture/INDEX.md` (added Flat docs table; updated last-updated line)
3. `CLAUDE.md` (item 2 reshape — added pointer to workspace-conventions doc)
4. `requirements/open-questions.md` (added OQ-085-001 RESOLVED + OQ-085-002 CLOSED entries before the future-append marker)

**In flight:**

- BA's US-NNN for the workspace-conventions deliverable — they'll land it in their own PR/turn; I patch the cross-link placeholder once their HANDOFF names the id.

**Next architect turns (Wave 107 + beyond):**

- Patch the `<!-- US-NNN: TBD -->` placeholder in `workspace-conventions.md` once BA names the id.
- When tests/ directory gets its first real wave-NNN home, code-review QA's first artifact landing to confirm the convention is honored end-to-end (smoke proof of US-085 AC5).

### #376 code review — `feature/375-pr-hygiene-injection-fix` — **PASS**

**Verdict:** PASS. DevSecOps may merge.

**AC verification:**

- **AC1 (body never evaluated as shell):** Diff moves `${{ github.event.pull_request.body }}` into an `env:` block as `PR_BODY` and replaces `echo "$body"` with `printf '%s' "$PR_BODY"`. The `${{ }}` expansion now lands in a quoted env-var assignment at YAML-render time, not inside a `run:` bash block — shell metacharacters in the body are never re-parsed by bash. ✓
- **AC2 (existing rule preserved):** Regex `(closes|fixes|resolves)\s+#[0-9]+\s*,\s*#[0-9]+` is byte-identical in the diff. Mentally verified: `closes #123, #456` matches (FAIL); `closes #123, closes #456` does not match because the literal `closes` between `#123` and `#456` breaks the `\s*,\s*` anchor (PASS). ✓
- **AC3 (smoke proof):** PR #376's own body contains backticks (`` `pnpm dev:test:ui` ``), `$` refs (`$PR_BODY`, `${{ ... }}`), and fenced code blocks. PR is OPEN with no failure annotation — live smoke proof. ✓
- **NFR audit (residual `github.event.*` inline expansions):** `grep -nE 'github\.event\.' .github/workflows/*.yml` returns exactly ONE hit — line 14 of `pr-hygiene.yml`, which is the file being fixed in this diff. `ci.yml` and `codeql.yml` are clean. DevSecOps's audit claim verified. ✓

**Code review (non-AC):**

- Drive-by cleanup drops unicode glyphs (❌/✓/✗) in `echo` strings in favor of `FAIL:`/`OK:`/`Bad:`/`Good:`. Not in the AC list, but defensible: matches the "no emojis in files" convention and is robust against CI log terminal-encoding quirks. Acceptable scope creep.
- Added explanatory comment block above the `if` is clear and load-bearing — explains WHY the env var indirection exists, which is the kind of comment our standards reward.
- `_handoff-pending/107-devsecops.md` fragment is well-formed (4 sections, factual).

**No structural concerns. No follow-up issues to file.**

HANDOFF to devsecops issued below.

**Parked / future:**

- `system-design.md` — still not created. Low priority pre-Plan-C; under Plan C the "system" is the eight subagents + workspace. Stub when it becomes useful.
- `tech-stack.md` — same. Vitest + ESLint + TS + pnpm is the entire stack; barely a page.
- `coding-standards.md` — still not created. Under the subagent runtime there's no application source to standardize against; the relevant standards live in `.claude/agents/*.md` and per-test conventions emerge from `tests/qa/` use.
- Fitness function for OQ-085-001's "no binary files committed under `tests/qa/wave-*/evidence/`" rule — QA owns the actual implementation; flagged in the conventions doc but not in scope this wave.

**Notes / caveats:**

- The doc is **explicitly authoritative** — code reviews can cite it as "this violates `workspace-conventions.md` §X." If subagents disagree about a path, the doc breaks ties; no other surface gets to.
- Three-layer enforcement model (prompts / code review / CI hooks) documented so DevSecOps knows when to escalate to a hard CI check. Most conventions live at layer 2; layer 3 is reserved for patterns expressible as static checks.
- Did NOT modify subagent prompts (`.claude/agents/*.md`) per PO out-of-scope clause. If any prompt references retired paths, that's a separate wave.
