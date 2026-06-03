### chore(docs) — port-allocation.md (claude-code hand-fix)

**Branch:** `chore/port-allocation-doc` off main `f09117c`.

**Context:** earlier today (2026-06-03 ~10:23 PST) apex-engine `next dev` stole `:3000` while apex-team's supervised server was respawning, breaking apex-team MCP client binding. Caused part of today's outage chain.

**Fix companion:** apex-engine `package.json` pinned to `next dev -p 3010` + `next start -p 3010` in apex-engine repo commit `34cbde1`. This doc captures the workspace-wide allocation so future contributors know where each service belongs.

**Files:**
- `docs/operations/port-allocation.md` — durable allocation table + recovery-script enforcement rule.
- `_handoff-pending/port-allocation-doc.md` — this fragment (Wave 93 convention).
