---
id: US-022
title: PO MANDATORY — Files Feature/Bug/Issue on Active Workspace Repo on Behalf of claude-code
slug: po-file-user-requests-as-gh-issues
status: accepted
owner: BE Dev (Wave 67; after Wave 65 + Wave 66 merge)
closes: "#145"
created: 2026-06-01
last_modified: 2026-06-01
wave: 67
---

## Story

As the user, I want **the Product Owner to file every feature request, bug, or change I bring to claude-code as a GitHub issue on the active workspace's repo on my behalf, mandatorily, before any work begins**, so that every request is tracked in the dashboard and traceable in git history regardless of whether I am working on apex-team, lfm-b2b, my-finances, or any other project.

**User clarification verbatim (2026-06-01):**
> *"The PO should file in behalf of claude-code, and it should be mandatory to file feature/bugs/issues so it gets trackd into the dashboard."*

## Acceptance criteria

1. **PO prompt amendment — `src/lib/roles.ts` `ORCHESTRATOR_PROTOCOL` only** (**NOTE: there is no `src/lib/skills/product-owner.ts`** — the PO prompt lives in `roles.ts`). The FIRST paragraph of the protocol body (before `### Requirements phase (mandatory triad)`) encodes the mandatory filing rule with MANDATORY wording (not "should"): "Before dispatching ANY peer for new work, you MUST file a GitHub issue on the active workspace repo via `gh issue create --repo $WORKSPACE_REPO`. This is MANDATORY. File first, then run the triad." Issue body uses user-story format (`## Story` + `## Acceptance criteria`) with the `Source:` footer from AC7.

2. **`WORKSPACE_REPO` pre-injection** — `src/lib/providers.ts` `augmentSystemPrompt()` (adjacent to the `## Working directory` block at line 115) calls the existing `deriveGithubRepo(ctx.cwd)` helper and injects a `## Workspace repository` section with the derived `owner/repo` string. The call MUST be wrapped in a per-cwd module-level cache (mirror the `_issueCache` pattern in `team-status/route.ts`) to avoid a git-subprocess tax on every agent turn.

3. **Failure mode — repo not derivable** (`repoStatus` is `bad-path`/`not-git`/`non-github`/`none`): PO ALWAYS falls back to filing on `keyan-commits/apex-team` with label `cross-repo-orphan`. No second-roundtrip, no waiting for user confirmation. PO flags the fallback and reason in the first line of its reply: "⚠️ WORKSPACE_REPO unavailable (`<reason>`) — filed on apex-team as meta-issue `#N` with label `cross-repo-orphan`. Can be re-homed once the workspace has a GitHub remote."

4. **Failure mode — repo derivable but `gh issue create` errors**: PO surfaces the `gh` stderr to claude-code in the first line, then continues with the triad (do not block work on filing failure). PO files a follow-up `self-improvement` issue on `keyan-commits/apex-team` to track the `gh` access fix.

5. **Dedup check before filing**: PO runs `gh issue list --repo <WORKSPACE_REPO> --state open --search "<keywords from user request>"`. If a similar open issue exists (PO judgment on similarity), PO references it instead of filing a duplicate. If the user explicitly intends a new issue, PO files and links the related. All subsequent dispatch blocks reference the selected issue number.

6. **Trivial-ops carve-out** — PO judgment: pure status checks ("what's the team status"), gate verdicts, re-dispatches, and conversational clarifications with no new source-file work may skip filing. The carve-out MUST be declared explicitly in PO's HANDOFF NOTES: "ops-only, no issue filed: `<reason>`." Any work touching source files or requiring a triad = issue filed, no exceptions.

7. **Issue body footer** — every filed issue body ends with:
   ```
   Source: filed by PO on behalf of claude-code in thread `<thread_id>` on `<workspace>` at `<ISO-timestamp>`
   ```

8. **`Closes #N` linkage** — PO references the filed issue number in all subsequent DISPATCH blocks. Closing the issue via `Closes #<N>` in the workspace PR's commit/PR body is the **workspace PR's responsibility** (different merge flow than apex-team). Apex-team cannot auto-close a workspace repo issue on behalf of the workspace. This is a stated limitation: the tracking exists; the auto-close depends on the workspace adopting the `Closes #N` pattern.

9. **Verification AC** — after Wave 67 merges, Mac 2's NEXT `talk_to_product_owner` call for a new lfm-b2b task MUST produce a visible issue in the Mac 2 dashboard's Issues panel (Recent Open list) within one refresh cycle (≤15s). This is the joint AC for Waves 66 + 67: Wave 66 renders the panel correctly on any labels/workspace; Wave 67 produces the data; the panel lights up on first use.

10. **Regression-guard tests** in `tests/lib/roles.test.ts`: assertions that `ORCHESTRATOR_PROTOCOL` (the PO system prompt exported from `roles.ts`) contains:
    - `"MANDATORY"` (mandatory framing)
    - `"on behalf of claude-code"` (explicit attribution)
    - `"WORKSPACE_REPO"` (injection reference)
    - `"cross-repo-orphan"` (fallback label for non-derivable repos)
    - `"apex-team"` (fallback target)
    - `"Source: filed by PO on behalf of claude-code"` (AC7 footer template)

## Out of scope

- Retroactive backfill of past Mac 2 / Mac 1 requests (going forward only).
- Cross-workspace aggregation in the Issues panel (see US-021 / Wave 66).
- Automatic label creation on the workspace repo.
- Auto-closing workspace issues from apex-team's CI (workspace PR is responsible via `Closes #N`).

## Sequencing

**Wave 67** — runs AFTER Wave 64 (smoke gate) + Wave 65 (BA competency) + Wave 66 (adaptive Issues panel). Wave 66 fixes rendering; Wave 67 produces data. Combined effect: Mac 2's lfm-b2b dashboard becomes informative on the next request post-Wave-67.

## Business rule cross-link

This story establishes **BR-001** in `requirements/business-rules.md`. The mandatory filing rule is a first-class business rule for the apex-team domain, dogfooded by the Wave 65 BA competency pre-seed.
