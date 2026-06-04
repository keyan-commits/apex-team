# Workspace Conventions — directory contract for the apex-team subagent runtime

<!-- Tracked by US-086 (Wave 107) — see requirements/user-stories/US-086-workspace-conventions.md -->

- **Status:** Accepted
- **Date:** 2026-06-04
- **Wave:** 107 (first wave under Plan C subagent runtime)
- **Owner:** Architect
- **Authority:** This document is the **single source of truth** for where every deliverable in this repo lives. Every subagent reads this; deviations require a follow-up PR that updates this doc first.
- **Companion docs:** `CLAUDE.md` §"Engineering standards" item 2; `architecture/INDEX.md`.
- **Resolves:** OQ-085-001 (test artifact retention policy), OQ-085-002 (skill-slot rescoping under subagent runtime).

---

## Why this exists

Under the Plan C runtime (`ebc83c5`, Wave 106) the apex-team monolith is retired — no Next.js server, no MCP server, no SQLite `agent_state` table. The 8 Claude Code subagents under `.claude/agents/*.md` coordinate **exclusively through files on disk**. The instant two subagents disagree about where a deliverable belongs, the discipline collapses — chat-bubble artifacts become indistinguishable from "real" ones, gates can't find what they're gating, and the dogfooding loop breaks.

This doc encodes the directory contract once so the eight subagents — and any future ninth — read the same map.

## The contract — what lives where

Authoritative path → owning role → contents → notes.

| Path | Owner | Contents | Notes |
|---|---|---|---|
| `requirements/` | business-analyst | Functional requirements: user stories, scope, glossary, open questions, business rules, domains, data sources, samples. | `requirements/INDEX.md` indexes every artifact. `requirements/open-questions.md` holds open questions in `OQ-NNN-NNN` form. |
| `requirements/user-stories/US-NNN-<slug>.md` | business-analyst | One user story per file. File naming **MUST** match `US-NNN-<kebab-slug>.md`; NNN is a zero-padded monotonically increasing integer. | Body **MUST** open with `## Story` + `## Acceptance criteria` + `## Out of scope`. Other sections (Notes, OQs, etc.) optional. |
| `architecture/` | architect | NFRs, coding standards, system design, ADRs, plus this workspace-conventions doc. | `architecture/INDEX.md` indexes ADRs + flat docs. |
| `architecture/decisions/ADR-NNN-<slug>.md` | architect | One ADR per file. NNN is monotonically increasing; gaps allowed (deletions are forbidden — supersede instead). | ADR template: Status / Date / Wave / Context / Decision / Consequences / Fitness functions (where applicable). Status transitions: Proposed → Accepted → Superseded. |
| `architecture/nfr.md` | architect | Quantified non-functional requirements with measurement methods. | Vague NFR = wish. Every NFR carries its fitness function or a `tests/qa/` smoke pointer. |
| `architecture/operations/` | architect | Operational runbooks owned by Architect (e.g. mcp-client-rebind.md). | Distinct from `ops/` — these are architectural-level concerns, not CI/CD recipes. |
| `architecture/coding-standards.md` | architect | Naming, layout, patterns the team **MUST** follow. | Cited by code reviews — "this violates §X of coding-standards.md." |
| `design/` | ux-designer | Per-feature design specs, wireframes, interaction-state inventories, a11y / motion / contrast call-outs. | One spec per US or per issue. `design/INDEX.md` indexes. |
| `tests/` | qa | All test code — unit, smoke, regression, UI, backend, security. | Vitest is the runner; per-test layout is QA's call within the conventions below. |
| `tests/qa/wave-NNN/` | qa | The canonical per-wave home for tests authored during wave NNN. | Test **code** committed; **evidence** (screenshots, console logs, traces) gitignored — see OQ-085-001 resolution below. |
| `ops/` | devsecops | CI/CD recipes, secrets policy, deploy scripts, supply-chain manifests, branch-protection payloads, ops README. | **Carveout:** GitHub Actions workflows live at the repo root under `.github/workflows/*.yml`, NOT under `ops/`. GitHub requires this path. `ops/README.md` cross-references the workflow files. |
| `.github/workflows/*.yml` | devsecops | CI workflows enforced by GitHub Actions. | Repo-root carveout; conventionally owned by DevSecOps but path is fixed by GitHub. Pre-commit hooks at `scripts/git-hooks/` likewise live outside `ops/` for the same path-dependence reason. |
| `coordination/handoffs/<role-id>.md` | each subagent owns its own file | Per-role working state ("HANDOFF doc"). Files-on-disk replacement for the retired SQLite `agent_state` table. | One file per subagent. Naming **MUST** match the subagent's role-id exactly (see role-id list below). Peers MAY read; only `<role-id>` MAY write — see "Peer-edit protocol" section below. |
| `HANDOFF.md` (repo root) | rotates per wave; PO consolidates | Wave-level NOW block + recent session history. | Composed via towncrier-style fragments at `_handoff-pending/<wave>-<role>.md`, folded by PO with `pnpm fold-handoff` (ADR-014). |
| `LESSONS.md` (repo root) | shared | Append-only "we hit X, it broke for Y, we now do Z." | Explains WHY conventions exist. Never edited in place — only appended. |
| `_handoff-pending/<wave>-<role>.md` | each role authors its own fragment | Per-wave HANDOFF fragment; folded into `HANDOFF.md` at wave close. | ADR-014. PO writes no fragment — the fold commit IS PO's state update. |
| `INDEX.md`, `INDEX.yaml` (repo root) | shared | Machine-readable doc index. Edit `INDEX.yaml`; the human view regenerates. | Per the `/handoff-init` global convention. |

