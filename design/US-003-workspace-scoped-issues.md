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

---

## Wave 13 Amendments — US-005 carry-forwards

**Story:** `requirements/user-stories/US-005-wave-11c-carry-forwards.md`  
**Implemented by:** UI Dev (AC1/AC3/AC4) + BE Dev (AC2)

These amendments resolve the 2 warns + 2 nits from the Wave 11c gate review.

---

### Amendment 1 — Drop "Issues:" attribution prefix (AC1)

**Was:** `Issues: <a class="issue-repo-link">keyan-commits/apex-team</a>`  
**Now:** bare monospace link only — no prefix text.

**Rationale:** the panel heading already reads "ISSUES" in the row above. Repeating the word "Issues:" creates redundant labelling at 11px that adds noise without context. The link itself, rendered in monospace at `var(--text-dim)`, reads naturally as a repo reference inline under the heading.

**New HTML structure (State 1 — repo present):**

```html
<p class="issue-repo-attr">
  <a class="issue-repo-link" href="https://github.com/{repo}/issues" target="_blank" rel="noopener noreferrer">
    {repo}
  </a>
</p>
```

No label text before the `<a>`. The `<p>` container keeps the existing `11px / var(--text-dim)` styling and `font-family: monospace` on the `<a>`.

**Updated ASCII layout:**

```
ISSUES
──────────────────────────────────────
keyan-commits/apex-team                 ← bare monospace link (11px, text-dim)
[1]  self-improvement
[0]  skill-proposal
[2]  mcp-proposal

RECENT OPEN
☐ #42  Some issue title          [label]
```

**Null state:** when `repo === null`, no attribution line renders at all — only the per-status empty-state copy (Amendment 2 below).

---

### Amendment 2 — Per-`repoStatus` empty-state copy (AC2)

The backend adds `repoStatus: "ok" | "none" | "not-git" | "non-github" | "bad-path"` to `TeamStatus["issues"]`. The dashboard forks empty-state copy on this value.

**Copy table:**

| `repoStatus` | Condition | Copy |
|---|---|---|
| `none` | Valid git repo, no `origin` remote configured | `No origin remote configured — issues unavailable.` |
| `not-git` | Path exists but is not a git repository | `This workspace isn't a git repo — issues unavailable.` |
| `non-github` | Has an origin remote but it isn't GitHub (GitLab, Bitbucket, self-hosted) | `Workspace remote isn't on GitHub — issues unavailable.` |
| `bad-path` | Path is missing, unreadable, or workspace field is empty | `Workspace path not found — set a valid directory above.` |

**Copy principles applied:**
- Non-blaming: "no origin remote configured" states a fact; doesn't say "you forgot to configure it."
- `bad-path` includes a recovery hint ("set a valid directory above") since the fix is visible on the same screen.
- All copies are one sentence, ≤ 60 characters, using sentence case.
- `non-github` is accurate for users on GitLab/Bitbucket — it doesn't incorrectly imply "no remote."

**HTML pattern (all 4 states):**

```html
<p class="empty-msg">{copy from table above}</p>
```

Same `.empty-msg` class as used by all other panel empty states (12px, `var(--text-dim)`). No icon, no additional affordance — the text alone is sufficient at this scope.

**Loading state:** `repoStatus` is absent from the `!data` case. Existing "Loading…" text unchanged.

---

### Amendment 3 — `.issue-repo-link:visited` style (AC3)

After clicking the attribution link, browser UA default visited styling (typically purple) overrides the monospace `var(--text-dim)` color.

**Fix: add one CSS rule to the styled-jsx block in `dashboard/page.tsx`:**

```css
.issue-repo-link:visited {
  color: var(--text-dim);
}
```

This locks the visited color to match the default/hover-out state. The hover rule (`color: var(--text)`) still takes precedence on `:hover:visited` via CSS specificity.

No other interaction states change.

---

### Amendment 4 — No stale-attribution during workspace-change transition (AC4)

**Was:** during workspace change, `data.issues.repo` holds the old value for ~100ms while the new fetch is in flight. The old repo name briefly flickers under the new workspace.

**Fix:** null out `data` immediately when `workspace` changes (before the new fetch resolves).

**Specified interaction:**

1. User edits the workspace field (types a new path or pastes one).
2. The effect re-fires because `workspace` is in the dependency array.
3. **Before calling `fetchData()`:** set `data` to `null` (or the equivalent reset).
4. Panel immediately transitions to the loading state (no repo, no counts — matches `!data` render path).
5. `fetchData()` completes → `setData(result)` → panel renders the new repo.

**UX:** blank/loading between old and new state — no stale label visible. On localhost this transition is < 100ms so the blank flash is imperceptible in practice, but the correctness is important: the old repo name should NEVER appear next to the new workspace.

**Implementation note:** a minimal fix is a single `setData(null)` call at the top of the effect before `fetchData()`. If the existing effect structure makes this awkward, an alternative is to key the effect on `workspace` and reset data as part of the cleanup function.

---

### Self-audit — new skills or MCPs needed?

No. All 4 amendments are pure CSS/JSX/TypeScript fixes in existing files. No new MCP tools, no new dependencies, no external services.

---

_UX Designer · Wave 13 amendments — 2026-05-31_
