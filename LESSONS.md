# Lessons — apex-team

Append-only. Newest first. Each entry: ~3–5 lines. Triggers: a protocol amendment, a "this shouldn't happen again" surprise, a non-obvious workaround.

## 2026-06-01

### Mandatory pnpm build + boot smoke before QA PASS (Wave 64)
**What broke:** PR #138 (`feature/55-roles-impl-mandate-and-routing`, commit `e7d4ba6`) shipped `src/lib/skills/architect.ts` line 24 with an em-dash + escaped backticks inside a template literal. `tsc --noEmit` passed. `vitest run` 158/158 green. QA declared PASS. At server startup, Turbopack/SWC failed: `Expected a semicolon at 24:217`. Dev server returned HTTP 500 on `/dashboard` and `/api/health`.
**Why:** `tsc` and `vitest` do NOT invoke the SWC/Turbopack compiler. `pnpm build` eagerly compiles the entire Next route graph including everything `src/app/**` transitively imports (e.g. `src/lib/roles.ts` -> `src/lib/skills/*.ts`). `server.ts` + `src/mcp/*.ts` run via tsx/esbuild and are NOT in the next-build graph; a parse error there is only caught by booting and hitting `/api/health`.
**We now do:** `pnpm build` UNCONDITIONAL on every PR (Leg A) AND boot `:3100` + `GET /api/health` -> 200 (Leg B). AND, not OR. Both legs. User mandate: "I'm still amazed by how we still have these kinds of bugs when we have strict guidelines that all changes should be tested on another environment/instance before we actually make it live. Please fix the workflow, make sure everything is being tested prior to deployment to live."

### BA competency upgrade — domain MDs prevent repeated business-logic questions
**What broke:** Mac 2's claude-code asked the user whether the Consolidation sheet was a separate file or part of the Order Sheet workbook. The answer was already documented in a workspace MD. BA had no hard rule to scan before answering, so it asked the user instead.
**Why:** BA prompt had no workspace-scan procedure, no `domains/` structure, no promote-to-MD discipline. Answers lived in conversation threads and evaporated.
**We now do:** BA skill rewritten (Wave 65) with discovery-first scan before every answer, onboarding scan on workspace change, per-domain MDs under `requirements/domains/`, promote-to-MD discipline on every derived answer, and canonical cross-peer authority. Architect's skill now carries a hard BA-deferral bullet. Pre-seeded apex-team's own `requirements/domains/` tree as dogfood. Closes #143.

### Mandatory requirements triad — implementer refusal is the hard backstop
**What broke:** Orchestrator-of-orchestrator (Mac 2's outer claude-code) and PO both bypassed the requirements phase on tasks they judged small. Un-specced UI changes shipped. UX gate was never triggered. Visual regressions went undetected until the user noticed on Mac 2.
**Why:** Requirements phase existed as exhortation only (prompt guidance). No implementer-side backstop. PO's dispatches died in DB because `talk_to_product_owner` used `runTurn` instead of `runTurnWithDispatches` (separate fix, Wave 54-meta).
**We now do:** Hard-encoded the parallel-triad mandate (Architect + UX + BA before any implementer) in `REQUIREMENTS_PHASE_PROTOCOL` + PO skill + `PHASED_WORKFLOW_DISCIPLINE`. Implementers (`qa.ts`, `backend-developer.ts`, `ui-developer.ts`) each carry a refusal clause that bounces work lacking a `US-NNN` path, a user-story-format `Closes #NNN`, or one of seven exception tags: `trivial-ops`, `gate-verdict`, `scout-issue`, `housekeeping`, `revise-redispatch`, `emergency-rollback`, `security-hotfix`. Wave 55.

### QA visual tests must exercise real components, not mocks
**What broke:** QA tests for visual / collapsible / overflow behavior passed because they mocked the component-under-test. Real render was broken (collapsed panel didn't clip at max-height; overflow scroll missing).
**Why:** Mocking the component defeats visual/interaction verification — the mock complies with spec while the real render fails silently.
**We now do:** QA skill (`qa.ts`) explicitly bans mocking the component under visual test. Both open/closed states required for affordance-bearing components. Overflow/layout tests must assert on rendered geometry, not class names. Wave 53a+53b.

### `tsx watch` mid-edit kills the editing agent
**What broke:** the auto-restart watcher respawned the apex-team server whenever an agent edited an imported source file. Mid-turn restarts cut off in-flight responses.
**Why:** the watcher couldn't distinguish "agent intentionally edited code" from "I should reload now." Both are file changes.
**We now do:** plain `tsx server.ts` + supervisor pattern via `.restart-trigger`. Code: `scripts/dev-supervisor.mjs`. ADR-002 §Consequences.

### MCP transport drops on long agent turns
**What broke:** multi-agent dispatches > 5 min dropped at the client. Server logs healthy.
**Why:** Node's `requestTimeout` default + undici client's bodyTimeout + intermediate TCP idle timeout.
**We now do:** `server.requestTimeout = 0` + `keepAliveTimeout = 65_000` + 30s SSE heartbeat in `src/mcp/handler.ts` Wave 30. See US-004.

### Direct-to-main "bootstrap exceptions" eroded discipline
**What broke:** small fixes ("just this one") routed directly to main bypassed QA/UX gates. Cumulatively the protocol's integrity decayed and we shipped a 500 to the live instance.
**Why:** no server-side enforcement; only agent-prompt discipline.
**We now do:** GitHub branch protection with `enforce_admins: true` + pre-push hook + CI required. Wave 14 US-006. No bypass without explicit per-incident user authorization.

### HANDOFF "Awaiting CI + merge" wording goes stale post-merge
**What broke:** HANDOFF entries written inside the feature PR referenced "Awaiting CI + merge" because the merge SHA didn't exist yet.
**Why:** the merge SHA can only be known AFTER the PR merges. Wave 14e bundled HANDOFF into the PR to kill round-two ceremony, but the merge SHA gap remained.
**We now do:** reference the PR # not the merge SHA. "Wave N — shipped via PR #123." Wave 36 in `DEPLOYMENT_PHASE_PROTOCOL`.

### Dependabot `strict:true` rebase treadmill
**What broke:** every wave that merged to main made all other Dependabot PRs fall behind, requiring another rebase + CI cycle.
**Why:** branch protection's `strict: true` requires up-to-date-with-main before merge.
**We now do:** sequence Dependabot merges as a final batch after the active waves drain, or accept the cycle as the cost of strict freshness.

### `tsx@4.22.4` blocked by pnpm minimum-release-age policy
**What broke:** a Dependabot PR couldn't merge because one bundled dep was published < 24h ago.
**Why:** pnpm's default supply-chain policy rejects very-new deps (typosquat / dep-confusion guard).
**We now do:** cherry-pick the older portion of the bump into a fresh PR; let Dependabot re-bump the new dep when it ages out. Wave 35 example.

---

Future entries go above. Append-only — never edit past entries.
