# Glossary

_Owned by Business Analyst. Last updated: 2026-05-31._

Terms are listed alphabetically. A term used two ways is a bug in the spec — flag and correct immediately.

| Term | Definition |
|------|-----------|
| **AC (Acceptance Criterion)** | A single testable condition that defines when a user story is done. Must be independently verifiable. Format: Given / When / Then. |
| **ADR (Architecture Decision Record)** | A document in `architecture/decisions/` recording a significant architectural choice, its rationale, and consequences. Referenced by story ACs when a decision constrains implementation. |
| **DISPATCH** | Orchestrator-to-team channel. Auto-triggers the target role's turn. Used only by Product Owner. |
| **FAIL** | Gate verdict returned by QA or UX Designer indicating a change did NOT meet the required standard. Includes evidence and specific defect list. Implementer must revise before DevSecOps merges. |
| **Feature branch** | A git branch created from main for one implementation wave, named `feature/<wave>-<short>`. Implementers (UI Dev, BE Dev) work here; DevSecOps merges to main after QA + UX PASS. |
| **Gate** | A mandatory quality checkpoint that must return PASS before the next phase begins. The three gates are: (1) UX Designer for UI changes, (2) QA for all changes, (3) Architect for non-UI design. |
| **HANDOFF** | Peer-to-peer async channel. Lands in the target role's inbox; does NOT auto-trigger their turn. Used by all non-PO roles. Format: `[[HANDOFF: role-id]] … [[/HANDOFF]]`. |
| **Instance** | A running copy of the apex-team server bound to a port with its own DB. Live instance = `:3000` (user-facing). QA instance = `:3100`. UI Dev isolated = `:3110`. BE Dev isolated = `:3120`. |
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
| **Turn** | One LLM call for a role — loads state + history + inbox, runs the model, persists NOTES / HANDOFF / DISPATCH blocks. |
| **Wave** | A named batch of parallel implementation tasks dispatched by PO in one orchestration turn. Example: "Wave 9b — Foundation work". |
| **Worktree** | A separate working directory created via `git worktree add`, sharing the same `.git` object store as the main checkout. Used to give each implementer (UI Dev, BE Dev, QA, UX Designer) physical filesystem isolation while keeping a single repo. Created by `pnpm branch:start <role> <slug>`; removed by `pnpm branch:cleanup`. |
| **Workspace** | The directory on disk that agents' file tools (Read, Edit, Write, Bash) target. Configured in the top bar and persisted in `localStorage`. |