### Role-id list (canonical, exact spelling)

`product-owner`, `business-analyst`, `architect`, `ux-designer`, `ui-developer`, `backend-developer`, `qa`, `devsecops`.

Subagent definition files: `.claude/agents/<role-id>.md`. HANDOFF files: `coordination/handoffs/<role-id>.md`. Role-ids **MUST** match across both surfaces; renaming a role requires updating both (plus this doc).

## Peer-edit protocol — HANDOFF docs are single-author by role (Wave 112)

Each `coordination/handoffs/<role-id>.md` file is **owned exclusively by `<role-id>`**. This is the durable rule for cross-role coordination under the subagent runtime.

**Rule:** other roles MAY **read** any peer's HANDOFF doc; they **MUST NOT write** to a peer's HANDOFF doc. Writes to `coordination/handoffs/<role-id>.md` are reserved for `<role-id>` itself.

**Why:**

- A HANDOFF doc is the role's own audit trail — the durable record of what that role decided, what it gated, and what it's tracking. Peer edits muddle ownership and make the verdict chain ambiguous (which role attested what?).
- Verdicts recorded in a gate role's HANDOFF doc (per ADR-018) are load-bearing: DevSecOps's merge step verifies them against the PR HEAD SHA. If any peer can edit a gate role's HANDOFF, the verdict is no longer self-attested by the gate role; the integrity chain breaks.
- The subagent runtime gives every role full write access to the filesystem; the discipline is policy, not OS permissions. The Architect's code review gate enforces it.

**The correct mechanisms for cross-role communication:**

1. **Your own HANDOFF doc.** Write what you requested, what you observed, what you decided in `coordination/handoffs/<self>.md`. That doc IS your durable record. Peers read it.
2. **Workspace artifacts.** US-NNN files, ADRs, design specs, test files, ops manifests — these are the cross-role contracts. They live in their owning role's lane (`requirements/`, `architecture/`, `design/`, `tests/`, `ops/`) and are edited by that role.
3. **Advisory `[[HANDOFF: <peer-id>]]` blocks** in the subagent's visible reply. Under the subagent runtime these are advisory text; the outer Claude Code orchestrator reads them and decides whether to invoke the named peer via the `Agent` tool. The advisory block is NOT a substitute for a direct file edit — it is the mechanism that REPLACES the direct file edit.

