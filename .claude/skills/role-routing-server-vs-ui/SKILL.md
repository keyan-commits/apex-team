---
name: role-routing-server-vs-ui
description: Enforce the server-vs-UI lane boundary on implementer dispatch in ANY project. When a Claude Code session dispatches implementer roles, server-side code (Node HTTP servers, API routes, SSE streams, WebSocket handlers, spawn/exec, file IO, server-side validation schemas, business logic on the server) is always Backend Developer's lane and browser-side code (HTML, CSS, browser-rendered JS, components, styling) is always UI Developer's lane — regardless of which repository the code lives in. A wave that touches both surfaces MUST dispatch UI Dev AND BE Dev in parallel; it must never be lumped under one role. Applies regardless of project — apex-team itself, the sibling apex-team-viewer repo, host workspaces apex-team drives, or any standalone repo whose Claude Code session has the eight role subagents installed.
---

# role-routing-server-vs-ui

The invariant this skill enforces:

> **Server-side code is always Backend Developer's lane. Browser-side code is always UI Developer's lane. Repo location does not determine ownership — code shape does. A wave that touches both surfaces dispatches UI Dev AND BE Dev in parallel; it is never lumped under one role.**

This applies to ANY project the eight role subagents drive — apex-team itself, the sibling `apex-team-viewer` repo, downstream host workspaces (LFM, bidshop, etc.), or any standalone repo whose Claude Code session has the user-scoped subagents installed. The eight role subagents are user-scoped (`~/.claude/agents/`) and so is this skill; the discipline travels with them.

## 1. The routing rule

When a Claude Code session dispatches implementer roles, **server-side code is always BE Dev's lane and browser-side code is always UI Dev's lane, regardless of which repository the code lives in.** A wave that touches both surfaces dispatches UI Dev AND BE Dev in parallel — never lumped under one.

The historical pattern of routing all viewer-repo changes solely to UI Dev (because the viewer "is the UI") is the bug this skill exists to prevent. The viewer repo contains a real Node HTTP server (`server.mjs`) with API routes, SSE streams, child-process spawn, and file IO — all of which is BE Dev's lane by shape, even though it lives in a repo conventionally labeled "the viewer."

## 2. Surface classification table

| Surface | Examples | Owner |
|---|---|---|
| Browser / DOM | HTML, CSS, browser-rendered JS (`public/*.html`, `public/*.css`, `public/app.js` that runs in browser), Next.js client components, Vue/Svelte components, JSX/TSX rendering pixels, browser event handlers, DOM queries, browser-side fetch/XHR | UI Dev |
| Server runtime | Node HTTP server (`server.mjs`, `server.ts`), Express/Fastify/Koa/Hapi routes, API handlers, SSE streams (`text/event-stream`), WebSocket handlers, file IO via `fs` / `fs/promises`, `spawn` / `exec` / `execFile`, server-side validation schemas (Zod / Joi / Yup), business logic that runs on the server, server-side rendering data fetchers | BE Dev |
| CLI tools | `scripts/*.mjs` Node CLIs that operate on filesystem, codegen scripts, migration runners, batch processors | BE Dev (or DevSecOps if operational / ops-shaped — repo hygiene, hook installers, deploy scripts) |
| Build / CI | `.github/workflows/`, `package.json` scripts, Dockerfiles, lockfile management, supply-chain manifests, release automation | DevSecOps |
| Tests | Any test file under `tests/` or per-project test convention | QA |

**Tiebreaker — primary responsibility wins.** When a file straddles surfaces (e.g. `server.mjs` that ALSO serves static HTML from `public/`), classify by the file's PRIMARY responsibility. A Node HTTP server with API routes IS BE Dev's lane, even if it also pipes static files to the browser. The static-file pipe is incidental; the server runtime is the load-bearing concern.

