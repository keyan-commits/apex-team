# Design spec — US-003: Workspace-scoped Issues panel

**Status:** reviewed  
**Story:** `requirements/user-stories/US-003-workspace-scoped-issues.md`  
**File changed:** `src/app/dashboard/page.tsx`  
**Implementation SHA:** `14c317c` (feature/11b-workspace-scoped-issues-ui)

> Note: this spec was written post-implementation because my Wave 11a UX dispatch
> transport-dropped before the spec could be filed (ironic — that drop is what US-004
> fixed). The spec documents the as-built design decisions plus known divergences I
> would have called out had I spec'd first.

---

## Problem

Two related gaps on the dashboard `/dashboard` route:

1. **Issues panel hardcodes `keyan-commits/apex-team`** regardless of which workspace
   the MCP session is pointed at. A user running apex-team against `~/b2b-platform`
   still sees apex-team's issues. Confusing and wrong.

2. **Workspace field shows placeholder** when the MCP session set the workspace via
   `talk_to_role(workspace: "...")` but the browser's `localStorage` has no entry —
   the user sees `/absolute/path/to/project` (placeholder text) instead of the real
   workspace path.

---

## States — Issues panel

### State 1: Repo present (`data.issues.repo !== null`)

```
ISSUES
──────────────────────────────────────
Issues: keyan-commits/apex-team         ← attribution label (11px, text-dim, monospace link)
                                          links to github.com/{repo}/issues
[1]  self-improvement                   ← count rows, hrefs dynamically derived from repo
[0]  skill-proposal
[2]  mcp-proposal

RECENT OPEN
☐ #42  Some issue title          [label] [→ PO]
...

[footer when issues selected]
```

**Interaction states for attribution link:**
- default: `color: var(--text-dim)`, no underline
- hover: `color: var(--text)`, underline
- focus-visible: `outline: 1px solid var(--accent-po)`, `border-radius: 2px`
- visited: should match default (text-dim) — see warn below

### State 2: Repo null (`data.issues.repo === null`)

```
ISSUES
──────────────────────────────────────
This workspace has no GitHub remote — Issues panel unavailable.
```

Uses existing `.empty-msg` class (12px, `var(--text-dim)`). No count rows. No recent
issues. No dispatch footer.

**Copy note:** `repo === null` covers four distinct backend cases (no git repo, no
remote configured, non-GitHub remote, workspace path missing). The copy "no GitHub
remote" is technically accurate for all but may read oddly for users with a GitLab
workspace who DO have a remote — just not a GitHub one. Future improvement: add
`repoStatus: "none" | "non-github" | "error"` to the API and fork the copy.
See warn filed below.

### State 3: Loading (before first successful fetch)

Existing `empty("Loading…")` text via the `!data` path. No change. The loading
state does not show the attribution label — it appears only once `data` is set.

### State 4: Endpoint not ready

Existing `notReady` rendering. No change.

---

## Workspace field fallback

On mount, if `localStorage` has no workspace entry, the dashboard fetches
`/api/health` and seeds `workspace` state from `defaultCwd`. This mirrors the
existing pattern in `src/app/page.tsx`. No visual difference to the user — the
workspace field just shows the correct path instead of empty.

---

## Workspace change → re-poll

`workspace` is in the team-status `useEffect` dependency array. When the user edits
the workspace field and it changes, the effect re-fires: interval clears and
`fetchData()` fires on the leading edge (before the new interval starts). The Issues
panel refreshes within one RTT (~100ms on localhost).

---

## Design decisions

**Attribution above counts (not below):** the source label is placed BEFORE the
count rows so the user knows which repo the numbers belong to before reading the
numbers. Context before data.

**Attribution uses `Issues:` prefix:** see warn [W1] below — this is the as-built
copy; preferred design would drop or replace the redundant "Issues:" prefix since
the panel heading already reads "ISSUES."

**Single empty state for all null cases:** backend returns only `repo: null` with
no reason code. UI cannot distinguish "no remote" from "GitLab remote." See warn
[W2] — future API improvement.

**No debounce on workspace change:** the workspace field triggers a re-poll on every
change event. Suitable for a local single-user tool where the workspace input is
changed deliberately (paste or type + blur), not character-by-character.

**No loading skeleton during workspace change:** between workspace change and new
fetch completing, `data.issues.repo` still holds the old value. Attribution briefly
shows stale repo. Acceptable for ~100ms on localhost. See nit [N2].

---

## Known issues from gate review

### Warns (UX debt — file as GitHub issues, label `ux`)

**[W1] Attribution prefix "Issues:" redundant with panel heading**
- Panel heading already reads "ISSUES". Attribution label reads "Issues: repo".
- The word appears twice in close visual proximity.
- Recommended fix: change to `↗ keyan-commits/apex-team` (icon prefix) or omit
  prefix entirely — the panel context makes "Issues" redundant.
- File as `[ux:issues-panel]` issue on `keyan-commits/apex-team`.

**[W2] Empty state copy conflates "no remote" and "non-GitHub remote"**
- "This workspace has no GitHub remote" implies the workspace has no remote at all,
  which is inaccurate for GitLab/self-hosted users.
- Correct fix requires backend `repoStatus` field — cannot be fixed in UI alone.
- Short-term copy alternative (no backend change needed):
  `"GitHub issues not available for this workspace."` — neutral, not prescriptive.
- File as `[ux:issues-panel]` issue blocking a future BE + UX wave.

### Nits (polish — can fix inline or skip)

**[N1] Missing `.issue-repo-link:visited` style**
After the user clicks the attribution link once, browser UA renders it with default
visited styling (purple on most browsers), overriding the monospace text-dim style.
Fix: add `color: var(--text-dim)` to `:visited`.

**[N2] Attribution shows stale repo during workspace-change transition**
~100ms window where `data.issues.repo` holds the OLD value after workspace changes.
Low impact on localhost. Fix: set `data` to null on workspace change to force the
loading state while the new fetch completes.

---

_UX Designer · 2026-05-31_
