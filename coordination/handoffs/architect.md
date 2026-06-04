# architect — HANDOFF

## ⏭️ NOW — 2026-06-04 — Wave 108 (subagent body rewrite rule pack + 8 file edits)

**Done this turn:**

- **ADR-017 landed** — `architecture/decisions/ADR-017-subagent-body-rewrite-rules.md`. Title: "Subagent prompt body rewrite rules (Plan C runtime)." This is the rule pack governing legacy-pattern removal from `.claude/agents/*.md` bodies. 15 named rewrite rules keyed by legacy pattern (Pattern → Action → Rationale), plus an inline-quote rule for the 4 retired-source protocols (`REQUIREMENTS_PHASE_PROTOCOL`, `DEPLOYMENT_GATES_PROTOCOL`, `WORKTREE_ISOLATION_PROTOCOL`, `SKILLS_SELF_ENRICHMENT_PROTOCOL`), plus the Open Question resolution (Plan C runtime adapter header REMOVED post-rewrite — see Decision section for both sides argued and rationale picked), plus an explicit allowlist with three concrete grep tests QA can copy verbatim.
- **8 subagent body rewrites executed** — `.claude/agents/{architect,backend-developer,business-analyst,devsecops,product-owner,qa,ui-developer,ux-designer}.md`. All four QA grep tests now pass with 0 non-allowlisted matches:
  1. `mcp__apex-team__` — only matches inside the allowlist sentence "You do NOT have ..." (1 per file × 8 files = 8 allowed lines; 0 violations elsewhere).
  2. `pnpm dev:test|pnpm dev:supervised|.restart-trigger|_handoff-pending|pnpm fold-handoff|talk_to_product_owner|talk_to_role|/api/health|data/test-*.db|agent_state|:3100|:3110|:3120|:3130` — 0 matches across all 8 files.
  3. `src/lib/roles.ts|src/lib/protocols.ts|src/lib/skills/` (dangling pointers) — 0 matches.
  4. `## Plan C runtime adapter` (header marker) — 0 matches (removed per ADR-017 Decision).
- **Per-file legacy ref count: 11 → 0 (architect), 14 → 0 (backend-developer), 11 → 0 (business-analyst), 15 → 0 (devsecops), 7 → 0 (product-owner), 23 → 0 (qa), 12 → 0 (ui-developer), 12 → 0 (ux-designer).** Total 95 → 0 modulo the 8 allowlisted "You do NOT have mcp__apex-team__*" sentences.
- **Concrete fix for PR #376 class of bug:** DevSecOps body no longer instructs the agent to write `_handoff-pending/<wave>-devsecops.md` or run `pnpm fold-handoff`. The HANDOFF-state-update section in every subagent now directs the agent to edit `coordination/handoffs/<role-id>.md` directly. The 4-section format (Done / In flight / Next / Notes) is preserved as a soft convention.
- **ADR-014 status updated to Superseded by ADR-017** under the subagent runtime (kept Accepted for monolith-history record). Status note + Superseded-by line landed in `ADR-014-handoff-fragment-pattern.md`.
- **`architecture/workspace-conventions.md` cross-reference section amended** — ADR-017 added as a companion to the directory contract; ADR-014 line annotated as "historical, superseded under subagent runtime."
- **`architecture/INDEX.md` updated** — ADR-016 + ADR-017 rows added; ADR-014 status flipped to "Superseded by ADR-017 (under subagent runtime)"; last-updated line bumped to Wave 108.

**Files landed this turn:**