**Tiebreaker — for SSR / RSC frameworks (Next.js, Remix, SvelteKit):** components are UI Dev's lane; route handlers / loaders / actions / server functions are BE Dev's lane. A file with both (a Next.js `page.tsx` that has a `default async function` with server data fetching AND JSX rendering) MUST be split — either physically (loader in a server file, render in a client component) or via dual-dispatch (UI Dev gates the rendering, BE Dev gates the loader logic).

## 3. Repository-agnostic clarification

**The rule applies regardless of which repository the code lives in.** Specifically:

- **apex-team itself** — the docs, scripts, and tooling here follow the same rule. A `scripts/*.mjs` Node CLI that operates on filesystem is BE-shaped even though apex-team has no traditional "backend."
- **apex-team-viewer** — the companion viewer repo (`keyan-commits/apex-team-viewer`, sibling clone at `../apex-team-viewer/`, port `:3200`). Its `server.mjs` is a real Node HTTP server with API routes, SSE, spawn, and file IO — BE Dev's lane. Its `public/app.js` + `public/style.css` + `public/index.html` are browser-side — UI Dev's lane. The repo is labeled "viewer" but it contains BOTH surfaces.
- **Downstream host workspaces** (LFM, bidshop, any client project) — same rule. A workspace's Express server is BE; its React components are UI. The workspace's name or marketing label is irrelevant.
- **Standalone repos** receiving Claude Code sessions with the eight subagents — same rule.

**Repo location does NOT determine ownership; code shape does.** A `server.mjs` is BE Dev's lane whether it lives in apex-team-viewer, in a workspace's root, or in a third-party fork. A `app.js` that runs in the browser is UI Dev's lane whether it lives in `apex-team-viewer/public/`, in `src/components/`, or in a generated bundle.

## 4. Full-stack waves — parallel dispatch

When a wave touches both surfaces, the Product Owner MUST dispatch UI Dev AND BE Dev in parallel — one for the browser-side portion, one for the server-side portion. Each implementer authors their own canonical artifact at the role-appropriate path:

