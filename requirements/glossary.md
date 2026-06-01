# Glossary

_Owned by Business Analyst. Last updated: 2026-06-01._

Terms are listed alphabetically. A term used two ways is a bug in the spec — flag and correct immediately.

| Term | Definition |
|------|-----------|
| **AC (Acceptance Criterion)** | A single testable condition that defines when a user story is done. Must be independently verifiable. Format: Given / When / Then. |
| **ADR (Architecture Decision Record)** | A document in `architecture/decisions/` recording a significant architectural choice, its rationale, and consequences. Referenced by story ACs when a decision constrains implementation. |
| **AUTO-CONTINUE** | The synthetic message tag prepended to a tick invocation: `[[AUTO-CONTINUE tick=N inflight=<n> idle-peers=<csv> backlog=<n>]]`. Kind: `user`, so it appears as a user trigger in history. Distinguishes server-scheduled ticks from human-initiated `talk_to_product_owner` pings. PO uses terse dispatch-only reply mode on AUTO-CONTINUE; verbose reply mode on user pings. See US-026 AC2. |
| **CONSULT_BA** | The mandatory HANDOFF a working role emits to Business Analyst before writing code, tests, or config when any acceptance criterion or business term is unclear, ambiguous, or contradicts the codebase (BR-004, US-025). Silent guessing on business intent is forbidden. BA replies with: clarification + promote-to-MD + HANDOFF back with permission-to-proceed. A consult-BA HANDOFF counts as non-idle activity for IDLE_INVARIANT purposes. |
| **DISPATCH** | Orchestrator-to-team channel. Auto-triggers the target role's turn. Used only by Product Owner. |
| **FAIL** | Gate verdict returned by QA or UX Designer indicating a change did NOT meet the required standard. Includes evidence and specific defect list. Implementer must revise before DevSecOps merges. |
| **Feature branch** | A git branch created from main for one implementation wave, named `feature/<wave>-<short>`. Implementers (UI Dev, BE Dev) work here; DevSecOps merges to main after QA + UX PASS. |
| **Gate** | A mandatory quality checkpoint that must return PASS before the next phase begins. The three gates are: (1) UX Designer for UI changes, (2) QA for all changes, (3) Architect for non-UI design. |
| **HANDOFF** | Peer-to-peer async channel. Lands in the target role's inbox; does NOT auto-trigger their turn. Used by all non-PO roles. Format: `[[HANDOFF: role-id]] … [[/HANDOFF]]`. |
| **IDLE_INVARIANT** | The rule that no agent may be IDLE while the apex-team backlog has open issues (BR-003, US-024). Enforced at the protocol level by Wave 69 and at the runtime level by the tick scheduler (Wave 71, US-026). The only legitimate idle state is backlog = 0 AND no in-flight work. |
| **Instance** | A running copy of the apex-team server bound to a port with its own DB. Live instance = `:3000` (user-facing). QA instance = `:3100`. UI Dev isolated = `:3110`. BE Dev isolated = `:3120`. |
| **Lane A** | The requirements and design lane: Product Owner + Business Analyst + Architect + UX Designer. While Lane B implements the current wave, Lane A pre-stages the next wave's user story, NFR design, and UI spec. Lane A idle + backlog > 0 = a PO breach (BR-002). See US-023. |
| **Lane B** | The implementation, verification, and deploy lane: UI Developer + Backend Developer + QA + DevSecOps. Lane B is active while Lane A pre-stages the following wave. Lane A and Lane B pipeline concurrently — NOT serial. See US-023. |
| **NO_OP_THROTTLE** | Geometric backoff applied when PO emits zero `[[DISPATCH:]]` blocks on K consecutive ticks (K = 3). Each no-op doubles the tick delay (base 20s → 40s → 80s → pause); after K no-ops the scheduler pauses entirely. Resets to base cadence on the next tick that emits ≥1 DISPATCH. Prevents runaway ticking when all signals are genuinely clear. See US-026 AC3. |
| **NOTES** | A role's self-update block that overwrites its persistent working-state doc in the DB. Format: `[[NOTES]] … [[/NOTES]]`. |
| **PASS** | Gate verdict returned by QA or UX Designer indicating a change meets all requirements. Required before DevSecOps merges to main. |
| **Pane** | One role's UI panel in the dashboard — includes composer, message stream, HANDOFF doc viewer, and inbox badge. |
| **Protocol** | A named constant in `src/lib/protocols.ts` encoding a mandatory workflow rule. Injected into every role's system prompt. Examples: `REQUIREMENTS_PHASE_PROTOCOL`, `DEPLOYMENT_PHASE_PROTOCOL`. |
| **REVISE** | Gate verdict from UX Designer indicating a UI change has spec deviations that must be corrected before QA proceeds. Includes a concrete list of required changes. |
| **Skill** | A domain-expertise block appended to a role's system prompt from `src/lib/skills/<role>.ts`. Skills define HOW a role does its job; protocols define WHAT phases they follow. |
| **Skills injection** | The mechanism that appends a role's skill block to its system prompt at turn time (via `src/lib/agents.ts`). |
| **Spec** | A design specification document in `<workspace>/design/` produced by UX Designer. Defines UI layout, interaction states, copy, and breakpoints. Referenced by UI user stories. |
| **Story** | A user story file in `requirements/user-stories/US-XXX-<slug>.md`. Documents one user goal with acceptance criteria, status, owner, and links to impl/test/design. |
| **Story ID** | Unique identifier for a user story. Format: `US-NNN`. Assigned by BA. Referenced by every implementation wave commit. |
| **Thread** | A conversation session scoped by `thread_id`. Each role maintains its own state + history per thread. |
| **TICK** | A server-side re-invocation of the PO turn loop triggered while any non-clear team signal exists (peer inbox > 0, open PR, backlog > 0). Implemented as a **self-rescheduling `setTimeout` chain** (NOT `setInterval`) per thread in `src/lib/tick-scheduler.ts`. Cadence is **adaptive 20–120s**: base interval 20s; doubles after each no-op tick (NO_OP_THROTTLE), capped at 120s before the scheduler pauses. Resets to 20s on any tick that emits ≥1 DISPATCH. See US-026 AC1. |
| **TICK_BUDGET** | Per-thread per-hour token/cost ceiling for autonomous ticking. Budget tracked via `getThreadSpendSince(threadId, sinceMs)` against the existing `turn_usage` table (NOT a separate budget table — avoids #140 schema-drift). Ticks pause when budget is exceeded (in-flight call finishes first); resume after the next clock-hour rollover. Default: 500K tokens/thread/hour (override: `APEX_TEAM_TICK_BUDGET_PER_HOUR=N`). See US-026 AC6. |
| **Turn** | One LLM call for a role — loads state + history + inbox, runs the model, persists NOTES / HANDOFF / DISPATCH blocks. |
| **Wave** | A named batch of parallel implementation tasks dispatched by PO in one orchestration turn. Example: "Wave 9b — Foundation work". |
| **Worktree** | A separate working directory created via `git worktree add`, sharing the same `.git` object store as the main checkout. Used to give each implementer (UI Dev, BE Dev, QA, UX Designer) physical filesystem isolation while keeping a single repo. Created by `pnpm branch:start <role> <slug>`; removed by `pnpm branch:cleanup`. |
| **Workspace** | The directory on disk that agents' file tools (Read, Edit, Write, Bash) target. Configured in the top bar and persisted in `localStorage`. |
| **WORKSPACE_REPO** | The `owner/repo` string for the active workspace's GitHub remote. Derived by `deriveGithubRepo(cwd)` from `git -C <cwd> remote get-url origin`, then parsed. Injected into every role's system prompt per turn by `src/lib/providers.ts` `augmentSystemPrompt()` (cached per-cwd to avoid per-turn subprocess overhead). PO uses it as the `--repo` target for mandatory issue filing (BR-001). Aliases: "workspace repo", "active repo". See AC2 of US-022. |