**Exception (narrow, named, single class):**

- **System-level housekeeping with explicit authorization.** A repo-wide rename, a wave-level HANDOFF compaction request, or a coordinated migration that touches multiple HANDOFF docs at once MAY be authored by a system-level role (typically Product Owner under user direction) provided: the authorization is explicit in the PR body or commit message, the touched HANDOFF docs are listed in the PR description, and the affected role is HANDOFF-ed to confirm the change matches their working state. Without these three conditions, the edit is a peer-edit violation.

**Enforcement:**

- Architect's code review rubric (`.claude/agents/architect.md`, step 4-parallel) FAILs any PR whose diff modifies `coordination/handoffs/<role-id>.md` where the PR author is not the same `<role-id>` (and not a system-level housekeeping author with the three-condition authorization above).
- Subagent bodies carry the matching boundary clause ("You do NOT write to other roles' `coordination/handoffs/<peer-id>.md` files") in their "Your boundaries" section.

**Discovered:** Wave 111c. DevSecOps's PR #388 edited `coordination/handoffs/architect.md` directly to surface an ADR-018 ratification request. The edit was self-corrected by Architect's overwrite of the NOW section, but the cleaner protocol — a `[[HANDOFF: architect]]` advisory block in DevSecOps's own state — would have left both roles' verdict chains intact. Filed as issue #391; codified here Wave 112.

## Requirements-first enforcement (Wave 117)

Every implementation request — in apex-team itself or in any host workspace driven by the eight user-scoped subagents — MUST pass through the business-analyst subagent before any developer or QA writes code. The enforcement runs at three layers, weakest to strongest:

1. **Orchestrator-side skill (`requirements-first`).** `.claude/skills/requirements-first/SKILL.md` is the source-of-truth checklist for the outer Claude Code session: detect implementation work, identify the active workspace, check for an existing US reference, dispatch BA first if absent, then dispatch QA + Dev in parallel after BA returns. The repo's `scripts/install-agents-user-scope.sh` symlinks the skill into `~/.claude/skills/requirements-first/SKILL.md` so it travels with the user-scoped subagents.
2. **BA auto-routing clause.** `.claude/agents/business-analyst.md` carries a clause titled "Auto-routing on raw user requirements (Wave 117)". When BA is invoked with a raw user requirement, BA writes the US file AND emits parallel HANDOFF advisory blocks to QA and the implementing developer in the same response — so the outer orchestrator can fan out QA + Dev in parallel after BA returns.
3. **Implementer hard-refusal pre-flight gate.** `.claude/agents/{backend-developer,ui-developer,qa,devsecops}.md` each carry a clause titled "Requirements-first pre-flight gate (Wave 117 — MANDATORY)". Before writing any code, the implementer MUST verify a US-NNN file exists in the active workspace's `requirements/user-stories/` directory. If absent and no exception tag is named, the implementer HALTS and emits a `[[HANDOFF: business-analyst]]` advisory block. For QA, "code" includes test code. For DevSecOps, "code" includes new CI workflow YAML and deploy manifest edits with runtime-visible effect (the merge step itself is outside this gate's scope — it operates on already-merged upstream work).

The seven exception tags (`[exception: trivial-ops]`, `[exception: gate-verdict]`, `[exception: scout-issue]`, `[exception: housekeeping]`, `[exception: revise-redispatch]`, `[exception: emergency-rollback]`, `[exception: security-hotfix]`) carve out narrow classes where the requirements phase is already satisfied or structurally unnecessary. The implementer pre-flight gate honors the same tag list as the REQUIREMENTS_PHASE_PROTOCOL exceptions documented in each subagent body.

