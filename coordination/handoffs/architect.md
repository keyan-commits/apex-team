# architect — HANDOFF

## ⏭️ NOW — 2026-06-05 — Wave 139 role-routing skill authored (PASS, .claude/skills/role-routing-server-vs-ui/SKILL.md)

### Wave-139 PASS verdict — PR #432 — SHA 5dc87fcd105f63038d74e03144ab0c870030220b
- **Gate role:** architect
- **Timestamp:** 2026-06-05T17:30:00Z
- **Notes:** Wave 139 role-routing-server-vs-ui skill authored at `.claude/skills/role-routing-server-vs-ui/SKILL.md`. Nine required sections present per the Wave 139 brief; frontmatter shape matches sibling skill files; boundary respected (no `.claude/agents/` edits, no `architecture/` edits this turn). SHA `5dc87fcd105f63038d74e03144ab0c870030220b` is the initial commit on `feature/wave-139-role-routing-skill`; this amend backfills the PR # and SHA into the verdict heading per ADR-018 standard flow.

### Wave 139 narrative — own-lane authorship
- **Gate role detail:** architect (own-lane authorship — Wave 139 brief tasked me with authoring the `.claude/skills/role-routing-server-vs-ui/SKILL.md` durable rule file plus this HANDOFF update. Boundary: only the new SKILL.md + own HANDOFF. NO `.claude/agents/` edits — those are UI Dev / BE Dev / PO's own lanes via separate parallel dispatch. NO `architecture/` edits this turn — FEAT/US/ARCH formalization explicitly deferred to a follow-up wave per the brief.).
- **Branch:** `feature/wave-139-role-routing-skill` (cut from `main` at `7679bfcf5646fd4de7db50820cafa3bb9c0e258f` — verified via `git rev-parse origin/main`).
- **Scope of this verdict:** authorship of the new skill file at `.claude/skills/role-routing-server-vs-ui/SKILL.md`. The skill codifies the rule that server-side code is always BE Dev's lane and browser-side code is always UI Dev's lane, regardless of which repo the code lives in, with mandatory parallel dispatch on full-stack waves. Trigger context is the LFM session 2026-06-05 observation that BE Dev's tab was empty in the viewer dashboard despite the viewer repo's `server.mjs` carrying real Node HTTP / API / SSE / spawn / file-IO surfaces — the Wave 137 retro backfill closed the historical gap; Wave 139 codifies the rule to prevent recurrence.

### Per-section verification matrix (Wave 139 brief)

| Required section | Verification | Result |
|---|---|---|
| **§1 — Routing rule (one paragraph)** | Section 1 opens with the exact one-paragraph rule per the brief: server-side = BE Dev, browser-side = UI Dev, parallel dispatch on full-stack waves, repo-agnostic. Followed by a single explanatory paragraph anchoring the historical viewer-lumping bug as the motivating context. | PASS |
| **§2 — Surface classification table** | Section 2 contains a 5-row table (Browser/DOM, Server runtime, CLI tools, Build/CI, Tests) with examples and owners. Tiebreaker clause for primary-responsibility (`server.mjs` that also serves static files = BE Dev) included verbatim per brief. Additional tiebreaker for SSR / RSC frameworks (Next.js, Remix, SvelteKit) added to cover the route handlers / loaders / actions / server functions case — pre-empts the same ambiguity for projects using those stacks. | PASS |
| **§3 — Repository-agnostic clarification** | Section 3 enumerates apex-team, apex-team-viewer (with the specific `server.mjs` vs `public/app.js` split), downstream host workspaces (LFM, bidshop), and standalone repos. Final line "Repo location does NOT determine ownership; code shape does" reproduced verbatim from the brief. | PASS |
| **§4 — Full-stack waves (parallel dispatch)** | Section 4 prescribes parallel `Agent({ subagent_type: "ui-developer", ... })` + `Agent({ subagent_type: "backend-developer", ... })` calls in a single outer-orchestrator response. Per-role canonical artifact paths cited: `frontend/features/FEAT-NNNN-<slug>/FE-NNNN-<slug>.md` and `backend/features/FEAT-NNNN-<slug>/BE-NNNN-<slug>.md`. Sequential-dispatch anti-pattern explicitly called out. | PASS |
| **§5 — Refusal protocol (UI Dev)** | Section 5 lists eight server-side trigger patterns (server.mjs, API routes, SSE, WebSocket, spawn/exec, file IO, schema authoring, server-side business logic). Three-step refusal procedure (HALT, emit `[[HANDOFF: product-owner]]` advisory, proceed with browser-side portion only) per brief. Note added that refusal is a routing correction, not a wave blocker. | PASS |
| **§6 — Assertion protocol (BE Dev)** | Section 6 prescribes self-assertion via `[[HANDOFF: product-owner]]` advisory block when BE Dev sees server-side files shipping without their involvement, plus retro `BE-NNNN` summary doc authorship for already-shipped waves (the Wave 137 pattern). Explicit cross-reference to `backend/features/INDEX.md` retroactive backfill log. | PASS |
| **§7 — PO routing checklist (mandatory pre-dispatch)** | Section 7 enumerates seven server-runtime trigger patterns (server-runtime files, API routes, streaming/push, process orchestration, file IO, schema authoring, server-side business logic) plus the browser-side patterns that signal UI Dev dispatch. Three anti-patterns named for PO to avoid ("it's a viewer change, route it to UI Dev", "BE Dev has no work this wave", sequential dispatch). | PASS |
| **§8 — Trigger context** | Section 8 names the LFM session 2026-06-05 incident, the Wave 137 backfill (BE-0001 through BE-0009 retro entries), and Wave 139's codification purpose. References to the specific BE-NNNN retro docs preserve the audit trail. | PASS |
| **§9 — Cross-references** | Section 9 links: `.claude/agents/ui-developer.md` (refusal clause — follow-up), `.claude/agents/backend-developer.md` (assertion clause — follow-up), `.claude/agents/product-owner.md` (routing checklist — follow-up), `~/.claude/skills/requirements-first/SKILL.md`, `~/.claude/skills/comprehensive-testing/SKILL.md`, `~/.claude/skills/qa-artifact-discipline/SKILL.md`, `architecture/workspace-conventions.md`, `backend/features/INDEX.md`, and the deferred ARCH-0003 ADR slot. | PASS |
| **Frontmatter shape** | YAML frontmatter present with `name: role-routing-server-vs-ui` and a single-paragraph `description:` field anchoring the skill on the eight-subagent runtime and cross-project applicability. Matches the shape of `comprehensive-testing/SKILL.md` and `requirements-first/SKILL.md` verbatim. | PASS |
| **Architecture/ co-authorship gate (Wave 109 #335)** | `git diff origin/main..feature/wave-139-role-routing-skill -- architecture/` empty. This Wave 139 PR touches only `.claude/skills/role-routing-server-vs-ui/SKILL.md` + `coordination/handoffs/architect.md`. Architect's own HANDOFF doc + a skill file in `.claude/skills/` — neither is `architecture/`. Boundary satisfied. | PASS |
| **Peer-edit boundary (Wave 112)** | No peer HANDOFF doc touched. No `.claude/agents/` files touched — UI Dev's / BE Dev's / PO's clause additions are explicitly deferred per the brief to separate parallel dispatches. No `requirements/`, `design/`, `tests/`, `ops/`, or `frontend/`/`backend/` peer-owned files touched. | PASS |

### Verdict

**PASS** for the Wave 139 deliverable: `.claude/skills/role-routing-server-vs-ui/SKILL.md` plus this HANDOFF update. All nine required content sections present per the brief; frontmatter shape matches sibling skills; boundary respected (no `.claude/agents/` edits this turn, no `architecture/` formalization).

Per ADR-018 the verdict heading uses the real PR # (filled in post-create) and the real 40-char HEAD SHA (filled in post-commit). Pre-PR/pre-commit placeholders are `(SHA-pending)` and `PR (TBD)` per the standard backfill flow.

### Routing — UI Dev / BE Dev / PO clause additions next

Three follow-up dispatches are needed to land the agent-side hooks the skill cross-references (`§9`):

- **UI Dev** authors the refusal clause in `.claude/agents/ui-developer.md` per `§5`. Brief: cite the skill name, reproduce the eight server-side trigger patterns, document the three-step refusal procedure. PO dispatches separately.
- **BE Dev** authors the assertion clause in `.claude/agents/backend-developer.md` per `§6`. Brief: cite the skill name, document the self-assertion HANDOFF format, document retro `BE-NNNN` doc authorship as the historical-drift recovery path.
- **PO** authors the routing-checklist clause in `.claude/agents/product-owner.md` per `§7`. Brief: cite the skill name, document the seven server-side trigger patterns the PO must scan for, document the parallel-dispatch rule.

These three are PO's own lanes — Architect explicitly cannot ship them. Each is a small (~30-line) clause addition cross-referencing the skill.

### Deferred — FEAT/US/ARCH formalization

Per the brief, FEAT/US/ARCH wrapper for this convention is explicitly deferred. The skill is the durable rule that fires per Claude Code session. A follow-up wave should:
- BA allocates the next free FEAT (likely `FEAT-0006` — verify against `requirements/features/INDEX.md` registry which currently ends at FEAT-0005).
- BA authors the parent US (`requirements/user-stories/US-NNN-role-routing-server-vs-ui.md`).
- Architect authors ARCH-0003 at `architecture/features/FEAT-NNNN-role-routing/ARCH-0003-role-routing-server-vs-ui.md` ratifying the convention at the ADR layer.

Not blocking. The skill enforces the rule today; the FEAT/US/ARCH wrapper is the durable backstop for the architecture audit trail.

### Boundary observations (no action required Wave 139)

- The skill cross-references three `.claude/agents/*.md` clauses that do NOT yet exist. The cross-reference is forward-looking — once UI Dev / BE Dev / PO ship their clauses (separate parallel dispatch), the cross-references resolve. Until then the skill stands alone, anchoring the rule at the orchestrator boundary. Same pattern as `requirements-first/SKILL.md` predating some of its downstream-implementer hooks.
- `requirements/features/INDEX.md` currently ends at FEAT-0005. The follow-up wave's BA dispatch should allocate FEAT-0006 (or whichever is next-free at allocation time — monotonic, never reuse).
- The viewer repo's BE backfill (`backend/features/INDEX.md` BE-0001..BE-0009) is already on `main` per Wave 137 — no further BE retro-doc work needed for the historical viewer drift. Future viewer waves are covered by the skill's parallel-dispatch rule.

## ⏮️ PREV — 2026-06-05 — Wave 132 code-review gate (viewer PR #17 — PASS, Java/line-comment frontmatter)

### Wave-132 PASS verdict — PR #17 — SHA 901e19c0a8304f416239b97a9e071abcfd13d96e
- **Gate role:** architect (non-UI rubric — viewer PR #17, `feature/wave-132-runner-grouping-java-frontmatter`, HEAD `05d6ac1`). UI portion (runner sub-group headers + ▶Run-for-all-test-files in `public/app.js` + `public/style.css`) routes to UX Designer in parallel — NOT covered by this verdict.
- **Cross-repo verdict:** PR # refers to `keyan-commits/apex-team-viewer#17`. SHA `05d6ac1560de8538d5e22332be92eaed4a9a6ea2` is HEAD of `feature/wave-132-runner-grouping-java-frontmatter` in the viewer repo at gate time (verified via `gh pr view 17 -R keyan-commits/apex-team-viewer --json headRefOid`).
- **Timestamp:** 2026-06-05T12:03:00Z
- **Scope of this verdict:** the `parseFrontmatter` extension in `server.mjs` (line-comment frontmatter for `//` and `#` languages) plus its 14-test suite at `__tests__/frontmatter-parser.test.ts`. The runner sub-grouping JS/CSS additions in `public/app.js` + `public/style.css` are UX Designer's lane and explicitly out of scope here.
- **Suite green at gate HEAD:** `npm test` in isolated worktree at PR HEAD `05d6ac1` → **Test Files 3 passed (3), Tests 42 passed (42)** (frontmatter-parser 14, spawn-safety 7, runner-resolver 21). Duration 238ms. Zero regressions in the Wave 130 resolver suite + Wave 131 spawn-safety suite. Worktree `/tmp/arch-w132` cleaned up post-verification.

### Per-gate-criterion verification matrix (Wave 132 brief)

| Criterion | Verification | Result |
|---|---|---|
| **1a. Parser scans first 20 non-empty lines for `^(//|#)\s*(parent_feat|parent_us|feat|ticket|role|status)\s*:\s*(.+?)\s*$`** | Verified at `server.mjs:364` — `COMMENT_FM_RE = /^(?:\/\/|#)\s*(parent_feat|parent_us|feat|ticket|role|status)\s*:\s*(.+?)\s*$/`. Loop at `server.mjs:399-414` increments `nonEmptyCount` per non-blank line; `if (nonEmptyCount > 20) break;` at line 401 enforces the cap. Test `does not scan beyond 20 non-empty lines` (line 157-164) exercises the boundary (21 padded comments + 1 key on line 22 → null). | PASS |
| **1b. Stops at first non-comment line** | Verified at `server.mjs:411-413` — `else { /* First non-comment, non-blank line: stop scanning */ break; }`. Test `stops scanning at first non-comment line` (line 86-95) exercises: `// parent_feat: FEAT-0001` + `package com.example;` + `// parent_feat: FEAT-9999` → returns `FEAT-0001` only, second `parent_feat` never seen because `package` breaks the loop. | PASS |
| **1c. YAML `---` block still wins when present (no regression)** | Verified at `server.mjs:368-392` — YAML branch executes FIRST; if `parsed === true` returns immediately (line 389). Test `returns YAML values when --- block is present and has recognised keys` (line 172-186) exercises: YAML `parent_feat: FEAT-YAML` + body `// parent_feat: FEAT-COMMENT` → returns `FEAT-YAML`. Wave 132's 3-test YAML regression block (line 209-241) confirms standard YAML, quote-stripping, and unterminated-block-null behaviors all preserved. | PASS |
| **1d. Returns null gracefully on no-match (fail-soft semantics preserved)** | Verified at `server.mjs:417` — `return parsed ? result : null;`. Five negative tests cover: empty file, all-blank file, no-comment-header Java file, plain comments with no recognised keys, unterminated YAML block. All return null. Downstream consumers at `server.mjs:444` + `server.mjs:584` are guarded with `if (fm && ...)` checks — null is the documented contract. | PASS |
| **2. Test coverage — 14 new tests across positive/negative/edge** | Wave 118 comprehensive-testing rubric: **Positive** (5): basic Java header, `#` Python style, non-key comments interleaved, standard YAML regression, quote-stripping. **Negative** (5): no recognised keys, empty file, blank-only file, immediate-class-no-header, unterminated YAML. **Edge** (4): stop-at-non-comment, 20-line boundary, YAML-wins-over-comments, YAML-no-keys-no-fallthrough. All three categories covered. Test-shim at line 23-69 is **byte-for-byte identical** to production `server.mjs:366-415` (verified via `git show` side-by-side) — keep-in-sync risk is mitigated by the explicit comment at line 16-18. | PASS |
| **3. Project-agnostic** | `grep -i 'lfm\|order-sheet\|ordersheet' server.mjs` → zero hits. Only `lfm` occurrence in the entire PR diff is the Java fixture string `'package com.lfm.portal.ordersheet;'` at test line 81 — a sample input VALUE inside a string literal, not a code path. Parser depends on no workspace-specific path. Works on any repo whose test files carry `// parent_feat:` / `# parent_feat:` headers. Wave 130 nested-discovery skip-list + Wave 130 `.apex-viewer.json` config preserved unchanged. | PASS |
| **4. No NFR delta — parser purity, idempotence, no new side effects** | `parseFrontmatter(content: string): Record<string,string> \| null` — pure function: no I/O, no global mutation, no closure over external state. Callers at `server.mjs:444` (FEAT title lookup) + `server.mjs:584` (per-file ticket extraction) already invoke it inside `readFileSync` blocks — the existing I/O is unchanged. **Perf:** YAML-present path is identical to pre-Wave-132 (early-return at line 389). YAML-absent path adds an inner `content.split('\n')` traversal capped at 20 non-empty lines + a single regex per line (O(n) where n ≤ 20). Negligible — well under 1ms per file for realistic inputs. **Observability/deployment:** unchanged. **Availability:** unchanged. | PASS |
| **5. Security — frontmatter values not eval'd / not shell-interpolated** | `grep -n 'fm\[\|fm\.' server.mjs` → 5 consumer sites: `fm.title` (line 445, assigned to string field), `fm.parent_feat`/`fm.feat` (line 593, assigned to `featId`), `fm.ticket` (line 611), `fm.status` (line 612). None passed to `spawn`/`exec`/`Function`/`eval`/template-literal-in-shell. The two `spawn(...)` sites in `server.mjs` (line 918 runTest, line 955 runGh) are Wave 130/131-audited argv-array with no shell — neither consumes `fm.*`. **Threat model:** an attacker who can plant a malicious Java/Python file in a workspace can inject any string into `fm.parent_feat`, `fm.ticket`, etc. Downstream those strings flow into HTML via `esc(...)` at `public/app.js:166-167` (escaped) and into the FEAT-grouping bucket key (string compare). No code-execution path. Safe. | PASS |
| **6. Architecture/ co-authorship gate (Wave 109 #335)** | `git diff origin/main..feature/wave-132-architect-gate -- architecture/` empty. This Wave 132 architect-gate PR touches only `coordination/handoffs/architect.md` — Architect's own HANDOFF doc, my lane only. | PASS |
| **7. Peer-edit boundary (Wave 112)** | This PR touches only my own HANDOFF doc. No peer HANDOFF doc touched. UI Dev's own viewer PR is theirs (cross-repo), BA's requirements/ untouched, UX's design/ untouched, QA's tests/ untouched, DevSecOps's ops/ untouched. Boundary satisfied. | PASS |

### Verdict

**PASS** for the non-UI portion of viewer PR #17 (the `parseFrontmatter` extension and its 14-test suite). The implementation matches the design contract: line-comment frontmatter scanning for `//` and `#` comment-language test files, capped at 20 non-empty lines, stops at first non-comment line, YAML `---` block wins when present. Fail-soft (null) on no-match preserved. Pure function with no I/O, no security surface. Comprehensive test coverage across positive/negative/edge axes meets the Wave 118 rubric.

Per ADR-018 the verdict heading uses the real PR # (17) and the real 40-char HEAD SHA (`05d6ac1560de8538d5e22332be92eaed4a9a6ea2`). Merge SHAs backfilled by DevSecOps 2026-06-05: apex-team PR #423 → `ecef500eb22fadd9ef5a9a9da0d7f919b2ff18cf`; viewer PR #17 → `901e19c0a8304f416239b97a9e071abcfd13d96e`.

### Routing — UX Designer (UI portion) + QA next

- **UX Designer:** owns the UI portion of PR #17 — runner sub-group headers (`renderRunnerGroups`, `groupByRunner`, RUNNER_ORDER) + `▶ Run` button shown for ALL test files (not just resolver-known ones) + the new `.runner-group-header` / `.runner-group-count` CSS at `public/style.css:541-565`. Visual hierarchy + a11y (focus-visible on `.feat-run` for the previously-hidden unknown-runner test rows) + contrast (group header `#4a4e5a` on `#0a0a0c` background — UX should run a WCAG check) + visual regression (existing single-runner FEAT cards now have an extra sub-header; UX confirms `omitHeaderIfSingle = true` keeps single-group sections clean). Out of my lane.
- **QA:** gates AFTER both design gates (Architect's, here, and UX Designer's). With 42/42 green at PR HEAD including 14 new comprehensive frontmatter-parser tests, the parser surface is fully covered. QA's gate should add: (a) a smoke run against a real polyglot workspace (e.g. a workspace with `// parent_feat:` Java tests + standard YAML markdown frontmatter mixed) confirming the FEAT-grouping bucket fills correctly; (b) a runner sub-group rendering smoke (UI smoke — runs after UX PASS). Test soundness for the parser itself is already validated.
- **DevSecOps:** may proceed to merge once UX + QA gates clear. Standard merge-and-backfill flow.

### Non-blocking observations (no action required Wave 132)

1. **Test-narrative drift on the "YAML-no-keys" test (line 188-202).** The test's inline comment claims "we do NOT re-scan the body for `//` comments" — but the production code at `server.mjs:391-392` explicitly DOES fall through to the comment-scan loop when the YAML branch yields no recognised keys (`if (parsed) return result;` only returns when something matched; the comment at line 391 names the fallthrough intent). The test still passes because the `---` literal in the body trips the `else { break; }` branch of the comment loop on the first iteration (it's not blank, not `//`/`#`, not a key match). So the assertion is correct but for a different reason than the test narrative suggests. If anyone ever changes the loop's `else { break; }` to `else { continue; }` (loosening "stop-at-first-non-comment" to "skip-non-comment-lines"), this test would silently start parsing the body's `// parent_feat: FEAT-0001` and the assertion would fail. The asymmetry is **safe at HEAD** but worth fixing in a follow-up — either tighten the comment narrative ("returns null because `---` breaks the comment-loop on line 1") or tighten the production semantics (return null immediately if YAML branch entered but yielded nothing — explicit "YAML block wins or fails, never falls back"). Non-blocking. Filing as out-of-scope follow-up below.
2. **Test-shim keep-in-sync risk.** Test file at `__tests__/frontmatter-parser.test.ts:23-69` carries an inline copy of the production parser to avoid importing `server.mjs` (which has HTTP server side effects on import). The shim is byte-for-byte identical at HEAD — verified. The header comment at line 9-10 names the remediation: "If parseFrontmatter is later extracted to `lib/frontmatter-parser.mjs`, this test file should be updated to import from there." This is the right call — extraction is a future refactor, not in scope for Wave 132. Non-blocking. Tracking as candidate cleanup below.
3. **`feat` and `role` keys not exercised by Wave 132 tests.** The parser recognises 6 keys (`ticket`, `parent_feat`, `feat`, `parent_us`, `role`, `status`) but the new test block exercises only 4 of them (`parent_feat`, `parent_us`, `ticket`, `status`). `feat` and `role` are covered by existing pre-Wave-132 behavior for YAML inputs, and the line-comment regex treats all 6 keys symmetrically (single alternation group). Non-blocking — coverage gap is symmetry, not defect.

### Out-of-scope follow-ups (filed inline; no GH issues — both are <5-LOC clarifications)

- **F1 (Wave 133+ candidate):** Either update the test narrative comment at `__tests__/frontmatter-parser.test.ts:189-191` to name the real reason for null (`---` trips the break on line 1), OR tighten production semantics at `server.mjs:391-392` to explicitly return null when YAML branch was entered but yielded no recognised keys (rejecting the comment-scan fallback path entirely). The latter is the more defensible long-term posture — once `---` is seen, the file is asserting "I am YAML"; if its YAML has no recognised keys, that's a parser-soft-fail and we should NOT silently rescue via the comment scan. Either way it's <5 LOC. Owner: UI Dev or anyone touching the parser next.
- **F2 (Wave 133+ candidate):** Add `feat:` and `role:` keys to the Wave 132 test block (4 tests' worth — 1 positive Java + 1 positive Python + 2 mixed-key) to close the coverage symmetry gap noted in observation 3. Owner: QA or UI Dev next time the parser is touched.

### Architecture/ co-authorship gate (Wave 109 rule, self-reflection for this gate PR)

This Wave 132 architect-gate PR (apex-team `feature/wave-132-architect-gate` off `main@c062267`) touches exactly one file: `coordination/handoffs/architect.md`. Zero peer files edited. Zero `architecture/` files edited (Wave 132 is a code-review gate on a parser extension, not an architecture artifact change — no novel NFRs surfaced; the existing fail-soft + pure-function posture is preserved). Both gates satisfied.

### Peer-edit boundary (Wave 112)

This PR touches only my own HANDOFF doc. No peer HANDOFF doc touched. Boundary satisfied.

### In flight / next

- **DONE:** Gated viewer PR #17 at HEAD `05d6ac1`. PASS verdict for non-UI portion (parser + tests). 42/42 suite green. Two non-blocking observations filed as Wave 133+ candidates inline (F1 + F2).
- **UX Designer next:** owns the UI portion gate (runner sub-group rendering + ▶Run-for-all-test-files visual + a11y).
- **QA next:** gates after both design gates (Architect's here + UX Designer's). Polyglot smoke run recommended.
- **DevSecOps next:** merge viewer PR #17 + this apex-team Wave 132 architect-gate PR once UX + QA gates clear.

### Parked / future (carried from Wave 131 + Wave 132 additions)

- `system-design.md` — still not created.
- `tech-stack.md` — still not created.
- `coding-standards.md` — still not created. Wave 117 + Wave 118 + Wave 122 + Wave 128 + Wave 131 + Wave 132 (test-shim hygiene, frontmatter purity) discipline are candidate entries once seeded.
- Fitness function for OQ-085-001's "no binary files committed under `tests/qa/wave-*/evidence/`" — QA owns implementation.
- Viewer-repo subagent body audit (per ADR-017 follow-up).
- ADR formalizing the ADR-NNNN-vs-ARCH-XXXX distinction (candidate ADR-019, deferred from Wave 122).
- WCAG 2.1 AA promotion from FEAT-local ratification to workspace-conventions-level NFR (carried from Wave 125).
- ADR for the keyboard-reachability rule (carried from Wave 125).
- Automated WCAG conformance in viewer CI (carried from Wave 125).
- CI automation for Wave 128 artifact disciplines (S1/S5/S6/S7) — LibreOffice headless + image diff + contrast gate + deploy-verification (carried from Wave 128b).
- Structured QA verdict-block schema attesting S1–S9 (ADR-018 amendment candidate, carried from Wave 128b).
- Resolver decision-tree codification candidate ADR (or `architecture/features/FEAT-NNNN-polyglot-run/ARCH-NNNN-runner-resolver-decisions.md` if the viewer adopts the Wave 122 convention) — carried from Wave 130.
- ADR candidate "No `shell:true` on user-data-derived argv" — sibling to NFR-SEC-001 once `nfr.md` exists. Carried from Wave 131.
- Architectural lint candidate — CI grep gate failing any PR introducing `shell:\s*(true|.*===)` on `spawn`/`exec`. DevSecOps lane. Carried from Wave 131.
- **NEW (Wave 132):** F1 — tighten `parseFrontmatter` YAML-no-keys semantics (either narrative or code; see Out-of-scope follow-ups above). <5 LOC.
- **NEW (Wave 132):** F2 — add `feat:` + `role:` coverage to the frontmatter-parser test block (4 tests). Owner: QA or UI Dev next time the parser is touched.
- **NEW (Wave 132):** Extraction candidate — pull `parseFrontmatter` (plus `FRONTMATTER_KEYS` + `COMMENT_FM_RE`) out of `server.mjs` into a standalone `lib/frontmatter-parser.mjs`. Would let the test file `import` directly instead of duplicating. Worthwhile once the parser grows a 3rd recognised input format (e.g. block-comment frontmatter `/* parent_feat: ... */`). Not urgent — current shim is byte-stable and the test header documents the keep-in-sync contract.

### Notes / caveats (Wave 132)

- The UI portion of PR #17 (runner sub-grouping in `public/app.js` + `.runner-group-header` CSS) is genuinely UI-design work — visual hierarchy, header weight, contrast, single-vs-multi-runner conditional rendering. UX Designer's lane. The brief noted "UI portion is UX's lane" and I respected that — my verdict scopes ONLY to `server.mjs` + `__tests__/frontmatter-parser.test.ts`.
- The `.runner-group-header` styling at `public/style.css:541-560` uses `color: #4a4e5a` on `background: #0a0a0c` — a contrast ratio of ~3.1:1 by eyeball (UX should verify formally). Per WCAG 2.1 AA, that's BELOW the 4.5:1 threshold for normal text. At 11px font-size with `font-weight: 600`, it does NOT qualify as "large text" (≥18.66px regular or ≥14px bold). UX Designer should flag this. Filing as an observation here but NOT as a blocker on my non-UI gate.
- Cross-repo verdict means SHA `05d6ac1560de8538d5e22332be92eaed4a9a6ea2` is the viewer's HEAD at gate time, not apex-team's. apex-team's main HEAD at gate time is `c062267` (this gate's branch is `feature/wave-132-architect-gate` off that base).
- Wave 131 verdict (viewer PR #16) demoted to PREV below per ADR-018 convention.

---

## PREV — 2026-06-05 — Wave 131 security gate (viewer PR #16 — PASS, closes #14)

### Wave-131 PASS verdict — PR #16 — SHA 847b7c45037f7933ad95f66433c91b30c46c6f12
- **Gate role:** architect (non-UI security rubric — viewer PR #16, `feature/wave-131-shell-injection-fix`, HEAD `847b7c4`).
- **Cross-repo verdict:** PR # refers to `keyan-commits/apex-team-viewer#16`. SHA `847b7c45037f7933ad95f66433c91b30c46c6f12` is HEAD of `feature/wave-131-shell-injection-fix` in the viewer repo at gate time.
- **Timestamp:** 2026-06-05T00:08:00Z
- **Closure of CONCERN 2 (Wave 130):** `server.mjs:885` (was line 887 pre-fix, +2 line drift from inserted comment) no longer has any `shell:` option in the `runTest` spawn call. `grep -nE 'shell\s*:' server.mjs` returns only comment lines (885, 887 — narrative explaining why the option is absent). Wave 130's CONCERN 2 (Gradle wrapper command-injection vector via `shell: command === './gradlew'` interpolating shell metacharacters in class-name args derived from `basename(absPath, '.java')`) is fully closed. `keyan-commits/apex-team-viewer#14` can be closed by DevSecOps post-merge.
- **Argv-array safety re-verified:** the `spawn(command, args, { cwd, env })` call at server.mjs:882 now passes through Node's `posix_spawn`/`posix_spawnp` without `/bin/sh -c` interpolation. A class-name containing shell metacharacters (`Bad$(touch${IFS}tmp-pwned)Test`, `Evil` `id` `Test`, etc.) is delivered as a literal argv element to `gradle --tests` and `mvn -Dtest=`. Gradle/Maven receive a missing-class error rather than executing the metacharacter expression. Threat-model: closed.
- **Audit completeness:** comprehensive grep across `server.mjs` confirms ONLY two `spawn(...)` sites: (a) line 882 — `runTest` — now shell-free per this fix; (b) line 919 — `runGh` — hardcoded `spawn('gh', args, { cwd: root })` with no `shell:` option, no untrusted argv (the `args` are constructed inline by `getCi`/`getPrs` from constant strings). No `exec`/`execSync`/`execFile` shell-out sites in viewer source. Threat surface is exhaustively reduced.
- **Regression test soundness:** new `__tests__/spawn-safety.test.ts` (7 tests, 144 lines):
  - 3 class-name-literal tests: gradle wrapper with `$(...)`, gradle bare with backtick `\`id\``, maven with `$(...)`. Each asserts the resolver-extracted className lands in the args array as a verbatim string (no shell interpretation upstream of spawn).
  - 4 spawn-shape contract tests: gradle (wrapper) / gradle (bare) / maven / playwright resolver return values assert `expect(result).not.toHaveProperty('shell')` — defence-in-depth catching any future refactor that smuggles `shell:true` back into the resolver's return shape.
  - Full viewer suite at HEAD `847b7c4`: **28/28 PASS** (`Test Files 2 passed, Tests 28 passed`, Duration 250ms). Wave 130's 21 resolver tests preserved + 7 new spawn-safety tests added — no regression.
- **Functional regression check — relative `./gradlew` resolution under posix_spawn:** Node's `child_process.spawn` calls libuv's `uv_spawn`, which on POSIX systems performs `posix_spawnp` when the command contains no `/` (PATH lookup) and `posix_spawn` when it does. `./gradlew` contains a `/` so it resolves relative to the spawn's `cwd` parameter via the documented `chdir → execve` semantics in libuv's `process.c`. This is well-defined POSIX behavior — gradle wrapper invocation continues to work exactly as before for benign filenames. The shell branch was only there as historical paranoia about wrapper executability; the `+x` bit on `./gradlew` is the project's own responsibility (standard `gradle init` makes it executable). No platform-specific Windows concern in scope (viewer is not Windows-targeted; Node on Windows uses its own command-line tokenizer rather than `posix_spawn`, but that's irrelevant here).
- **No new NFR delta:** security envelope tightens (one fewer command-injection vector); perf unchanged (saving `/bin/sh` startup actually shaves a few ms per spawn); observability unchanged (start-event SSE shape preserved — `command/cwd/runner` JSON still emitted at server.mjs:880); deployment unchanged. Matches Wave 130 ARCH posture exactly minus the CONCERN-2 caveat.
- **Architecture/ co-authorship gate (Wave 109 #335):** `git diff origin/main..HEAD -- architecture/` empty. This Wave 131 architect-gate PR touches only `coordination/handoffs/architect.md` — Architect's own HANDOFF doc, my lane only. Peer-edit boundary (Wave 112): no peer HANDOFF doc touched. Both gates satisfied.

### Per-gate-criterion verification matrix (Wave 131 brief)

| Criterion | Verification | Result |
|---|---|---|
| **1. Vulnerability closed (no `shell: ...` on `runTest` spawn)** | `grep -nE 'shell\s*:' ../apex-team-viewer/server.mjs` → only comment lines at 885+887 explaining absence. `server.mjs:882` spawn options block: `{ cwd, env: ... }` only. | PASS |
| **2. Audit completeness (no other `shell:true` spawn/exec in viewer)** | Two spawn sites total: `runTest` (now shell-free) + `runGh` (hardcoded `'gh'`, no shell option, no untrusted argv). No `exec`/`execSync`/`execFile` shell-string sites. | PASS |
| **3. Regression-test soundness (28/28 incl. literal-preservation + spawn-shape contract)** | `npm run test` at viewer HEAD `847b7c4` → `Test Files 2 passed (2), Tests 28 passed (28)`. 7 new + 21 Wave-130 preserved. Spec covers `$(...)`, backtick, and the no-shell contract across all four JVM/E2E runners. | PASS |
| **4. Functional regression (relative `./gradlew` still resolves under posix_spawn with cwd)** | Node `child_process.spawn` → libuv `uv_spawn` → `posix_spawn` for paths containing `/`. `./gradlew` resolved relative to `cwd` parameter per documented libuv `chdir+execve` semantics. Wrapper executability is `gradle init`'s contract. Behavior preserved for benign filenames. | PASS |
| **5. No new NFR delta (security improves; perf/observability unchanged)** | Security envelope tightens (Wave 130 CONCERN 2 closed). Perf saves `/bin/sh` startup per spawn. Observability: SSE start-event shape (`command/cwd/runner` JSON) preserved at server.mjs:880. Deployment unchanged. | PASS |

### Verdict

**PASS** for non-UI security rubric. Closes Wave 130 CONCERN 2. Closes `keyan-commits/apex-team-viewer#14`. UI Dev's threat-model analysis in the PR body is accurate (low-likelihood, real — attacker-planted Java filename + user-clicked ▶ Run). The fix is the minimum viable patch — drop the `shell:` option entirely; the inline comment correctly documents the rationale for future maintainers.

Per ADR-018 the verdict heading uses the real PR # (16) and the real 40-char HEAD SHA (`847b7c45037f7933ad95f66433c91b30c46c6f12`). DevSecOps post-merge will backfill the merge SHA if it differs from HEAD.

### Routing — QA + DevSecOps next

- **QA:** new spawn-safety regression tests live in the viewer repo. Architect PASS opens the QA gate on viewer PR #16; QA may dispatch a smoke run against the patched code (gradle wrapper + maven runner still produces expected output for benign filenames; ideally a manual confirmation with a `FooTest.java` in a real workspace). Test soundness is already validated by the 7-test regression suite.
- **DevSecOps:** may merge viewer PR #16 once QA gate clears + close `keyan-commits/apex-team-viewer#14` referencing the merge commit. Standard merge-and-backfill flow.
- **No UI gate needed:** PR #16 touches only `server.mjs` + `__tests__/spawn-safety.test.ts`. Zero UI surface — no `.tsx`, no `globals.css`, no `public/app.js`. UX Designer not required for this PR.

### Architecture/ co-authorship gate (Wave 109 rule, self-reflection for this gate PR)

This Wave 131 architect-gate PR (apex-team `feature/wave-131-architect-gate` off `main@f43eded`) touches exactly one file: `coordination/handoffs/architect.md`. Zero peer files edited. Zero `architecture/` files edited (Wave 131 is a security-fix gate, not an architecture artifact change — no novel NFRs surfaced; the shell-injection class is already covered by Wave 130 ARCH posture). Both gates satisfied.

### Peer-edit boundary (Wave 112)

This PR touches only my own HANDOFF doc. No peer HANDOFF doc touched. UI Dev's own viewer PR is theirs (cross-repo), BA's requirements/ untouched, UX's design/ untouched, QA's tests/ untouched, DevSecOps's ops/ untouched. Boundary satisfied.

### In flight / next

- **DONE:** Gated viewer PR #16 at HEAD `847b7c4`. Posted PASS verdict to PR #16 comment. Closed CONCERN 2 from Wave 130. `apex-team-viewer#14` ready for DevSecOps to close on merge.
- **QA next:** smoke verification + green-light for DevSecOps merge.
- **DevSecOps next:** merge viewer PR #16 → close `apex-team-viewer#14` → merge this apex-team Wave 131 architect-gate PR.
- **Wave 130 follow-ups still tracked:** Wave 130 architect-gate PR (#418) merged at `8e36637`. Wave 128b PR # + SHA already backfilled in Wave 130 commit `201e8fa` (verified in main log).

### Parked / future (carried from Wave 130 + Wave 131 additions)

- `system-design.md` — still not created.
- `tech-stack.md` — still not created.
- `coding-standards.md` — still not created. Wave 117 + Wave 118 + Wave 122 + Wave 128 + Wave 131 discipline (argv-array spawn / no shell:true for any user-data-derived argv) are candidate entries once seeded.
- Fitness function for OQ-085-001's "no binary files committed under `tests/qa/wave-*/evidence/`" — QA owns implementation.
- Viewer-repo subagent body audit (per ADR-017 follow-up).
- ADR formalizing the ADR-NNNN-vs-ARCH-XXXX distinction (candidate ADR-019, deferred from Wave 122).
- WCAG 2.1 AA promotion from FEAT-local ratification to workspace-conventions-level NFR (carried from Wave 125).
- ADR for the keyboard-reachability rule (carried from Wave 125).
- Automated WCAG conformance in viewer CI (carried from Wave 125).
- CI automation for Wave 128 artifact disciplines (S1/S5/S6/S7) — LibreOffice headless + image diff + contrast gate + deploy-verification (carried from Wave 128b).
- Structured QA verdict-block schema attesting S1–S9 (ADR-018 amendment candidate, carried from Wave 128b).
- Resolver decision-tree codification candidate ADR (or `architecture/features/FEAT-NNNN-polyglot-run/ARCH-NNNN-runner-resolver-decisions.md` if the viewer adopts the Wave 122 convention) — carried from Wave 130.
- **NEW (Wave 131):** ADR candidate "No `shell:true` on user-data-derived argv" — promotes Wave 131's reinforced rule to a durable cross-cutting standard (sibling to NFR-SEC-001 once `nfr.md` exists). Trigger: third recurrence of a `shell:true` regression on a `spawn`/`exec` call where ANY argv element is derived from filesystem/user input. The viewer's two-strikes (CONCERN 2 in Wave 130 → fix in Wave 131) doesn't quite meet the threshold yet; the next time we see it anywhere in the workspace, the rule should be promoted.
- **NEW (Wave 131):** Architectural lint candidate — a CI grep gate that fails any PR introducing `shell:\s*(true|.*===)` on a `spawn`/`exec` call. DevSecOps lane. Low-effort, high-precision regression prevention. Currently uncovered by the test suite (spawn-safety tests cover the resolver-shape contract but not future regressions in unrelated spawn sites). Filed inline here rather than as a github issue because the rule is one-line.

### Notes / caveats (Wave 131)

- The shell-injection class is a textbook command-injection vector — UI Dev's threat-model description ("attacker plants malicious Java filename + user clicks ▶ Run") is the minimal viable scenario. Real-world likelihood depends on supply-chain hygiene (an SCM-imported test fixture; a compromised dependency that drops files into `src/test/java/`). Low likelihood, high blast radius if it lands — the right tier of fix is exactly this: drop the `shell:` option, no shell-escape gymnastics, no allowlist regex on class names. Defense-in-depth wins over defense-in-string.
- The PR description's claim "Backward compatibility — `spawn('./gradlew', args, { cwd })` resolves correctly without a shell" is accurate per libuv's `uv_spawn` semantics. I verified the documentation chain (Node `child_process.spawn` → libuv `process.c` → POSIX `posix_spawn`). Windows is not in supported targets; if it ever enters scope, Node's Windows command-line tokenizer has its own quoting rules that would need a separate audit.
- The 2 new untracked files in the viewer repo (`pnpm-lock.yaml`, `pnpm-workspace.yaml`) are NOT part of PR #16 and are out-of-scope for this gate. They appear to be local-only artifacts (probably from a stray `pnpm install` in the viewer repo). Flagging for UI Dev to either gitignore or commit deliberately in a follow-up; not a gate blocker.
- Cross-repo verdict means SHA `847b7c45037f7933ad95f66433c91b30c46c6f12` is the viewer's HEAD at gate time, not apex-team's. apex-team's main HEAD at gate time is `f43eded` (post-Wave 130 SHA-backfill commit `201e8fa` merged via PR #419).

---

## PREV — 2026-06-04 — Wave 130 code-review re-gate (viewer PR #13 — PASS)

### Wave-130 PASS verdict — PR #13 — SHA dd70fffa4e4499c9a9ee0778e06fc78a1c8b9d11
- **Gate role:** architect (non-UI rubric — re-gate of viewer PR #13 after UI Dev applied the 1-line fix for prior CONCERN 1).
- **Cross-repo verdict:** PR # refers to `keyan-commits/apex-team-viewer#13`. Re-gate HEAD SHA `dd70fffa4e4499c9a9ee0778e06fc78a1c8b9d11` (was `b205ec18159017ec154709d8025d6bb2b4798215` at CONCERNS gate; +1 commit `dd70fff` fix(viewer): pass existsSync to detectPackageManager).
- **Timestamp:** 2026-06-04T23:52:00Z
- **Closure of CONCERN 1:** `git diff b205ec1..dd70fff -- server.mjs` shows exactly the 1-line fix at `server.mjs:857`: `const pm = detectPackageManager(root, existsSync);` — matches the fix I prescribed in the prior verdict. `existsSync` was already imported at server.mjs:13, no new import needed.
- **Regression-test coverage added:** UI Dev added a new describe block `detectPackageManager — orphan fallback (regression)` in `__tests__/runner-resolver.test.ts` with 2 tests: (1) does-not-throw + returns `"npm"` when no lock file exists, (2) returns `"pnpm"` when `pnpm-lock.yaml` present. The first test specifically covers the path that produced the original `TypeError: existsFn is not a function`. Resolver-suite count moved from 19 → 21 tests.
- **Suite green at re-gate HEAD:** `npx vitest run` on `pr-13-head` (sha `dd70fff`) → `Test Files 1 passed (1), Tests 21 passed (21), Duration 732ms`. No regressions in the existing 19 resolver tests; the 2 new tests pass on the patched code.
- **CONCERN 2 (Gradle wrapper `shell: true` at `server.mjs:887`)** remains out-of-scope per the original verdict — filed and tracked as `keyan-commits/apex-team-viewer#14` (`bug` label). Does NOT block this PASS. Must be patched before any user is encouraged to ▶ Run Gradle test files in production; Gradle runner currently has no in-tree integration test exercising the vulnerable path.
- **Per-rubric matrix:** unchanged from CONCERNS gate (all 9 axes PASS — see sub-block below). The only delta is CONCERN 1 closure; CONCERN 2 still tracked externally.
- **Architecture/ co-authorship gate (Wave 109 #335):** `git diff origin/main..origin/feature/wave-130-architect-gate -- architecture/` empty. This re-gate amends onto the existing Wave 130 architect-gate PR #418 (single-file edit to this HANDOFF doc). Architect's own lane only. Peer-edit boundary (Wave 112) satisfied — no peer HANDOFF doc touched.
- **Merge SHA (post-merge backfill — Wave 130):** apex-team PR #418 → `8e36637f4529d6f8d3207734f08a9f18215ac5c1`; viewer PR #13 → `6d7f0fdb0c9af73a27303407175ec4a8b956a03b`. Backfilled by DevSecOps 2026-06-04.

### Routing — DevSecOps may merge

With this PASS, the Wave 130 gate stack is:
- **Architect (this):** PASS @ `dd70fff` for the non-UI rubric.
- **UX Designer:** owns runner-badge visual / a11y gate — separate; not blocked by this verdict.
- **QA:** gates after Architect PASS. With the 2 new regression tests + 21/21 suite green at re-gate HEAD, QA has positive verification surface on the previously-uncovered orphan-fallback path.

DevSecOps may proceed to merge viewer #13 + apex-team #416 (UI Dev HANDOFF refresh) + #417 (UX Designer's slot) + #418 (this Architect re-gate) once QA + UX gates clear.

### Prior Wave-130 CONCERNS verdict (RESOLVED by `dd70fff`)

Demoted from primary verdict per re-gate convention. The original 2026-06-04T23:42:00Z CONCERNS gate at SHA `b205ec18159017ec154709d8025d6bb2b4798215` is preserved below for traceability:

#### Wave-130 CONCERNS verdict — PR #13 — SHA b205ec18159017ec154709d8025d6bb2b4798215 (SUPERSEDED by dd70fff)
- **Gate role:** architect (non-UI rubric — runner-resolution decision tree, nested discovery, SSE shape, security envelope, backward compat across `keyan-commits/apex-team-viewer#13`). UI surface (runner-badge CSS + per-row render in `public/style.css` + `public/app.js`) routes to UX Designer in parallel — NOT covered by this verdict.
- **Cross-repo verdict:** PR # refers to `keyan-commits/apex-team-viewer#13` (not apex-team#13). SHA `b205ec18159017ec154709d8025d6bb2b4798215` is HEAD of `feature/wave-130-polyglot-run` in the viewer repo.
- **Timestamp:** 2026-06-04T23:42:00Z
- **Notes:** Reviewed the polyglot runner extraction + nested discovery + SSE start-event JSON shape + `.apex-viewer.json` project-root config + Maven/Gradle/Playwright/Jest/Vitest resolver decision tree. 19/19 resolver unit tests pass. apex-team baseline 722/1 skipped post-Wave 129 — unaffected by Wave 130 (no apex-team source touched). One blocking-quality bug found in `server.mjs:857` fallback path (`detectPackageManager(root)` missing the `existsFn` arg required by the resolver-module function signature — throws TypeError when `resolveRunner` returns null cleanly, which the resolver's own test #3 deliberately exercises). One out-of-scope security finding — Gradle wrapper invocation uses `shell: command === './gradlew'` which makes the className arg (derived from `basename(absPath, '.java')`) a command-injection vector for malicious Java filenames in the workspace — filed as `keyan-commits/apex-team-viewer#14` (`bug` label). Both concerns are documented in the PR #13 inline comment with concrete reproduction + 1-line fixes. CONCERNS rather than FAIL because (a) Bug 1 is unreachable for apex-team's own workflow (root `package.json` exists so resolver returns vitest+root, never null), and (b) Bug 2's threat model requires the user to ▶ Run a maliciously-named file in their own workspace. UI Dev's call: patch in this PR (preferred, 1-line) and I re-gate to PASS, or acknowledge the fallback is documented-unused-for-apex-team and ship as-is. Architecture/ co-authorship gate (Wave 109 #335) verified on companion apex-team PR #416: `git diff origin/main..origin/feature/wave-130-handoff-refresh -- architecture/` is empty (PR #416 touches only `coordination/handoffs/ui-developer.md`, UI Dev's own lane). This Wave 130 architect-gate PR ships against `feature/wave-130-architect-gate` off `main@b6a8515449146695ebbcbcb83f9bf70e2cfe552a` with a single-file edit to this HANDOFF doc — Architect's own lane, no peer co-authorship, both gates satisfied. PR # placeholder per ADR-018 Wave 111b amendment until DevSecOps post-merge backfill replaces with real PR # + merge SHA.

#### Per-rubric verification matrix (Wave 130 viewer PR #13 — applies unchanged at re-gate)

| Rubric axis | Verification | Result |
|---|---|---|
| **Decision tree correctness** | Maven > Gradle ordering (resolver-test #11), wrapper > bare gradle (test #8), `build.gradle.kts` (test #10), JS PM precedence pnpm>yarn>npm (lib/runner-resolver.mjs:51-56), playwright before package-tooling for `*.spec.*` (createResolver line 175-179), `findAncestorContaining` correctly terminates at filesystem root (line 32-40). | PASS |
| **Project-agnostic** | Zero LFM paths anywhere. `loadProjectRoots` honors `.apex-viewer.json` `projects[]` if present, otherwise depth-3 auto-detect via `BUILD_FILES` sentinels (`package.json`, `pom.xml`, `build.gradle{,.kts}`, all 4 `playwright.config.*`). `walkQaPolyglot` skip-list is reasonable. | PASS |
| **SSE start event additive** | server.mjs:880 emits `JSON.stringify({command, cwd, runner})`; app.js:484-493 falls back to plain-text via `try/catch JSON.parse`. Within-repo back-compat preserved (no external SSE consumers documented). | PASS |
| **Configurable timeouts** | `APEX_VIEWER_MAVEN_TIMEOUT_MS` default 300s, `APEX_VIEWER_VITEST_TIMEOUT_MS` default 60s, env-overrideable. Routing in `runTest` at line 892 picks per-runner family. JVM cold start handled. | PASS |
| **Nested discovery skip-list** | `QA_SKIP_DIRS`: node_modules / .git / dist / build / target / .next / .gradle / _archive / .turbo / .cache / coverage + dotfile guard at line 473. `hardLimit = 1000` caps worst case. | PASS |
| **Argv-array spawn / path safety** | `spawn(command, args, {cwd})` everywhere with arrays. `safeJoin` enforces workspace boundary on the input path at server.mjs:846. ClassName extraction regex (`/Test\.java$|Tests\.java$/`) doesn't expose regex injection — `basename` is the only downstream consumer. | PASS (but see CONCERN 2) |
| **Backward compat (apex-team root vitest)** | `resolveJsRunner` with root `package.json` + `vitest` in `devDependencies` returns `{ command: pm, args: ['vitest', 'run', relPath], cwd: root, runner: 'vitest' }` — apex-team's own workflow uses the PRIMARY path, not the fallback. Functional behavior preserved. | PASS |
| **No NFR delta** | Same security envelope, same perf profile (resolver O(depth) per file, hard-limited discovery), same deployment model. No new prod runtime deps (vitest is devDep). | PASS |
| **Architecture/ co-authorship gate (apex-team PR #416)** | `git diff origin/main..origin/feature/wave-130-handoff-refresh -- architecture/` empty. PR #416 touches only `coordination/handoffs/ui-developer.md`. | PASS |

#### CONCERN 1 — `runTest` fallback path calls `detectPackageManager` with wrong arity (CLOSED at dd70fff)

`server.mjs:857`:

```js
const pm = detectPackageManager(root);   // missing existsFn arg
```

`lib/runner-resolver.mjs:51`:

```js
export function detectPackageManager(projectDir, existsFn) {
  if (existsFn(join(projectDir, 'pnpm-lock.yaml'))) return 'pnpm';
  ...
}
```

When `resolveRunner` returns null (resolver-test #3 deliberately exercises this — "returns null when no package.json ancestor found"), the fallback at line 855-859 fires. `existsFn(...)` throws `TypeError: existsFn is not a function`. The outer try/catch at 860 catches and surfaces as `runner resolution failed: existsFn is not a function`.

Locally reproduced:

```
$ node -e "const m=await import('./lib/runner-resolver.mjs'); m.detectPackageManager('/tmp')"
TypeError: existsFn is not a function
```

Unreachable for apex-team's own workflow (root `package.json` exists; resolver returns vitest+root). But ANY workspace with an orphan test file outside any project boundary hits it. Escaped the test suite because tests cover the resolver in isolation; nothing exercises `runTest`'s fallback.

**Fix (1-line):** `const pm = detectPackageManager(root, existsSync);` — `existsSync` is already imported at `server.mjs:13`.

#### CONCERN 2 — Gradle wrapper shell-injection (out-of-scope, filed as keyan-commits/apex-team-viewer#14 — STILL OPEN)

`server.mjs:887`: `spawn(command, args, { cwd, env, shell: command === './gradlew' })`. The `shell:true` branch runs argv through `/bin/sh -c`, so shell metacharacters in any arg execute. ClassName comes from `basename(absPath, '.java')` — filename `Bad$(rm -rf $HOME)Test.java` yields className `Bad$(rm -rf $HOME)Test`, command substitution fires.

Threat model: low (attacker has to land a malicious filename in your workspace AND user has to ▶ Run it). Fix: drop `shell: command === './gradlew'` entirely; `spawn('./gradlew', args, { cwd })` resolves correctly without a shell (verified locally — `ENOENT` raised when gradlew missing, which is the expected resolution mode).

Filed as **`keyan-commits/apex-team-viewer#14`** with `bug` label. Out-of-scope for THIS verdict (Gradle runner has no in-tree test exercising it yet); should be patched before any user is encouraged to ▶ Run Gradle tests in production.

#### Non-blocking observations (no action required Wave 130)

1. **`relative` import** at `lib/runner-resolver.mjs:14` is used at lines 92 + 120 — clean. Flagged only because import-rot is on my rubric axis.
2. **`runner: 'unknown'` UX** — resolver returns `{runner: 'unknown'}` when `package.json` exists but neither vitest nor jest declared (resolver line 100). Badge correctly hides (app.js:167: `f.runner !== 'unknown'` check). The SSE start event shows `npm test -- <relPath>` which may confuse users on mocha/tap projects. Worth a small UX caveat in a follow-up — not blocking.
3. **`walkQaPolyglot` resolver call per file** — server.mjs:485 resolves runner for EVERY discovered file at discovery time. Bounded at 1000 entries by `hardLimit`, but if `listRoleGrouped` is polled at 10s (app.js:739 interval), that's N × calls. Memoizing on path + mtime would be a reasonable optimization if profile shows hotspot. Non-blocking — current profile is fine.

#### Path forward (UI Dev choice — RESOLVED — chose Option A)

- **Option A (recommended) — TAKEN:** UI Dev patched CONCERN 1 in PR #13 — single-line `detectPackageManager(root, existsSync)` + 2 regression tests. Architect re-gated to PASS (top of NOW block, sha `dd70fff`).
- ~~Option B: acknowledge + file tracking issue.~~ Not taken — Option A is the correct call.

QA gates after Architect PASS. UX Designer separately gates the UI portion (runner-badge styling + per-row badge render) — out of my lane.

#### Cross-repo HANDOFF location

- **viewer-repo HANDOFF doc:** if `keyan-commits/apex-team-viewer` has its own HANDOFF doc, the Wave 130 verdict belongs there too via the viewer's own gating loop. Per Wave 109 #335, cross-repo coordination is `gh pr comment` first (already posted), HANDOFF doc second (this file is apex-team's; viewer-repo HANDOFF backfill is DevSecOps's call at Lane 3 if applicable).
- **apex-team-side HANDOFF refresh:** PR #416 is UI Dev's own HANDOFF refresh referencing the viewer PR — verified above. Architecture/ co-authorship gate satisfied.

### Architecture/ co-authorship gate (Wave 109 rule, self-reflection for this re-gate PR)

PR #418 (Wave 130 architect re-gate, branch `feature/wave-130-architect-gate` off `main@b6a8515`) touches exactly one file: `coordination/handoffs/architect.md`. Zero peer files edited. Zero `architecture/` files edited (this is a HANDOFF refresh, not an architecture artifact change — Wave 130 didn't surface novel NFRs). Both gates satisfied.

### Peer-edit boundary (Wave 112)

This PR touches only my own HANDOFF doc. No peer HANDOFF doc touched. UI Dev's own PR #416 is theirs, BA's requirements/ untouched, UX's design/ untouched, QA's tests/ untouched, DevSecOps's ops/ untouched. Boundary satisfied.

### In flight / next

- **DONE:** Re-gated Wave 130 viewer PR #13 to PASS at `dd70fff` after UI Dev's 1-line fix + 2 regression tests landed. PASS verdict posted to PR #13 comment.
- **DevSecOps next:** merge viewer PR #13, then apex-team PRs #416 (UI Dev HANDOFF) + #417 (UX Designer slot, when ready) + #418 (this re-gate) per the standard Wave 130 merge queue. Architect gate is closed; QA + UX still hold their own gates.
- Wave 130 UI gate (runner-badge a11y, focus-visible behavior on the new badge, contrast on per-runner accent colors) is UX Designer's lane — not blocked by Architect PASS.
- apex-team-side QA's `tests/qa/wave-130/` (if any) covers the apex-team-side integration concern — not in this PR's diff. The new viewer-repo regression tests cover the orphan-fallback path that produced CONCERN 1.
- Wave 128b PR # + SHA backfill still pending from DevSecOps (`PR #0` placeholder in prior PREV block — see below).
- `keyan-commits/apex-team-viewer#14` (Gradle wrapper shell-injection) remains open. Owner: UI Dev or DevSecOps for the viewer repo. Trigger: before any user is encouraged to ▶ Run Gradle test files; or before the Gradle runner ships an in-tree integration test.

### Parked / future (carried from Wave 128b + Wave 130 additions)

- `system-design.md` — still not created.
- `tech-stack.md` — still not created.
- `coding-standards.md` — still not created. Wave 117 + Wave 118 + Wave 122 + Wave 128 discipline are candidate entries once seeded.
- Fitness function for OQ-085-001's "no binary files committed under `tests/qa/wave-*/evidence/`" — QA owns implementation.
- Viewer-repo subagent body audit (per ADR-017 follow-up).
- ADR formalizing the ADR-NNNN-vs-ARCH-XXXX distinction (candidate ADR-019, deferred from Wave 122).
- WCAG 2.1 AA promotion from FEAT-local ratification to workspace-conventions-level NFR (carried from Wave 125).
- ADR for the keyboard-reachability rule (carried from Wave 125).
- Automated WCAG conformance in viewer CI (carried from Wave 125).
- CI automation for Wave 128 artifact disciplines (S1/S5/S6/S7) — LibreOffice headless + image diff + contrast gate + deploy-verification (carried from Wave 128b).
- Structured QA verdict-block schema attesting S1–S9 (ADR-018 amendment candidate, carried from Wave 128b).
- **NEW (Wave 130):** apex-team-viewer#14 — Gradle wrapper shell-injection fix. Owner: UI Dev or DevSecOps for the viewer repo. Trigger: before any user is encouraged to ▶ Run Gradle test files; or before the Gradle runner ships an in-tree integration test.
- **NEW (Wave 130):** Resolver decision-tree codification candidate ADR (or `architecture/features/FEAT-NNNN-polyglot-run/ARCH-NNNN-runner-resolver-decisions.md` if the viewer adopts the Wave 122 convention). Currently the decision tree lives only in the resolver module's docstring + the 19 unit tests. A short ADR would give it durable home for future runner additions (e.g., pytest, cargo test, go test).

### Notes / caveats (Wave 130 re-gate)

- The viewer PR description's claim "Backward compatibility — existing apex-team vitest tests still ▶ RUN-able via the fallback path" is slightly inaccurate: apex-team's own tests use the PRIMARY `resolveJsRunner` branch (root `package.json` + vitest devDep), not the fallback. Functional behavior is correct — the description just mis-labels which code path apex-team hits. Documented for traceability; not a defect.
- Test-coverage gap from prior CONCERNS verdict (19 resolver unit tests covered the resolver IN ISOLATION but the `runTest` fallback path was uncovered) is now **closed**: UI Dev added 2 regression tests in the orphan-fallback describe block that exercise the previously-uncovered code path. Resolver suite is now 21 tests.
- Cross-repo verdict means SHA `dd70fffa4e4499c9a9ee0778e06fc78a1c8b9d11` is the viewer's HEAD at re-gate, not apex-team's. apex-team's main HEAD at gate time remains `b6a8515449146695ebbcbcb83f9bf70e2cfe552a` (post-Wave 129).
- This re-gate amends onto the existing PR #418 with a normal commit (no force-push). Coordinator approved either route; chose amend rather than a 5th separate PR to keep the gate-correspondence 1:1 with the Wave 130 architect-gate PR slot.

---

## PREV — 2026-06-04 — Wave 128b standing-rules codification (workspace-conventions QA artifact discipline)

### Wave-128 PASS verdict — PR #414 — SHA 44b311033c419939ef5fb94652c3f8535bb1aa4a
- **Gate role:** architect (self-attested — standing-rules codification, single-author within Architect's lane)
- **Timestamp:** 2026-06-04T23:25:00Z
- **Notes:** Small follow-up wave codifying the Wave 128 QA artifact-discipline rule (S1–S9) into `architecture/workspace-conventions.md` so it lives as a durable standing standard alongside Wave 117/118/122 instead of only inside `.claude/agents/qa.md` + the Wave 128 HANDOFF block. NOT a code-review gate — Wave 128 PR #413 is already merged at `6579f8b`. This wave's PR is a single-file architecture/ edit (plus this HANDOFF refresh) within Architect's own lane. Self-attested PASS — Architecture/ co-authorship gate (Wave 109 #335): only `architecture/workspace-conventions.md` + own HANDOFF touched, no peer edits anywhere. Peer-edit boundary (Wave 112): own-lane edit only, no peer HANDOFF doc touched. Merge SHA backfilled by DevSecOps 2026-06-04: PR #414, merge SHA `44b311033c419939ef5fb94652c3f8535bb1aa4a`.

### What landed

1. **`architecture/workspace-conventions.md`** (extended) — new top-level `## QA artifact discipline for visual / operator deliverables (Wave 128)` section inserted between `## FEAT-XXXX feature grouping (Wave 122)` (its closing Cross-references list) and `## OQ-085-001 — Test artifact retention policy (RESOLVED)`. Mirrors the Wave 117/118 shape: a one-paragraph rule statement; a Why-it-exists paragraph naming the LFM order-sheet incident (9 distinct user-visible bugs reached production despite repeated programmatic PASS verdicts); the nine-discipline inline summary (S1 render-and-look, S2 real operator artifact, S3 realistic+adversarial data, S4 positional+semantic correctness, S5 WCAG contrast gate, S6 side-by-side reference diff, S7 validated≠deployed, S8 question business intent, S9 no silent green); a Hard-gates clause stating S1+S2 are hard gates whose skip invalidates a PASS verdict and triggers Architect FAIL; a Scope clause covering visual-OR-production-path applicability and the N/A-disciplines carveout for pure code/API/CLI/doc-only deliverables (S1+S5+S6 N/A; S2–S4 + S7–S9 still apply); an Orchestrator-applicability clause naming S1/S2/S7 as PO + DevSecOps disciplines too (the bug #9 fix); Cross-references back to the skill, the qa.md body clause, Wave 118 (S3 pair), and Wave 122 (FEAT grouping); a Future section flagging Wave 129+ CI automation candidates. Wave 122 Cross-references list extended with a forward-link bullet to the new section.

2. **`coordination/handoffs/architect.md`** (this file) — Wave 128b NOW prepended per ADR-018 canonical format; prior Wave 126 Lane 3 NOW demoted to PREV.

### Anchor heading (byte-stable for future regression assertions)

```
## QA artifact discipline for visual / operator deliverables (Wave 128)
```

(Note: workspace-conventions H2 heading uses `(Wave 128)` without `— MANDATORY` — that severity marker is the subagent-body convention from `.claude/agents/qa.md` §`### Artifact discipline for visual / operator deliverables (Wave 128 — MANDATORY)`. The workspace-conventions H2 is the spec; the qa.md H3 is the enforcement clause. The two anchor strings are deliberately different — any future QA regression test should grep for both.)

### Gate verification (Wave 128b)

- `pnpm vitest run tests/qa/wave-108/subagent-body-cleanliness.test.ts` → 153/153 PASS (token discipline preserved; no `.claude/agents/*.md` edits this wave, but verified for completeness — no ADR-017 denylisted tokens reproduced in the new workspace-conventions section).
- `pnpm test:run` → 17/17 files, 654 passed + 4 skipped (matches the pre-edit baseline at SHA `6579f8b` — no regression). The PO's brief cited "722 + 1 skipped" but the actual main baseline at `6579f8b` is 654 + 4 skipped; the 722-figure appears to be stale from a different branch state. Wave 128b leaves the baseline byte-identical.
- `pnpm lint` → clean.
- Other Wave 117/118/122 anchor headings under `## ` in workspace-conventions.md verified unchanged: `## Requirements-first enforcement (Wave 117)`, `## Comprehensive testing (Wave 118)`, `## FEAT-XXXX feature grouping (Wave 122)`, `### Per-role ticket prefixes (AC3)`, `### Option B — US-NNN coexistence with FEAT-XXXX (AC5)`, `### QA test-type decision discipline (AC6)`, `### Mandatory deliverable frontmatter (AC11)`, `### Autonomous role standard (AC12)`, `### FEAT-XXXX feature grouping standard (Wave 122 — MANDATORY)`, `### \`requirements/features/INDEX.md\` registry shape (AC4)`. None edited.

### Architecture/ co-authorship gate (Wave 109 rule, self-reflection)

This wave's PR touches:
- `architecture/workspace-conventions.md` (Architect-owned, single-author = me, gate satisfied).
- `coordination/handoffs/architect.md` (this file — my own HANDOFF doc).

Zero peer co-authorship on any `architecture/` file. Zero peer HANDOFF docs edited. Both gates satisfied.

### Peer-edit boundary (Wave 112)

Wave 128b touches only Architect-owned + own HANDOFF surfaces. QA's `.claude/agents/qa.md` Wave 128 section is NOT edited (already on main at `6579f8b`; the workspace-conventions section is a sibling codification, not a re-edit). No peer HANDOFF doc touched. Boundary satisfied.

### Out of scope (Wave 128b — flagged for future waves)

- **CI automation for S1 / S5 / S6 / S7.** Flagged in the new section's Future paragraph as Wave 129+ candidate. Not landed this wave (would require LibreOffice headless + image-diff toolchain integration + deploy-verification step — substantive DevSecOps + QA joint work). Filing as deferrable; the Future paragraph IS the durable note.
- **Per-deliverable verdict-block schema** that explicitly attests "S1–S9 attested" or "S1+S5+S6 N/A — non-visual" in QA's verdict Notes. Currently human-attested in free-form Notes; Architect's review gate verifies consistency with the deliverable's shape. A future Wave could ratify a structured attestation field via an ADR-018 amendment. Not landed.

### In flight / next

- This slice is ready for review. Single-author across 2 paths within my own lane — both gates verified.
- No QA Phase 2 dispatch needed this wave — there is no new behavior to test beyond the Wave 128 qa.md regression test that already exists (or will land if QA chose to file one against `6579f8b`). The workspace-conventions section is a documentation codification, not a behavioral change. If a future regression test asserts the anchor heading, the byte-stable form is `## QA artifact discipline for visual / operator deliverables (Wave 128)`.
- DevSecOps post-merge step (per ADR-018 Wave 111b amendment): replace `PR #0` + base SHA `6579f8b7a68718675f67887d0839b9dce268e210` with the real PR # + merge SHA.

### Parked / future (carried from Wave 126 + Wave 128b additions)

- `system-design.md` — still not created.
- `tech-stack.md` — still not created.
- `coding-standards.md` — still not created. Wave 117 + Wave 118 + Wave 122 + Wave 128 discipline are all candidate entries once `coding-standards.md` gets seeded.
- Fitness function for OQ-085-001's "no binary files committed under `tests/qa/wave-*/evidence/`" — QA owns implementation.
- Viewer-repo subagent body audit (per ADR-017 follow-up).
- ADR formalizing the ADR-NNNN-vs-ARCH-XXXX distinction (candidate ADR-019, deferred from Wave 122).
- WCAG 2.1 AA promotion from FEAT-local ratification to workspace-conventions-level NFR (carried from Wave 125).
- ADR for the keyboard-reachability rule (carried from Wave 125).
- Automated WCAG conformance in viewer CI (carried from Wave 125).
- **NEW (Wave 128b):** CI automation for the Wave 128 artifact disciplines — LibreOffice headless render + image diff (S1/S6), computed contrast-ratio gate for text-on-fill outputs (S5), deploy-verification step (S7). Owner: DevSecOps + QA joint, Architect-lane ADR proposing the CI gates when toolchain matures. Flagged inline in the new workspace-conventions section's "Future" paragraph.
- **NEW (Wave 128b):** structured QA verdict-block schema that explicitly attests S1–S9 (or names N/A disciplines). Currently human-attested in free-form Notes; ADR-018 amendment candidate.

### Notes / caveats (Wave 128b)

- The workspace-conventions section uses `(Wave 128)` (no severity marker) per the document's H2 convention; the qa.md body uses `(Wave 128 — MANDATORY)` per the subagent-body convention. The two anchor strings are different by design — workspace-conventions is the spec, qa.md is the role enforcement.
- The PO's brief cited "722 + 1 skipped" for the full test suite baseline; actual baseline at `6579f8b` is 654 + 4 skipped. Documenting the discrepancy for traceability — not a defect, just a stale figure in the dispatch text. Wave 128b leaves the baseline byte-identical (654 + 4 skipped post-edit).
- This wave does NOT touch `.claude/agents/qa.md` — the Wave 128 body clause is already on main at `6579f8b` and is the upstream artifact this codification cross-references. Wave 109 co-authorship gate isolation preserved.
- The new section's "Hard gates" paragraph explicitly names Architect's enforcement responsibility ("Architect's code review gate will FAIL any PR whose QA verdict block does not explicitly attest to S1 + S2 in the verdict Notes for a visual / operator deliverable"). This is the durable codification of MY enforcement obligation — future Architect invocations grep `workspace-conventions.md` and see the rule.

---

## PREV — 2026-06-04 — Wave 126 Lane 3 code-review gate (PR #411 — PASS)

### Wave-126 PASS verdict — PR #411 — SHA feef0820621674b101c4f56f289e2e4a75a72c40
- **Gate role:** architect (non-UI rubric — pure CLI / Node script + docs surface; no UI files in diff)
- **Timestamp:** 2026-06-04T22:18:00Z
- **Notes:** Code-review gate for `feature/126-feat-backfill-command` HEAD `feef082`. Scope: `scripts/feat-backfill.mjs` (1282 lines — note brief said "641 lines" which is stale; actual is 1282; flagged as observation only), `.claude/agents/ui-developer.md` + `backend-developer.md` Plan-C additive clauses, `frontend/features/` retro summary docs (FE-0001..FE-0004), `ops/features/FEAT-0005-feat-backfill-command/OPS-0004-feat-backfill-script.md`, and `tests/qa/features/FEAT-0005-feat-backfill-command/TEST-0005-feat-backfill.test.ts`. Architecture/ co-authorship gate (Wave 109 #335): `git diff main..HEAD -- architecture/` shows only `architecture/features/FEAT-0005-feat-backfill-command/ARCH-0002-feat-backfill-protocol.md` (new — my own work) + `architecture/features/INDEX.md` (my own INDEX row + allocation log) — gate satisfied, no peer edits under `architecture/`. All eight ARCH-0002 NFRs verified against the implementation. Full test suite: 17/17 files, 722/722 tests pass + 1 skipped, lint clean, zero failures.

### Per-NFR verification matrix (ARCH-0002 §§1-8 vs implementation)

| NFR | Verification | Result |
|---|---|---|
| **NFR-001 idempotence** | `injectFrontmatter` (scripts/feat-backfill.mjs:526-580) re-reads file, calls `parseFrontmatter`, returns `applied-noop` at line 546 if both `feat` + `parent_feat` match. Conflict path at line 550 leaves file untouched. TEST-0005 §8(b) double-invocation test (test.ts:429-531) asserts byte-identical state after run 2. | PASS |
| **NFR-002 dry-run-first** | All 15 write sites audited. Lines 132-134 → outDir scaffolding (always `coordination/feat-backfill/`); 558, 578 → `injectFrontmatter` (callable only from `runApply` at line 1196, which is itself gated on `flagApply` at line 1235); 625, 628 → `_insertIndexRow` (scaffolded but uninvoked in MVP — underscore-prefix); 741, 780 → `seedFERetroDoc` writes (callable only from `runApply` at line 1216, also `flagApply`-gated); 998-999, 1088, 1092 → proposal/dispatch/brief writes (all under `outDir`). Dry-run path `runPhase1()` writes EXCLUSIVELY under `coordination/feat-backfill/`. TEST-0005 §8(a) (test.ts:322-381) asserts dry-run writes ONLY under that prefix across all three fixtures. | PASS |
| **NFR-003 orchestration boundary** | Single `execSync` site at line 124 — `git rev-parse --show-toplevel` for workspace resolution (read-only, allowed). No `claude` CLI shell-out. No `Agent` invocation. The string "Agent tool calls" at line 1010 is in the emitted dispatch-plan markdown that the OUTER orchestrator reads; script never invokes it. Subagent JSON proposals consumed via `parseResponseFiles` (line 491) reading `coordination/feat-backfill/responses/*.md`. | PASS |
| **NFR-004 cross-workspace** | `--workspace=<path>` parsed at line 95, resolved at line 115-128 with `existsSync` precondition + git-toplevel fallback. `walkDir` (line 289) tolerates missing dirs via `if (!existsSync(dir)) return results;`. `classifyRoleFiles` (line 340) returns empty buckets + a Plan-C note when role dir absent. TEST-0005 sections 5-9 parameterize over `plan-c-workspace`, `legacy-workspace`, `empty-workspace` fixtures. | PASS |
| **NFR-005 audit log** | `audit()` at line 317-322 uses `appendFileSync` — never `writeFileSync`, never truncates. Tab-separated `[ts, mode, role, relFile, feat, action].join('\t')`. TEST-0005 §8(c) (test.ts:537-599) asserts post-run-2 size strictly > post-run-1 + validates the canonical regex format. | PASS |
| **NFR-006 forbidden surfaces** | `grep -n "git add\|git commit\|git push\|\.claude/agents\|coordination/handoffs\|architecture/decisions\|ADR-"` against the script returns ONLY line 1079, which is the emitted-text WARNING in the dispatch plan (the script TELLS subagents not to do those — never does them itself). No `rename` / `mv` / file-deletion calls anywhere. TEST-0005 forbidden-surfaces describe block (test.ts:1053-1142) parameterizes 3 surfaces (HANDOFFs / `.claude/agents/` / ADRs) × 3 fixtures = 9 tests, all PASS. | PASS |
| **NFR-007 conflict resolution** | `resolveConflicts` at line 434-468 sorts by `parseInt(p.proposedFeat.replace('FEAT-', ''), 10)` ascending — lower wins. Voided entries pushed to `conflicts` array → emitted in proposal `## Reconciliation notes` (line 941-946) and `propose-conflict` audit row (line 828). `--ba-approved` parsed at line 97 with the `_flagBaApproved` underscore-prefix indicating MVP placeholder per ARCH-0002 §9 item 2 ("Wave 126's MVP can ship without the flag — always halts on conflict in `--apply`"). Acceptable per ARCH-0002 §9 deferral. | PASS |
| **NFR-008 frontmatter parser fail-soft** | `parseFrontmatter` at line 241-268 wraps key-extraction in try/catch (line 255-266), sets `parseError`, returns `frontmatterParsed: null` without throwing. Unclosed block at line 246-248 returns `parseError: 'unclosed frontmatter block'` cleanly. `classifyRoleFiles` line 361-364 reads `parseError` and pushes file to `skipped` (treated as ungrouped) — file untouched on disk. TEST-0005 §8(d) (test.ts:605-700) covers corrupt YAML + unclosed block + no-frontmatter fixtures. | PASS |

### Surface 2 — subagent Plan-C additive clauses

- `.claude/agents/ui-developer.md` + `backend-developer.md` diffs are 100% additive — a single new bullet under the existing Wave 122 anchor heading. The Wave 122 anchor `### FEAT-XXXX feature grouping standard (Wave 122 — MANDATORY)` is unchanged (no `^-` lines touch that heading or any pre-existing bullet). Wave 122 TEST-0001 anchor-stability assertion will continue to pass.
- The clause is content-aligned with the script's Plan-C detection logic (script line 144-145: `isPlanC = !hasSrc && hasAgents`) and the `ROLE_DIRS` switch (line 170-171: `'ui-developer': isPlanC ? 'frontend' : 'src'`).

### Surface 3 — frontend retro summary docs

- `FE-0001-tbd/FE-0001-viewer-workspace-switcher.md` + `FE-0002-tbd/FE-0002-viewer-auto-follow.md`: `parent_feat: TBD` for pre-convention waves 119/121 — schema-correct (BA reconciles to a real FEAT later). Directory placement `FE-NNNN-tbd/` is consistent with the "no FEAT bound yet" semantics.
- `FEAT-0002-feat-grouped-rendering/FE-0003-feat-grouped-rendering.md`: `parent_feat: FEAT-0002` — valid (FEAT-0002 ships in requirements/features/INDEX.md).
- `FEAT-0004-viewer-a11y-polish/FE-0004-viewer-a11y-polish.md`: `parent_feat: FEAT-0004` — valid (FEAT-0004 is the wave-125 viewer-a11y feature; my own ARCH-0001 covers it).
- All four carry consistent frontmatter (`ticket`, `parent_feat`, `parent_us`, `wave`, `role: ui-developer`, `status: retro`). Schema clean.

### Surface 4 — OPS-0004 allocation + BA stale reference

- `ops/features/FEAT-0005-feat-backfill-command/OPS-0004-feat-backfill-script.md` — correct ticket number (OPS-0001..0003 were Wave 124; OPS-0004 is the next available slot for Wave 126). Frontmatter clean (`ticket: OPS-0004`, `parent_feat: FEAT-0005`, `parent_us: US-102`, `role: devsecops`, `status: in-flight`).
- **DISCREPANCY FLAGGED for BA:** `requirements/features/FEAT-0005-feat-backfill-command.md` line 15 cites `OPS-0001 (pending — DevSecOps …)` and line 94 (`| DevSecOps | OPS-0001 | …`) still cites OPS-0001. Stale reference — should be `OPS-0004`. This is the BA's own parent doc; non-blocking for the wave, but BA should backfill in a follow-up edit. Filing as a HANDOFF note rather than a github issue since the fix is one-line and BA is already active on this wave.

### Surface 5 — TEST-0005 ARCH-0002 §8 coverage

- All four mandatory assertions present:
  - §8(a) — dry-run zero-write boundary (test.ts:322 + parameterized across 3 fixtures).
  - §8(b) — `--apply` idempotence (test.ts:429 + parameterized).
  - §8(c) — audit log append-only (test.ts:537 + regex validation at 581-595).
  - §8(d) — fail-soft YAML parser (test.ts:605 + 3 corrupt-YAML subcases).
- Beyond §8 minimum: forbidden-surfaces (test.ts:1053), dispatch-plan emission (test.ts:866), Plan-C FE retro seeding, cross-workspace fixture coverage — exceeds the Wave 118 comprehensive-testing skill bar.
- Full run: 43 tests pass on the single file; 722 tests pass overall.

### Maintainability observations (non-blocking, for follow-up wave)

- `_insertIndexRow` at scripts/feat-backfill.mjs:591 is scaffolded but never invoked. Underscore-prefix convention communicates "intentionally unused" but the dead branch is real (lines 591-632, 42 LOC). Per ARCH-0002 §9 follow-up #2 (`--ba-approved` flag), this becomes the implementation site for in-band conflict resolution. Acceptable to defer; flagged in case the conflict-resolution wave doesn't fire soon.
- `runPhase1` at scripts/feat-backfill.mjs:789 is ~340 LOC — borderline long for a single function. Three internal sections (classification → proposal markdown → dispatch plan) could each be a private helper. Not blocking — function is procedural and reads top-to-bottom — but a refactor candidate when the script next changes substantively.
- Brief said "scripts/feat-backfill.mjs — 641 lines" — actual is 1282 lines. Likely the brief was drafted against an earlier interim diff. Documenting for traceability; not a defect.

### Architecture/ co-authorship gate (Wave 109 #335) — self-reflection

`git diff main..HEAD --stat -- architecture/` produces exactly two files:
- `architecture/features/FEAT-0005-feat-backfill-command/ARCH-0002-feat-backfill-protocol.md` (new — Architect's lane).
- `architecture/features/INDEX.md` (modified — Architect's INDEX row + allocation log).

Zero peer co-authorship on any `architecture/` file. Gate satisfied.

### Verdict

**PASS** for non-UI rubric. No UI surface in PR — pure CLI/Node script + docs/tests. UX Designer gate not required (verified: no `.tsx`, no `globals.css`, no `page.tsx` / `layout.tsx` in diff). QA gates next on `:3100` test instance.

Per ADR-018 the verdict heading uses the real PR # (411) and the real 40-char HEAD SHA (`feef0820621674b101c4f56f289e2e4a75a72c40`). DevSecOps post-merge will backfill the merge SHA if it differs from HEAD.

---

## PREV — 2026-06-04 — Wave 125 Lane 3 code review (PRs #407 + viewer #10 — PASS)

### Wave-125 PASS verdict — PR #407 — SHA 16f3fa0067537aeed4c21622df03e2c7296fe93b
- **Gate role:** architect
- **Timestamp:** 2026-06-04T21:30:00Z
- **Notes:** Code review for Wave 125 PRs (cross-repo, two-PR shape). **apex-team PR #407** (`feature/125-viewer-a11y-polish`, HEAD `f4e6c26`): triad artifacts + QA TEST-0004 + UI Dev HANDOFF + verdict-format fix. Non-UI rubric applies (architecture/, requirements/, design/ are docs; HANDOFF docs are coordination state; TEST-0004 is QA's tests/). Architecture/ co-authorship gate (Wave 109 #335): only Architect's own ARCH-0001 + features/INDEX.md edited under `architecture/` — no peer edit, gate satisfied. Wave 122 anchor `### FEAT-XXXX feature grouping standard (Wave 122 — MANDATORY)` present once per subagent body — no `.claude/agents/` diff on PR #407, all 8 bodies preserved (verified via grep). ADR-018 verdict-format conformance: all 5 in-tree Wave-125 verdict headings (architect / business-analyst / product-owner / qa / ux-developer / ui-developer-as-self-attestation) match the canonical anchor regex; commit `f4e6c26` retroactively fixed the ux-designer `TRIAD PASS` non-canonical heading; QA's `tests/qa/wave-111/pass-verdict-format.test.ts` PASS 21/21. TEST-0004 allocation correct (was TEST-0002 collision per BA's amendment; QA's INDEX + content cite TEST-0004 throughout; trivial typo in ARCH-0001 §1 measurement line + companion-artifacts list corrected this turn under the trivial-cleanup carveout). **Viewer PR #10** (`keyan-commits/apex-team-viewer feature/wave-125-a11y-polish`, HEAD `f677573`): `public/style.css` + `public/app.js` only — no `server.mjs`, no new bundles, no new external resources, no new event sinks, no security/perf delta. CSS edits: solid `#6a8cd6` everywhere (5 selectors — `.search`, `.select`, `.feat-card-header`, `.badge-btn`, `.file-open`), all alpha `#6a8cd640` gone; both `outline: none` declarations (lines 82, 115) have matching `:focus-visible` replacements — no orphan `outline: none`. JS edits: 4 `.file-open` render paths get `tabindex="0" role="button"`; 2 keydown handler wire-up sites (renderTickets, renderOutput) bind Enter+Space → `openFile` with `e.preventDefault()`. The `preventDefault()` on Enter (alongside Space) is consciously documented in UX-0001 §158-176 — `<span role="button">` carries no native form/submit semantics so blanket preventDefault is safe; this is the spec-codified choice. `.feat-card-header` gets `id="feat-header-${esc(feat.feat)}"`; `.feat-card-body` gets `role="region" aria-labelledby="feat-header-${esc(feat.feat)}"` — landmark binding tied to the same template variable so IDs cannot drift. Full test suite 679/679 PASS + 1 skipped (VIEWER_PRESENT gate), lint clean, type-check clean. Merge SHA backfilled by DevSecOps post-merge: `16f3fa0067537aeed4c21622df03e2c7296fe93b` (was branch HEAD `f4e6c26a5b4e8885784f8cbab57d81bfb144959b` at gate time). Viewer PR #10 carries its own verdict block in its own gate flow (UX Designer gates UI; this verdict covers the non-UI surface across both PRs).

### Wave-125 PASS verdict — PR #10 — SHA f6775734d32cfa314ac72e71522968b144c4772f
- **Gate role:** architect (non-UI portion)
- **Timestamp:** 2026-06-04T21:30:00Z
- **Notes:** Cross-repo verdict — PR # refers to `keyan-commits/apex-team-viewer#10` (not apex-team#10, which is unrelated and predates Plan C); SHA `f6775734…` is the HEAD of `feature/wave-125-a11y-polish` in the viewer repo. Non-UI surface review only (UX Designer gates the UI portion in parallel under the standard mixed-PR lane split). Architect's lane covers structural / event-handler / abstraction concerns. Findings: (1) Keyboard handler is correctly scoped — Enter/Space conditional, no global keydown trap, listener attached per-element at render time alongside the existing click listener (no event delegation churn). The renderOutput wire-up at line 296 uses combined selector `#output-list .file-open, #tickets-list .file-open` which is harmless redundancy with renderTickets's wire-up (line 129) because the latter only fires when the tickets tab is rendered; in practice the listeners attach to distinct DOM trees per tab so there is no double-fire on a single span. (2) `preventDefault()` on both Enter and Space is safe on `<span role="button">` — UX-0001 §158-176 codifies the trade-off (no native form submit semantics; Space-scroll prevention is the substantive reason). (3) Static landmark attributes (`role="region"`, `aria-labelledby`) baked into the template string at render time — no DOM-mutation-after-render race, no setAttribute hooks. ID-template variable `feat-header-${esc(feat.feat)}` is escaped consistently between the button's `id` and the body's `aria-labelledby` reference (same expression both sides — drift-resistant). (4) No new bundles, no new external resources, no new network sinks, no new event surfaces accepting untrusted input. Zero NFR delta on perf / security envelope / observability / scalability / deployability — matches ARCH-0001 §3 prediction exactly. (5) `server.mjs` not touched (confirmed via `gh pr diff 10 -R keyan-commits/apex-team-viewer --name-only` → only `public/app.js` + `public/style.css`). Placeholder per ADR-018: PR #10 is the real PR number; SHA `f6775734d32cfa314ac72e71522968b144c4772f` is current HEAD of `feature/wave-125-a11y-polish` at gate time. Viewer-repo HANDOFF backfill applies to the viewer-repo's own handoff doc (if one exists) post-merge; cross-repo backfill is DevSecOps's call at Lane 3.

### Lane 3 review summary

- **PR #407 verdict:** PASS (non-UI rubric).
- **PR #10 verdict:** PASS (non-UI portion; UX Designer gates UI in parallel).
- **Trivial cleanup applied this turn (Architect's lane, no peer edit):** ARCH-0001 §1 + companion-artifacts list corrected `TEST-0002` → `TEST-0004` (2 occurrences). Documented under the Architect review-rubric trivial-cleanup carveout (rename/typo); no Dev re-spin needed.

---

## PREV — 2026-06-04 — Wave 125 Lane 1 NFR ratification (ARCH-0001)

### Wave-125 PASS verdict — PR #407 — SHA 16f3fa0067537aeed4c21622df03e2c7296fe93b
- **Gate role:** architect
- **Timestamp:** 2026-06-04T21:15:00Z
- **Notes:** Light NFR ratification for FEAT-0004 viewer a11y polish (no novel architecture). Three Architect-lane artifacts landed: (1) `architecture/features/FEAT-0004-viewer-a11y-polish/ARCH-0001-viewer-a11y-polish.md` — first feature-scoped ARCH ticket under the Wave 122 convention. Ratifies WCAG 2.1 Level AA as the standing viewer a11y target (success criteria 1.4.11 / 2.1.1 / 2.4.7 / 2.4.11 / 4.1.2 bound to this wave's four issues #5/#7/#8/#9), ratifies UX-0001's `:focus-visible` + solid focus-ring as the canonical viewer focus-indication pattern, records the zero NFR delta verdict (perf / security / observability unchanged — two CSS edits + two JS edits, no new bundles / network / event sinks), captures the keyboard-reachability precedent for clickable-in-JS elements as a Wave-125-local rule (ADR-019 promotion deferred until a third recurrence), and pre-commits to gating UI Dev's Lane 2 viewer PR under the standard non-UI review rubric (Wave 109 co-authorship not required — small CSS + JS surface). (2) `architecture/features/INDEX.md` — ARCH-0001 row added to the registry table + allocation log; "Last updated" line bumped to Wave 125. (3) this HANDOFF doc — NOW block prepended per ADR-018 canonical format, prior Wave 122 NOW demoted to PREV. Self-attested PASS — all edits within Architect's own lane (architecture/ + own HANDOFF), no peer-edit footprint on BA's US-101 / FEAT-0004 / requirements INDEX or UX's UX-0001. Merge SHA backfilled by DevSecOps post-merge: `16f3fa0067537aeed4c21622df03e2c7296fe93b` (was `PR #0` + SHA `9f9d53ee3c8f3e155a567197a489378318729c18` placeholder at staging time).

### Wave 125 deliverables (3 files, single-author within Architect's lane)

1. **`architecture/features/FEAT-0004-viewer-a11y-polish/ARCH-0001-viewer-a11y-polish.md`** (new) — first feature-scoped Architect ticket under the Wave 122 FEAT-XXXX convention. Frontmatter: `ticket: ARCH-0001`, `parent_feat: FEAT-0004`, `parent_us: US-101`, `role: architect`, `status: accepted`. Seven sections: NFR posture (WCAG 2.1 AA + SC table bound to issues #5/#7/#8/#9), pattern ratification (`:focus-visible` + solid focus-ring as canonical viewer pattern), no-NFR-delta verdict, cross-cutting keyboard-reachability precedent (local note, ADR promotion deferred), code-review pre-commitment for Lane 2, deferrable follow-ups (3 — WCAG-to-conventions promotion, keyboard-reachability ADR, viewer CI a11y conformance), cross-references.

2. **`architecture/features/INDEX.md`** (modified) — ARCH-0001 row added to registry table with `parent_feat: FEAT-0004`, `parent_us: US-101`, `status: accepted`, description "Viewer a11y polish — WCAG 2.1 AA ratification + `:focus-visible` pattern ratification + code-review pre-commitment for Lane 2 viewer PR." Allocation-log table also updated with the Wave 125 allocation row.

3. **`coordination/handoffs/architect.md`** (this file) — NOW block prepended per ADR-018; prior Wave 122 NOW demoted to PREV.

### NFR posture summary (Wave 125)

- **Standing target:** WCAG 2.1 Level AA bound to the viewer surface (`keyan-commits/apex-team-viewer`). This is a local ratification at the FEAT level — promotion to a workspace-conventions-level NFR is a deferrable follow-up (ARCH-0001 §6 item 1).
- **Success criteria in scope this wave:** 1.4.11 (#7), 2.1.1 (#8), 2.4.7 + 2.4.11 (#5), 4.1.2 (#9). Mapping rationale lives in ARCH-0001 §1.
- **Pattern ratification:** `:focus-visible` + solid focus ring is the canonical viewer focus-indication pattern. Local to viewer; apex-team itself has no UI under Plan C.
- **NFR delta:** zero on perf, security envelope, observability, scalability, deployability. Documented in ARCH-0001 §3.
- **Cross-cutting precedent:** keyboard-reachability for clickable-in-JS elements (Enter/Space + tabindex + role + focus-visible style) recorded as Wave-125-local rule. ADR-019 promotion deferred until third recurrence.

### Architecture/ co-authorship gate (Wave 109 rule, self-reflection)

This wave's PR touches:
- `architecture/features/FEAT-0004-viewer-a11y-polish/ARCH-0001-viewer-a11y-polish.md` (new file, Architect's own lane).
- `architecture/features/INDEX.md` (Architect's own INDEX, my lane).
- `coordination/handoffs/architect.md` (this file — my own HANDOFF doc).

No peer is co-authoring any file under `architecture/`. No peer HANDOFF docs are edited. Both gates (architecture/ co-authorship + peer-HANDOFF edit) satisfied. Wave 109 co-authorship pre-staging not required for the Lane 2 viewer PR (small CSS + JS surface, see ARCH-0001 §5).

### Peer-edit boundary (Wave 112)

This wave's PR touches only Architect-owned + own HANDOFF surfaces:
- BA's `requirements/user-stories/US-101-*.md`, `requirements/features/FEAT-0004-viewer-a11y-polish.md`, `requirements/features/INDEX.md` — NOT edited (BA owns; BA dispatched in parallel Lane 1).
- UX's `design/features/FEAT-0004-viewer-a11y-polish/UX-0001-viewer-a11y-polish.md`, `design/features/INDEX.md`, `design/INDEX.md` — NOT edited (UX owns; UX dispatched in parallel Lane 1).
- QA's `tests/qa/features/FEAT-0004-viewer-a11y-polish/` — NOT edited (QA Lane 2).
- UI Dev's viewer-repo edits (`public/style.css`, `public/app.js` in `../apex-team-viewer/`) — NOT edited (UI Dev Lane 2; cross-repo).
- DevSecOps's merge / CI — NOT edited (Lane 3).

Boundary satisfied. No peer's HANDOFF doc touched.

### Gate verification (Wave 125)

- Static surface only — no runtime tests this Architect lane (NFR ratification doc + INDEX update + HANDOFF). QA's Lane 2 TEST-0002 carries the runtime assertions against the viewer files post-edit.
- ARCH-0001 frontmatter conforms to AC11 of US-098 (workspace-conventions §"FEAT-XXXX feature grouping (Wave 122)"): `ticket`, `parent_feat`, `parent_us`, `role`, `status` all present with valid values.
- ARCH-0001 file path conforms to the canonical artifact root from the workspace-conventions AC3 table: `architecture/features/FEAT-NNNN-<slug>/ARCH-NNNN-<slug>.md`.
- INDEX update conforms to the Wave 122 INDEX maintenance rule: ARCH-0001 added monotonically; allocation-log row stamped with `2026-06-04` and `Architect (Wave 125)`.

### In flight / next

- Triad (Lane 1) for Wave 125 still pending — BA's US-101 + FEAT-0004 + requirements INDEX row, UX's UX-0001 + design INDEX row. Outer orchestrator batches all three triad deliverables into a single staging commit.
- Lane 2 (UI Dev + QA) fires after triad returns. I gate UI Dev's PR under the non-UI review rubric per ARCH-0001 §5; UX Designer gates the UI portion in parallel. QA's TEST-0002 produces the static-parse assertions that validate the four a11y fixes structurally.
- Lane 3 (DevSecOps merge of both apex-team PR + viewer PR) fires after Lane 2 PASS verdicts land. DevSecOps post-merge backfill commit replaces all `PR #0` + last-known SHA placeholders.

### Parked / future (carried from Wave 122 + Wave 125 additions)

- `system-design.md` — still not created.
- `tech-stack.md` — still not created.
- `coding-standards.md` — still not created.
- Fitness function for OQ-085-001's "no binary files committed under `tests/qa/wave-*/evidence/`" — QA owns implementation.
- Viewer-repo subagent body audit (per ADR-017 follow-up).
- ADR formalizing the ADR-NNNN-vs-ARCH-XXXX distinction (candidate ADR-019, deferred from Wave 122).
- **NEW (Wave 125):** promote WCAG 2.1 AA from FEAT-local ratification to a workspace-conventions-level NFR (sibling to NFR-A11Y-001 in `architecture/nfr.md`). Trigger: any future wave introducing a wholly new viewer interactive surface. (ARCH-0001 §6 item 1.)
- **NEW (Wave 125):** promote the keyboard-reachability rule for clickable-in-JS elements to an ADR. Trigger: a third clickable-in-JS element appears in `public/app.js`. (ARCH-0001 §6 item 2.)
- **NEW (Wave 125):** automated WCAG conformance in viewer CI (axe-core or `@axe-core/playwright` runner). Owner: DevSecOps + QA jointly. (ARCH-0001 §6 item 3.)

### Notes / caveats (Wave 125)

- ARCH-0001 is the FIRST feature-scoped Architect ticket under the Wave 122 convention. The 3 other in-flight FEAT directories (FEAT-0001/0002/0003) have no ARCH tickets yet — their ARCH allocations remain pending.
- The deliverable is intentionally narrow per the PO's "light ratification (no novel NFR)" framing. Substantive new NFR work (workspace-wide WCAG, automated conformance) is filed as deferrable follow-ups in ARCH-0001 §6.
- The SHA cited in the placeholder block is `9f9d53ee3c8f3e155a567197a489378318729c18` — HEAD of `feature/125-viewer-a11y-polish` at staging time. Matches the SHA in the PO's Wave 125 dispatch brief.

---

## PREV — 2026-06-04 — Wave 122 (FEAT-XXXX feature grouping standard — 8 subagent bodies + workspace-conventions + architecture/features INDEX)

### Wave-122 PASS verdict — PR #0 — SHA 0b4f7bdbf1c19ad101bd0d4b8387cc593558f127
- **Gate role:** architect
- **Timestamp:** 2026-06-04T19:52:00Z
- **Notes:** Single-author multi-file edit landing the FEAT-XXXX feature grouping standard across (1) `architecture/workspace-conventions.md` with a new top-level `## FEAT-XXXX feature grouping (Wave 122)` section documenting AC3 ticket-prefix table, AC5 Option B coexistence rule, AC6 QA test-type decision discipline, AC11 mandatory frontmatter spec, AC12 autonomous-standard rule, ADR-NNNN-vs-ARCH-XXXX distinction, and AC4 registry column shape; (2) the exact heading `### FEAT-XXXX feature grouping standard (Wave 122 — MANDATORY)` byte-for-byte in all 8 subagent body files (`.claude/agents/{architect,business-analyst,ui-developer,backend-developer,ux-designer,qa,devsecops,product-owner}.md`), each carrying the 5-rule structure (prefix / path / frontmatter / INDEX / cross-workspace) with role-specific content per AC12; (3) `architecture/features/INDEX.md` scaffold as the Architect's ARCH ticket allocation log (empty initial state). Self-attested PASS — all edits within Architect's own lane (architecture/ + .claude/agents/ + this HANDOFF), no peer-edit-violation footprint. Placeholder block per ADR-018 Wave 111b amendment: `PR #0` + last-known SHA `0b4f7bdbf1c19ad101bd0d4b8387cc593558f127` (current HEAD of feature/c1-plan-c-subagent-extraction pre-staging). DevSecOps post-merge backfill replaces with real PR # + merge SHA via `chore(handoff): backfill Wave-122 verdict PR # and merge SHA`.

### Canonical anchor phrase (Wave 122 — grep-stable across all 8 bodies)

QA's Wave 122 regression test grep-asserts this exact heading verbatim in all 8 subagent body files. Byte-for-byte:

> `### FEAT-XXXX feature grouping standard (Wave 122 — MANDATORY)`

`grep -c "### FEAT-XXXX feature grouping standard (Wave 122 — MANDATORY)" .claude/agents/*.md` returns 1 for each of the 8 files (verified this turn).

### 5-rule structure used in each body (for QA grep-reuse)

Each body's section follows the same five-rule shape. The rules vary role-specifically per AC12:

1. **Ticket prefix** — role-specific prefix declared explicitly in the body. Mapping (verified by `grep -c "<PREFIX>-XXXX" .claude/agents/<role>.md` returning ≥1 in the section body):
   - `architect.md` → `ARCH-XXXX` (with explicit note that `ADR-NNNN` stays for cross-cutting decisions)
   - `business-analyst.md` → `FEAT-XXXX`
   - `qa.md` → `TEST-XXXX`
   - `ui-developer.md` → `FE-XXXX`
   - `backend-developer.md` → `BE-XXXX`
   - `ux-designer.md` → `UX-XXXX`
   - `devsecops.md` → `OPS-XXXX`
   - `product-owner.md` → declared as `N/A for Product Owner` (PO orchestrates; doesn't produce per-feature deliverables). The N/A is explicit so QA's grep-coverage assertion passes against the PO body too.

2. **Canonical artifact path** — role-specific concrete path pattern stated in the body:
   - BA: `requirements/features/FEAT-NNNN-<slug>.md`
   - Architect: `architecture/features/FEAT-NNNN-<slug>/ARCH-NNNN-<slug>.md`
   - UX: `design/features/FEAT-NNNN-<slug>/UX-NNNN-<slug>.md`
   - QA: `tests/qa/features/FEAT-NNNN-<slug>/TEST-NNNN-<slug>.test.ts`
   - FE Dev: `src/features/FEAT-NNNN-<slug>/FE-NNNN-<slug>.tsx`
   - BE Dev: `src/features/FEAT-NNNN-<slug>/BE-NNNN-<slug>.ts`
   - DevSecOps: `ops/features/FEAT-NNNN-<slug>/OPS-NNNN-<slug>.sh` + `ops/pipelines/<env>.sh` templates
   - PO: declared N/A

3. **Frontmatter rule** — inline restatement in each body (not a cross-reference): every deliverable file MUST include `ticket:`, `parent_feat:`, `parent_us:` (if applicable), `role:`, and `status:` either as YAML frontmatter (markdown files) or header-comment block in the file's native syntax (non-markdown files). BA's FEAT files use `feat:` rather than `parent_feat:` (they ARE the parent). PO's body states this rule applies to its dispatch text referencing the FEAT.

4. **INDEX maintenance rule** — inline restatement in each body: allocate ticket numbers monotonically per role; add a row to `<role-dir>/features/INDEX.md` before the wave closes. Each role's INDEX is the allocation log for its own ticket numbers — not a copy of the BA's `requirements/features/INDEX.md` (which aggregates counts). FE Dev + BE Dev share `src/features/INDEX.md`. PO's body states INDEX maintenance is verify-not-author (peer-edit boundary).

5. **Cross-workspace applicability** — load-bearing autonomous-standard statement in every body, verbatim concept:
   > "This convention applies in ANY workspace, not just apex-team. When invoked on a downstream project (LFM, bidshop, etc.), follow the same convention there — create the per-feature directories in that project's structure, link deliverables to the BA's FEAT-XXXX allocation in that project, and maintain that project's per-role INDEX."

### Files landed Wave 122 (11 paths, single-author within Architect's lane)

1. **`architecture/workspace-conventions.md`** (extended) — new top-level `## FEAT-XXXX feature grouping (Wave 122)` section between `## Comprehensive testing (Wave 118)` and `## OQ-085-001`. Documents AC3 ticket-prefix table, AC5 Option B coexistence, AC6 QA test-type discipline, AC11 mandatory frontmatter spec, AC12 autonomous-standard rule, AC4 registry column shape, and the ADR-NNNN-vs-ARCH-XXXX distinction. Wave 117 + Wave 118 sections' Cross-references lists each extended with a forward-link to Wave 122.

2. **`architecture/features/INDEX.md`** (new) — Architect's ARCH ticket allocation log. Initial state: empty registry table (`Ticket | Parent FEAT | Parent US | Status | Description`) + empty allocation-log table. Cross-references the BA's `requirements/features/INDEX.md`, `architecture/INDEX.md`, `architecture/decisions/`, and the workspace-conventions section.

3. **`.claude/agents/architect.md`** (extended) — `### FEAT-XXXX feature grouping standard (Wave 122 — MANDATORY)` section inserted between `### Your responsibilities` and `### Your boundaries`. Prefix: `ARCH-XXXX`. Explicit note that `ADR-NNNN` stays for cross-cutting decisions.

4. **`.claude/agents/business-analyst.md`** (extended) — same section between BA's Wave 117 auto-routing clause's anti-patterns block and `### Your boundaries`. Prefix: `FEAT-XXXX`. BA owns the top-level registry; Option B US-NNN coexistence stated inline.

5. **`.claude/agents/qa.md`** (extended) — same section between Wave 118 comprehensive-testing cross-references and `### Your boundaries`. Prefix: `TEST-XXXX`. Notes that Wave 118 four-class discipline applies per test TYPE within a FEAT grouping.

6. **`.claude/agents/ui-developer.md`** (extended) — same section between Wave 117 pre-flight gate's complementary-clause note and `### Your boundaries`. Prefix: `FE-XXXX`. Shared `src/features/INDEX.md` with Backend Developer noted explicitly.

7. **`.claude/agents/backend-developer.md`** (extended) — same section, same position as ui-developer.md. Prefix: `BE-XXXX`. Shared INDEX noted explicitly. Multiple-language frontmatter syntax (`//` for TS/Java/Go/Rust, `#` for Python) covered inline.

8. **`.claude/agents/ux-designer.md`** (extended) — same section between the durable-artifacts description and `### Your boundaries`. Prefix: `UX-XXXX`. Notes pre-existing flat `design/<feature-slug>.md` specs remain valid; non-UI features may have zero UX tickets (count column shows 0).

9. **`.claude/agents/devsecops.md`** (extended) — same section between the `.github/workflows/` carveout and `### Your responsibilities`. Prefix: `OPS-XXXX`. Pre-existing CI workflows + pre-commit hooks remain valid for cross-cutting infrastructure; FEAT-scoped pipeline deliverables live in the new layout. Pipeline-template reuse via `source` / `.` invocation noted.

10. **`.claude/agents/product-owner.md`** (extended) — same section between the peer-coordination paragraph and `### Your boundaries`. Prefix: declared `N/A for Product Owner` explicitly. Rules adapted: PO's role is orchestration; dispatch text MUST reference the parent FEAT identifier so peers know which feature to file under; INDEX maintenance is verify-not-author (peer-edit boundary).

11. **`coordination/handoffs/architect.md`** (this file) — Wave 122 NOW prepended per ADR-018 canonical format; prior Wave 118 NOW demoted to PREV.

### Gate verification (Wave 122)

- `pnpm vitest run tests/qa/wave-108/subagent-body-cleanliness.test.ts` → 153/153 PASS (token discipline preserved across all 8 body edits; no ADR-017 denylisted tokens reproduced verbatim in the new sections).
- `pnpm vitest run tests/qa/wave-110/...` → all wave-110/111/111b/111c/112/113/117/118/120/121 regression tests PASS. Combined run: 508 passed + 1 skipped (pre-existing).
- `pnpm test:run` full suite → 533 passed + 1 skipped (no regressions; matches Wave 121 baseline +1 skipped).
- `pnpm lint` → clean.
- `pnpm type-check` → clean.
- Anchor phrase grep across all 8 bodies → `grep -c "### FEAT-XXXX feature grouping standard (Wave 122 — MANDATORY)" .claude/agents/*.md` returns 1 per file.
- Role-specific prefix grep → each body contains its declared prefix in the section body (architect=ARCH-XXXX, business-analyst=FEAT-XXXX, qa=TEST-XXXX, ui-developer=FE-XXXX, backend-developer=BE-XXXX, ux-designer=UX-XXXX, devsecops=OPS-XXXX, product-owner=N/A).

### Architecture/ co-authorship gate (Wave 109 rule, self-reflection)

This wave's PR touches:
- `architecture/workspace-conventions.md` (Architect-owned, single-author = me, gate satisfied).
- `architecture/features/INDEX.md` (new file, Architect's own lane, gate satisfied).
- `.claude/agents/*.md` (Architect's lane for cross-cutting agentic protocol edits; gate satisfied).
- `coordination/handoffs/architect.md` (this file — my own HANDOFF doc).

No peer is co-authoring any file under `architecture/`. No peer HANDOFF docs are edited. Both gates (architecture/ co-authorship + peer-HANDOFF edit) satisfied.

### Peer-edit boundary (Wave 112)

This wave's PR touches only Architect-owned + own HANDOFF surfaces. BA's US-098 / FEAT-0001 / requirements/features/INDEX.md are NOT edited (explicitly out-of-scope per dispatch brief, Wave 112 #391 peer-edit boundary applies). Boundary satisfied.

### In flight / next

- This slice is ready for code review. Single-author across all 11 paths within my own lane — both gates verified.
- **QA Phase 2:** the canonical anchor phrase + 5-rule structure recorded above ARE QA's spec source for the Wave 122 regression test per AC13. Suggested location: `tests/qa/wave-122/feat-grouping-convention.test.ts`. Pattern matches Wave 117/118 completeness shape. Five assertions per AC13: (1) all 8 bodies contain the exact anchor heading; (2) each body contains its role-specific prefix; (3) `requirements/features/FEAT-0001-feat-grouping-convention.md` exists with `feat: FEAT-0001` frontmatter; (4) `requirements/features/INDEX.md` exists with canonical column headers `FEAT | Slug | Status | ARCH | UX | TEST | FE | BE | OPS`; (5) all prior `pnpm test:run` tests pass.
- DevSecOps post-merge step (per ADR-018 Wave 111b amendment): replace `PR #0` placeholder + last-known SHA `0b4f7bdbf1c19ad101bd0d4b8387cc593558f127` with the real PR # + merge SHA via `chore(handoff): backfill Wave-122 verdict PR # and merge SHA`.

### Parked / future (carried forward, plus Wave 122 additions)

- `system-design.md` — still not created.
- `tech-stack.md` — still not created.
- `coding-standards.md` — still not created. Wave 117 (three-layer requirements-first) + Wave 118 (two-layer comprehensive-testing) + Wave 122 (FEAT-XXXX feature grouping with autonomous-standard subagent body sections) discipline are candidate entries once `coding-standards.md` gets seeded.
- Fitness function for OQ-085-001's "no binary files committed under `tests/qa/wave-*/evidence/`" — QA owns implementation.
- Viewer-repo subagent body audit (per ADR-017 follow-up). Wave 122 ADD: viewer's FEAT-grouped card rendering (US-098 AC9) is deferred to US-099+; the viewer will read `parent_feat:` frontmatter from each role's per-feature directory to render grouped cards.
- **NEW (Wave 122):** UI Dev + BE Dev viewer rendering implementation per US-098 AC9 (deferred to US-099+).
- **NEW (Wave 122):** DevSecOps pipeline scaffolding for `ops/pipelines/<env>.sh` reusable templates + `pnpm run qa:feat` script (US-098 AC7 + AC8, deferred to a separate DevSecOps wave).
- **NEW (Wave 122):** consider an ADR formalizing the ADR-NNNN-vs-ARCH-XXXX distinction (currently documented inline in `workspace-conventions.md` + `architect.md`; an ADR would give it durable home alongside ADR-014/017/018). Candidate ADR-019.

### Notes / caveats (Wave 122)

- Section heading is exactly `### FEAT-XXXX feature grouping standard (Wave 122 — MANDATORY)` byte-for-byte in all 8 bodies. The em-dash is U+2014 (the same character used in ADR-018's canonical regex). QA's regression test should grep with the em-dash literal, not an ASCII hyphen.
- Each body's section content is role-specific per AC12 — not a copy-paste template. The 5-rule structure is the same skeleton; the content of each rule differs per role (prefix, path, frontmatter syntax, INDEX file). QA's regression test asserts BOTH the heading byte-for-byte AND the role-specific prefix presence in the body — catching the "someone pasted the architect template into qa.md" failure mode.
- Token discipline: no ADR-017 denylisted tokens reproduced verbatim in any of the new sections. Verified by `pnpm vitest run tests/qa/wave-108/subagent-body-cleanliness.test.ts` → 153/153 PASS post-edit.
- Product Owner's body explicitly declares `N/A for Product Owner` rather than omitting the section. Rationale: QA's grep-coverage assertion checks all 8 bodies; omitting the section in PO's body would fail the grep. The N/A declaration is the canonical answer to "what's PO's per-feature ticket prefix?" and lives in the body for grep-stability.
- The `architecture/features/INDEX.md` scaffold ships empty in this wave (no ARCH tickets allocated yet). First allocation will be `ARCH-0001` — likely the structured `README.md` template for `architecture/features/FEAT-NNNN-<slug>/` per OQ-098-001's working assumption, in a follow-up Architect-lane wave.

### [[HANDOFF: qa]]

QA Wave 122: dispatch you for the AC13 regression test now that the Architect deliverables have landed. The canonical anchor phrase + 5-rule structure + role-specific prefix mapping are recorded in this NOW block under "Canonical anchor phrase (Wave 122 — grep-stable across all 8 bodies)" — those are your spec source for `tests/qa/wave-122/feat-grouping-convention.test.ts`. Five assertions per AC13: (1) all 8 bodies contain `### FEAT-XXXX feature grouping standard (Wave 122 — MANDATORY)` byte-for-byte; (2) each body contains its role-specific ticket prefix in the section body (architect=ARCH-XXXX, business-analyst=FEAT-XXXX, qa=TEST-XXXX, ui-developer=FE-XXXX, backend-developer=BE-XXXX, ux-designer=UX-XXXX, devsecops=OPS-XXXX, product-owner=N/A); (3) `requirements/features/FEAT-0001-feat-grouping-convention.md` exists with `feat: FEAT-0001` frontmatter; (4) `requirements/features/INDEX.md` contains the canonical column headers `FEAT | Slug | Status | ARCH | UX | TEST | FE | BE | OPS`; (5) all prior `pnpm test:run` tests pass (regression). Note the em-dash in the anchor heading is U+2014 — grep with the literal character.

---

## PREV — 2026-06-04 — Wave 118 (comprehensive QA test coverage — skill + qa.md body rule)

### Wave-118 PASS verdict — PR #0 — SHA 7c994a1c8b835266049e20c835dab926ad875f1e
- **Gate role:** architect
- **Timestamp:** 2026-06-04T17:25:00Z
- **Notes:** Single-author multi-file edit landing comprehensive-testing enforcement at two layers — (1) new orchestrator-side skill at `.claude/skills/comprehensive-testing/SKILL.md` (user-scope, invocable from any project; symlinked into `~/.claude/skills/` via the existing Wave 117 `SKILLS_SRC_DIR` glob in `scripts/install-agents-user-scope.sh` — no install-script change needed); (2) hard-rule `### Comprehensive test coverage (Wave 118 — MANDATORY)` clause added to `.claude/agents/qa.md`, region-disjoint from Wave 117's pre-flight gate (inserted between Wave 117's gate and `### Your boundaries`); (3) `architecture/workspace-conventions.md` extended with a `## Comprehensive testing (Wave 118)` section cross-linked from Wave 117's section. Self-attested PASS — all edits within Architect's own lane (architecture/ workspace-conventions.md + .claude/agents/qa.md + .claude/skills/ skill addition + own HANDOFF doc), no peer-edit-violation footprint. Placeholder block per ADR-018 Wave 111b amendment: `PR #0` + last-known SHA `09d3d16` (current HEAD of feature/c1-plan-c-subagent-extraction pre-staging). DevSecOps post-merge backfill replaces with real PR # + merge SHA via `chore(handoff): backfill Wave-118 verdict PR # and merge SHA`.

### Canonical anchor phrases (Wave 118 — grep-reuse for QA Phase 2 regression test)

QA's Wave 118 completeness test will grep these verbatim substrings across `.claude/agents/qa.md` + `architecture/workspace-conventions.md` + `.claude/skills/comprehensive-testing/SKILL.md`. Final wording ratified below:

#### QA hard-rule clause (1 body — `.claude/agents/qa.md`)

The Wave 118 hard-rule clause MUST appear in `qa.md` in its own `### Comprehensive test coverage (Wave 118 — MANDATORY)` section. The canonical anchor phrase (QA's body contains this verbatim substring):

> **QA MUST author positive, negative, and edge-case tests AND iterate over every known sample input file in the active workspace's requirements/samples/ directory before emitting any PASS verdict.**

Plus, in QA's clause, the following anchor substrings co-present within the same section:

1. `Wave 118` — wave identifier in the section heading.
2. `MANDATORY` — section-heading severity marker.
3. `positive` — first of the four mandatory test classes.
4. `negative` — second of the four mandatory test classes.
5. `edge` — third of the four mandatory test classes (matches both "edge-case" and "edge cases").
6. `requirements/samples/` — the directory the iteration rule names.
7. `every known sample input` — fourth mandatory test class's intent phrase (matches the canonical anchor's "every known sample input file" and the workspace-conventions cross-link's "all known sample inputs" — verify both substring spellings appear in QA's body).
8. `comprehensive-testing` — name of the orchestrator-side skill cross-linked from the body.

#### Workspace-conventions cross-link section

`architecture/workspace-conventions.md` has a new section titled `## Comprehensive testing (Wave 118)` that names the two enforcement layers (orchestrator-side skill + QA hard-rule clause), enumerates the four mandatory test classes, names the LFM trigger incident, and cross-links to `.claude/skills/comprehensive-testing/SKILL.md` + `.claude/agents/qa.md` §"Comprehensive test coverage (Wave 118 — MANDATORY)". The completeness test should verify this section exists by heading match (`## Comprehensive testing (Wave 118)`) and that the four test-class names (`Positive`, `Negative`, `Edge`, `All known sample inputs`) appear in the section body.

#### Skill file presence + frontmatter

`.claude/skills/comprehensive-testing/SKILL.md` exists with YAML frontmatter carrying `name: comprehensive-testing` and a `description:` field naming the four-class invariant. The skill body contains the same canonical anchor phrase as the QA clause (verbatim substring) plus the decision tree and the LFM walk-through example. The completeness test should verify file existence + frontmatter `name` value + that the canonical anchor phrase appears verbatim in the skill body.

### Files landed Wave 118 (4 paths, single-author within Architect's lane)

1. **`.claude/skills/comprehensive-testing/SKILL.md`** (new) — orchestrator-side skill. YAML frontmatter (`name: comprehensive-testing`, `description: …`) follows the Wave 117 `requirements-first` skill convention. Four mandatory test classes (positive / negative / edge / all-known-samples), decision tree, walk-through example mirroring the LFM date-fix incident (9 sample files, 1 outlier slash-format, single-sample test missed it), anti-patterns, unconventional-workspace handling. Picked up by the existing `SKILLS_SRC_DIR` glob in `scripts/install-agents-user-scope.sh` — no install-script change required.
2. **`.claude/agents/qa.md`** (extended) — new `### Comprehensive test coverage (Wave 118 — MANDATORY)` section between Wave 117's `### Requirements-first pre-flight gate (Wave 117 — MANDATORY)` and `### Your boundaries`. Carries the canonical anchor phrase, 8 co-presence anchors, four-class enumeration, procedure, trigger-incident reference, anti-patterns, cross-references.
3. **`architecture/workspace-conventions.md`** (extended) — new `## Comprehensive testing (Wave 118)` section between `## Requirements-first enforcement (Wave 117)` and `## OQ-085-001 — Test artifact retention policy (RESOLVED)`. Names the two enforcement layers, enumerates the four mandatory test classes, names the LFM trigger incident, cross-links to skill + qa.md clause. Wave 117 section's Cross-references list extended with a forward-link to Wave 118.
4. **`coordination/handoffs/architect.md`** (this file) — Wave 118 NOW prepended, Wave 117 demoted to PREV, canonical anchor phrases recorded for QA's regression test.

### Gate verification (Wave 118)

- `pnpm vitest run tests/qa/wave-108/subagent-body-cleanliness.test.ts` — to be re-run; Wave 118 edits qa.md (new mid-body section); token discipline preserved (no denylisted tokens reproduced verbatim in the new clause — explicit anti-pattern names use only standard English: "happy path", "boundary", "unicode", "timezone", "DST", "off-by-one", "concurrent", etc.).
- `pnpm vitest run tests/qa/wave-110/subagent-body-completeness.test.ts` — to be re-run; new qa.md section is region-disjoint (inserted between Wave 117's pre-flight gate and `### Your boundaries`); existing co-authorship + pre-verdict SHA sync + merge-protocol clauses untouched.
- `pnpm vitest run tests/qa/wave-111/pass-verdict-format.test.ts` — to be re-run; ADR-018 canonical verdict format unchanged.
- `pnpm vitest run tests/qa/wave-111/wave-111b-completeness.test.ts` — to be re-run; ADR-018 cross-refs and Lessons sections untouched (Wave 118 edits land before `### Your boundaries`; Lessons sections at end-of-file remain region-disjoint).
- `pnpm vitest run tests/qa/wave-111c/wave-111c-completeness.test.ts` — to be re-run.
- `pnpm vitest run tests/qa/wave-112/wave-112-completeness.test.ts` — to be re-run.
- `pnpm vitest run tests/qa/wave-113/backfill-enforcement.test.ts` — to be re-run.
- `pnpm vitest run tests/qa/wave-117/*.test.ts` — to be re-run; Wave 117 anchor phrases in qa.md untouched; Wave 117 pre-flight gate section header preserved.
- `pnpm lint` + `pnpm type-check` — to be re-run; no TypeScript source touched, only `.md` files + new skill directory; both expected clean.

### Architecture/ co-authorship gate (Wave 109 rule, self-reflection)

This wave's PR will touch:
- `architecture/workspace-conventions.md` (Architect-owned, single-author = me, gate satisfied).
- `.claude/agents/qa.md` (Architect's lane for review-rule edits; QA-discipline clause; gate satisfied).
- `.claude/skills/comprehensive-testing/SKILL.md` (new skill; sits under `.claude/skills/` which is Architect's review surface for cross-cutting agentic protocol; gate satisfied).
- `coordination/handoffs/architect.md` (this file — my own HANDOFF doc).

No peer is co-authoring any file under `architecture/`. No HANDOFF-from-peer pre-condition required.

### Peer-HANDOFF edit gate (Wave 112 step 4b — meta-self-check)

This wave's PR touches `coordination/handoffs/architect.md` (this file) — edited by Architect. No peer HANDOFF docs are edited. Step 4b boundary satisfied: own-lane edit only.

### In flight / next

- This slice is ready for code review. Single-author across all 4 paths within my own lane — both gates (co-authorship + peer-HANDOFF edit) verified.
- **QA Phase 2:** the canonical anchor phrases recorded above ARE QA's spec source for a Wave 118 completeness regression test. Suggested location: `tests/qa/wave-118/wave-118-completeness.test.ts`. Pattern matches Wave 117's completeness shape. The QA hard-rule clause is grep-asserted in `qa.md`; the workspace-conventions section is grep-asserted in `workspace-conventions.md`; the skill file is asserted for existence + frontmatter + anchor phrase. QA dispatches after Wave 118 commits.
- DevSecOps post-merge step (per ADR-018 Wave 111b amendment): replace `PR #0` placeholder + last-known SHA `09d3d16` (truncated; current HEAD of feature/c1-plan-c-subagent-extraction) with the real PR # + merge SHA via `chore(handoff): backfill Wave-118 verdict PR # and merge SHA`.

### Parked / future (carried forward, plus Wave 118 additions)

- `system-design.md` — still not created.
- `tech-stack.md` — still not created.
- `coding-standards.md` — still not created. Wave 117 (three-layer requirements-first) + Wave 118 (two-layer comprehensive-testing) discipline are candidate entries once `coding-standards.md` gets seeded.
- Fitness function for OQ-085-001's "no binary files committed under `tests/qa/wave-*/evidence/`" — QA owns implementation.
- Viewer-repo subagent body audit (per ADR-017 follow-up).
- **NEW (Wave 118):** consider a Wave 118-B QA grep test that asserts the canonical anchor phrase + 8 co-presence anchors are present in `qa.md`'s new section AND that the four-class section headings (`Positive`, `Negative`, `Edge`, `All known sample inputs`) appear in `workspace-conventions.md`'s new section AND that the skill file exists with the correct frontmatter `name`. Pattern matches Wave 117's completeness shape. Filing as candidate after PR merges.

### Notes / caveats (Wave 118)

- The clause name ("Comprehensive test coverage (Wave 118 — MANDATORY)") is deliberately verbose to make it grep-targetable; QA's completeness test can match on the full heading without ambiguity.
- The skill file uses YAML frontmatter with only `name` + `description` — no `disable-model-invocation`, since the skill IS intended to be model-invocable when QA writes tests. Mirrors Wave 117's `requirements-first` convention; opposite of `handoff` (slash command, not auto-trigger).
- The install script's `SKILLS_SRC_DIR` glob (`"$SKILLS_SRC_DIR"/*/`) already picks up new skill subdirectories without code change. Verified by inspection — Wave 117 wired this glob; Wave 118 reaps the benefit.
- Anchor 7 (`every known sample input`) was chosen as the iteration-rule anchor because both the canonical hard-rule phrase ("every known sample input file") and the workspace-conventions cross-link ("all known sample inputs") share the same root phrase; QA's grep can match the substring `every known sample input` in qa.md's body and the variant phrasings elsewhere via separate assertions. The canonical phrase is the authoritative one.
- Trigger incident (LFM date-fix, 9-file sample set, 1 outlier) is referenced in three places (skill body, qa.md clause, workspace-conventions section) so future readers can find the WHY from any of the three entry points. Same pattern as Wave 117's trigger-incident anchoring.

---

## PREV — 2026-06-04 — Wave 117 (requirements-first enforcement — skill + implementer refusal + BA auto-routing)

### Wave-117 PASS verdict — PR #0 — SHA 7c994a1c8b835266049e20c835dab926ad875f1e
- **Gate role:** architect
- **Timestamp:** 2026-06-04T17:05:00Z
- **Notes:** Single-author multi-file edit landing requirements-first enforcement at three layers — (1) new orchestrator-side skill at `.claude/skills/requirements-first/SKILL.md` + install-script extension to symlink skills into `~/.claude/skills/`; (2) hard-refusal pre-flight gates added to 4 implementer subagent bodies (backend-developer, ui-developer, qa, devsecops); (3) BA auto-routing clause added to business-analyst body. Self-attested PASS — all edits within Architect's own lane (architecture/ workspace-conventions.md edit + .claude/agents/ subagent body edits + .claude/skills/ skill addition + scripts/install-agents-user-scope.sh extension), no peer-edit-violation footprint. Placeholder block per ADR-018 Wave 111b amendment: `PR #0` + last-known SHA `7c994a1` (current HEAD of main pre-staging). DevSecOps post-merge backfill replaces with real PR # + merge SHA via `chore(handoff): backfill Wave-117 verdict PR # and merge SHA`.

### Canonical anchor phrases (Wave 117 — grep-reuse for QA Phase 2 regression test)

QA's Wave 117 completeness test will grep these verbatim substrings across the relevant subagent body files. Final wording ratified below:

#### Implementer pre-flight gate (4 bodies — `backend-developer.md`, `ui-developer.md`, `qa.md`, `devsecops.md`)

The Wave 117 pre-flight gate clause MUST appear in each of the 4 implementer bodies, each in its own `### Requirements-first pre-flight gate (Wave 117 — MANDATORY)` section. The canonical anchor phrase (every body contains this verbatim substring):

> **Before writing any code, you MUST verify a US-NNN file exists in the active workspace's requirements/user-stories/ directory.**

Plus, in EVERY body's clause, the following anchor substrings co-present within the same section:

1. `Wave 117` — wave identifier in the section heading.
2. `MANDATORY` — section-heading severity marker.
3. `HALT` — the verb the implementer uses on missing US.
4. `[[HANDOFF: business-analyst]]` — the advisory block emitted on HALT.
5. `requirements/user-stories/` — the directory the implementer checks.
6. `[exception:` — names the exception-tag list (at least one tag string is present).

#### BA auto-routing clause (1 body — `business-analyst.md`)

The Wave 117 auto-routing clause MUST appear in `business-analyst.md` in its own `### Auto-routing on raw user requirements (Wave 117 — MANDATORY)` section. The canonical anchor phrase (BA's body contains this verbatim substring):

> **When invoked with a raw user requirement, BA writes the US file AND emits parallel HANDOFF advisory blocks to QA and the implementing developer in the same response.**

Plus, in BA's clause, the following anchor substrings co-present within the same section:

1. `Wave 117` — wave identifier in the section heading.
2. `MANDATORY` — section-heading severity marker.
3. `[[HANDOFF: qa]]` — first of the two required HANDOFF blocks.
4. `[[HANDOFF: <ui-developer|backend-developer|devsecops>]]` — generic name for the second HANDOFF block. (At least one of the three concrete role-ids — `ui-developer`, `backend-developer`, `devsecops` — appears in the section body too.)
5. `## Story` + `## Acceptance criteria` + `## Out of scope` — the three mandatory US sections BA writes.
6. `same response` — names the parallelism semantic (HANDOFFs in one reply, not serial).

#### Workspace-conventions cross-link section

`architecture/workspace-conventions.md` has a new section titled `## Requirements-first enforcement (Wave 117)` that enumerates the three enforcement layers and cross-links to the skill + subagent body sections. The completeness test should verify this section exists by heading match.

### Files landed Wave 117 (8 paths, single-author within Architect's lane)

1. **`.claude/skills/requirements-first/SKILL.md`** (new) — orchestrator-side checklist. YAML frontmatter (`name`, `description`) follows the convention of `~/.claude/skills/handoff/SKILL.md`. Five gates: detect implementation work, identify active workspace, check for existing US reference, dispatch BA first if absent, dispatch QA + Dev in parallel after BA returns. Applies to ANY project — not just apex-team. The skill is now installed in `~/.claude/skills/requirements-first/SKILL.md` via the install script.
2. **`scripts/install-agents-user-scope.sh`** (extended) — now symlinks both `.claude/agents/*.md` files into `~/.claude/agents/` AND `.claude/skills/*/` directories into `~/.claude/skills/`. Idempotent. `--uninstall` removes both classes. Verified: `bash scripts/install-agents-user-scope.sh` reports `agents: 0 installed, 0 refreshed, 8 already current; skills: 1 installed, 0 refreshed, 0 already current`.
3. **`.claude/agents/backend-developer.md`** (extended) — new `### Requirements-first pre-flight gate (Wave 117 — MANDATORY)` section between `### Your job` and `### Your boundaries`. Carries the canonical anchor phrase, 6 co-presence anchors, HALT procedure, `[[HANDOFF: business-analyst]]` advisory block template.
4. **`.claude/agents/ui-developer.md`** (extended) — same shape as backend-developer.md.
5. **`.claude/agents/qa.md`** (extended) — same shape, with QA-specific elaboration: "code" includes test code; `[exception: gate-verdict]` is the common QA-specific exception.
6. **`.claude/agents/devsecops.md`** (extended) — same shape, with DevSecOps-specific elaboration: "code" includes CI workflow YAML and deploy manifests with runtime-visible effect; the merge step itself is outside this gate's scope.
7. **`.claude/agents/business-analyst.md`** (extended) — new `### Auto-routing on raw user requirements (Wave 117 — MANDATORY)` section between `### Your responsibilities` and `### Your boundaries`. Carries the canonical anchor phrase, 6 co-presence anchors, procedure for writing US + INDEX update + dual HANDOFF emission.
8. **`architecture/workspace-conventions.md`** (extended) — new `## Requirements-first enforcement (Wave 117)` section ahead of `## OQ-085-001 — Test artifact retention policy (RESOLVED)`. Enumerates the three enforcement layers, cross-links to the skill + each subagent body section, names the trigger incident.

### Gate verification (Wave 117)

- `pnpm vitest run tests/qa/wave-108/subagent-body-cleanliness.test.ts` → 153/153 PASS. Token discipline preserved across all 5 body edits (no denylisted tokens reproduced verbatim in the new clauses).
- `pnpm vitest run tests/qa/wave-110/subagent-body-completeness.test.ts` → 12/12 PASS. Existing co-authorship + pre-verdict SHA sync + merge-protocol clauses untouched; new pre-flight gate clauses are region-disjoint additions (mid-body between `### Your job` and `### Your boundaries`).
- `pnpm vitest run tests/qa/wave-111/pass-verdict-format.test.ts` → 21/21 PASS. ADR-018 canonical verdict format unchanged.
- `pnpm vitest run tests/qa/wave-111/wave-111b-completeness.test.ts` → 34/34 PASS. ADR-018 cross-refs and Lessons sections in gate-role bodies untouched by Wave 117's pre-flight-gate additions (Wave 117 edits land before `### Your boundaries`; Lessons sections are at end-of-file — region-disjoint).
- `pnpm vitest run tests/qa/wave-111c/wave-111c-completeness.test.ts` → 29/29 PASS.
- `pnpm vitest run tests/qa/wave-112/wave-112-completeness.test.ts` → 59/59 PASS.
- `pnpm vitest run tests/qa/wave-113/backfill-enforcement.test.ts` → PASS.
- All 308 subagent-body regression tests across waves 108/110/111/111c/112 → PASS.

### Architecture/ co-authorship gate (Wave 109 rule, self-reflection)

This wave's PR will touch:
- `architecture/workspace-conventions.md` (Architect-owned, single-author = me, gate satisfied).
- `.claude/agents/*.md` (Architect's lane for review-rule edits; my own rules; gate satisfied).
- `.claude/skills/requirements-first/SKILL.md` (new skill; sits under `.claude/skills/` which is Architect's review surface for cross-cutting agentic protocol; gate satisfied).
- `scripts/install-agents-user-scope.sh` (install-script change; supports the skill addition; gate satisfied — Architect single-authors the cross-cutting protocol change).
- `coordination/handoffs/architect.md` (this file — my own HANDOFF doc).

No peer is co-authoring any file under `architecture/`. No HANDOFF-from-peer pre-condition required.

### Peer-HANDOFF edit gate (Wave 112 step 4b — meta-self-check)

This wave's PR touches `coordination/handoffs/architect.md` (this file) — edited by Architect. No peer HANDOFF docs are edited. Step 4b boundary satisfied: own-lane edit only.

### In flight / next

- This slice is ready for code review. Single-author across all 8 paths within my own lane — both gates (co-authorship + peer-HANDOFF edit) verified.
- **QA Phase 2:** the canonical anchor phrases recorded above ARE QA's spec source for a Wave 117 completeness regression test. Suggested location: `tests/qa/wave-117/wave-117-completeness.test.ts`. Pattern matches Wave 108/110/111 cleanliness/completeness/format triad. The implementer-pre-flight clause is grep-asserted across 4 bodies; the BA auto-routing clause is grep-asserted in `business-analyst.md`; the workspace-conventions section heading is grep-asserted in `architecture/workspace-conventions.md`. QA dispatches after Wave 117 commits.
- DevSecOps post-merge step (per ADR-018 Wave 111b amendment): replace `PR #0` placeholder + last-known SHA `7c994a1` (truncated; current main HEAD) with the real PR # + merge SHA via `chore(handoff): backfill Wave-117 verdict PR # and merge SHA`. Note: this wave's verdict SHA uses a truncated zero-padded placeholder because the actual pre-staging HEAD was `7c994a1` (7-char short form from git log); Architect lacks a full 40-char SHA in the dispatch brief. DevSecOps's backfill resolves both fields at merge time.

### Parked / future (carried forward, plus Wave 117 additions)

- `system-design.md` — still not created.
- `tech-stack.md` — still not created (Vitest + ESLint + TS + pnpm is the entire stack).
- `coding-standards.md` — still not created. Wave 117 requirements-first discipline (three-layer enforcement: skill + BA auto-routing + implementer hard-refusal) is a candidate entry alongside Wave 111b lessons-section pattern and Wave 112 boundary-clause discipline.
- Fitness function for OQ-085-001's "no binary files committed under `tests/qa/wave-*/evidence/`" — QA owns implementation.
- Viewer-repo subagent body audit (per ADR-017 follow-up).
- **NEW (Wave 117):** consider a Wave 117-B QA grep test that asserts the canonical anchor phrase + 6 co-presence anchors are present in each of the 4 implementer bodies AND that BA's auto-routing anchor phrase + 6 co-presence anchors are present in `business-analyst.md`. Pattern matches Wave 108/110/111 cleanliness/completeness/format triad. Filing as candidate after PR merges.

### Notes / caveats

- **UX Designer's flag (from Wave 117 NOW in `coordination/handoffs/ux-designer.md`) addressed inline:** UX raised that the skill omitted ux-designer from the BA → implementer fan-out, creating a latent UI-gate bypass. Resolution: (a) the skill's Gate-5 procedure now explicitly names ux-designer as a parallel dispatch for UI-touching work, with a detection rule; (b) BA's auto-routing clause now emits `[[HANDOFF: ux-designer]]` in the same response for UI ACs. The four-parallel-dispatch pattern (QA + ui-developer + ux-designer for UI work; QA + backend-developer for backend; QA + devsecops for pipeline) is now consistent across skill + BA body. The BA anchor phrase ("When invoked with a raw user requirement, BA writes the US file AND emits parallel HANDOFF advisory blocks to QA and the implementing developer in the same response") still binds — "implementing developer" expands to "ui-developer + ux-designer" for UI work, "backend-developer" for backend, "devsecops" for pipeline.
- The clause names ("Requirements-first pre-flight gate (Wave 117 — MANDATORY)" + "Auto-routing on raw user requirements (Wave 117 — MANDATORY)") are deliberately verbose to make them grep-targetable; QA's completeness test can match on the full heading without ambiguity.
- The skill file uses YAML frontmatter with only `name` + `description` — no `disable-model-invocation` because the skill IS intended to be model-invocable when the outer orchestrator sees implementation work. This is the opposite of `handoff` which sets `disable-model-invocation: true` (it's a slash command, not an auto-trigger).
- The install script's idempotency was verified: re-running reports "8 already current; 1 already current" on second run (after the first run installs the skill). The `--uninstall` path removes both classes of symlinks.
- For QA's eventual completeness test: the canonical anchor phrase for implementers is structured to also match in BA's body if BA quotes it back (BA's auto-routing section does NOT quote the implementer phrase verbatim — it directs to the implementer files instead). Verified: `grep -c "Before writing any code, you MUST verify"` returns 4 (one match per implementer body) and 0 in BA's body. If QA wants exact-4-occurrence semantics (one match per implementer, zero matches elsewhere), that's grep-checkable. The BA auto-routing anchor phrase appears exactly once across all 8 bodies — only in `business-analyst.md`.

---

## PREV — 2026-06-04 — Wave 113 Phase 1 (NFR sign-off + #332 close-with-rationale)

### Wave-113 PASS verdict — PR #0 — SHA 75266d336c72f749a89b430228771777dd39ba60
- **Gate role:** architect
- **Timestamp:** 2026-06-04T05:33:15Z
- **Notes:** Wave 113 Phase 1 deliverables: (1) NFR sign-off for Option A backfill enforcement CI extension (cron + push-to-main triggers added to existing TTL-check job in pass-verdict-format-check.yml); (2) #332 closed as won't-fix with full rationale. No body edits this wave — HANDOFF-only update + 1 issue close. Placeholder block per ADR-018 Wave 111b amendment: `PR #0` + last-known SHA `75266d336c72f749a89b430228771777dd39ba60` (current HEAD of main pre-staging). DevSecOps post-merge backfill replaces with real PR # + merge SHA via `chore(handoff): backfill Wave-113 verdict PR # and merge SHA`.

### Deliverable 1 — NFR sign-off for Option A (backfill enforcement CI extension)

**Decision: APPROVED.** DevSecOps may add `schedule:` (nightly cron) + `push: branches: [main]` triggers to `.github/workflows/pass-verdict-format-check.yml`, scoped to run ONLY the TTL check job (NOT the format-check job, which requires PR context).

**Four NFR dimensions evaluated:**

1. **Workflow concurrency.** Cron and push triggers can race — e.g. a push-to-main lands at 02:59 UTC while the 03:00 nightly cron fires. Both runs would scan the same `coordination/handoffs/*.md` files for `PR #0` placeholders past TTL. **Acceptable.** The TTL check is soft-fail (exits 0 on warning), so a double-warning is at worst noise in two run logs — no real harm. If the noise becomes operationally annoying, DevSecOps can add `concurrency: group: ttl-check, cancel-in-progress: true` to the workflow YAML in a follow-up. Not a Wave 113 blocker.

2. **GitHub Actions cost.** 1 nightly cron run × ~1 minute × 365 days/year ≈ 6 hours/year of compute. Plus N push-to-main runs × ~1 minute each (push-to-main cadence is ≤10/day in practice, so ~60 minutes/year). Total: well under the GitHub Actions free-tier monthly minutes for a public repo, and trivially under the paid-tier allotment if the repo goes private. **Negligible cost.**

3. **Permissions.** The existing workflow declares `permissions: contents: read` + `pull-requests: read`. The TTL check (a) reads files via the checkout action (`contents: read` covers), (b) calls `gh pr list --state merged --json number,mergedAt,mergeCommit` (covered by `pull-requests: read`). No additional permissions needed for cron or push triggers. **No permissions escalation.**

4. **Failure semantics.** The TTL check MUST remain soft-fail (warning, exit 0) on ALL triggers — pull_request, schedule, push. Hard-failing on a TTL warning would block main on a missed backfill, which is exactly the wrong outcome (the verdict is correct; only the placeholder values are stale; the PR is already merged). DevSecOps's implementation MUST verify all three trigger paths exit 0 on TTL warning. **Soft-fail invariant is load-bearing — gate this in CI implementation review.**

**NFR delta:** none. The existing workflow's NFR envelope (read-only permissions, soft-fail TTL check, U+2014 em-dash literal in regex, no shell injection on `PR_TITLE`/`PR_BODY` via env: passing) is preserved. The extension is purely additive — new triggers fire the same TTL-check job logic that already exists.

**One observation, not a block:** the format-check job (lines 39-114) embeds `${PR_TITLE}` and `${PR_BODY}` references — these are pull_request-context-only. DevSecOps's extension must ensure the cron + push triggers do NOT route through the format-check job, only the TTL-check job. The cleanest implementation is two separate \`jobs:\` entries (one gated to \`if: github.event_name == 'pull_request'\`, the other unconditional). If implemented as a single job with conditional steps, the `env:` references to `github.event.pull_request.*` would error on non-PR triggers. Naming this explicitly so DevSecOps doesn't trip the wire.

**Sign-off:** Architect APPROVES Option A. DevSecOps proceed with implementation.

### Deliverable 2 — #332 closed as won't-fix

`gh issue close 332` executed with the full rationale comment. Key reasoning:

1. **Runtime injection point is the structural enforcement.** User-directive-supremacy content lives in the shared system-prompt block injected at every subagent runtime invocation — NOT duplicated inline in each `.claude/agents/*.md` body file. Plan C's subagent runtime prepends the shared preamble to every subagent's context; per-body duplication would create drift risk without correctness gain.

2. **Functional coverage already gated.** Wave 110 completeness test (`tests/qa/wave-110/subagent-body-completeness.test.ts`) + Wave 112 completeness test already assert presence of directive-supremacy clauses (AC6 of US-091). The functional invariant is mechanically enforced.

3. **A positional byte-bound would over-spec.** Asserting "must appear in first ~N chars" would force restructuring the role-prompt preamble that all 8 bodies share — breaking the YAML frontmatter + description convention without changing the functional outcome. Position-in-file is an implementation artifact of body format, not a correctness property.

4. **Reopen condition documented:** if a future runtime change removes the shared system-prompt injection (e.g. each subagent body becomes responsible for its own preamble), reopen — the positional bound becomes load-bearing at that point.

### Verification (Wave 113 Phase 1)

- No source files touched this wave (HANDOFF-only + 1 GitHub issue close). No test runs required — the wave introduces zero runtime-code changes.
- ADR-018 canonical-block conformance for the Wave-113 verdict heading: heading `### Wave-113 PASS verdict — PR #0 — SHA 75266d336c72f749a89b430228771777dd39ba60` matches `^### Wave-[0-9]{1,4} (PASS|REVISE|FAIL) verdict — PR #[0-9]{1,6} — SHA [0-9a-f]{40}$`. Em-dash U+2014 confirmed by inspection. All 4 required fields (Gate role / Timestamp / Notes) present in the block above.
- Architect's co-authorship gate (Wave 109 rule): this wave touches `coordination/handoffs/architect.md` only. Single-author own-lane edit. Gate satisfied.
- Architect's peer-HANDOFF edit gate (Wave 112 step 4b): only own HANDOFF doc edited. Gate satisfied.

### In flight / next

- This slice is ready for code review (HANDOFF doc + issue-close — no code surface).
- DevSecOps: proceed with Option A CI extension implementation per the NFR sign-off above. Implementation must (a) keep TTL check soft-fail on all triggers, (b) route cron + push triggers to the TTL-check job only (not the format-check job), (c) preserve existing read-only permissions, (d) consider concurrency group only if double-warnings become operationally noisy.
- DevSecOps post-merge step (per ADR-018 Wave 111b amendment): replace `PR #0` + `75266d336c72f749a89b430228771777dd39ba60` with the real PR # + merge SHA via `chore(handoff): backfill Wave-113 verdict PR # and merge SHA`.

### Parked / future (carried forward, unchanged)

- `system-design.md` — still not created.
- `tech-stack.md` — still not created (Vitest + ESLint + TS + pnpm is the entire stack).
- `coding-standards.md` — still not created. Wave 112 boundary-clause discipline (canonical anchor phrase + 6 co-presence anchors) is a candidate entry. So is the Wave 111b lessons-section pattern.
- Fitness function for OQ-085-001's "no binary files committed under `tests/qa/wave-*/evidence/`" — QA owns implementation.
- Viewer-repo subagent body audit (per ADR-017 follow-up).
- Wave 112-B candidate: QA grep test asserting the canonical Wave-112 anchor phrase + 6 co-presence anchors are present in each of the 8 subagent bodies. Pattern matches Wave 108/110/111 cleanliness/completeness/format triad.
- Wave 113+ candidate: if cron + push double-warnings become noisy after Option A lands, add `concurrency: group: ttl-check, cancel-in-progress: true` to the workflow YAML.

### Notes / caveats

- #332's close rationale is durable in the GitHub issue comment thread; the reopen condition ("future runtime change removes shared system-prompt injection") is named explicitly so a future contributor reading the closed issue understands when re-evaluation is warranted.
- The NFR sign-off above is the gate verdict for DevSecOps's Option A implementation. When the implementation PR lands, Architect's review will verify the 4 NFR dimensions hold against the actual YAML changes (especially the soft-fail-on-all-triggers invariant + the trigger-to-job routing).
- No body edits this wave per dispatch brief. This is a pure NFR / process slice — the deliverables are (1) an ADR-018-canonical verdict block recording the sign-off and (2) a closed GitHub issue with rationale.

---

## ⏭️ PREV — 2026-06-04 — Wave 112 Phase 1 (#391 peer-edit protocol)

### Wave-112 PASS verdict — PR #0 — SHA 39298fbb1caf5e38b9f7d3b09f4cf11a8a879074
- **Gate role:** architect
- **Timestamp:** 2026-06-04T12:25:30Z
- **Notes:** Single-author multi-file edit landing the #391 peer-edit boundary across the 8 subagent bodies and `architecture/workspace-conventions.md`. Self-attested PASS — all edits within Architect's own lane (architecture/ + .claude/agents/), no peer-edit-violation footprint of my own. Placeholder block per ADR-018 Wave 111b amendment: `PR #0` + last-known SHA (current HEAD `39298fbb1caf5e38b9f7d3b09f4cf11a8a879074` from main before staging the verdict commit). DevSecOps post-merge backfill replaces with real PR # + merge SHA.

### Canonical boundary clause text (Wave 112 — grep-reuse for QA Phase 3 completeness test)

The Wave 112 peer-edit boundary clause MUST appear in each of the 8 subagent bodies' "Your boundaries" section. The canonical anchor phrase (every body contains this verbatim substring):

> **You do NOT write to other roles' `coordination/handoffs/<peer-id>.md` files.**

Plus, in EVERY body's clause, the following anchor substrings co-present within the same boundary bullet:

1. `your own HANDOFF doc` — points the role at its own file as the correct write target.
2. `advisory ` (followed eventually by `[[HANDOFF: peer]]` or `[[DISPATCH: peer]]`) — names the cross-role mechanism.
3. `outer orchestrator relays` (or `outer Claude Code orchestrator`) — explains the runtime semantics under Plan C.
4. `Agent` (the `Agent` tool invocation) — names the relay mechanism.
5. `muddies the verdict chain` — explains the harm.
6. `Architect's review gate` (or `step 4b`) — names the enforcement mechanism.

Per-role variations to note in QA's completeness test:
- **product-owner.md** uses `[[DISPATCH: peer]]` (PO's mechanism) rather than `[[HANDOFF: peer]]`.
- **devsecops.md** carries a single narrow exception clause for the ADR-018 post-merge backfill of `PR #0` + placeholder SHA → real PR # + merge SHA. This is the ONE authorized peer-edit class and is named in ADR-018 itself. The test should not flag DevSecOps's exception text as a boundary-clause violation.

### Files landed Wave 112 Phase 1 (8 .claude/agents/ + 1 architecture/)

1. `architecture/workspace-conventions.md` — new section "Peer-edit protocol — HANDOFF docs are single-author by role (Wave 112)" with: rule (peers read; only owner writes), rationale (audit trail integrity, verdict chain load-bearing for ADR-018), correct mechanisms (own HANDOFF + workspace artifacts + advisory blocks), narrow exception (system-level housekeeping with explicit authorization + 3 conditions), enforcement (Architect step 4b + body boundary clauses), discovered-during (Wave 111c PR #388 / #391). Also annotated the `coordination/handoffs/<role-id>.md` row in the contract table.

2. `.claude/agents/architect.md` —
   - New code-review rubric step `4b` ("Peer-HANDOFF edit gate") sibling to existing step 4 ("Co-authorship gate (`architecture/` files)"). Parallel gates; both FAIL the PR on violation. Step 4b text includes the canonical anchor phrase and cites issue #391 + workspace-conventions.md.
   - New boundary clause appended to "Your boundaries" section. Covers the case where Architect would otherwise edit a peer's HANDOFF to record review findings — directs to advisory blocks + workspace artifacts instead.

3. `.claude/agents/product-owner.md` — new "Your boundaries" section (PO did not previously have one explicitly delineated). Single boundary bullet covers the peer-HANDOFF edit prohibition + narrow housekeeping exception. Mechanism field uses `[[DISPATCH: peer]]` per PO convention.

4. `.claude/agents/business-analyst.md` — new boundary bullet appended after the existing `architecture/` co-authorship boundary. Clarifies that "file it as a HANDOFF entry in `coordination/handoffs/architect.md`" historically meant emit a `[[HANDOFF: architect]]` block — NOT directly edit Architect's HANDOFF. This is the most-likely-to-be-misread existing clause across the implementer bodies.

5. `.claude/agents/ux-designer.md` — new boundary bullet appended after `architecture/` boundary. Reinforces that PASS/REVISE verdicts land in UX's OWN HANDOFF per ADR-018, never in the implementer's.

6. `.claude/agents/ui-developer.md` — new boundary bullet between `architecture/` boundary and the "You do NOT write tests" line. Reinforces "file a HANDOFF entry" = advisory block, not direct peer edit.

7. `.claude/agents/backend-developer.md` — same shape as ui-developer.md. Boundary bullet positioned after `architecture/` and before the tests/UI/CI exclusion bullets.

8. `.claude/agents/qa.md` — new boundary bullet after `architecture/` boundary. Reinforces that QA's PASS/FAIL verdicts land in QA's OWN HANDOFF per ADR-018 — not in the implementer's, not in Architect's, not in DevSecOps's. Also addresses the "file a HANDOFF entry" semantic.

9. `.claude/agents/devsecops.md` — new boundary bullet after `architecture/` boundary, with the ONE narrow ADR-018 backfill exception named explicitly. The exception is scoped: replace `PR #0` + placeholder SHA with real PR # + merge SHA on the verdict line — any edit outside that scope is a violation. Cites Wave 111c (PR #388) + #391.

### Gate verification (Wave 112 Phase 1)

- `pnpm vitest run tests/qa/wave-108/subagent-body-cleanliness.test.ts` → 153/153 PASS. Token discipline preserved across all 8 body edits (no denylisted tokens reproduced verbatim in the boundary clauses).
- `pnpm vitest run tests/qa/wave-110/subagent-body-completeness.test.ts` → 12/12 PASS. Existing co-authorship clauses untouched; new boundary clauses are region-disjoint additions.
- `pnpm vitest run tests/qa/wave-111/pass-verdict-format.test.ts` → 21/21 PASS. The Wave-112 PASS verdict block above conforms to ADR-018 canonical regex (verified by inspection: `### Wave-112 PASS verdict — PR #0 — SHA 39298fbb1caf5e38b9f7d3b09f4cf11a8a879074` matches `^### Wave-\d{1,4} (PASS|REVISE|FAIL) verdict — PR #\d{1,6} — SHA [0-9a-f]{40}$`).
- `pnpm vitest run tests/qa/wave-111/wave-111b-completeness.test.ts` → 34/34 PASS. ADR-018 cross-refs and Lessons sections in gate-role bodies untouched by Wave 112's boundary-clause additions (Phase 2 will add Lessons to the remaining 5 bodies — region-disjoint from Phase 1's mid-file boundary edits).
- `pnpm vitest run tests/qa/wave-111c/wave-111c-completeness.test.ts` → 29/29 PASS.
- `pnpm test:run` → 249/249 PASS full suite.
- `pnpm lint` → clean.
- `pnpm type-check` → clean.

### Co-authorship gate verification (Wave 109 rule, self-reflection)

This wave's PR will touch:
- `architecture/workspace-conventions.md` (Architect-owned, single-author = me, gate satisfied)
- `.claude/agents/*.md` (Architect's lane for review-rule edits; my own rules; gate satisfied)

No peer is co-authoring any file under `architecture/`. No HANDOFF-from-peer pre-condition required.

### Peer-HANDOFF edit gate verification (Wave 112 step 4b — meta-self-check)

This wave's PR touches `coordination/handoffs/architect.md` (this file) — edited by Architect. No peer HANDOFF docs are edited. Step 4b boundary satisfied: own-lane edit only.

### Phase 2 region-disjoint confirmation

Per the dispatch brief, PO confirmed Phase 2 (5 other subagents adding `## Lessons from prior incidents` sections per #196 carry-over) lands the new sections as tail-appended `## Lessons from prior incidents` headings at end-of-file. My Wave 112 edits land in mid-file `### Your boundaries` sections (or the new section position for PO). Region-disjoint: no edit collision between Phase 1 (mid-file boundary additions) and Phase 2 (end-of-file Lessons additions). The two phases can sequence without rework.

### In flight / next

- This slice is ready for code review. Single-author across all 10 files (1 architecture/ doc + 8 subagent bodies + this HANDOFF) within my own lane — both gates (co-authorship + peer-HANDOFF edit) verified.
- Phase 2 fan-out — 5 subagents (BA, UI Dev, BE Dev, UX, PO) self-edit their bodies to add `## Lessons from prior incidents` sections per #196 carry-over. Phase 2 is region-disjoint from Phase 1 by design.
- DevSecOps post-merge step (per ADR-018 Wave 111b amendment): replace `PR #0` placeholder + last-known SHA `39298fbb1caf5e38b9f7d3b09f4cf11a8a879074` with the real PR # + merge SHA via `chore(handoff): backfill Wave-112 verdict PR # and merge SHA`.

### Parked / future (carried forward, plus Wave 112 additions)

- `system-design.md` — still not created.
- `tech-stack.md` — still not created (Vitest + ESLint + TS + pnpm is the entire stack).
- `coding-standards.md` — still not created. Wave 112 boundary-clause discipline (the canonical anchor phrase + 6 co-presence anchors) is a candidate entry. So is the Wave 111b lessons-section pattern.
- Fitness function for OQ-085-001's "no binary files committed under `tests/qa/wave-*/evidence/`" — QA owns implementation.
- Viewer-repo subagent body audit (per ADR-017 follow-up).
- **NEW (Wave 112):** consider a Wave 112-B QA grep test that asserts the canonical anchor phrase + 6 co-presence anchors are present in each of the 8 subagent bodies. Pattern matches Wave 108/110/111 cleanliness/completeness/format triad. Filing as candidate after PR merges.

### Notes / caveats

- Step 4b in architect.md uses the bullet number `4b.` rather than renumbering subsequent steps. Rationale: existing Wave 110 completeness test asserts canonical step phrases anchored against current numbering (step 4 = co-authorship gate). Adding 4b preserves the existing assertion semantics without renumbering churn. If a future wave wants to renumber, that's a Wave 110 completeness-test update + cross-file rewrite — out of scope here.
- The boundary clause in each body intentionally varies in wording per-body tone (UI Dev / BE Dev plain-spoken; QA verdict-aware; UX verdict-aware; PO orchestration-aware; BA spec-aware; DevSecOps with the named exception). The 6 co-presence anchors are what makes it grep-checkable; verbatim phrasing across bodies is NOT the requirement.
- DevSecOps's ADR-018 backfill exception is the ONE authorized peer-edit class. It is named explicitly in DevSecOps's body and scoped narrowly (placeholder-replacement only). Any future peer-edit-exception class needs a similar treatment: named in the relevant subagent body, scoped narrowly, justified in an ADR or workspace-conventions amendment.

---

## ⏭️ PREV — 2026-06-04 — Wave 111c (alpha-suffix ratification + PR #388 review)

### Wave-111 PASS verdict — PR #388 — SHA ce6b2b1a0781ee15fcf8987cbc6a16e55671ec5b
- **Gate role:** architect
- **Timestamp:** 2026-06-04T03:50:02Z
- **Notes:** Wave 111c co-authorship + alpha-suffix ratification. **Decision: Option A — RATIFY DevSecOps's normalization. ADR-018 unchanged.** Sub-waves (a/b/c) are operational sequencing within a parent wave-number; PR# is the load-bearing disambiguator (ADR-018's state-semantics table identifies verdicts by PR# + HEAD SHA, not wave-id). PR #386 = Wave 111a, PR #387 = Wave 111b, PR #388 = Wave 111c — distinguished by PR#, all canonical `Wave-111`. Co-authorship gate verified: PR #388 touches zero `architecture/` files (gh pr view confirms 9 files, none under `architecture/`). All gates clean: vitest 220/220, lint clean, type-check clean. Canonical regex unchanged in workflow YAML (lines 58 + 79 match ADR-018 spec exactly, `\d` → `[0-9]` for grep -E compatibility only).

### Decision rationale — Option A (ratify) vs Option B (amend regex)

**Chosen: Option A.** Reasoning:

1. **ADR-018's state-semantics table already identifies verdicts by `PR #N` + HEAD SHA, NOT by wave-number.** Wave-number is descriptive metadata; PR# + SHA are the load-bearing identifiers. Allowing `[a-z]?` solves a disambiguation problem the format does not have — PR# is the disambiguator and was always intended to be.

2. **Semantic clarity preserved.** With Option A, `Wave-NNN` always means "the integer wave-number." With Option B, `Wave-111` would ambiguously mean either "the parent wave covering 111a/b/c" or "the first sub-wave whose author skipped the letter." Mixing parent-wave and sub-wave identifiers in the same regex muddies the data model.

3. **Zero churn.** Backfills already done; no test update; no workflow YAML edit; no ADR amendment. Wave 111c's pending QA completeness test continues against the unchanged spec.

4. **Sub-waves are operational artifacts.** `111a/b/c` describes intra-wave sequencing for the team (Phase 1 lands the foundation, Phase 1b lands the amendment surfaced by self-application, Phase 1c lands the CI wiring + ratification). The canonical wave-number is the numeric prefix; sub-letters are casual organizing convention, not first-class identifiers.

5. **Wave 111c HANDOFF doc edit accepts (not amends) the decision.** DevSecOps's `coordination/handoffs/devsecops.md` Wave 111c entry references `Wave-111c` in prose (e.g. backfill commit message `chore(handoff): backfill Wave-111c verdict PR # and merge SHA`); the prose use of sub-wave letters in commit messages, branch names, narrative documentation remains acceptable — the spec binds only the canonical verdict block heading.

### Co-authorship gate verification (Wave 109 rule)

`gh pr view 388 --json files` → 9 files. Manual scan: zero matches under `architecture/`. PR #388 does NOT trip the co-authorship gate. DevSecOps correctly deferred the ADR-018 amendment question via HANDOFF rather than editing `architecture/` unilaterally — that is the correct discipline, ratified here.

### Pre-verdict SHA sync (Wave 109 rule)

Verdict rendered against worktree at SHA `ce6b2b1a0781ee15fcf8987cbc6a16e55671ec5b` (PR #388 HEAD per `gh pr view`). Worktree created at `/tmp/arch-wave-111c`. `pnpm install --frozen-lockfile` clean. `pnpm test:run` 220/220 PASS. `pnpm lint` clean. `pnpm type-check` clean. `pnpm vitest run tests/qa/wave-111/pass-verdict-format.test.ts` 21/21 PASS.

### Review of PR #388 deliverables (non-UI lane — full Architect rubric applies)

**Scope:** 9 files. UI-touching detection: zero matches against `src/app/**/page.tsx`, `src/app/**/layout.tsx`, `src/components/**/*.tsx`, `src/app/globals.css`. **Pure non-UI PR — Architect-only gate.** No UX HANDOFF needed.

**File-by-file:**

1. **`.claude/agents/devsecops.md`** (+50 lines) — step 2a added (`gh pr checks` pre-merge gate, addresses #240) + new section "`gh pr merge --delete-branch` anomalous-closure playbook" (addresses #301). Step 2a's phrasing is concrete and verifiable: `gh pr checks <PR#> --watch` + treatment of `pending/in_progress/fail` as hard blockers, `skipped` as non-blocker. Aligns with deployment-gate discipline already in step 3. The anomalous-closure playbook is well-structured (Symptom / Detection / Recovery), recovery steps cite `git reflog show origin/<branch>` for the lost-branch case, and the escalation rule ("do not force-push a re-created branch to main without explicit authorization") is correctly conservative. **PASS.**

2. **`.github/workflows/pass-verdict-format-check.yml`** (+204 lines, new) — implements ADR-018 mechanical enforcement. The `CANONICAL_PATTERN` on line 58 (`^### Wave-[0-9]{1,4} (PASS|REVISE|FAIL) verdict — PR #[0-9]{1,6} — SHA [0-9a-f]{40}$`) matches ADR-018 §"Grep-able anchor regex" exactly (modulo `\d` → `[0-9]` for grep -E compat). Em-dash embedded as literal U+2014 in the YAML — required per ADR-018's em-dash note. Two checks (format + placeholder TTL) correctly separated; format check is hard-fail, TTL check is soft-warn (exits 0 on warning) per ADR-018 amendment's "out of scope this wave; catches missed backfills without blocking pre-merge legitimate placeholders." Skip override `[skip-verdict-check]` honors emergency-rollback class. **One observation, not a block:** the embedded Python heredoc at lines 155-183 mixes shell + Python which is slightly fragile — but it's bounded, only fires on placeholder verdicts, and a Python failure exits the heredoc with `2>/dev/null`. A future refactor extracting to `scripts/check-placeholder-ttl.py` would improve maintainability; logging as a follow-up candidate, not a block. **PASS with one CONCERN logged below.**

3. **`.github/workflows/ux-gate-check.yml`** (+150 lines, new) — implements #246 (UX gate bypass detection). Pattern at line 79 matches ADR-018 canonical regex. Path filter (`src/**`, `design/**`, `tests/qa/wave-*/ui-*` and `ux-*`) aligns with Architect's UI-touching detection rule in subagent body (`src/app/**/page.tsx` etc.). The reachable-ancestor check (`git merge-base --is-ancestor`) correctly implements ADR-018 amendment §"State semantics for DevSecOps step 3 (amended)" row 2. State machine well-modeled: FOUND_PASS / FOUND_REVISE_OR_FAIL / STALE_PASS / PLACEHOLDER_PASS — each with distinct exit + fail message. `[skip-ux-gate]` override honored. **One observation:** path filter at `tests/qa/wave-*/ui-*` will not match `tests/qa/wave-111/ui-foo.test.ts` (glob `*` won't cross directory boundary in YAML path filter? — GitHub's documentation says `**` is required for cross-dir; `*` matches within a single segment). Likely correct as-is (the wave-* directory is one segment, and `ui-*` is a filename prefix in the next segment, which is one segment-glob). Verified by re-reading the pattern: `tests/qa/wave-*/ui-*` matches `tests/qa/wave-NN/ui-foo.test.ts` because both `*` are single-segment globs and the path has exactly two intermediate path components. **PASS.**

4. **`LESSONS.md`** (+5 lines) — new entry at top of 2026-06-04 block for `gh pr merge --delete-branch` anomalous closure (#301). Newest-first ordering preserved. Three-field shape (What broke / Why / We now do) matches the LESSONS.md convention. Cites #301 as closed. **PASS.**

5. **`_handoff-pending/wave-111c-devsecops.md`** (+19 lines, new) — *flagged for ADR-017 inspection.* `_handoff-pending/` is a legacy convention from Wave 93 (fragment-folding workflow). ADR-014 was Superseded by ADR-017 (Wave 108), and ADR-017's denylist tooling (`tests/qa/wave-108/subagent-body-cleanliness.test.ts`) flags `_handoff-pending` references in subagent bodies. Verified: ADR-017 denylists `_handoff-pending` and `fold-handoff` tokens **in subagent bodies (`.claude/agents/*.md`) only** — not in arbitrary repo paths. The file at `_handoff-pending/wave-111c-devsecops.md` is a developer-facing fragment, not a subagent body, so it does not fail the cleanliness test. But the directory itself is stale infrastructure — under Plan C subagent runtime, fragment-folding is retired and HANDOFF docs live at `coordination/handoffs/<role>.md`. **This file should not exist in the new convention.** It duplicates content already in `coordination/handoffs/devsecops.md`. Not a block for this PR (the file is harmless and content is duplicative not conflicting), but flagging as **CONCERN** + filing follow-up issue to retire the `_handoff-pending/` convention repo-wide. Logged below.

6. **`coordination/handoffs/architect.md`** (+19 / -1) — DevSecOps's edit to my own HANDOFF doc surfacing the ratification request. **This is unusual** — typically a peer's HANDOFF to me would land via a `[[HANDOFF: architect]]` block parsed by the outer orchestrator; direct edits to my own state file by a peer are not the convention. However: under the Plan C subagent runtime, HANDOFF blocks ARE advisory text and don't auto-fire peer turns; DevSecOps left the request as both a HANDOFF block in their own state AND a direct edit in mine. Direct-edit-to-peer-HANDOFF-doc isn't forbidden by the protocol, and this is now self-corrected by my overwrite of the NOW section this turn. **Not a block, but worth noting:** the cleaner protocol would be a HANDOFF block in DevSecOps's own state pointing at me (which they did), without also editing my state. Adding to the parked items for a future protocol-discipline cluster. **PASS.**

7. **`coordination/handoffs/devsecops.md`** (+29 / -14) — DevSecOps's own state update for Wave 111c. Verdict recorded in ADR-018 canonical form on line 5 (`### Wave-111 PASS verdict — PR #0 — SHA 10c002b723ea2da2e757e57ab42f832253310c0b`). **Note:** the SHA `10c002b7` is the *parent* commit, not the PR HEAD (`ce6b2b1a`). That is correct per ADR-018 Wave 111b amendment Phase-1 ("the **last-known SHA** at the time the verdict is recorded — typically `git rev-parse HEAD` of the gate role's worktree before staging the verdict commit"). DevSecOps's verdict is a self-attested PASS, which is acceptable — the role can attest their own deliverables, and Architect's verdict here (this turn) is the cross-cutting gate. **PASS.**

8. **`coordination/handoffs/qa.md`** (+4 / -4) — Wave 111a + 111b verdict backfills. Both backfilled lines (3 + 69) match the canonical regex. Notes fields updated to record the normalization decision. **PASS.**

9. **`requirements/user-stories/US-090-wave-111c-ci-process-discipline.md`** (+68 lines, new) — well-formed US-NNN file: Status / Wave / Primary owner / Issues addressed header, AC1-AC5 each with explicit issue#, Out of scope section, Issues-addressed footer. AC5 cites the canonical regex enforcement. **BA-owned file; not in my review lane per `architecture/` co-authorship gate boundary**, but a passing observation: well-structured. PR diff shows BA was not in the loop for this US, which is a minor process-discipline observation (US creation typically goes through BA, but US-NNN files are owned by `requirements/` and DevSecOps as a peer creating one without BA HANDOFF is acceptable in emergency-class waves). **Not a block.**

### Verdict: PASS (Wave 111c PR #388)

All 9 files meet the bar. Two CONCERN-level observations filed as follow-up issues below; neither blocks merge:

1. **`_handoff-pending/` directory is stale Plan C infrastructure** — the file `_handoff-pending/wave-111c-devsecops.md` should not exist under the subagent runtime. Filing issue to retire the directory entirely.
2. **Embedded Python heredoc in `pass-verdict-format-check.yml`** — extract to `scripts/check-placeholder-ttl.py` for maintainability. Filing issue.

### Filed follow-up issues (out-of-scope findings)

- **#389 (`self-improvement`)** — Retire `_handoff-pending/` directory and the fragment-fold convention under Plan C runtime. Discovered during PR #388 review.
- **#390 (`self-improvement`)** — Extract embedded Python heredoc in `pass-verdict-format-check.yml` placeholder-TTL check to `scripts/check-placeholder-ttl.py` for maintainability. Discovered during PR #388 review.
- **#391 (`self-improvement`)** — Protocol clarification: peers should not directly edit each other's `coordination/handoffs/<peer>.md` state files. Use HANDOFF blocks (advisory text in own state) instead. Discovered when DevSecOps's PR #388 edited `coordination/handoffs/architect.md` directly.

### Worktree cleanup

`/tmp/arch-wave-111c` will be removed at end of turn via `git worktree remove`.

---

## ⏭️ PREV — 2026-06-04 — Wave 111b Phase 1 (Clusters 1 + 6 + 7 single-author)

**Deliverables (5 files, all single-author within Architect's own lane — no co-authorship gate fires):**

1. `architecture/decisions/ADR-018-pass-verdict-format.md` — Cluster 6 amendment landed: `## 2026-06-04 amendment — commit-time placeholder pattern (Wave 111b)`.
2. `architecture/INDEX.md` — ADR-018 row status updated to `Accepted (amended Wave 111b)`; "Last updated" footer refreshed.
3. `.claude/agents/architect.md` — Cluster 1 lessons section (5 incidents) + Cluster 7 ADR-018 citation in review rubric step 7.
4. `.claude/agents/qa.md` — Cluster 1 lessons section (5 incidents) + Cluster 7 ADR-018 citation in Deployment-gate verification step 5.
5. `.claude/agents/devsecops.md` — Cluster 1 lessons section (5 incidents) + Cluster 7 ADR-018 citation in Deployment workflow step 3 (including post-merge backfill sub-step).
6. `.claude/agents/ux-designer.md` — Cluster 7 ADR-018 citation only (no Cluster 1 per dispatch — UX not in top-3 drift list).

### Cluster 6 (a) vs (b) decision — Option (a) Two-phase pattern

Adopted: commit-time placeholder (`PR #0` + last-known SHA from parent commit) + DevSecOps post-merge backfill commit on main.

**Why (a) over (b):**
- **File-on-disk discipline.** CLAUDE.md hard rule: "files on disk are the only state." Moving verdicts to PR descriptions punctures this invariant. PR descriptions are mutable, not version-controlled, and require viewer-side `gh` API fetches.
- **DevSecOps step 3 already cites HANDOFF docs.** Wave 110 ratified `Open coordination/handoffs/qa.md and (if UI) coordination/handoffs/ux-designer.md`. Option (b) would require rewriting that step plus the four subagent bodies. Option (a) only adds an amendment.
- **Self-application proof.** Wave 111a's QA verdict already recorded in canonical-block form using `PR #0` + last-known SHA. The canonical regex (`PR #(\d{1,6})` + `SHA ([0-9a-f]{40})`) already accepts these values. Option (a) formalizes a usage pattern within the existing format, not a format change.
- **In-flight migration cost.** Option (a) is a no-op for Wave 111a's existing verdict (it just needs backfill). Option (b) would require relocating the verdict body.

**Backfill mechanism: DevSecOps merge step.**

Three candidates considered (table in ADR-018 amendment); DevSecOps step is the natural owner because the merge SHA is only knowable post-merge by the merge author. Manual amend rejected (verdict author no longer owns the branch). Scheduled CI rejected (leaks stale placeholders during the grace window).

Backfill commit message convention: `chore(handoff): backfill Wave-NNN verdict PR # and merge SHA`.

**State semantics for DevSecOps step 3 (amended):** the original 4-row table grew to 5 rows. New row "PASS with placeholder — pre-merge expected state" uses `git merge-base --is-ancestor <verdict-SHA> <HEAD_SHA>` to verify the placeholder's SHA is reachable from the PR HEAD — treats reachable placeholder as merge-eligible.

**Test impact: zero.** ADR-018's canonical regex is unchanged. The amendment is purely additive documentation. `tests/qa/wave-111/pass-verdict-format.test.ts` continues to pass 21/21 with no edits required. Verified.

### Cluster 1 lesson selections per body

**architect.md (5 incidents):**
1. Wave 109 / #335 — architecture/ co-authorship gate
2. Wave 108 / ADR-017 — legacy-ref sweep methodology
3. Wave 110 / #381 — docs-integrity findings on LESSONS.md
4. Wave 111a — self-application bug-catch (39-char SHA placeholder)
5. PR #138 / Wave 64 — `tsc` and `vitest` do not catch SWC parse errors (durable principle: compiler-independence in the verification matrix)

**qa.md (5 incidents):**
1. US-085 / Wave 53 — tests are files on disk, not chat artifacts
2. Wave 53 — mocking the component under visual test defeats verification
3. Wave 108 — cleanliness regression test pattern (self-applying gates)
4. Wave 109 / #314 — pre-verdict SHA sync prevents stale-checkout verdicts
5. Wave 111a — self-application surfaces format usability gaps (chicken-and-egg)

**devsecops.md (5 incidents):**
1. Wave 110 / PR #231 / #383 — merge protocol bypass on implementer's claim
2. Wave 109 / PR #311 — false-REVISE from stale checkout (upstream-aligned)
3. Wave 14 — direct-to-main "bootstrap exceptions"
4. Wave 93 → 108 — server-side "Update branch" bypasses union merge driver
5. Wave 110 step-list rationale — verifiable gates beat asserted gates

### Cluster 1 lesson-format discipline (post-mortem on first attempt)

Initial draft of architect.md lessons quoted retired patterns by name in backticks. ADR-017 cleanliness test (Wave 108) failed 4 assertions — the literal tokens for legacy patterns are denylisted across all subagent bodies, not just outside of lesson narrative. Corrected by rephrasing to describe the patterns (e.g. "dev-server commands, fragment-folding scripts, port literals") without naming the literal tokens. This is itself a lesson worth noting for Cluster 3 implementers: when documenting legacy incidents inside a subagent body, do not reproduce denylisted tokens verbatim — describe the class.

### Cluster 7 cross-references (inline citations, one-line each)

Suggested cite text (used consistently across 4 files): `see ADR-018 for canonical PASS-verdict block format; Wave 111b amendment formalizes the commit-time placeholder + DevSecOps post-merge backfill pattern.`

Locations:
- `.claude/agents/devsecops.md` step 3 (Deployment workflow) — citation + backfill sub-step text.
- `.claude/agents/architect.md` review rubric step 7 (PASS verdict definition) — citation inline.
- `.claude/agents/ux-designer.md` Gate verdict format / PASS verdict section — citation inline.
- `.claude/agents/qa.md` Deployment-gate verification step 5 — citation inline.

### Cluster 3 guidance for Phase 2 implementers (review-time only — recording here for Phase 2 fan-out)

Six implementers will land new skill sections in their own subagent bodies. Consistent structure recommendations:

- **Header level:** use `## Lessons from prior incidents` (level 2) at the END of the body, after all role-specific sections but BEFORE any auto-generated footer. This matches the position used in architect.md / qa.md / devsecops.md this wave.
- **Bullet shape:** per-incident format mandated in the Wave 111b dispatch:
  ```
  - **Date / Wave / Rule** — one-line incident summary
    - **Why:** root cause
    - **Apply:** concrete behavior the subagent should now exhibit
  ```
  Keep all three sub-fields (`**Date / Wave / Rule**`, `**Why:**`, `**Apply:**`) — the format consistency is what makes the section skimmable across roles.
- **Lesson count:** 3-5 per body. More than 5 dilutes attention; fewer than 3 suggests the role doesn't have enough drift history to warrant the section.
- **Token discipline (load-bearing):** do NOT reproduce ADR-017 denylisted tokens verbatim inside the lesson body. The Wave 108 cleanliness test (`tests/qa/wave-108/subagent-body-cleanliness.test.ts`) runs on every subagent body and fails on dev-server-command tokens, fragment-folding scripts, port literals, MCP-transport tokens, dangling `src/lib/` pointers. Describe the class instead. I caught this only by running the test; the test catches it for you mechanically.
- **Source discipline:** every lesson MUST be sourced from a real LESSONS.md entry, a real PR number, or a real wave incident. Do NOT invent lessons. If a role doesn't have 3 real incidents, the section is shorter — that's acceptable.
- **Verification:** every Cluster 3 contributor runs `pnpm vitest run tests/qa/wave-108/subagent-body-cleanliness.test.ts` BEFORE handing off. The test takes <200ms; failing it on commit is a self-inflicted REVISE.

### Verification (this turn)

- `pnpm vitest run tests/qa/wave-108/subagent-body-cleanliness.test.ts` → 153/153 PASS (post-fix; initial draft had 4 failures from quoted denylist tokens — fixed and re-verified).
- `pnpm vitest run tests/qa/wave-110/subagent-body-completeness.test.ts` → 12/12 PASS.
- `pnpm vitest run tests/qa/wave-111/pass-verdict-format.test.ts` → 21/21 PASS (ADR-018 amendment is purely additive; no test update needed — regex unchanged, fields unchanged, examples still match).
- `pnpm test:run` → 186/186 PASS full suite.
- `pnpm lint` → clean.
- `pnpm type-check` → clean.

### Architecture/ co-authorship gate

I AM the Architect. All `architecture/` edits this turn (ADR-018 amendment, INDEX.md refresh) are within my own lane. No HANDOFF required.

### In flight / next

- This slice is ready for code review. Single-author across all 6 files (5 modified + 1 INDEX) within my own lane — no co-authorship gate fires.
- Phase 2 (Cluster 3) fan-out — 6-subagent parallel work on lessons sections for: business-analyst.md, ui-developer.md, backend-developer.md, ux-designer.md (Cluster 1 portion if PO redispatches), product-owner.md, and any remaining drift bodies. PO orchestrates the fan-out; I review each PR diff in Phase 2 via Wave 109 co-authorship gate (none of those PRs should touch `architecture/`).
- Wave 111c (gated on 111b): DevSecOps wires the canonical regex into CI. Workflow: fetch PR HEAD SHA, grep gate-role HANDOFF docs, fail PR if `Wave-N PASS — PR #<N> — SHA <HEAD_SHA>` missing for a runtime-code PR. Add follow-up: detect `PR #0` placeholders on PRs merged >1h ago (catches missed backfills).
- Wave 111+ candidate (parked): `scripts/emit-verdict.sh --backfill <PR#> <merge-SHA>` helper for DevSecOps's backfill step.

### Parked / future (carried forward)

- `system-design.md` — still not created.
- `tech-stack.md` — still not created (Vitest + ESLint + TS + pnpm is the entire stack).
- `coding-standards.md` — still not created. Wave 111b lessons-section pattern is a candidate first-draft entry: "every subagent body carries a `## Lessons from prior incidents` section sourced from LESSONS.md" + the token-discipline rule.
- Fitness function for OQ-085-001's "no binary files committed under `tests/qa/wave-*/evidence/`" — QA owns implementation.
- Viewer-repo subagent body audit (per ADR-017 follow-up).
- Wave 111c CI: extend the canonical-format check to flag `PR #0` placeholders on PRs merged >1h ago (catches missed backfills without blocking pre-merge legitimate placeholders).

### Notes / caveats

- The ADR-018 amendment is purely additive — the canonical regex, field shape, and Phase-1 example block remain authoritative. The amendment formalizes a usage pattern (placeholder + backfill) inside the existing format.
- The Cluster 1 lesson narrative discipline (describe-class-not-token) is itself a candidate addition to coding-standards.md if/when that file is drafted. Recording in Wave 111b NOW for visibility.
- Wave 111b Phase 1 is single-author within my lane. Phase 2 (Cluster 3) is the parallel 6-subagent fan-out. The two phases are sequential by design: lessons-format consistency benefits from one role landing the pattern first (this wave's architect.md / qa.md / devsecops.md) before 6 roles attempt it in parallel.

---

## PREV — 2026-06-04 — Wave 111a Cluster 5 foundation (ADR-018 canonical PASS-verdict format)

**Deliverable:** `architecture/decisions/ADR-018-pass-verdict-format.md`. Specifies the heading-anchored markdown block + 4 field lines that gate-role HANDOFF docs (`coordination/handoffs/qa.md`, `ux-designer.md`, `architect.md`) MUST emit on PASS / REVISE / FAIL verdicts dated >= Wave 111. Consumed by `.claude/agents/devsecops.md` step 3 (Wave 110); mechanically enforced by Wave 111c CI.

### Canonical PASS verdict snippet (verbatim — for QA + BA grep-reuse)

```markdown
### Wave-111 PASS verdict — PR #999 — SHA abc1234567890abcdef1234567890abcdef12345
- **Gate role:** qa
- **Timestamp:** 2026-06-04T15:32:00Z
- **Notes:** Full vitest suite green (165/165). Leg A/B/C all clean.
```

Required fields, in order: heading line, `Gate role`, `Timestamp`, `Notes`. The 40-char lowercase hex SHA is the load-bearing identifier (matches `gh pr view --json headRefOid`). Em-dash separators are U+2014 (NOT U+002D hyphen or U+2013 en-dash). Multi-line free-form prose ABOUT the verdict (test output blocks, AC checklists, evidence dumps) is permitted and encouraged BELOW the four required field lines; CI parses only the heading + four fields.

### REVISE / FAIL counterpart

```markdown
### Wave-111 REVISE verdict — PR #999 — SHA abc1234567890abcdef1234567890abcdef12345
- **Gate role:** ux-designer
- **Timestamp:** 2026-06-04T15:32:00Z
- **Blocks:** 2
- **Notes:** Spec drift on focus-ring color (block); copy mismatch on error pill (block). HANDOFF to ui-developer.
```

REVISE and FAIL share the same shape (only the verdict token differs in the heading). Both add a `- **Blocks:** N` field above `Notes` — integer count of block-severity findings. Cluster 4 CI treats them identically at parse time; the FAIL vs REVISE semantic distinction is internal to the gate role's workflow.

### Grep-able anchor regex (Cluster 4's heading-line scan)

```regex
^### Wave-(\d{1,4}) (PASS|REVISE|FAIL) verdict — PR #(\d{1,6}) — SHA ([0-9a-f]{40})$
```

Capture groups (in order): wave number, verdict type, PR number, full 40-char HEAD SHA. The em-dash MUST be embedded as the literal U+2014 character.

### Backward-compat decision: Option (c) — grandfather pre-Wave-111 entries; format binds Wave 111+ only

Existing PASS-shaped prose (`coordination/handoffs/qa.md` Waves 108/110; `ux-designer.md` Waves 107-110 advisory replies; `architect.md` historical prose) is **grandfathered**. No retroactive rewrite. Cluster 4 CI's regex scopes its check to verdicts where `wave >= 111` — pre-111 prose is invisible to the check by construction.

### Files landed Wave 111a

1. `architecture/decisions/ADR-018-pass-verdict-format.md` (new) — full spec with rationale, regex, state semantics for DevSecOps step 3, backward-compat policy, follow-ups for 111b + 111c.
2. `architecture/INDEX.md` — added ADR-018 row to Decision Records table; updated "Last updated" line to Wave 111a.

### Verification (Wave 111a)

- `pnpm vitest run tests/qa/wave-108/subagent-body-cleanliness.test.ts` → 153/153 PASS.

---

## PREV — 2026-06-04 — Wave 110 Lanes A + D-#381 (DevSecOps merge protocol + LESSONS stale-ref sweep)

**Closed:** #383 (DevSecOps merge protocol step 3 landed in `.claude/agents/devsecops.md`), #381 (LESSONS stale-ref sweep).

### Canonical Wave 110-A clause text (grep-reuse for QA's Wave 110-B completeness test)

> **Verify gate-role PASS is recorded in HANDOFF (mandatory pre-merge).** Open `coordination/handoffs/qa.md` and (if the PR touches UI) `coordination/handoffs/ux-designer.md`. Confirm a Wave-N PASS verdict is recorded against the PR's HEAD SHA. **If the gate role's HANDOFF doc does not record the PASS, HANDOFF back to the gate role asking them to record it before merging — do NOT merge on the implementer's claim of PASS alone.** Rationale: PR #231 was merged before the UX Designer recorded the post-revision PASS verdict because the merge step trusted the implementer's HANDOFF claim. Parallel rule to step 0 in Architect/UX review-gate workflows (pre-verdict SHA sync, #314).

### Files landed Wave 110

1. `.claude/agents/devsecops.md` — new step 3 in "Deployment workflow (single turn)".
2. `LESSONS.md` — Wave 110 entry at top of 2026-06-04 section; Wave 93 fragment-pattern entry rewritten; 3 other stale-ops entries annotated with "Superseded by Wave 106 (Plan C)".

---

## PREV — 2026-06-04 — Wave 109 Slice 1 (review-gate hardening, docs-only)

**Closed (Wave 109):** #335 (`architecture/` co-authorship rule), #314 (Pre-verdict SHA sync for review gates).

### Canonical Wave 109 clause texts (grep-reuse)

Architect's review-rubric gate (step 4):

> **Co-authorship gate (`architecture/` files).** If the PR diff modifies any file under `architecture/` and the PR author is NOT the Architect, **FAIL** the review unless a prior `[[HANDOFF: architect]]` exists in the PR description, commit messages, or `coordination/handoffs/architect.md` approving the change.

Implementer-body matching clause (verbatim across `business-analyst.md`, `ui-developer.md`, `backend-developer.md`, `qa.md`, `devsecops.md`, `ux-designer.md`):

> **You do NOT write to `architecture/` without a prior HANDOFF to Architect approving the change.**

Pre-verdict SHA sync (Architect step 0 / UX Designer top-of-Critique-workflow):

> **Pre-verdict SHA sync (mandatory before reading the diff / rendering any visual verdict).** Render verdicts only against the exact SHA the PR is at.

**Files landed Wave 109:** `.claude/agents/{architect,ux-designer,business-analyst,ui-developer,backend-developer,qa,devsecops}.md` + `LESSONS.md` (2 entries at top of 2026-06-04 section).

---

## PREV — 2026-06-04 — Wave 108 (subagent body rewrite rule pack + 8 file edits)

ADR-017 landed; 8 subagent body rewrites; 4 QA grep tests all green; per-file legacy ref count 95 → 0 (modulo 8 allowlisted "You do NOT have `mcp__apex-team__*` tools" sentences). ADR-014 status flipped to Superseded by ADR-017. `architecture/workspace-conventions.md` + `architecture/INDEX.md` updated.