- **UI Dev** authors `frontend/features/FEAT-NNNN-<slug>/FE-NNNN-<slug>.md` (or the workspace's source-tree equivalent under `src/features/...`). This artifact summarizes the browser-side change, links to the PR/commit, and carries the FEAT/US/role frontmatter per Wave 122.
- **BE Dev** authors `backend/features/FEAT-NNNN-<slug>/BE-NNNN-<slug>.md` (or the workspace's source-tree equivalent). Same FEAT/US/role frontmatter discipline.

**Parallel dispatch means a single outer-orchestrator response that issues both `Agent({ subagent_type: "ui-developer", ... })` and `Agent({ subagent_type: "backend-developer", ... })` calls simultaneously.** Sequential dispatch (UI Dev first, then BE Dev) is the bug this rule prevents — UI Dev silently absorbs the server-side work because BE Dev was never invoked.

## 5. Refusal protocol — UI Developer

If UI Dev receives a dispatch brief that includes server-side patterns, UI Dev MUST refuse to silently absorb the server-side work. Server-side patterns include (non-exhaustive):

- `server.mjs`, `server.ts`, or any file describing itself as a Node HTTP server
- API route handlers (`app.get(...)`, `app.post(...)`, `router.handle(...)`)
- SSE streams (`text/event-stream`, `response.write('data: ...\n\n')`)
- WebSocket handlers (`ws.on('message', ...)`, `socket.io` server-side)
- `spawn` / `exec` / `execFile` / `fork` from `child_process`
- File IO via `fs` / `fs/promises` (`readFile`, `writeFile`, `readdir`, `stat`)
- Server-side schema authoring (Zod / Joi / Yup schemas consumed by request validation)
- Business logic that runs on the server (not in the browser)

**Refusal protocol — three steps:**

1. **HALT.** Do NOT begin work on the server-side portion. Do not edit `server.mjs`. Do not author API routes. Do not write file-IO logic. Do not write schemas.
2. **Emit an advisory HANDOFF block.** Include in your reply:
   ```
   [[HANDOFF: product-owner]]
   This dispatch brief includes server-side patterns (<name them: e.g. server.mjs route additions, SSE handlers, file IO>) that belong to BE Dev's lane per the role-routing-server-vs-ui skill. Requesting BE Dev co-dispatch on this wave. I will proceed with the browser-side portion only.
   [[/HANDOFF]]
   ```
3. **Proceed with the browser-side portion only.** Author the browser-side changes (HTML/CSS/browser-rendered JS) and the FE-NNNN artifact. Leave the server-side files untouched. The outer orchestrator reads your HANDOFF block and dispatches BE Dev in the next turn.

**The refusal is not a blocker on the wave** — it is a routing correction. UI Dev still ships the browser portion; BE Dev is engaged in parallel to ship the server portion.

## 6. Assertion protocol — Backend Developer

When BE Dev observes a wave proceeding without BE Dev's involvement that SHOULD be BE-shaped (server.mjs, API routes, SSE, spawn, file IO, schemas), BE Dev MUST self-assert their lane rather than waiting passively for a dispatch that may never arrive.

**Assertion protocol — two steps:**

1. **Self-assert via advisory HANDOFF.** When BE Dev sees a UI Dev PR / commit / HANDOFF entry that touches server-side files, emit in BE Dev's own next reply:
   ```
   [[HANDOFF: product-owner]]
   Wave <N> touched server-side files (<list them>) without BE Dev dispatch. Per the role-routing-server-vs-ui skill, server-side code is BE Dev's lane. Requesting backfill: either (a) re-dispatch BE Dev on the wave's server-side portion if work is in flight, or (b) authorize BE Dev to author retro BE-NNNN summary doc(s) if the wave already shipped.
   [[/HANDOFF]]
   ```
2. **Author retro BE-NNNN summary docs if the wave already shipped.** This is the Wave 137 pattern (`backend/features/INDEX.md` retroactive backfill log). For each server-side change that shipped under UI Dev's authorship, create a retro `BE-NNNN-<slug>.md` doc at `backend/features/FEAT-NNNN-<slug>/` (or `FEAT-tbd-<slug>/` if the parent FEAT isn't yet allocated) with `status: retro` in the frontmatter, linking to the original PR/commit. This restores the BE-shaped audit trail without rewriting history.

**BE Dev's assertion is not a complaint** — it is a routing correction. The lane boundary holds even when the original dispatch missed it; retro docs are how the boundary survives historical drift.

## 7. PO routing checklist — mandatory pre-dispatch

Before emitting `[[DISPATCH: ui-developer]]` for any wave, the Product Owner MUST scan the wave's planned diff (file list, brief, or upstream issue) for server-side patterns. If any of the following are present, the wave is a full-stack wave and MUST dispatch BE Dev in parallel:

- **Server-runtime files** — any `server.mjs`, `server.ts`, `*.server.*`, `api/**`, `routes/**`, or file matching the project's server-entry convention
- **API route changes** — additions, deletions, or modifications to `app.get(...)`, `app.post(...)`, `app.put(...)`, `app.delete(...)`, `router.*`, or framework-specific route declarations (Next.js `route.ts`, Remix `loader`/`action`, SvelteKit `+server.ts`)
- **Streaming / push patterns** — SSE (`text/event-stream`), WebSocket, long-poll, server-side push of any kind
- **Process orchestration** — `spawn`, `exec`, `execFile`, `fork`, `child_process`, container/sandbox invocation
- **File IO on the server** — `fs.readFile`, `fs.writeFile`, `fs.readdir`, `fs.stat`, `fs/promises`, or any disk access from server runtime
- **Schema authoring** — `*.schema.*`, Zod / Joi / Yup / Ajv schemas consumed by request validation or server-side data shaping
- **Server-side business logic** — calculations, transformations, or rule application that runs on the server

If ANY of the above appear in the wave's planned diff, PO dispatches BE Dev in parallel with UI Dev (one `Agent` call per role, same outer-orchestrator response).

**Browser-side patterns that signal UI Dev dispatch:**
- HTML files (`*.html`, `index.html`)
- CSS / styling (`*.css`, `*.scss`, `*.module.css`, Tailwind class additions in templates)
- Browser-rendered JS (`public/app.js`, browser bundles, browser event handlers, DOM queries)
- Components (`*.tsx` / `*.jsx` / `*.vue` / `*.svelte` rendering pixels)
- Browser-side state (Redux/Zustand/Pinia stores running in the browser)

If a wave touches BOTH lists, it is a full-stack wave. Dispatch both.

**Anti-pattern PO must avoid:**
- "It's a viewer change, route it to UI Dev" — wrong if the change is in `server.mjs`. Route by file, not by repo label.
- "BE Dev has no work this wave" — verify by scanning the diff, not by intuition. If `server.mjs` is in the diff, BE Dev has work.
- "I'll dispatch UI Dev first and BE Dev in the next wave if needed" — sequential dispatch is the bug. Parallel dispatch is the rule.

## 8. Trigger context

**LFM session 2026-06-05.** The user noticed that the BE Dev tab in the apex-team-viewer dashboard was empty after many waves of viewer work. Root cause analysis surfaced the routing bug: the viewer repo's `server.mjs` (a real Node HTTP server with API routes, SSE, spawn, file IO) had been lumped under UI Dev's lane for the entire history of the viewer's existence, because the repo was labeled "the viewer" and conventional intuition routed all "viewer changes" to UI Dev.

**Wave 137 backfilled the BE-NNNN retro docs** — `backend/features/INDEX.md` now logs BE-0001 through BE-0009 as `status: retro` entries crediting the BE-shaped work that historically shipped under UI Dev authorship in `keyan-commits/apex-team-viewer` (workspace switcher API, auto-follow polling, artifacts API FEAT-grouping, frontmatter parser extensions, polyglot runner resolver, spawn safety, scan-dir fix, cache-control headers, Playwright headed-mode toggle).

**Wave 139 codifies the rule** — this skill — to prevent the bug from recurring on future viewer waves OR on any other project where the same pattern (real server in a "UI-labeled" repo) could mislead routing.

## 9. Cross-references

- `.claude/agents/ui-developer.md` — refusal-clause section (to be added in a follow-up Wave 139 dispatch to UI Dev's own lane).
- `.claude/agents/backend-developer.md` — assertion-clause section (to be added in a follow-up Wave 139 dispatch to BE Dev's own lane).
- `.claude/agents/product-owner.md` — routing-checklist section (to be added in a follow-up Wave 139 dispatch to PO's own lane).
- `~/.claude/skills/requirements-first/SKILL.md` — sibling skill enforcing BA-first routing on the requirements axis. Where `requirements-first` ensures every implementation request has a US, this skill ensures every implementation request is dispatched to the correct implementer(s).
- `~/.claude/skills/comprehensive-testing/SKILL.md` — sibling skill enforcing comprehensive QA coverage. Independent axis; both can fire on the same wave.
- `~/.claude/skills/qa-artifact-discipline/SKILL.md` — sibling skill enforcing the nine QA disciplines. Independent axis.
- `architecture/workspace-conventions.md` — durable workspace rules; the FEAT/US/BE/FE directory contract this skill plugs into.
- `backend/features/INDEX.md` — the Wave 137 retro backfill log that motivated this skill. The "Going-forward routing rule (Wave 137)" section in that INDEX is the seed text this skill expands into a full discipline.
- ARCH-0003 (deferred follow-up) — Architect-ratified ADR formalizing this rule at the architecture-decision layer. Slated for a follow-up wave with full FEAT/US/ARCH wrapper.