**Trigger incident:** a downstream Mac running apex-team's user-scoped subagents was given an implementation task. The outer Claude Code dispatched an implementing developer directly, skipping BA. The existing implementer-side "Refuse work without a user-story reference" clauses caught format-violations on dispatch prompts, but the orchestrator never reached them — the orchestrator-side guidance was advisory only. Wave 117 hardens the discipline at all three layers.

**Cross-references:**
- `.claude/skills/requirements-first/SKILL.md` — orchestrator checklist.
- `.claude/agents/business-analyst.md` §"Auto-routing on raw user requirements (Wave 117)" — BA's response shape.
- `.claude/agents/backend-developer.md`, `ui-developer.md`, `qa.md`, `devsecops.md` §"Requirements-first pre-flight gate (Wave 117 — MANDATORY)" — implementer hard backstop.
- `scripts/install-agents-user-scope.sh` — symlinks both agents AND skills into `~/.claude/`.
- §"Comprehensive testing (Wave 118)" below — the downstream sibling enforcement that fires AFTER BA writes the US, ensuring QA's tests cover the four mandatory classes (positive / negative / edge / all-known-samples) before any PASS verdict.
- §"FEAT-XXXX feature grouping (Wave 122)" below — the organizing convention that groups every role's deliverable for a feature under a shared FEAT-NNNN identifier, layered on top of US-NNN (Option B coexistence).

## Comprehensive testing (Wave 118)

Every QA dispatch that authors tests for a user story — in apex-team itself or in any host workspace driven by the eight user-scoped subagents — MUST satisfy four mandatory test classes before QA emits any PASS verdict. The enforcement runs at two layers:

