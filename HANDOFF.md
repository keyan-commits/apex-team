# HANDOFF — apex-team

## ⏭️ NOW — 2026-05-31

**Wave 11b UI Dev — US-003 workspace-scoped Issues panel. Feature branch: `feature/11b-workspace-scoped-issues-ui`. Pre-HANDOFF complete — awaiting UX PASS.**

- `src/app/dashboard/page.tsx` — three changes: (1) workspace init: added `/api/health` `defaultCwd` fallback when no localStorage entry; (2) team-status poll: appends `?workspace=<path>` and adds `workspace` to useEffect dep array so re-polls on change; (3) Issues panel: `repo === null` → `.empty-msg` empty state; `repo !== null` → attribution label (`issue-repo-attr`) + dynamic GitHub links keyed to derived repo
- Pre-HANDOFF: `pnpm type-check` clean, `pnpm test:run` 24/24 green (6 files, includes BE's 7 repo-derivation tests)
- Commit SHA: (SHA-pending)
- **Awaiting:** UX Designer PASS → QA

---

**Wave 11b BE Dev — US-003 workspace-scoped Issues panel. Feature branch: `feature/11b-workspace-scoped-issues`. Pre-HANDOFF complete — awaiting QA PASS.**

- `src/types.ts` — added `repo: string | null` to `TeamStatus["issues"]`
- `src/app/api/team-status/route.ts` — added `deriveGithubRepo(workspace)` exported helper (execFileSync, SSH + HTTPS regex, null on all failure modes); converted singleton `_issueCache` to `Map<string, …>` keyed by repo; `fetchIssues(repo)` takes explicit repo; GET handler reads `?workspace=` query param and derives repo — null workspace → `_noIssues` (repo: null), never falls back to apex-team hardcode
- `tests/api/team-status-repo-derivation.test.ts` — 7 vitest cases covering SSH, HTTPS, HTTPS+.git, GitLab (null), no remote (throws → null), empty string (null), null (null)
- Pre-HANDOFF: `pnpm type-check` clean, `pnpm test:run` 24/24 green (6 files)
- Commit SHA: `3c7c71d`

**🎉 US-004 SHIPPED. THE META-FIX. `#31` closed.** MCP transport drops are now solved at the source — Node `requestTimeout=0` removes the only server-side timer that was tearing down long-running agent turns. Merge `03b086f` on `origin/main`. Server respawned (new PID 5527). `pnpm smoke` PASS.

**Wave 12 net:**

| Phase | Wave | Output |
|---|---|---|
| Requirements | 12a | Architect diagnosis (real culprit: `requestTimeout=5min`, not `keepAliveTimeout`) + BA US-004 `bc75f9e` |
| Implementation | 12b | BE Dev in own worktree → `server.ts` `applyHttpTimeouts(server)` helper + 4 unit tests → `464fe73` |
| Verification | 12c | QA in own worktree → 4/4 ACs PASS, 17/17 tests green |
| Deployment | 12d | DevSecOps merge `03b086f` + push + worktree cleanup + restart-trigger + smoke PASS |

**Empirical confirmation comes from the very next long-running PO dispatch.** If we still see drops on a >5-minute turn, the remaining culprit is client-side (Claude Code MCP HTTP client timeout) and outside our server's control — Architect flagged this in Wave 12a.

**Next user-facing work:** Wave 11 (US-003 workspace-scoped issues — the dashboard's Issues panel showing the wrong repo on the user's other Mac). Pending: UX Designer dispatch + OQ-003 (manual repo override?) + OQ-004 (Architect already answered: per-request git derivation + multi-key cache). Architect's full design ready, BA's user story written.

---

**Wave 12b BE Dev — US-004 MCP transport fix implemented. Feature branch: `feature/12b-mcp-transport-fix`. Awaiting QA PASS.**

- `server.ts` — exported `applyHttpTimeouts(server)` helper; called between `createServer(...)` and `server.listen(...)`. Sets `requestTimeout=0`, `keepAliveTimeout=65_000`, `headersTimeout=66_000`.
- `tests/server/timeouts.test.ts` — 4 vitest cases locking the constraint values. All 17 tests pass (5 files).
- Pre-HANDOFF checklist: `pnpm type-check` clean, `pnpm test:run` 17/17 green.
- Commit SHA: `464fe73`

**US-003 still pending:** OQ-003 (UX Designer) + UX spec in `design/` before Wave 11b can be scoped.

---

**🎉 US-002 SHIPPED end-to-end through the new phased workflow.** First complete dogfood of ADR-002. Merge commit `6eaab70` on `origin/main`. `pnpm smoke` PASS.

**Wave 10 net summary:**

| Phase | Wave | Role(s) | Output |
|---|---|---|---|
| Requirements | 10a | PO + Architect + DevSecOps + BA (parallel) | Recommendation: GitHub Actions + Dependabot + gitleaks + smoke (no Jenkins, no IaC). US-002 written. ADR-002 §Consequences updated `3ebe889`. |
| Implementation | 10b | DevSecOps (own worktree) | CI workflow + CodeQL + Dependabot + smoke script + gitleaks hook + ops/README updates. `88fd8d1`. 13 vitest cases green. |
| Verification | 10c | QA (own worktree) | Gate FAIL on AC5 (IaC docs missing). Structured per-AC evidence table. |
| Fix + Re-verify | 10d | DevSecOps → QA | IaC N/A section added `93015c7`. QA re-PASS. |
| Deployment | 10e | DevSecOps | Merge to main `6eaab70` + push origin/main + worktree cleanup + remote branch deletion. |

**Process worked exactly as designed:** QA caught a real gap before main; DevSecOps fixed; QA re-PASSed; DevSecOps merged. No protocol violations. US-002 now `done` in `requirements/user-stories/`.

---

**Wave 10b DevSecOps — US-002 implementation complete. Feature branch: `feature/10b-pipeline-ownership`. Worktree: `../apex-team-devsecops-10b-pipeline-ownership/`. Awaiting QA PASS before merge to main.**

**Deliverables shipped on `feature/10b-pipeline-ownership` (`88fd8d1`):**
- `.github/workflows/ci.yml` — type-check + test:run + lint (continue-on-error) on PR + push
- `.github/workflows/codeql.yml` — JS/TS SAST, weekly + push to main
- `.github/dependabot.yml` — npm weekly, minor+patch grouped
- `scripts/post-deploy-smoke.mjs` — health check POST-deploy (`pnpm smoke`)
- `scripts/post-deploy-smoke.d.mts` — TS declaration for testability
- `tests/ops/post-deploy-smoke.test.ts` — 5 vitest cases, all passing
- `package.json` — `"smoke"` script added
- `scripts/git-hooks/pre-commit` — gitleaks protect --staged added (conditional on install)
- `ops/README.md` — "Pipeline & security tooling" section appended

**Pre-HANDOFF checklist: all PASS**
- `pnpm type-check` clean
- `pnpm test:run` — 4 files, 13 tests, all pass
- YAML syntax valid (no tabs)
- No secrets required in CI beyond GITHUB_TOKEN (auto-injected)

**Wave 10a Architect — CI/CD research complete; ADR-002 §Consequences updated with confirmed worktree isolation model + script names. Self-audit: no skill gaps.**

**Wave 10a recommendation written (see below). Awaiting DevSecOps domain-expert input + BA US-002 before PO synthesizes for the user.**

**ADR-002 updated (`3ebe889`):** §Consequences now documents the resolved isolation model (feature branch + git worktree), confirmed per-role dev:test script names + ports, and closes the OQ-001 ambiguity note.

**Wave 9b/c/d foundation complete. Phased workflow protocol is live; worktrees provisioned; requirements scaffold seeded; all peers ran skill self-audit. Origin/main in sync. Active thread: `mcp_mpsoeous_bih2`.**

**Shipped in this foundation push (all on origin/main):**

| Commit | Role | What |
|---|---|---|
| `2a81587` | Architect | `src/lib/protocols.ts` (6 constants) + `architecture/decisions/ADR-002-multi-phase-workflow.md` + `architecture/INDEX.md` + roles.ts prompt updates (phased-workflow discipline + DevSecOps-only deploy) |
| `5802292` | DevSecOps | Per-role `pnpm dev:test:ui` (3110) / `dev:test:be` (3120) / `dev:test:qa` (3100) / `dev:test:ux` (3130) scripts |
| `3d2a933` | DevSecOps | `scripts/branch-start.mjs` (worktree-based) + `scripts/branch-cleanup.mjs` + `pnpm branch:start <role> <slug>` / `branch:cleanup` |
| `f31ae5f` + `06ed4c1` | BA | `<workspace>/requirements/` scaffold (INDEX, scope, glossary, open-questions, user-stories template + US-001 multi-phase-workflow-foundation) |
| `288c6c8` | UI Dev | Skill self-audit; filed #37 |
| `82eb900` | BE Dev | Skill self-audit; filed #38 |
| (HANDOFF only) | QA | Skill self-audit; filed #39 |
| `ead641e` | UX Designer | Shipped #34 (responsive design section) + #35 (motion subsection); filed #40 |

**4 new skill-proposal issues filed (queued for PO triage in next iteration):**
- #37 UI Dev — pre-HANDOFF unit testing (Vitest + testing-library for React)
- #38 BE Dev — pre-HANDOFF unit testing (Vitest for API routes + better-sqlite3 mocks)
- #39 QA — gate verification workflow + structured PASS/FAIL evidence format
- #40 UX Designer — gate verdict format (PASS / REVISE output template)

Common theme across #37–#40: the protocols are in place; what's missing is the OPERATIONAL templates (test patterns + evidence formats) that make each gate consistent and machine-readable. Natural next iteration.

**Open user-questions answered this wave:**
- "Feature branches?" → yes, confirmed.
- "Same filesystem dir for testing?" → resolved via worktrees on top of branches. Implementer creates `pnpm branch:start <role> <slug>` → worktree at `../apex-team-<role>-<slug>/` → `pnpm dev:test:<role>` runs that worktree's source on its own port + DB.

**How a real wave runs now (operational summary):**
1. User asks PO for a change.
2. PO dispatches Architect + UX Designer + BA in parallel — BA writes the user story under `requirements/user-stories/`.
3. PO dispatches UI Dev / BE Dev — each runs `pnpm branch:start <role> <slug>`, works in worktree, writes unit tests, runs `pnpm test:run`.
4. On their own PASS, implementer HANDOFFs to UX Designer (if UI) and then QA.
5. UX Designer reviews against design spec → PASS or REVISE.
6. QA spins up `pnpm dev:test:qa` from the implementer's branch → PASS or FAIL with evidence.
7. On both PASS, DevSecOps merges feature branch into main + pushes. The user's `pnpm dev` on :3000 picks up the change.

**Skill-proposal backlog (PO surfaces at next session start per their prompt):** #5, #6, #7, #10, #11, #12, #13, #14, #15, #16, #30, #36, #37, #38, #39, #40.

---

**Wave 9d UX Designer — Wave 8c retry + skill self-audit complete.**

- `src/lib/skills/ux-designer.ts` — added `### Responsive design` section (closes #34) + `#### Motion` subsection under `### Interaction states` (closes #35). Commit `ead641e`.
- Filed skill-proposal **#40** — "Gate verdict format — structured PASS/REVISE output for the UX design gate"
- Gap: critique workflow describes process but not the structured output artifact (PASS/REVISE verdict format DevSecOps + UI Dev act on). Proposal covers: PASS required fields (SHA, spec consulted, no-block confirmation, nit issues filed), REVISE required fields (blocking items with spec→delta→change, who receives HANDOFF), missing-spec path, port 3130 usage guidance.

**Awaiting:** PO triage of skill-proposals #37, #38, #39, #40.

---

**Wave 9d QA — skill self-audit complete.**

- Filed skill-proposal **#39** — "Gate verification workflow — evidence format and worktree setup protocol"
- Gap identified: `qa.ts` skills file has no guidance on worktree setup for gate verification or structured PASS/FAIL evidence format. Under `VERIFICATION_PHASE_PROTOCOL`, I return a gate verdict DevSecOps uses to decide merges. Without a template, output is free-form and inconsistent.
- Proposal covers: worktree setup (`pnpm branch:start qa <wave>-<short>`, feature branch checkout), port 3100 spin-up, AC checklist format, required PASS evidence fields (SHA, test output, per-AC table, Playwright snapshot for UI), required FAIL evidence fields (AC text, repro steps, severity, fix suggestion), fallback path when Playwright transport drops (#31).
- Also flagged: #30 (Playwright visual verification) should ship only if it includes a transport-drop fallback.
- No other gaps. AC-to-test traceability, edge-case enumeration, security patterns, defect filing are all solid.

**Awaiting:** skill-proposals #39, #38, #37 triage.

---

**Wave 9d BE Dev — skill self-audit complete.**

- Filed skill-proposal **#38** — "Pre-HANDOFF unit testing — Vitest patterns for Next.js API routes and SQLite service layer"
- Gap identified: `backend-developer.ts` skills file has zero testing guidance. Under `IMPLEMENTATION_PHASE_PROTOCOL`, BE Dev must write unit tests in `tests/be/` and pass `pnpm test:run` before HANDOFF to QA. Proposal covers: what to test per endpoint (validation, happy path, error propagation), how to mock `better-sqlite3`, how to test Next.js App Router handlers directly, and the pre-HANDOFF checklist.
- No other gaps. Worktree workflow (`pnpm branch:start backend-developer <slug>`) and isolated instance (`pnpm dev:test:be`, port 3120) are standard scripts already provisioned by DevSecOps. No-direct-push obligation is protocol awareness, not a skills gap.

**Awaiting:** skill-proposal #38 triage.

---

**Wave 9d UI Dev — skill self-audit complete.**

- Filed skill-proposal **#37** — "Pre-HANDOFF unit testing — Vitest + testing-library patterns for React components"
- Gap identified: `ui-developer.ts` skills file has no guidance on writing unit tests. Under `IMPLEMENTATION_PHASE_PROTOCOL`, UI Dev must write tests in `tests/ui/` and pass `pnpm test:run` before HANDOFF. The skill proposal covers: what to test (behavior/aria/keyboard flows), what not to test (CSS classes, snapshots), and the concrete pre-HANDOFF checklist.
- No other gaps. Worktree workflow (`pnpm branch:start`) and isolated instance (`pnpm dev:test:ui`) are standard CLI + existing scripts. UX HANDOFF-first + no-direct-push obligations are covered by existing protocol awareness.

**Awaiting:** Architect PASS for Wave 8e (commit `a41ef22`). Skill-proposal #37 triage.

---

**Wave 9c BA (retry) — US-001 updated to reflect resolved OQ-001 + worktree model. Commit `06ed4c1`.**

- `requirements/user-stories/US-001-multi-phase-workflow-foundation.md` — AC2 updated: explicitly references `pnpm branch:start <role> <slug>` + worktree path convention; Open Questions OQ-001 marked RESOLVED; impl links added for `5802292` + `3d2a933`.
- `requirements/INDEX.md` — US-001 summary updated to list all three impl SHAs.

**Previous Wave 9c BA — `f31ae5f`.**

- `requirements/open-questions.md` — OQ-001 marked RESOLVED: user confirmed feature branches + git worktrees. Decision and DevSecOps Wave 9c implementation (`3d2a933`) documented.
- `requirements/glossary.md` — added `ADR` and `Worktree` entries (22 terms total).
- `requirements/INDEX.md` — updated summaries for glossary + open-questions.

**No new open questions. No skill gaps beyond skill-proposal #36 (already filed).**

---

**Wave 9c DevSecOps — worktree-based per-role isolation. Commit `3d2a933`.**

- `scripts/branch-start.mjs` — rewritten: now takes `<role> <wave>-<short>`; uses `git worktree add` → creates `../apex-team-<role>-<short>/` on `feature/<slug>` from `origin/main`; role validated against `VALID_ROLES`; worktree path collision check; branch duplicate check; per-role next-steps in output.
- `scripts/branch-cleanup.mjs` (NEW) — removes worktree + deletes merged feature branch; refuses if uncommitted changes in worktree.
- `package.json` — added `branch:cleanup` script.
- `README.md` — "Worktree workflow" subsection added under "Per-role isolated work".
- `ops/README.md` — branch creation + per-role workflow sections updated to reflect worktrees.
- `pnpm type-check` clean.

**Skills audit:** no new skills needed — `git worktree` is standard CLI.

**Previous: Wave 9b DevSecOps — per-role isolated dev instances + branch-start helper. Commit `5802292`.**

---

**Wave 9b BA — requirements/ scaffold complete. Commit `c693fc0`.**

- `requirements/scope.md` — full 8-role, MCP, ADR-002 phased workflow, constraints table
- `requirements/glossary.md` — 20 canonical terms (AC, gate, instance, PASS/REVISE/FAIL, feature branch, spec, story, protocol, skill, and existing terms)
- `requirements/open-questions.md` — OQ-001: feature-branch vs worktree vs clone isolation (awaiting user decision)
- `requirements/user-stories/_TEMPLATE.md` — story template per ADR-002 format
- `requirements/user-stories/US-001-multi-phase-workflow-foundation.md` — inaugural story; status in-dev; 6 ACs; impl links to `2a81587` + `a8fab5d`
- `requirements/INDEX.md` — updated to list all 5 docs

**Skill self-audit:** filed skill-proposal #36 — BA consultation-hub guidance (responding to peer HANDOFF requirements queries). No other gaps identified.

**HANDOFF to PO + Architect:** scaffold is live; implementation waves can now gate on story docs.

**Open question for user (OQ-001):** Feature branches vs git worktrees vs separate clones for implementer isolation — see `requirements/open-questions.md`. Awaiting user decision before DevSecOps finalizes provisioning scripts.

---

**Wave 9b — Mandatory phased workflow encoded. Commit `2a81587` on main.**

`src/lib/protocols.ts` (NEW):
- `REQUIREMENTS_PHASE_PROTOCOL` — PO convenes Arch + UX + BA before any implementer
- `IMPLEMENTATION_PHASE_PROTOCOL` — feature branches, isolated dev instances, local unit tests before HANDOFF
- `VERIFICATION_PHASE_PROTOCOL` — UX PASS before QA; QA on `:3100` against BA ACs
- `DEPLOYMENT_PHASE_PROTOCOL` — DevSecOps sole merge/push authority; never push from implementer
- `CONSULTATION_PROTOCOL` — any role HANDOFF BA for requirements clarification
- `SKILLS_SELF_ENRICHMENT_PROTOCOL` — skill-proposal / mcp-proposal issue flow + mcpmarket.com search

`architecture/decisions/ADR-002-multi-phase-workflow.md` (NEW): documents phased model, per-role gate ownership, isolation rationale, skills self-enrichment, ADR-001 compatibility.

`architecture/INDEX.md` (NEW): doc index for architecture/.

`src/lib/roles.ts` (MODIFIED):
- Imports all 6 protocol constants from `./protocols`
- `PHASED_WORKFLOW_DISCIPLINE` constant appended to `PEER_PROTOCOL` → flows into all 7 peer system prompts
- `ORCHESTRATOR_PROTOCOL` updated: Requirements phase mandatory (Arch+UX+BA first), Implementation wave (BA story required), Verification wave (UX before QA), Deployment wave (DevSecOps only)
- QA: "Deployment-gate verification" section — must use `:3100`, never PASS on code inspection alone
- UX Designer: is the design gate for all UI changes before QA proceeds
- DevSecOps: sole merge-to-main + push authority called out explicitly via `PHASED_WORKFLOW_DISCIPLINE`

**Downstream HANDOFFs sent:** BA, DevSecOps, all 6 peers (skill assessment ask).

**Ambiguity flagged to user:** "their own source code" interpreted as **feature branches** (not git worktrees / separate clones). ADR-002 §Consequences calls this out explicitly. Awaiting user confirmation if stronger isolation is desired.

---

**Wave 9a — Deployment-gate policy encoded. Commit `a8fab5d` on main.**

`src/lib/roles.ts` changes:
- `DEPLOYMENT_GATES_PROTOCOL` constant (exported) — canonical policy spec
- `GATE_DISCIPLINE` paragraph appended to `PEER_PROTOCOL` → flows into all 7 peer system prompts
- `ORCHESTRATOR_PROTOCOL` — "At the END of any wave" rule: QA at wave close, UX Designer before QA if UI touched; never declare wave done without QA PASS
- QA system prompt — new "Deployment-gate verification" section: must run `pnpm dev:test` on `:3100`, never PASS on code inspection alone
- UX Designer step 6 — explicit design gate: PASS/REVISE with severity list, HANDOFF to both implementer and QA
- Architect code review step 6 — PASS explicitly named as design gate for non-UI changes

Policy sharpening notes filed in reply.

---

**Hotfix on top of QA 8f.** `/api/agent-state` + `/api/chat` route-level Zod `RoleEnum` did NOT include `ux-designer`, so adding the 8th role broke `/`'s `refreshStates` — Zod rejected the role param → response shape lacked `pendingInbox` → `Cannot read properties of undefined (reading 'length')` runtime crash on page.tsx:172. Also added defensive `?.pendingInbox?.length ?? 0` for resilience. Triple-checked all hardcoded RoleEnums (3 copies — agent-state, chat, mcp/tools.ts) and the `agents` object schema in `/api/chat` BodySchema; all now include `ux-designer`. The 3-copy duplication is a code-smell carried over from before — flagged as a refactor candidate but not done now. Closes the dashboard 500 + the `/` crash.

**Hygiene:** Added `.playwright-mcp/` to `.gitignore` and removed the 2 console/snapshot artifacts that QA accidentally committed. These are per-turn dump files, not source of truth.

**QA — Wave 8f complete.** Code + live browser verification of Wave 8e fixes + po-dispatch hotfix. New smoke test file `tests/smoke/po-dispatch.test.ts` (2 tests). `pnpm test:run` 8/8. Commit `6c804ab`.

**Wave 8f QA findings — all PASS:**
- #21 QUEUED keyboard reorder: boundary guards, localStorage persist, flash, aria-live, focus-follows — all confirmed in code + browser snapshot shows `aria-label` with position hint ✓
- #24 Expandable error pill: both views have `title={pillLabel}`; error-only click handler + `aria-expanded`; detail block renders `{status}` verbatim; Escape + outside-click dismiss ✓
- `8fecea0` po-dispatch fire-and-forget: no `await`, `.catch(console.error)`, immediate 202 with `{ok,accepted,issueNumbers}` ✓

**Browser snapshot (http://localhost:3000/dashboard):**
- All 8 roles in CONTEXT panel ✓
- QUEUED item aria-label includes "Use arrow keys to reorder" ✓
- Console error: harmless 404 favicon.ico (nit — not filed)
- No WORKFLOW panel (removed `fb7e0f4`) ✓

---

**UI Dev — Wave 8e complete.** QUEUED keyboard reorder (#21) + expandable error pill (#24). Commit `a41ef22`.

**Wave 8e UI Dev changes:**
- `src/app/dashboard/page.tsx` — `useRef` added to imports; `flashedRowId`, `liveMsg`, `queuedRowRefs` added; `moveQueued(fromIdx, dir)` + `queuedRowKd(idx, itemId)` helpers; QUEUED rows now respond to ArrowUp/Down for reorder (same localStorage persistence as DnD); `aria-live` region announces "Moved to position N of M"; `.row-flash` CSS (200ms background flash); `.sr-only` CSS.
- `src/components/AgentPane.tsx` — `errorExpanded` state + `errorDetailRef`; Escape + outside-mousedown close handlers; pill in both folded + expanded view gets `title={pillLabel}` (Tier 1 hover tooltip); in error state pill gets `cursor:pointer` + `onClick` toggle + `aria-expanded`; inline error detail block renders below header when expanded (left border in role accent, monospace body, full error text); CSS for `.pill-error-btn`, `.pill-open`, `.error-detail*`.
- `pnpm type-check` clean.

**Awaiting:** Architect PASS for Wave 8e.

**Hotfix on top of Wave 8e:** `/api/po-dispatch` made fire-and-forget. Endpoint was awaiting `runTurnWithDispatches`, which for a 10-issue batch is 5+ minutes — the browser saw "Sending…" indefinitely and the HTTP transport timeout aborted the in-flight PO turn via `req.signal`. Now returns 202 immediately after kicking off the turn detached; bus events drive the UI. Closes user-reported "selections keep getting ignored."

**Removed: Workflow panel.** User feedback: not useful — comparison against a hardcoded "canonical chain" (PO→BA→UX→UI Dev→UX→QA→DevSecOps) is misleading because (a) the chain was something I made up from a passing user comment, not enforced by the system; (b) the only auto-trigger source is PO, peer-to-peer HANDOFFs don't trigger turns; (c) the visualization sprawled across an entire long-lived thread, washing out signal. Deleted: WORKFLOW section in `dashboard/page.tsx`, `wfStatus`/`expandedWfStep`, all `.wf-*` CSS, `/api/workflow/route.ts`, `WorkflowEdge` + `WorkflowResponse` types. Parked for future: per-instruction segmented view if/when a meaningful comparison spec is defined.

---

**UI Dev — Wave 8d complete.** WORKFLOW panel on dashboard. Commit `04a5f7c`.

**Wave 8d UI Dev changes:**
- `src/app/dashboard/page.tsx` — added `WorkflowResponse` import; `workflow` + `expandedWfStep` state; 10s visibility-aware poll for `/api/workflow`; `wfStatus()` helper for loose match/out-of-order/extra classification; WORKFLOW panel at top of grid (span-2) with Expected row, Actual row (per-step ✓/! marks + ×N badge), mismatch sentence, click-to-expand edge sub-list; CSS for `.wf-*` classes; `workflow` added to `PANEL_INFO`.
- `pnpm type-check` clean.

**Awaiting:** Architect PASS for Wave 8d.

---

**UI Dev — Wave 8c complete.** Poll error banner for issue #22. Commit `2f49c14`.

**Wave 8c UI Dev changes:**
- `src/app/dashboard/page.tsx` — added `fetchError` state; `.catch(() => {})` → `.catch(() => setFetchError(true))`; `.then(d => ...)` chains `setFetchError(false)` on success; `{fetchError && <div className="poll-error">…</div>}` banner below OrchestratorBar; `.poll-error` CSS rule added. Closes #22.
- `pnpm type-check` clean.

**Awaiting:** Architect PASS for Wave 8c.

---

**BE Dev — Wave 8b complete.** `src/app/api/workflow/route.ts` + types shipped. Commit `36bb6ec`.

**Wave 8b shipped:**
- `src/types.ts` — added `WorkflowEdge` + `WorkflowResponse` interfaces
- `src/app/api/workflow/route.ts` — NEW: `GET /api/workflow?threadId=<id>`. Iterates `listMessages`, maps `user`/`dispatch`/`handoff` author kinds to edges, collapses consecutive same-destination edges into `steps`, returns `expected` canonical chain. Capped at last 200 messages. Empty thread returns `{ edges: [], steps: [], expected: [...] }` — no 500.
- `pnpm type-check` clean.

**Next:** UI Dev consumes `/api/workflow` for the Workflow panel.

---

**State (prior). Wave 8a complete.**

**UX Designer — What I own:** Design specs (`<workspace>/design/`), UI/UX critique after each UI Dev wave, design-system token decisions. I do NOT write code — I write specs that UI Dev implements against.

**State.** Wave 8a complete. UX Designer introductory turn done — `design/INDEX.md` created with design notes for top-3 open UX issues (#22, #24, #21). Two skill-proposal issues filed (#34, #35).

**UX Designer Wave 8a intro — commit `fe29cf1`.**
- `design/INDEX.md` — created; design spec notes for issues #22 (poll error feedback), #24 (error pill expand), #21 (QUEUED keyboard reorder)
- `#34` filed: `[skill:ux-designer] Add responsive/breakpoint design section`
- `#35` filed: `[skill:ux-designer] Add motion/animation guidance to interaction-states section`

---

**State (prior).** Wave 8a UI Dev complete — ux-designer role rendered in both pages. Commit `15e57b1`.

**Wave 8a UI Dev changes:**
- `globals.css` — `--accent-uxd: #bf6dff` (violet)
- `src/app/page.tsx` — `ux-designer` added to `ALL_ROLES`, `TEAM_ROLES`, `ROLE_META` (accent: uxd, title: "UX Designer"); 7-peer team grid now 7 cards (3+3+1 at 3-col)
- `src/app/dashboard/page.tsx` — `ux-designer` added to `ROLE_ACCENT` + `ROLES`
- `AgentPane.tsx` / `AgentStatePanel.tsx` — no changes needed (role-agnostic)
- `pnpm type-check` clean

**Awaiting:** Architect PASS for Wave 7e + Wave 8a.

---

**State (prior).** Wave 7d retry QA complete. Wave 7e UI Dev awaiting Architect PASS.

**Wave 7d retry QA — code-analysis + curl. Playwright MCP still not available in direct Claude Code session.**

Confirmed FIXED (by code inspection):
| Fix | Issue | Evidence |
|---|---|---|
| `--accent-orch: #e0af68` defined | #19 | `globals.css:20` ✓ |
| MessageBubble `max-width: 820px` | #28 | `MessageBubble.tsx:151` ✓ |
| OrchestratorBar on dashboard | #23 | `dashboard/page.tsx:251` ✓ |
| OrchestratorBar tabs: border+padding+hover+active+focus ring | — | `OrchestratorBar.tsx:129-146` ✓ |

Wave 7e collapsible MessageBubble (`49cd73f`) — code review passed:
- `getPreview()` min(6 lines, 400 chars) logic correct
- `useState(!isLong)` correctly starts long messages collapsed
- Streaming/pending messages stay expanded (mount when short → stays expanded) ✓
- Click-expand with link guard, double-toggle prevention (stopPropagation on CTA) ✓
- `aria-expanded` on outer div, `:focus-visible` on CTA ✓
- Nit: `bubble-fade` gradient uses `var(--surface)` but peer/handoff bubbles use `var(--surface-2)` — noted in code comment, acceptable

`pnpm test:run`: 6/6 ✓  `pnpm type-check`: clean ✓

No new issues filed — all known defects already tracked (#20, #21, #22, #24, #25, #26).

**Wave 7e UI Dev changes:**
- `MessageBubble.tsx` — per-bubble collapse state; default collapsed when >400 chars; `getPreview()` takes min(6 lines, 400 chars); gradient fade overlay; "Show more / Collapse ▴" CTA; outer div `role="button"` + `aria-expanded` + Enter/Space toggle when collapsed; `bubble-fade` for gradient; `:focus-visible` ring on CTA.

**Awaiting:** Architect PASS for Wave 7e.

---

**Wave 7d UI Dev complete — commit `2d56050`. `pnpm type-check` clean.**

**Wave 7d UI Dev changes:**
- `globals.css` — defined `--accent-orch: #e0af68` (closes #19; logo and AgentStatePanel styling now visible)
- `MessageBubble.tsx` — `max-width: 820px` on `.bubble` (closes #28; PO pane text no longer spans full viewport)
- `OrchestratorBar.tsx` — sep divider between brand and nav-tabs; tabs restyled: `6px 16px` padding, `13px`, `font-weight: 700` active, tinted background on active, `:focus-visible` ring

**Wave 7d QA — code-based UI/UX audit + smoke test regression fix.** `pnpm test:run` 6/6. Pushed to origin/main.

**Important limitation:** `mcp__playwright__browser_*` tools are only mounted when running as an apex-team agent turn (via the turn runner), NOT in a direct Claude Code session. This turn used code analysis + live API calls instead of browser snapshots.

**New issues filed:**
| # | Severity | Summary |
|---|---|---|
| #28 | warn | `[ux:agent-pane]` PO pane no max-width → full-viewport line length on wide monitors |
| #29 | **block** | `[qa]` Smoke test Test 1 always fails — `"ok":true` check vs `"status":"ok"` response (FIXED in this commit) |
| #30 | — | `[skill:qa]` skill-proposal: Add visual verification via Playwright MCP section |

**User-reported issues validated by code analysis:**
| Claim | Verdict | Evidence |
|---|---|---|
| PO pane full-viewport width | ✓ CONFIRMED | `MessageBubble:84` `max-w-none`, `page.tsx:500-502` no max-width on `.po-area` |
| Team/Dashboard tabs invisible | ✗ NOT confirmed | `OrchestratorBar` tabs have border + active state (`--accent-po` background). BUT logo `⌬` is invisible because `--accent-orch` undefined (#19) |
| AgentPane auto-fold not working | ✗ NOT confirmed | Lines 117–125 implement 60s idle fold + busy auto-expand. Working in code. |
| Logo styling broken (#19) | ✓ CONFIRMED | `globals.css` has no `--accent-orch`; used in OrchestratorBar:119 and 5× in AgentStatePanel |
| Click-once on Issues panel | ✗ FIXED | `e561885` switched to `sendingRows: Set<number>` per-row; per-row buttons independent |
| Dashboard loads at all | ✓ CONFIRMED | `/api/team-status` and `/api/active-thread` both return correct data |

**Smoke test regression fixed (commit `744ef9e`):**
- `tests/smoke/http.sh:67` — changed `'"ok":true'` → `'"status":"ok"'`; also added `mcpMounted:true` check
- `tests/smoke/api.test.ts` — NEW: 2 Vitest unit tests for `/api/health` response shape (regression guard for issue #29)
- `pnpm test:run`: 6/6 passing (was 4/4; +2 new API shape tests)

**Carry-forward coverage gaps (unblocked, not yet written):**
- Health degraded path with wrong `APEX_MCP_URL` — now covered in `api.test.ts` ✓
- `agentModels` unknown-key filter in run-turn.ts — deferred
- AgentPane: Other… model selection regression — deferred
- EventSource single-connection on fresh load — deferred
- #22: dashboard poll error feedback — open issue, no test written (would require component test)

**Wave 7c UX audit — full findings (9 issues across all files):**

**Wave 7c UI Dev `e561885` — PASS.**
Delivered: OrchestratorBar on dashboard (workspace input), inline model select in Context, per-row `sendingRows` dispatch (concurrent). `pnpm type-check` clean.

**Wave 7c UX audit — full findings (9 issues across all files):**

| Issue | Severity | File:line | Status |
|---|---|---|---|
| #19 | warn | `OrchestratorBar.tsx:119`, `AgentStatePanel.tsx:119` | **open** — `--accent-orch` undefined, logo/panel styling broken |
| #20 | warn | `AgentStatePanel.tsx:122` | **open** — `all:unset` on toggle removes focus ring |
| #21 | warn | `dashboard/page.tsx` QUEUED panel | **open** — DnD no keyboard alternative |
| #22 | warn | `dashboard/page.tsx:132` | **open** — poll errors silently swallowed |
| #23 | warn | `dashboard/page.tsx` | **CLOSED** — fixed in `e561885` (OrchestratorBar added) |
| #24 | warn | `AgentPane.tsx:432-439` | **open** — error pill truncated 120px, no expand path |
| #25 | warn | `dashboard/page.tsx:230` | **open** — `"Endpoint building… (Wave 6b BE Dev)"` dev note in notReady |
| #26 | warn | `dashboard/page.tsx:83-88` | **open** — active-thread only fetched on mount, no 4s re-poll |
| #27 | — | `dashboard/page.tsx` | **CLOSED** — fixed in `e561885` (per-row sendingRows) |

**UX process change:** Starting this wave, every code review includes an explicit UI/UX rubric pass as a distinct step. For any wave touching UI files, I will apply the 5-point rubric (density, feedback latency, error visibility, keyboard a11y, zero-states) and file `[ux:*]` issues for every finding — not bundled as informal notes. Gate verdicts will cite UX issues explicitly.

**All wave gate verdicts:**
- Wave 6e UI Dev `4c0b1d9` — **PASS**
- Wave 7a UI Dev `9ca54dc` — **PASS**
- Wave 7b BE Dev `4ca6b43` — **PASS**
- Wave 7b UI Dev `23c089a` — **PASS** (expandable rows + tooltips + model badge)
- Wave 7c UI Dev `e561885` — **PASS** (nav + model select + per-row dispatch)

**Wave 7a shipped:**
- `src/app/api/po-dispatch/route.ts` — `POST /api/po-dispatch` (BE Dev, `d598c3e`)
- `src/app/dashboard/page.tsx` — Issues panel dispatch affordances (UI Dev, `9ca54dc`)

**Wave 7a shipped:**
- `src/app/api/po-dispatch/route.ts` — NEW: `POST /api/po-dispatch`. Body: `{ threadId, issueNumbers: number[], workspace? }`. Fetches each issue via `gh issue view --json`, constructs a PO message, calls `runTurnWithDispatches` targeting `product-owner`, returns `{ ok, dispatched, issueCount }`. Long-running (30–60s); no timeout. Bus events stream live. (BE Dev, `d598c3e`)
- `src/app/dashboard/page.tsx` — Issues panel enhanced: per-row checkbox multi-select, per-row "→ PO" instant-dispatch button, multi-select sticky footer with send/cancel, in-flight spinner, success toast with Team link, error banner with retry. All states account for `dispatchState: idle|sending|success|error`. (UI Dev, `9ca54dc`)

**Wave 6 complete (all on origin/main):**

**Wave 6 shipped (all on origin/main):**

| Commit | Stream | What |
|---|---|---|
| `4c0b1d9` | UI Dev | fix(dashboard): align panel shape with `/api/team-status` — closes #17 |
| `7291391` | UI Dev | `/dashboard` 9 panels + QUEUED HTML5 drag-drop prioritization + AgentPane auto-fold (60s idle) + OrchestratorBar Team/Dashboard tabs + UI/UX self-review skill in `ui-developer.ts` |
| `2e55fa2` | Architect | `/api/team-status?threadId=<id>` — 9-panel JSON, safe defaults |
| `70fff8e` | BE Dev | Token-usage capture in `providers.ts` + `turn_usage` table + `src/lib/pricing.ts` (per-model $/MTok incl. cache) |
| `e29755f` | BE Dev | Scout DB helpers + PO prompt Parts C/E/F + `skill-scout.mjs` (opt-in; needs API key not currently set) |
| `4f39199` | DevSecOps | Scout pivot — drop GH-Actions cron (no `ANTHROPIC_API_KEY`); PO has weekly scout-cadence prompt; `.env.local.example` + README updated |

Wave 6a fired 6 parallel role scouts + Architect MCP scan; produced 12 `skill-proposal` / `mcp-proposal` issues.

**Wave 6d review verdict:** PASS overall. Block (#17, fixed). Two carry-forward warns:
- `.env.local.example` comment "ANTHROPIC_API_KEY not used" is incorrect — `skill-scout.mjs` does use it.
- `skill-scout.mjs:58-89` empty `tool_result` error path unvalidated.

**Open issue backlog (PO triages on session start per `roles.ts` opener):**
- `self-improvement` open: #4 (page.tsx mount race warn).
- `skill-proposal` open from wave 6a: #5–#7, #9–#16.
- `mcp-proposal` open: #8 (microsoft/playwright-mcp).

**Open next-steps (priority order):**
1. PO surfaces the skill-proposal backlog at next session start and proposes 2–3 to schedule.
2. Verify BA-capture loop end-to-end: send a feature-ask via `talk_to_product_owner`; inspect `<workspace>/requirements/` for the new capture.
3. Verify token-spend panel populates after first new agent turn (capture in `providers.ts` is wired but unverified live).
4. Fix the two carry-forward warns from Wave 6d.
5. Eventually: graceful-restart enhancement so `.restart-trigger` doesn't kill mid-turn agents (currently acceptable trade since the team owns when to touch it).

**Parked (carry forward):**
- SDK-native `skills: ['code-review']` for Architect / `['verify']` for QA (Wave 3 of original plan).
- LLM-driven inbox watcher; thread list / resume sidebar; client-side abort button.
- Streaming-input mode for Claude Agent SDK.
- CI pipeline, Dependabot/Renovate — future wave.

**User context:** session focus is **apex-team self-improvement only**. User will run apex-team on a second Mac (20x Claude subscription there; 5x here). No `ANTHROPIC_API_KEY` — cron features deliberately not built; team agents use Claude Code OAuth.

**Repo:** https://github.com/keyan-commits/apex-team

**Resume commands:**

```bash
cd /Users/nikoe/Development/Study/apex-team
pnpm dev:supervised                       # http://localhost:3000  + MCP at /mcp  (supervisor watches .restart-trigger)

# in another shell, if not already running:
cd /Users/nikoe/Development/Study/apex-engine && pnpm setup

# register apex-team's MCP with your Claude Code (once per machine):
claude mcp add apex-team --transport http http://localhost:3000/mcp
```

---

## 2026-05-31 — afternoon: event-bus refactor + skills wave-1 start

Option-(b) refactor that gives every thread a single SSE delivery channel. MCP-driven and UI-driven turns now publish identical events through `event-bus.ts`; the browser opens one long-lived `EventSource` per thread via `/api/thread-events`. `/api/chat` lost its SSE response — it just kicks off `runTurnWithDispatches` and returns. PO dispatches now fan out **in parallel** (matches user's preference; was sequential under MCP path). Bus keyed on `globalThis` to bridge tsx-loaded MCP modules and Next-bundled routes. `mcp-config.ts` extended with built-in tool allowlist so headless team agents can do real work. Tried `tsx watch` for autonomous restarts — reverted; agents editing source kill themselves. Wave 1 (skills) started: Architect committed the bus refactor as `9a6f6a4`, then half-finished the skills feature before tsx watch interrupted.

## 2026-05-30 → 2026-05-31 — initial build + parallel rework + Claude CLI embed (now superseded)

---

## Session — 2026-05-30 → 2026-05-31 — initial build + parallel rework + Claude CLI embed (now superseded)

**One long session that produced the v1 MVP**, then a structural redesign to the v2 team-of-7 + MCP-driven model. v1 arcs preserved here for context:

### v1 — initial build (now superseded)
1. Scaffold (Next.js 15, Claude Agent SDK, apex-engine MCP wired) — 2 roles (BA + Dev), serial handoff relay.
2. Parallel-agent rework: per-agent `agent_state` table; `[[NOTES]]` + `[[HANDOFF: role]]` blocks; async inbox; per-pane busy + composer.
3. Role-ownership tightening: BA owns functional reqs, Dev escalates business-logic questions.
4. Auto routing classifier (`/api/route-task` via Claude Haiku 4.5) for the OrchestratorBar dropdown.
5. SDK-orchestrator agent: third role with `[[DISPATCH: role]]` auto-trigger. **Wrong abstraction** — user wanted real Claude Code, not a simulation. Pivoted away.
6. Embedded real `claude` CLI in top pane via node-pty + xterm.js + WebSocket PTY. Worked, but then…
7. node-pty gotcha: pnpm strips +x from `spawn-helper`; opaque `posix_spawnp failed.`. Fixed via postinstall chmod script.
8. Shared workspace field — top bar input flowing to PTY spawn cwd + agents' `query() cwd`. Persisted in localStorage.
9. `git init` + `/handoff-init` + initial commit (`1167b3a`) + push to private `keyan-commits/apex-team`.
10. Dependabot patch — postcss `>=8.5.10` via pnpm override (CVE-2026-41305).

### v2 — team-of-7 + MCP-driven (THIS session's structural redesign)
- Embedded `claude` CLI removed entirely (with all its xterm/node-pty/ws machinery).
- apex-team becomes its own MCP server (`src/mcp/` + `/mcp` endpoint).
- Roles expand from 2 → 7: PO replaces the SDK-orchestrator concept; Developer splits into UI Dev + Backend Dev; Architect picks up code reviews (was QA's lane in BMAD v1, now Architect's); QA narrows to testing; DevSecOps added.
- BA's spec persistence becomes a file-based `<workspace>/requirements/` directory (BA creates + maintains).
- Architect owns `<workspace>/architecture/`; DevSecOps owns `<workspace>/ops/`.

### Caveats carried forward
- Claude Agent SDK's `mcp__apex-engine__<tool>` allowlist naming still unverified in practice — open next-step #3.
- Non-Claude providers (Gemini/Groq) don't accept a `cwd`. They see workspace in their system prompt but can't read files there.
- `messages.author.kind` includes `dispatch` (PO → peer) AND `orchestrator` (system note). Both render but `orchestrator` notes are rare in v2.
- Block parsing is regex-based; malformed blocks render as visible text.
- Inbox is implicit (last-agent-turn cursor); processing the inbox without a reply still marks items "seen".
