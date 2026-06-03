# Priority Queue — User-Directed Order

_Maintained by Business Analyst. This file records user-stated priority orderings that override `rankIssues` default age-sort. It is first-class state — not chat memory. Update whenever the user explicitly sets an ordering._

_Application of US-078 / ADR-011 (user-directive supremacy): user priorities are authoritative and recorded here, not deferred to algorithm defaults._

---

## Active ordering — set 2026-06-03

**Source:** user quote (2026-06-03, via PO inbox):
> "After #316-#320, I want the ticket where I can see the QA tests in http://localhost:3000/agents/qa, like we prioritized earlier"

**Why this file exists:** `rankIssues` default is age-sort (oldest first). Without an explicit override, #126 (the QA tests ticket, one of the oldest open issues) would float to the top of the queue ahead of #316–#320. The user's directive inverts that — the self-heal bundle comes first, then #126.

| Slot | Issue(s) | Title | Status | Notes |
|---|---|---|---|---|
| **1 — CURRENT** | PR #323 | user-directive-supremacy (closes #321) | In gates | Architect PASS ✓; QA smoke → DevSecOps merge remaining |
| **2 — NEXT** | #316 → #317 → #318 → #319 → #320 | Self-heal bundle (L1 launchd → L2 stall detector → L3 auto-merge → SQLite crash-safety → runaway notify) | Queued | #316 triad fires first (user-off semantics require BA+Architect+UX input); #317–#320 pipeline-pre-stage while #316 triad runs |
| **3 — AFTER** | #126 / US-071 | Tests section on `/agents/qa` + manual Run button | Queued — backend done | **#308 MERGED** (2026-06-03T10:16:58Z) — SSE `/api/qa/run-test` route already shipped; remaining work is UI Dev frontend per UX's wireframe spec. No BE Dev re-open needed. |
| **4 — THEN** | #322, #324–#330 | Recent audit fills | Queued | Normal `rankIssues` priority within this group |

---

## Override discipline

- This ordering **overrides** `rankIssues` age-sort for the listed issues.
- Once an issue is done/merged, remove it from the active table and archive below.
- Any future user directive that re-orders these must be recorded here (and in the Directive supersessions table in INDEX.md) before implementation begins.
- PO reads this file at the start of every tick to apply the correct queue order. BA updates it whenever the user states a priority change.

---

## Archive (completed directives)

_Empty — no entries yet._
