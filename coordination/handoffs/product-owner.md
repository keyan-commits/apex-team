# product-owner — HANDOFF

## ⏭️ NOW — 2026-06-04 — Wave 108 (subagent body rewrites — COMPLETE, ready to merge)

**Wave goal:** Eliminate ~105 legacy monolith references from the 8 `.claude/agents/*.md` body prose. Prevent the PR #376 class of slip (DevSecOps body instructing `_handoff-pending/<wave>-devsecops.md` writes).

**Charter decisions (PO):**
- Rewrite-rule home → new ADR by Architect (ADR-017) + cross-link amendment in `architecture/workspace-conventions.md`.
- Implementer → Architect (single hand, 8 files, coding-standards owner). Rejected option (c) self-edit because each subagent reading its legacy prompt during edit reproduces PR #376's slip pattern.
- QA regression test → IN Wave 108 as `tests/qa/wave-108/subagent-body-cleanliness.test.ts`. First concrete tests-as-files artifact under US-085 AC5 discipline.
- Plan C runtime adapter header (lines 6-19) → **REMOVED** per Architect's ADR-017 ratification (bodies are clean, adapter is redundant).

**Returned (all 4 lanes):**
- ✅ Architect — `architecture/decisions/ADR-017-subagent-body-rewrite-rules.md` (15 rewrite rules, inline-quote rule, adapter-header removal rationale, allowlist). Executed 8 file edits: 95 legacy refs → 0 (modulo 8 allowlisted "You do NOT have `mcp__apex-team__*` tools" sentences). Cross-doc updates: `architecture/INDEX.md` (ADR-016 + ADR-017 added; ADR-014 status flipped to Superseded), `architecture/workspace-conventions.md` (amendment), `architecture/decisions/ADR-014-handoff-fragment-pattern.md` (status header amended).
- ✅ UX Designer — "No UI impact — skip UX gate" verdict in `coordination/handoffs/ux-designer.md`.
- ✅ BA — US-087 filed (`requirements/user-stories/US-087-subagent-body-rewrite.md`) with 5 ACs; `requirements/INDEX.md` updated.
- ✅ QA — `tests/qa/wave-108/subagent-body-cleanliness.test.ts` written + run: **153/153 PASS in 125ms**. Verdict: PASS. **First US-085 AC5 smoke proof artifact on disk.**

**Wave 108 PR bundle:**
- New: ADR-017, US-087, `tests/qa/wave-108/subagent-body-cleanliness.test.ts`, `coordination/handoffs/qa.md`.
- Modified: 8 `.claude/agents/*.md` files, `architecture/INDEX.md`, `architecture/workspace-conventions.md`, `architecture/decisions/ADR-014-handoff-fragment-pattern.md`, `requirements/INDEX.md`, `coordination/handoffs/{architect,business-analyst,ux-designer,product-owner}.md`.

