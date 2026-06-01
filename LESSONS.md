# Lessons — apex-team

Append-only. Newest first. Each entry: ~3–5 lines. Triggers: a protocol amendment, a "this shouldn't happen again" surprise, a non-obvious workaround.

## 2026-06-01

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
