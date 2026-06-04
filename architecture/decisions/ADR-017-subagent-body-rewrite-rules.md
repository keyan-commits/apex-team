# ADR-017 — Subagent prompt body rewrite rules (Plan C runtime)

- **Status:** Accepted
- **Date:** 2026-06-04
- **Wave:** 108
- **Owner:** Architect
- **Supersedes:** none (amends `architecture/workspace-conventions.md`; that doc remains the authoritative directory contract)
- **Tracked by:** Wave 108 (no US — this is an architectural rule pack consumed by code review + the QA regression test in the same wave)

---

## Context

PR #348 (`ebc83c5`, Wave 106) extracted the eight team roles as Claude Code subagents under `.claude/agents/*.md`. The extraction prepended a **Plan C runtime adapter** header (lines 6-19 of each file) that *translates* legacy monolith mechanisms — `[[DISPATCH: role]]`, `[[HANDOFF: role]]`, `talk_to_*` MCP tools, SQLite `agent_state`, `pnpm dev:test*`, `.restart-trigger`, etc. — as **historical context only**.

The header works for what it covers, but the *bodies* of the eight subagent files still contain 7–23 active legacy references each (95 total across the 8 files). These references actively guide subagent behaviour into retired mechanisms:

- **Concrete failure (PR #376, Wave 107):** DevSecOps wrote `_handoff-pending/107-devsecops.md` because `devsecops.md:427` literally instructs "Your HANDOFF fragment lands at `_handoff-pending/<wave>-devsecops.md`" and `:441` says "PO folds all fragments into `HANDOFF.md` at wave close with `pnpm fold-handoff`". Both files / commands are retired — there is no PO process to run the fold, no `_handoff-pending/` directory contract, and the SQLite `agent_state` has been replaced by `coordination/handoffs/<role-id>.md` files (per `workspace-conventions.md`).
- **Drift pattern:** the adapter header is a *negation* ("if you see X, ignore it"). Subagents tuned to follow concrete imperatives in their bodies frequently miss the negation when the body's imperative is more specific. The fix is to **remove or rewrite the imperative**, not to add stronger negations to the header.

The audit (legacy ref counts per file):

| File | Refs |
|---|---|
| `architect.md` | 11 |
| `backend-developer.md` | 14 |
| `business-analyst.md` | 11 |
| `devsecops.md` | 15 |
| `product-owner.md` | 7 |
| `qa.md` | 23 |
| `ui-developer.md` | 12 |
| `ux-designer.md` | 12 |

Wave 107 ratified `architecture/workspace-conventions.md` as the directory contract under the subagent runtime. Wave 108 brings the eight subagent bodies into alignment with that contract.

## Forces

1. **Retired mechanisms must not guide active behaviour.** The bodies are read at every invocation; their imperatives shape subagent decisions. Stale imperatives = recurring drift bugs (#376 is one of several).
2. **Translation in the header is unreliable.** Two waves of evidence (107: file fragments to `_handoff-pending/`; 107: HANDOFF doc edits in the wrong path on first dispatch) confirm subagents skip the negation when the body says otherwise.
3. **Some "legacy" mechanisms are still in use in the host project (apex-team itself).** `apex-engine` MCP tools (`mcp__apex-engine__*`) remain valid; `gh issue create --repo keyan-commits/apex-team` still works. The rewrite must distinguish "retired" from "still active in the host project, just not under the subagent runtime."
4. **Some protocol bodies (the requirements-phase protocol, the exception-tag catalog, the deployment-gate routing rule) are still operationally valid under the subagent runtime** — they're about decision flow, not retired infrastructure. They need to STAY in the bodies, often quoted inline because their source files (`src/lib/protocols.ts`) are gone.

## Decision

**Apply the rewrite-rule pack below to all 8 subagent body files.** Goal: drive each file's legacy ref count to ~0 modulo a small allowlist for files whose role legitimately must quote the legacy strings (e.g. `product-owner.md`'s legacy-translation explanation).

The rule pack is deliberately **a flat list keyed by legacy pattern**, so QA can build a grep-translatable regression test from it.

### Rewrite rule pack

Each rule: **Pattern → Action (remove / rewrite-to / inline-quote-protocol) + one-sentence rationale**.

1. **`pnpm dev:test`, `pnpm dev:test:ui`, `pnpm dev:test:be`, `pnpm dev:test:qa`, `pnpm dev:test:ux`**
   → **REMOVE**. Replace any imperative that depends on these (e.g. "spin up `pnpm dev:test:be` (port 3120)") with "spin up the host project's test instance if one exists; otherwise skip the runtime-verification step and rely on `pnpm test:run` / `pnpm build` / `pnpm type-check`." 
   *Rationale:* the apex-team monolith's per-role test instances are retired. There is no shared dev server under the subagent runtime.

2. **`pnpm dev:supervised`, `.restart-trigger`**
   → **REMOVE the entire section** describing the supervisor-restart mechanism (DevSecOps's "Restart triggering" subsection). 
   *Rationale:* no monolith process to supervise. The supervisor + `.restart-trigger` were apex-team-specific infrastructure.

3. **`_handoff-pending/<wave>-<role>.md`, `pnpm fold-handoff`, ADR-014 fragment pattern**
   → **REWRITE to direct edit of `coordination/handoffs/<role-id>.md`**. The fragment pattern is retired under the subagent runtime; each subagent now edits its own HANDOFF doc directly. The 4-section format (Done / In flight / Next / Notes) is preserved as a soft convention. 
   *Rationale:* PR #376 (Wave 107) showed DevSecOps writing a `_handoff-pending/` fragment because the body said to. There is no PO process to fold fragments under the subagent runtime, and `workspace-conventions.md` names `coordination/handoffs/<role-id>.md` as the canonical per-role HANDOFF location.

4. **`talk_to_product_owner`, `talk_to_role`, `mcp__apex-team__*`, "MCP server" (in the sense of apex-team's own server)**
   → **REMOVE** all instructions that depend on these tools. Phrases like "every new task entering the team via `talk_to_product_owner`" → rewrite to "every new task entering the team." References to "apex-team MCP server" → strike unless the surrounding sentence is specifically explaining what was *retired*. 
   *Rationale:* apex-team's MCP server is gone. The outer Claude Code orchestrator invokes subagents directly via the Task tool — there is no `talk_to_*` interface.

5. **`src/lib/roles.ts`, `src/lib/protocols.ts`, `src/lib/skills/*`** (any reference to "see `src/lib/...` for full protocol text")
   → **INLINE-QUOTE the protocol verbatim** in the subagent body (or summarize the relevant rule inline with attribution: "Per the historical `DEPLOYMENT_GATES_PROTOCOL`…"). Strip the pointer to the now-deleted source file. If the protocol is already quoted inline (e.g. `REQUIREMENTS_PHASE_PROTOCOL` is duplicated in every file), KEEP the inline quote and just remove the trailing "Full protocol text: `src/lib/protocols.ts`" line. 
   *Rationale:* the source files were deleted with the monolith. A pointer that resolves nowhere is worse than no pointer — it implies an authoritative source exists when none does.

6. **`/api/health`**
   → **REMOVE** any verification step that depends on `/api/health` (e.g. "Confirm `/api/health` is reachable" in DevSecOps Phase 2; QA's "Confirm `GET /api/health` `gitSha`/`buildTime` matches branch HEAD"). Replace with "verify the host project's health endpoint if one exists; otherwise rely on `pnpm test:run` + `pnpm build` exit 0 + the host project's smoke test." 
   *Rationale:* apex-team's `/api/health` endpoint is gone. The S7 "deploy-confirmed" rule survives in spirit — "validated ≠ deployed" is a real principle — but it now points at whatever the host project provides.

7. **`data/test-*.db`, `data/apex-team-test.db`, `data/apex-team.db`, "SQLite `agent_state` table", "the `messages` table", "DB at `data/...`"**
   → **REMOVE**. Replace BE Dev's "mock `src/lib/db.ts` wholesale" with "mock the host project's data-access layer wholesale." 
   *Rationale:* the SQLite-backed `agent_state` and `messages` tables were apex-team monolith state. The subagent runtime has no shared database; coordination is files on disk under `coordination/handoffs/`.

8. **`:3100`, `:3110`, `:3120`, `:3130`, `:3000` (port references to retired apex-team instances)**
   → **REMOVE**. Any imperative like "run on the `:3100` test instance" → "run on the host project's test instance if one exists; otherwise rely on the unit-test suite." The port-routing matrix in subagent bodies (UI Dev on 3110, BE Dev on 3120, QA on 3100, UX on 3130) is retired wholesale. 
   *Rationale:* these ports were apex-team monolith instances. No subagent has a private dev-server port under the runtime.

9. **References to `src/app/**/page.tsx`, `src/app/**/layout.tsx`, `src/components/**/*.tsx`, `src/app/globals.css` as the **detection rule** for "UI-touching"**
   → **KEEP THE RULE'S INTENT, GENERALIZE THE PATHS**. The Architect/UX routing rule ("if the diff touches a UI route, route to UX") is operationally valid; the specific Next.js paths are apex-team-specific. Rewrite to: "If the diff touches files that render pixels a user sees — the host project's UI routes, components, or stylesheets — route the UI portion to UX." Files in the apex-team repo can KEEP the literal globs as examples in parentheses for clarity. 
   *Rationale:* the routing rule is good; the path-glob is project-specific. The rule must remain comprehensible when a subagent runs against a non-apex-team workspace.

10. **`[[DISPATCH: role]]` blocks and `talk_to_product_owner` as auto-trigger mechanisms** (PO's body in particular)
    → **REWRITE PO's body to describe DISPATCH as advisory text** that the outer orchestrator reads. PO no longer "fires" peer turns. The visible reply describes the *intent* to dispatch and what each peer should do; the outer Claude Code orchestrator decides whether to invoke them. Other roles' bodies referencing DISPATCH ("PO's first action on a new task is a parallel DISPATCH to…") → KEEP the DISPATCH terminology but reframe: "PO's first action is to request the parallel triad (architect + ux-designer + business-analyst)." 
    *Rationale:* DISPATCH-as-auto-trigger is a monolith mechanism. The outer orchestrator (not PO's reply text) decides peer invocation under Plan C.

11. **The "Restart triggering" subsection of `devsecops.md` and any HANDOFF instructions to "restart the apex-team dev server"**
    → **REMOVE entirely**. DevSecOps under the subagent runtime owns the host project's CI/CD, not apex-team's own server lifecycle. 
    *Rationale:* there is no apex-team dev server to restart under Plan C. The host project (e.g. `lfm`) has its own deploy path that DevSecOps configures.

12. **Two-phase deployment / Phase 1 merge + Phase 2 restart-verify in `devsecops.md`**
    → **COLLAPSE to one phase: merge + verify** (with verify being whatever the host project supports). The two-phase split existed because apex-team's MCP transport had a 5-minute body timeout that the supervisor restart blew through. 
    *Rationale:* no MCP transport, no 5-minute timeout, no supervisor restart. One turn, one merge, one verify.

13. **"Auto-loop" / `CronCreate` / `ScheduleWakeup` mentions and any reference to "PO must auto-start the next-priority backlog issue every turn"**
    → **KEEP the heuristic** ("when the team is clear, look at the backlog") but **strip the auto-trigger language**. PO under Plan C surfaces backlog candidates in its visible reply; the outer orchestrator decides whether to start the next wave. 
    *Rationale:* auto-trigger ticks were apex-team server functionality. They do not exist under the subagent runtime.

14. **Inline references to apex-team-internal commands** — `pnpm scout`, `pnpm fold-handoff`, `pnpm branch:start`, `pnpm dev` (in the sense of starting apex-team's own server)
    → **REMOVE or REWRITE to host-project-equivalent**. `pnpm scout` is dead. `pnpm fold-handoff` is dead. `pnpm branch:start qa <wave>-<short>` → "create a worktree per the WORKTREE_ISOLATION_PROTOCOL using `git worktree add /tmp/<role>-<branch> origin/<branch>`."
    *Rationale:* these scripts live in the retired monolith's `package.json`. The subagent runtime has no `pnpm scout` to run.

15. **The S1, S2, S5, S6, S7 gates in `qa.md`** (visual / artifact-correctness gates)
    → **KEEP THE RULE, GENERALIZE THE PATHS / PORTS**. The principles ("render the artifact and look at it"; "exercise the real path, not a fixture"; "WCAG AA contrast"; "validated ≠ deployed") are universally valid. Strip `:3100` and `/api/health` per rules 6 and 8 above. The gate names (S1–S10) stay; the apex-team-specific implementation details get removed.
    *Rationale:* these gates encode universal QA discipline. They are valuable under any runtime; only the apex-team-specific mechanics need to go.

### Inline-quote rule for retired-source protocols

Several protocols exist in the bodies as duplicated inline quotes pointing at `src/lib/protocols.ts` as the "authoritative source":

- `REQUIREMENTS_PHASE_PROTOCOL`
- `DEPLOYMENT_GATES_PROTOCOL`
- `WORKTREE_ISOLATION_PROTOCOL`
- `SKILLS_SELF_ENRICHMENT_PROTOCOL`

**Rule:** the inline quote IS the canonical text now. Strip the trailing "Full protocol text: `src/lib/protocols.ts`" or "See `SKILLS_SELF_ENRICHMENT_PROTOCOL` in `src/lib/protocols.ts`" pointer. The protocol body stays; the dangling source-file reference goes.

If the protocol is referenced WITHOUT being inline-quoted (e.g. one file says "see DEPLOYMENT_GATES_PROTOCOL in `src/lib/roles.ts`" without quoting it), **inline the protocol** before stripping the pointer. Better to duplicate canonical text across 8 files than to leave a pointer to a deleted file.

### Resolve the Open Question — keep or remove the Plan C runtime adapter header?

The PR brief surfaces this question explicitly: post-rewrite, do we keep the adapter header (lines 6-19) or remove it now that bodies are clean?

**Argument for KEEP:**
- Defense-in-depth. If a single legacy reference slips back in through a future PR (e.g. someone copy-pastes from the apex-team monolith's old `src/lib/roles.ts` archived elsewhere), the header still translates it.
- Cheap insurance. Lines 6-19 cost ~70 lines × 8 files = ~560 lines total. Negligible context bloat.
- Forward-compatible with apex-team-fork projects. If anyone forks the role definitions to drive a different monolith, the adapter clearly demarcates "we ported from a monolith; here's the translation table."

**Argument for REMOVE:**
- Once bodies are clean, the header is documenting a translation no longer needed in the body. It becomes a fossil. Future reviewers may wonder why the negation exists when there's nothing to negate.
- The header text itself contains every legacy pattern it's negating — so it counts AGAINST the QA regression test ("body should not mention `talk_to_product_owner`"). A clean test becomes complicated by an allowlist for the header.
- PO's non-binding lean: remove once bodies are clean.

**Decision: REMOVE the Plan C runtime adapter header (lines 6-19) from all 8 subagent files** once the body rewrites are landed.

Rationale: the adapter was a Wave 106 bridge to ship the extraction without rewriting every body in the same PR. Wave 108 lands the body rewrites; the bridge is no longer load-bearing. Keeping it complicates the QA grep-test (every legacy term appears in the header by definition) and creates a fossil that obscures the cleaner post-rewrite contract. The cost of a future regression slipping in is low because: (a) every subagent invocation reads `workspace-conventions.md` cross-linked from `CLAUDE.md`, (b) Architect code review FAILs any PR landing a retired pattern, (c) the QA Wave-108 regression test mechanically catches the patterns.

If a future fork needs translation, they can copy the header back from git history.

### Allowlist exceptions

Three files have legitimate reasons to mention the legacy patterns post-rewrite. The QA regression test must allowlist these.

| File | Allowed string(s) | Rationale |
|---|---|---|
| `product-owner.md` | `"You do NOT have \`mcp__apex-team__*\` tools"` — this exact phrase, kept as a single explanatory sentence in the "Tools" subsection. | PO's body explicitly disclaims a tool surface that another reader might assume PO has. Removing the disclaimer would invite the assumption. The sentence quotes the legacy string only to negate it. |
| `architect.md`, `backend-developer.md`, `business-analyst.md`, `qa.md`, `ui-developer.md`, `ux-designer.md`, `devsecops.md` (Team protocol section) | `"You do NOT have \`mcp__apex-team__*\` tools"` — this exact phrase, in the "Talking to a peer" subsection. | Same reasoning as PO. Each subagent's body negates the assumption that it has an apex-team-specific MCP-driver tool surface. |
| ALL 8 files (the Wave 55 refusal clause, kept as-is) | `[[HANDOFF: product-owner]]`, `[[DISPATCH: ...]]`, `[[NOTES]]`, `[[HANDOFF: <role-id>]]` block syntax | These tag formats are now advisory text per Plan C — the outer orchestrator reads them but does not auto-fire on them. Removing the syntax would gut the cross-role coordination instructions wholesale. The semantics are kept; the auto-trigger behaviour is gone. |

Concrete grep test (QA implementation hint):

```
# Should match 0 lines except in the allowlisted sentence (one line per file):
grep -n 'mcp__apex-team__' .claude/agents/*.md | grep -v 'You do NOT have'

# Should match 0 lines:
grep -nE 'pnpm dev:test|pnpm dev:supervised|\.restart-trigger|_handoff-pending|pnpm fold-handoff|talk_to_product_owner|talk_to_role|/api/health|data/test-.*\.db|agent_state|:3100|:3110|:3120|:3130' .claude/agents/*.md

# Should match 0 lines (no dangling pointers to deleted files):
grep -nE 'src/lib/roles\.ts|src/lib/protocols\.ts|src/lib/skills/' .claude/agents/*.md

# Plan C runtime adapter header marker — should NOT appear (header removed):
grep -n '## Plan C runtime adapter' .claude/agents/*.md
```

## Consequences

### Positive

- Subagent bodies stop guiding behaviour into retired mechanisms. The PR #376 class of bug ("DevSecOps wrote a fragment because the body said to") is eliminated structurally.
- The bodies become portable: a fork driving a different host project no longer carries apex-team-monolith-specific imperatives.
- QA's regression test in Wave 108 has a clean grep-translatable spec: the rule pack above.
- `workspace-conventions.md` (Wave 107) and ADR-017 (this) form a complete contract: directory layout + body discipline.

### Negative

- 8 file rewrites are wide-touching. Diff review is large; QA's regression test exists to mechanically verify completeness.
- Some operational knowledge that lived in the monolith-specific imperatives (e.g. "QA spins up `:3100` after Architect PASS") needs to be re-derived per host project. The rewrites point at "the host project's test instance if one exists" — this is correct but less prescriptive.
- The two-phase deployment collapse (rule 12) loses the explicit timeout-budget rationale. If a future host project's deploy is slow enough to need a split, DevSecOps will need to re-derive the pattern. Acceptable: cross-host-project portability over apex-team-specific optimization.

### Follow-ups

- **Wave 109+ candidate:** add a CI hook (DevSecOps lane) that runs the QA grep test on every PR touching `.claude/agents/*.md`. Mechanical enforcement at layer 3 (per `workspace-conventions.md` enforcement model).
- **Wave 109+ candidate:** review the viewer-repo subagent bodies (`keyan-commits/apex-team-viewer`) for the same drift, with a translation pack of their own. Out of scope this wave per PO brief.
- **Already in scope this wave:** QA writes a regression test at `tests/qa/wave-108/subagent-body-cleanliness.test.ts` exercising the four grep checks above. Test code lives on disk per `workspace-conventions.md` §"Test code is retained (committed) indefinitely."

## Cross-references

- `architecture/workspace-conventions.md` — directory contract this ADR amends. Wave 107.
- `architecture/decisions/ADR-014-handoff-fragment-pattern.md` — defines the `_handoff-pending/<wave>-<role>.md` fragment mechanism that rule 3 above retires under the subagent runtime. ADR-014's status should transition to **Superseded by ADR-017** in the same PR that lands this ADR.
- `.claude/agents/*.md` — the 8 files this ADR governs.
- PR #376 — the concrete failure that motivated this ADR.