**Next PO turn (post-merge):**
- Wave 109 candidates per Architect + QA HANDOFFs:
  - **DevSecOps CI hook** to run `tests/qa/wave-108/subagent-body-cleanliness.test.ts` on every PR touching `.claude/agents/*.md` (Architect flagged this as the Wave 109 sweetspot; QA's test is the regression guard, DevSecOps wires it into CI).
  - Viewer-repo coordination (`apex-team-viewer` sibling repo conventions).
  - BA's retained-annotated backlog menu.

**Parked:** viewer-repo subagent bodies (separate codebase, out of scope).

---

## ⏭️ PREV — 2026-06-04 — Wave 107 (first wave under subagent runtime)

**Wave goal:** Three deliverables on the new Plan C runtime (main `ebc83c5`):
1. Architect ratifies `architecture/workspace-conventions.md` — directory contract single source of truth, resolves OQ-085-001 + OQ-085-002.
2. BA re-triages monolith-era backlog (#316–#320, US-079/080/081/082/083/084, US-065/066, ~20 `self-improvement` issues) — close monolith-coupled, re-file subagent-runtime discipline.
3. DevSecOps fixes `.github/workflows/pr-hygiene.yml` injection bug per #375 ACs (env passthrough + `printf '%s'`).

**Dispatched (parallel, this turn):**
- Architect — owns deliverable 1 (workspace-conventions doc).
- UX Designer — triad participation for deliverable 1 (expected verdict: no UI impact, skip).
- BA — US-NNN-workspace-conventions for deliverable 1, owns deliverable 2 outright.
- DevSecOps — owns deliverable 3, ops-only carveout.

**Parallel structure:** mandatory triad (Architect + UX + BA) for #1; BA's lane fans out to #2 in parallel; DevSecOps runs #3 in parallel on its own lane. Four subagents fired concurrently by outer Claude Code.

**Returned:**
- ✅ Architect — `architecture/workspace-conventions.md` (flat doc, not ADR — rationale documented). OQ-085-001 RESOLVED (test code committed, evidence binaries gitignored under `tests/qa/wave-NNN/evidence/`, per-evidence-dir README.md audit trail). OQ-085-002 CLOSED (re-scoped: original "skill slot in src/lib/skills/qa.ts" question is meaningless post-monolith; `.claude/agents/qa.md` IS the skill file). Also updated `architecture/INDEX.md`, `CLAUDE.md` item 2, `requirements/open-questions.md`. HANDOFF at `coordination/handoffs/architect.md`.
- ✅ UX Designer — "No UI impact — skip UX gate" verdict written to `coordination/handoffs/ux-designer.md`.
- ✅ BA — US-086 filed (`requirements/user-stories/US-086-workspace-conventions.md`), `requirements/INDEX.md` updated. **Re-triage executed: 44 GitHub issues closed** (dev-supervisor, MCP/server/tick-scheduler, dashboard/component, DISPATCH mechanism, dup skill proposals); **8 US files status-updated to closed** (US-065/066, US-079/080/081, US-082/083, US-084). 31 issues retained (skill proposals, CI/process discipline, docs-integrity, role-discipline items annotated for `.claude/agents/*.md` rehoming). Full re-triage table in `coordination/handoffs/business-analyst.md`.
- ✅ DevSecOps — PR #376 (`fix(ci): prevent shell injection in pr-hygiene.yml body validation`). **MERGED at `749843d`** after Architect PASS verdict. Closes #375. HANDOFF at `coordination/handoffs/devsecops.md`.
- ✅ Architect (second turn) — Code review on PR #376: PASS. Verdict recorded in `coordination/handoffs/architect.md` §"#376 code review".

**US-086 cross-link patched** in `architecture/workspace-conventions.md` (was `<!-- US-NNN: TBD by BA -->`).

**Wave 107 working-tree changes to bundle into a single PR** (Wave 107 doc-deliverables PR):
- New: `architecture/workspace-conventions.md`, `requirements/user-stories/US-086-workspace-conventions.md`, 5 `coordination/handoffs/*.md` files (architect, business-analyst, devsecops, product-owner, ux-designer).
- Modified: `CLAUDE.md`, `architecture/INDEX.md`, `requirements/INDEX.md`, `requirements/open-questions.md`, 8 US files (status → closed).
- Cleanup: delete `_handoff-pending/107-devsecops.md` (orphan from DevSecOps's branch — legacy `_handoff-pending/` pattern referenced ADR-014 but the directory was removed in the retirement PR; canonical state lives in `coordination/handoffs/devsecops.md`).

**Architect HANDOFF callouts to address:**
- DevSecOps still references `_handoff-pending/` + `pnpm fold-handoff` (both deleted in retirement). Body-rewrite of `.claude/agents/devsecops.md` is a separate wave; for now the discipline gap is a known carveout.
- Future fitness function (CI hook) for "no binary files under `tests/qa/wave-*/evidence/`" — owned by QA when they author the first wave's tests.

**Next PO turn:**
- After Wave 107 doc PR merges: ack closeout, plan Wave 108. Top candidates:
  - Body rewrites of subagent prompts to remove legacy monolith references (would have caught the DevSecOps `_handoff-pending/` gap and the UI Dev `pnpm dev:test:ui` gap from earlier smoke).
  - Viewer-repo coordination (the `apex-team-viewer` sibling repo needs its own conventions / cross-link to apex-team's).
  - Whatever BA flagged as "retained, annotated" in her re-triage — these are work items waiting for a wave.

**Workflow notes (Plan C runtime, first wave):**
- DISPATCH blocks are advisory; outer Claude Code invokes subagents.
- HANDOFF docs at `coordination/handoffs/<role>.md` are the only durable per-role state.
- No auto-trigger; no peer inbox; no SQLite. Files-on-disk only.

**Parked:** viewer-repo conventions (separate codebase, out of scope this wave).
