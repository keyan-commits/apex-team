---
id: US-020
title: BA Competency Upgrade — Workspace-Discovery and Durable Domain Knowledge
slug: ba-competency-upgrade
status: accepted
owner: UI Dev or BE Dev (pick idler at impl time; Wave 65)
closes: "#143"
created: 2026-06-01
last_modified: 2026-06-01
---

## Story

As the user driving apex-team (on any Mac, any workspace), I want the Business Analyst to proactively discover and organize the business requirements from workspace documentation before answering any question, so that peers never need to ask the user a question that's already documented — and every answer gets committed to a durable MD for future sessions.

## Acceptance criteria

1. **Workspace-discovery-first.** `src/lib/skills/business-analyst.ts` is amended to encode: before answering ANY business-logic question (from peer HANDOFF, PO DISPATCH, or direct user message), BA's FIRST action is a workspace scan — grep `<workspace>/` for the topic, list root-level `*.md`, list `docs/**.md`, list `requirements/**.md`. BA never asks the user a business-logic question that's already documented. If the user provides an answer in chat or a screenshot, BA promotes it to a durable MD before replying.

2. **Durable per-domain MDs.** BA creates and maintains the following structure under `<workspace>/requirements/`:
   - `domains/<domain>.md` — one MD per business domain. Documents: what the domain is, what data lives where (sheet rows, DB tables, API endpoints, sample files), calculation rules, edge cases, golden-file references.
   - `business-rules.md` — non-obvious calculation logic, ordering rules, totals, edge cases. Each rule has: ID, rule statement, source, confidence (verified/assumed), and link to the US or sample that established it.
   - `data-sources.md` — every external data surface the app reads/writes (Excel sheets, DBs, APIs, sample files). Shape, path/URL, sample location, owner.
   - `samples/` — directory for screenshots, sample CSV/XLSX, API response captures the user provides. Referenced from the MD that explains them.
   - `open-questions.md` — existing; formalized `OQ-<PREFIX>-NNN` convention (e.g. `OQ-APX-001` for apex-team, `OQ-LFM-001` for lfm-b2b). Each OQ: ID, question, what we know, what we don't, who can answer, working assumption, status (open/answered/closed-by-US-NNN).

3. **Promote-to-MD discipline.** Every BA answer that required lookup or derivation MUST be promoted to a durable MD before reply. Reply format: "Answer: X. Promoted to `requirements/domains/Y.md#section`." For a NEW domain (MD doesn't exist yet): "Answer: X. Created `requirements/domains/Y.md`." If the answer came from a user message or screenshot, the snippet goes in `requirements/samples/<date>-<topic>.md` and the domain MD references it.

4. **Cross-peer authority.** BA skill prompt encodes: BA is the canonical source for all business-logic answers. Peers (Architect, QA, UI Dev, BE Dev, UX Designer, DevSecOps) must route business-logic questions to BA via `[[HANDOFF: business-analyst]]` instead of synthesizing from code. `src/lib/skills/architect.ts` gains one line: "Defer business-logic questions to BA via `[[HANDOFF: business-analyst]]`; never synthesize business rules from observed code."

5. **Onboarding scan on workspace change.** When BA receives a DISPATCH/HANDOFF in a workspace with a different `cwd` than last turn, BA's FIRST action is a workspace inventory: list top-level dirs, scan README, scan any `docs/` tree, scan any existing `requirements/` tree. BA outputs a one-paragraph "current workspace inventory" into its `[[NOTES]]` block so subsequent turns have a baseline.

6. **Glossary maintenance.** Every domain term, KPI, acronym (e.g. "SWS", "Consolidation", "Valerie-style"), role, and calculation that appears in peer messages or user requests gets a glossary entry (definition, aliases, where used). When a peer uses a term differently from the glossary, BA corrects the usage in the reply and updates the glossary entry.

7. **Intelligence-over-rote.** If a question's answer surfaces a gap in the documentation, BA flags the gap and offers to fix the doc proactively. If a sample file shows a pattern not yet in `business-rules.md`, BA promotes it. BA does not wait to be asked — it proactively maintains docs when it encounters a gap.

## Out of scope

- Implementation details of the prompt rewrite body (Architect's design is authoritative; BA co-designs the structure proposal).
- Non-functional requirements, system design, architecture decisions (Architect's lane).
- UI/visual changes to the dashboard (UX Designer's lane).
- Seeding `requirements/` for non-apex-team workspaces — each workspace's BA session seeds it on first contact; apex-team seeds its own as a dogfood exercise in Wave 65 pre-seed.