1. **Orchestrator-side skill (`comprehensive-testing`).** `.claude/skills/comprehensive-testing/SKILL.md` is the source-of-truth checklist + decision tree + walk-through. The skill is symlinked into `~/.claude/skills/comprehensive-testing/SKILL.md` via the existing `scripts/install-agents-user-scope.sh` (Wave 117's `SKILLS_SRC_DIR` glob picks up new skill directories without code change).
2. **QA hard-rule clause.** `.claude/agents/qa.md` carries a clause titled "Comprehensive test coverage (Wave 118 — MANDATORY)" placed immediately after the Wave 117 requirements-first pre-flight gate (region-disjoint addition). The clause names the four mandatory test classes and the procedure QA follows before emitting any PASS verdict.

The four mandatory test classes per US:
- **Positive** — happy-path test per acceptance criterion.
- **Negative** — explicit-rejection test per AC with a non-trivial input surface (null / undefined / empty / wrong-type / out-of-domain inputs).
- **Edge** — boundary conditions on every input axis the AC exposes (empty collection, single item, max size, off-by-one, unicode, timezone / DST, date format variants, whitespace, numeric precision, concurrent mutations).
- **All known sample inputs** — for ACs that depend on parsing/processing/rendering files from a known input directory, iterate over every file in `requirements/samples/**` (or the project's equivalent — `fixtures/`, `test-data/`, `examples/`, `__fixtures__/`). Parameterized / loop test, not a hand-picked representative. If only one sample file exists, flag the lack of variety as a coverage gap and file an issue requesting BA / domain experts surface additional sample inputs.

**Trigger incident:** the LFM Add-PO project shipped a date-fix feature that QA validated against ONE sample file (`20260524`, ISO date format) out of 9 sample files in `requirements/samples/2026-05-28-bk-daily-pos/`. The outlier (`20260525`, US-slash format `5/27/2026`) slipped past, broke production, required a hot-fix. Root cause: single-sample testing. The Wave 118 enforcement is the durable fix so this pattern cannot recur.

**Cross-references:**
- `.claude/skills/comprehensive-testing/SKILL.md` — orchestrator-side skill: full decision tree, walk-through example, unconventional-workspace handling.
- `.claude/agents/qa.md` §"Comprehensive test coverage (Wave 118 — MANDATORY)" — QA hard-rule clause, ~50 lines, region-disjoint from Wave 117's pre-flight gate.
- `.claude/agents/qa.md` §"Edge-case enumeration" — pre-existing checklist; Wave 118 makes it MANDATORY per US.
- `scripts/install-agents-user-scope.sh` — symlinks both agents AND skills into `~/.claude/` (no script change needed for Wave 118 — `SKILLS_SRC_DIR` glob from Wave 117 already picks up new skill directories).
- §"Requirements-first enforcement (Wave 117)" above — upstream sibling enforcement; this clause is the downstream half that covers "what tests are mandatory" after BA writes the US.
- §"FEAT-XXXX feature grouping (Wave 122)" below — applies the four-class testing discipline per test TYPE within a FEAT grouping; QA's `TEST-PLAN.md` records type rationale.

## FEAT-XXXX feature grouping (Wave 122)

Every deliverable in this workspace — and in any downstream workspace driven by the eight user-scoped subagents — groups under a shared `FEAT-XXXX` identifier. The convention makes artifacts discoverable, cross-linked, and groupable in the apex-team-viewer without hunting across flat file lists. US-098 is the driving story; FEAT-0001 is the meta-feature that dogfoods the convention.

### Per-role ticket prefixes (AC3)

Ticket numbers are allocated monotonically per role, independently of other roles. `ARCH-XXXX` is feature-scoped Architect work; `ADR-NNNN` stays for cross-cutting Architect decisions (the two coexist — an ADR can be authored alongside one or more ARCH tickets, or independently when the decision is repo-wide). The ratified prefix table:

| Role | Ticket prefix | Per-feature artifact root | Per-role INDEX |
|---|---|---|---|
| BA | `FEAT-XXXX` | `requirements/features/FEAT-NNNN-<slug>.md` | `requirements/features/INDEX.md` |
| Architect | `ARCH-XXXX` | `architecture/features/FEAT-NNNN-<slug>/ARCH-NNNN-<slug>.md` | `architecture/features/INDEX.md` |
| UX Designer | `UX-XXXX` | `design/features/FEAT-NNNN-<slug>/UX-NNNN-<slug>.md` | `design/features/INDEX.md` |
| QA | `TEST-XXXX` | `tests/qa/features/FEAT-NNNN-<slug>/TEST-NNNN-<slug>.test.ts` | `tests/qa/features/INDEX.md` |
| FE Developer | `FE-XXXX` | `src/features/FEAT-NNNN-<slug>/FE-NNNN-<slug>.tsx` (project-equivalent) | `src/features/INDEX.md` |
| BE Developer | `BE-XXXX` | `src/features/FEAT-NNNN-<slug>/BE-NNNN-<slug>.ts` (project-equivalent) | shared with FE |
| DevSecOps | `OPS-XXXX` | `ops/features/FEAT-NNNN-<slug>/OPS-NNNN-<slug>.sh` + `ops/pipelines/<env>.sh` reusable templates | `ops/features/INDEX.md` |

FE Dev and BE Dev share the `src/features/FEAT-NNNN-<slug>/` tree but carry distinct ticket prefixes; their files coexist in the same per-feature directory. Product Owner orchestrates and does not produce per-feature deliverables under this convention.

### Option B — US-NNN coexistence with FEAT-XXXX (AC5)

A FEAT-XXXX document is the feature parent that groups one or more US-NNN user stories as children. Existing US-NNN files are not retired or renamed; they carry a `parent-feat:` frontmatter field referencing their parent FEAT when one is assigned. New features always start with a FEAT document; the associated US-NNN stories link back to it. Rationale: retiring US-NNN would lose story-level granularity and break the US → BR → test traceability chain (`requirements/traceability.md`). Option B preserves feature-level grouping for the viewer AND story-level granularity for acceptance criteria.

### QA test-type decision discipline (AC6)

QA selects test types for each FEAT-XXXX grouping based on the feature's requirements and ACs — not on how the developer implemented the feature. The test-type decision is QA's professional judgment. Available types (non-exhaustive): unit, integration, smoke, regression, end-to-end, UI (visual regression), performance, security (static + DAST). QA documents the rationale for type selection in a `TEST-PLAN.md` at the root of `tests/qa/features/FEAT-NNNN-<slug>/`. The Wave 118 comprehensive-testing discipline (positive / negative / edge / all-known-samples) applies per test TYPE within the feature grouping — not just per story.

### Mandatory deliverable frontmatter (AC11)

Every role deliverable file MUST include a frontmatter (Markdown) or header-comment block (non-Markdown) with at minimum:

```yaml
---
ticket: <PREFIX-NNNN>       # this role's ticket — prefix must match AC3 table
parent_feat: FEAT-NNNN      # the BA feature this belongs to
parent_us: US-NNN           # the BA user story (omit if no US exists)
role: <role-id>             # e.g. architect, qa, ui-developer
status: <status>            # proposed | accepted | in-flight | done | superseded
---
```

For non-Markdown files (`.ts`, `.tsx`, `.sh`, `.py`, etc.), use the file's native top-of-file comment syntax with the same fields. BA's FEAT-XXXX files use `feat:` (not `parent_feat:`) — they ARE the parent.

`parent_feat:` is the primary cross-link: it is what the viewer uses to group artifacts by FEAT card and what `grep parent_feat: FEAT-XXXX` uses to compute the count columns in `requirements/features/INDEX.md`.

**Per-role INDEX maintenance rule:** each role MUST maintain an allocation index at `<role-dir>/features/INDEX.md` (paths per the AC3 table). When a role creates a new ticket file, it MUST add a row to its own INDEX before the wave closes. Ticket numbers are allocated monotonically per role; numbers are never reused after retirement. The BA's `requirements/features/INDEX.md` aggregates counts across all role INDEXes — it does not replace them.

### Autonomous role standard (AC12)

Each role's subagent body (`.claude/agents/<role-id>.md`) carries a section with the exact heading:

```
### FEAT-XXXX feature grouping standard (Wave 122 — MANDATORY)
```

The heading is the canonical grep anchor. QA's Wave 122 regression test grep-asserts this exact string in all 8 subagent body files. Each body's section codifies role-specifically:

1. **Ticket prefix** — the role's own prefix from the AC3 table (stated explicitly, not as a reference).
2. **Directory layout** — the canonical artifact root for this role's per-feature files, stated as a concrete path pattern.
3. **Frontmatter rule** — inline restatement of the AC11 fields, not a cross-reference. The subagent carries the rule without needing to read US-098.
4. **INDEX maintenance** — allocate ticket numbers monotonically; add a row to `<role-dir>/features/INDEX.md` before the wave closes.
5. **Cross-workspace applicability** — the convention applies in ANY workspace, not just apex-team. When invoked on a downstream project (LFM, bidshop, etc.), follow the same convention there.

The autonomous-standard section is the mechanism that makes the convention self-propagating: a role subagent invoked fresh in a new workspace applies the convention without explicit instruction. The Wave 121 viewer auto-follow means a single subagent body edit on apex-team propagates to every project using user-scope subagents.

Architect single-authored all 8 body amendments in Wave 122 (the Plan C subagent runtime treats `.claude/agents/*.md` edits as Architect's lane for cross-cutting agentic protocol). PO does not produce per-feature deliverables under this convention; the PO body's section documents the absence explicitly so QA's grep-coverage assertion passes against all 8 files.

### `requirements/features/INDEX.md` registry shape (AC4)

The BA-owned registry uses this canonical column shape:

```
| FEAT | Slug | Status | ARCH | UX | TEST | FE | BE | OPS |
```

Wave + US-NNN refs columns are dropped from the table; full context lives in the FEAT-XXXX file's frontmatter. The ARCH / UX / TEST / FE / BE / OPS counts are derived by grepping `parent_feat: FEAT-XXXX` across each role's `features/` directory. BA updates counts when a peer notifies BA that a new role ticket has been filed, or on any wave-close sweep.

### Cross-references

- `requirements/user-stories/US-098-feat-grouping-convention.md` — driving story; ratified ACs.
- `requirements/features/FEAT-0001-feat-grouping-convention.md` — meta-feature; dogfoods the convention.
- `requirements/features/INDEX.md` — top-level feature registry.
- §"Requirements-first enforcement (Wave 117)" above — the upstream gate that ensures a US-NNN exists before implementation; FEAT-XXXX grouping is the post-US organizing layer.
- §"Comprehensive testing (Wave 118)" above — applies per test TYPE within a FEAT grouping (AC6).
- `.claude/agents/<role-id>.md` §"FEAT-XXXX feature grouping standard (Wave 122 — MANDATORY)" — autonomous role standard, present in all 8 bodies.

## OQ-085-001 — Test artifact retention policy (RESOLVED)

**Question (original framing, Wave 106):** Are artifacts under `tests/qa/wave-NNN/` gitignored, retained, or pruned after N waves?

**Resolution (this doc, Wave 107):**

**Test code is retained (committed) indefinitely. Evidence artifacts are gitignored.**

Concretely:

1. **Test code** — `*.test.ts`, `*.test.tsx`, fixture builders, helper modules under `tests/qa/wave-NNN/` — **committed**. Treated like any other source artifact. Never pruned by wave age; only deleted when the code under test is deleted (in which case the deletion travels in the same PR).
2. **Evidence artifacts** — screenshots (`*.png`), console logs (`*.log`), browser traces (`*.zip`, `*.har`), Playwright videos, vitest snapshots-as-binary — **gitignored** under `tests/qa/wave-NNN/evidence/`. A `README.md` at that path (committed) records *what was captured*, *when*, *for which gate verdict*, and a *short reproduction recipe* so any future reader can regenerate the evidence on demand.
3. **Snapshot files** (e.g. Vitest `__snapshots__/` text snapshots) — **committed** with the test code; they ARE the assertion. Distinct from "evidence" above.

**Rationale:**

- Test code is durable: it documents intent and regression coverage long after the wave that birthed it. Pruning would erase regression history. Disk cost is negligible (text).
- Evidence binaries inflate the repo without proportional value — they're outputs of running the tests, not the tests themselves. The `README.md` at `evidence/` keeps the *audit trail* (what gate this evidence supported, on what date, for which PR) without the binary weight.
- The wave-NNN directory boundary is a per-wave scratchpad for **organization**, not a retention horizon. A wave-203 test continues to live at `tests/qa/wave-007/` if that's where it was authored — moving tests after the fact churns history for no gain.

**Gitignore entry (DevSecOps owns the actual `.gitignore` edit):**

```
# Evidence artifacts (screenshots, logs, traces) — README.md at each evidence dir
# explains what was captured. Test code itself is committed.
tests/qa/wave-*/evidence/*
!tests/qa/wave-*/evidence/README.md
```

**Migration of old waves:** N/A. Wave 107 is the first wave under this convention. Pre-wave-107 test artifacts don't exist (the monolith's testing approach was different and is retired with `src/`).

**Fitness function (QA owns; tracked separately):** a vitest pre-flight check that any directory matching `tests/qa/wave-*/evidence/` contains a `README.md` and that no committed file in such a directory matches the binary-extension allow-list. Wire into CI alongside `pnpm test:run`. Filed as a follow-up if not in scope this wave.

## OQ-085-002 — Skill-slot question (CLOSED, re-scoped)

**Question (original framing, Wave 106):** Which section of `src/lib/skills/qa.ts` holds the "tests are files on disk" discipline (AC4 of US-085)?

**Resolution (this doc, Wave 107):** **The original framing no longer makes sense.** `src/lib/skills/qa.ts` was deleted as part of the Plan C cutover (PR #373; monolith retirement) — there is no shared skill file under the subagent runtime to slot a section into.

Under the subagent runtime, **`.claude/agents/qa.md` IS the skill file** for the QA role. The "tests are files on disk, not chat artifacts" discipline was absorbed directly into that file during the port. The "skill slot" abstraction is gone — each subagent's `.md` is one self-contained document; sections inside it are organized for human readability, not for slot-based composition.

**Closing with that reasoning.** No follow-up needed. The discipline is enforced by:

1. The text of `.claude/agents/qa.md` itself.
2. This workspace-conventions doc, which names `tests/` as QA's canonical home and chat-bubble code as not counting.
3. Code reviews — Architect FAILs a review if QA delivered test artifacts only in chat without landing files at the conventional paths.

## Enforcement model

The contract is **enforced at three layers**, weakest to strongest:

1. **Subagent prompts** (`.claude/agents/*.md`) — each role's prompt declares its lane. Soft enforcement; depends on the model honoring the prompt.
2. **Code review** (Architect) — a PR that lands deliverables outside their canonical path FAILs the design gate with a citation to this doc. Strong enforcement on the PR boundary.
3. **Pre-commit hooks + CI** (DevSecOps) — `scripts/git-hooks/` and `.github/workflows/` mechanically reject violations. Strongest enforcement; only feasible for patterns expressible as a static check (e.g. "every PR that touches source MUST include a HANDOFF fragment").

When a new constraint earns enough recurrence to deserve hard enforcement, DevSecOps adds it at layer 3 and this doc is updated with a citation.

## How to evolve this contract

1. **Open an ADR.** Proposed change → `architecture/decisions/ADR-NNN-<slug>.md` with Context / Decision / Consequences. Cite this doc as the contract being amended.
2. **Update this doc** in the same PR that lands the ADR. Single PR, two artifacts — never an ADR without the contract update, never a contract change without the ADR rationale.
3. **Update `CLAUDE.md` §"Engineering standards" item 2** if the change reshapes the top-level lane map.
4. **Update `architecture/INDEX.md`** to reflect the ADR + any new flat docs.
5. **Announce in `HANDOFF.md` NOW block** for the wave that lands the change so every subagent picks it up on next session pickup.

Renames or deletions of an entire convention class (e.g. removing `coordination/handoffs/` in favor of some new mechanism) are **Rule 6 destructive actions** under the global agentic workflow — they require explicit separate user approval, not bundled inside a larger wave.

## Out of scope (this doc / Wave 107)

- **Per-subagent prompt edits.** Out of scope per the PO's brief. If a subagent's `.claude/agents/<role>.md` references retired paths or stale conventions, that's a separate wave's work — file as `self-improvement` if found.
- **Viewer repo conventions.** `keyan-commits/apex-team-viewer` is a separate codebase with its own conventions. Cross-repo coordination is a future wave's concern.
- **Historical migration** of pre-Wave-107 artifacts. The cutover is a hard reset; we do not retroactively reorganize anything authored before this doc landed.

## Cross-references

- `CLAUDE.md` — "Engineering standards" item 2 cites this doc as the source of truth.
- `architecture/INDEX.md` — lists this doc in its flat-docs section.
- `requirements/open-questions.md` — OQ-085-001 + OQ-085-002 resolution lines point here.
- `requirements/user-stories/US-085-qa-disk-artifacts.md` — superseded marker references this doc as the ratified home of the QA path convention.
- `architecture/decisions/ADR-014-handoff-fragment-pattern.md` — historical: defined the `_handoff-pending/<wave>-<role>.md` fragment mechanism. **Superseded under the subagent runtime by ADR-017** — each subagent now edits `coordination/handoffs/<role-id>.md` directly.
- `architecture/decisions/ADR-017-subagent-body-rewrite-rules.md` — Wave 108 amendment: the rewrite-rule pack governing legacy-pattern removal from `.claude/agents/*.md` bodies. Companion to this directory contract.