1. `architecture/decisions/ADR-017-subagent-body-rewrite-rules.md` (new — the rule pack, ~280 lines)
2. `architecture/decisions/ADR-014-handoff-fragment-pattern.md` (status header amended)
3. `architecture/INDEX.md` (ADR-016 + ADR-017 rows added; ADR-014 status flipped; last-updated bumped)
4. `architecture/workspace-conventions.md` (cross-reference section updated)
5. `.claude/agents/architect.md` (full rewrite — 407 lines)
6. `.claude/agents/backend-developer.md` (full rewrite — 333 lines)
7. `.claude/agents/business-analyst.md` (full rewrite — 333 lines)
8. `.claude/agents/devsecops.md` (full rewrite — 389 lines)
9. `.claude/agents/product-owner.md` (full rewrite — 318 lines)
10. `.claude/agents/qa.md` (full rewrite — 696 lines)
11. `.claude/agents/ui-developer.md` (full rewrite — 336 lines)
12. `.claude/agents/ux-designer.md` (full rewrite — 406 lines)

**Allowlist QA needs to know about (the regression test must allow these and only these):**

- **Exactly 8 lines total** matching `You do NOT have \`mcp__apex-team__\*\` tools` — one per subagent file. The sentence text after the allowlisted opening varies slightly per role but the literal anchor `You do NOT have \`mcp__apex-team__*\` tools` is consistent. The grep test `grep 'mcp__apex-team__' .claude/agents/*.md | grep -v 'You do NOT have'` should return 0 matches.
- **The block-tag syntax** `[[HANDOFF: <role-id>]]`, `[[DISPATCH: ...]]`, `[[NOTES]]` is kept as advisory text — these tags are NOT legacy patterns under Plan C; they're the cross-role coordination format the outer orchestrator reads. Do NOT add these to the regression test's denylist.

**In flight / next:**

- QA picks up ADR-017 as their spec source and writes `tests/qa/wave-108/subagent-body-cleanliness.test.ts` exercising the four grep tests above. The test is mechanical — Vitest + child_process spawning `grep -E ...` against the 8 files; assertion is that the non-allowlisted line count is 0 for each rule.
- DevSecOps (Wave 109+ candidate) — wire the QA test into CI on every PR touching `.claude/agents/*.md`. Per `workspace-conventions.md` §"Enforcement model" layer 3 (mechanical CI hooks).
- Viewer-repo subagent body audit (out of scope this wave per PO brief; future wave).

**Parked / future:**

- `system-design.md` — still not created. Under the subagent runtime the "system" is the eight subagents + workspace directory contract. Stub when it becomes useful.
- `tech-stack.md` — same. Vitest + ESLint + TS + pnpm is the entire stack; barely a page.
- `coding-standards.md` — still not created. Under the subagent runtime there's no application source to standardize against; relevant standards live in `.claude/agents/*.md` and per-test conventions emerge from `tests/qa/` use.
- Fitness function for OQ-085-001's "no binary files committed under `tests/qa/wave-*/evidence/`" rule — QA owns the actual implementation; flagged in `workspace-conventions.md`.

**Notes / caveats:**

- The Plan C runtime adapter header removal is intentional per ADR-017 Decision (PO's non-binding lean: remove once bodies are clean). Both sides argued in the ADR. If a future reviewer wonders "why no header anymore?" the answer is in ADR-017's "Resolve the Open Question" section. The translation table is recoverable from git history if a fork ever needs it.
- The rule pack uses generic language for host-project commands ("the host project's test instance if one exists") rather than naming `lfm` or any other project specifically. This keeps the subagent bodies portable across whatever workspace the team is driving.
- The two-phase deployment collapse (rule 12) means DevSecOps's body now describes a single-turn merge+verify. If a future host project's deploy genuinely needs a split (e.g. >5min CI), DevSecOps re-derives the pattern; documented as a known consequence in ADR-017's Negative section.
- All 8 files now read cleanly against `workspace-conventions.md` (Wave 107) — the directory contract and the body discipline form a complete contract for the subagent runtime.

### #376 code review — `feature/375-pr-hygiene-injection-fix` — **PASS** (carried over from Wave 107)

**Verdict:** PASS. DevSecOps merged.

### Wave 107 deliverable — `workspace-conventions.md` — **RATIFIED**

(Detailed Wave 107 history archived above; carried-forward summary only.)
