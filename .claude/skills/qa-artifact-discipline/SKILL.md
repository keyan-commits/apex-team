---
name: qa-artifact-discipline
description: Enforce nine mandatory QA disciplines on visual / operator-facing artifacts in ANY project. When QA verifies a deliverable that has a rendered form (xlsx, PDF, generated page, image) or is downloaded/consumed by an end-operator, QA MUST render the artifact and look at it (S1), test the real operator path end-to-end (S2), use realistic + scaled + adversarial inputs (S3), assert positional + semantic correctness rather than presence/equality (S4), apply a WCAG-AA contrast gate (S5), produce a side-by-side reference diff (S6), confirm validated == deployed (S7), question business intent rather than rubber-stamp the sample (S8), and make every assertion map to a human-meaningful claim (S9). Applies regardless of project — apex-team itself, host workspaces apex-team drives, or any standalone repo whose Claude Code session has the eight role subagents installed.
---

# QA Skill Improvements — retro from the LFM order-sheet generator engagement (2026-06-02)

**Context.** Over one long session building the "generate-don't-fill" order-sheet generator, QA repeatedly issued PASS verdicts while real, user-visible bugs reached Niko on the live download. This is an honest post-mortem of *why* the misses happened and the concrete **skills to add to the apex-team QA role** so they don't recur. The through-line: **QA verified the wrong thing, at the wrong layer, with the wrong data, and never looked at the actual artifact.**

---

## The bugs that shipped despite a QA PASS

| # | Bug the user hit | What QA checked instead | Why it slipped |
|---|---|---|---|
| 1 | Order sheet had extra MON/WED tabs + phantom Popeyes/Wendy's rows when only a BK PO was uploaded | Unit tests on the service; "values are correct" | Never generated + opened the **actual Step-6 download** |
| 2 | SWS column empty (mapped but not rendered) | "20/20 headers present" (header-text presence) | Presence ≠ population; never inspected per-row cell values |
| 3 | Wrong column **order** vs Valerie (per-block first-appearance drift) | Header-text set match | Checked *which* headers exist, not their **position** |
| 4 | Invisible fills (every fill had `00` alpha → transparent) | ARGB value diff (`==` on the bytes) | The value "matched" but **rendered invisible**; never rendered |
| 5 | Solid **black blocks** on empty columns | "no regression in cell values" | Empty-cell fill bug only visible when **rendered** |
| 6 | **White-on-yellow / white-on-light** text — unreadable | "fill ARGB matches Valerie" | No **contrast** check; never rendered to judge legibility |
| 7 | Double header rows; inconsistent alignment | Structural cell checks | Never **looked at it**; alignment not asserted |
| 8 | **Multi-PO upload → 1 tab** (12 delivery dates collapsed) | Parity on **single** POs only | Never tested the **realistic operator scenario** (many POs) |
| 9 | Validated fix sat **un-deployed**; user tested old code for hours | "PASS" on the branch | No check that the validated build == the **running** build |

Nine distinct classes, one engagement. Each was cheap to catch and expensive to miss.

---

## Root themes (the skill gaps)

1. **QA never rendered the artifact and looked at it.** Spreadsheets, PDFs, rendered pages have a *visual* truth that cell-value/ARGB diffs cannot see: transparency, contrast, black blocks, alignment, double headers, spacing. A green programmatic diff said "matches Valerie" while the sheet was, in the user's words, "horrendous."
2. **QA verified at the unit/service layer, not the real operator artifact.** Service tests passed while the **downloaded file** from the operator's path was wrong (phantom tabs, missing SWS, collapse). The thing the user touches was never the thing QA checked.
3. **QA used one happy-path input.** A single PO, single date. The operator uploads *many* POs across *many* dates. The bugs lived in the multi-input / multi-date / empty / all-zero cases that were never exercised.
4. **Presence and value-equality stood in for semantic + positional + visual correctness.** "Headers exist," "ARGB equals" — true and useless. The bug was order, population, legibility, layout.
5. **"PASS" was issued on code, not on the running system.** Validated ≠ deployed. No one confirmed the user would actually *receive* the fixed behavior.
6. **QA matched the sample without questioning intent.** It compared to Valerie's reference file and never asked "is the empty column supposed to be here? is this garish-but-matching actually what they want?" — business rules (hide-empty-columns) surfaced only when the user complained.

---

## Skills to add to the apex-team QA role

Add these as explicit, required QA capabilities/checklist items (grounding):

### S1 — **Render-and-look (visual verification is mandatory for visual artifacts)**
For any artifact with a rendered form (xlsx, PDF, generated page, image), QA **must render it to an image and inspect it**, then diff that image against the reference — *before* a PASS. Programmatic cell/ARGB diffs are necessary but **never sufficient**.
- *How:* LibreOffice headless `--convert-to pdf` → image; or xlsx→HTML(inline styles)→Playwright screenshot; or the app's own preview. Capture at the size the user sees.
- *Catches:* transparency/alpha bugs, contrast, black blocks, alignment, double headers, spacing (#4–#7).

### S2 — **Test the real operator artifact, end-to-end**
QA verifies the **actual file the operator downloads via the production path** (the endpoint/UI), not a unit test of an internal service. If a unit test mocks/stubs the artifact path, it is **not** verification.
- *Catches:* phantom tabs, unpopulated columns, wiring bugs (#1, #2, #8).

### S3 — **Realistic + scaled + adversarial test data**
Never validate on one happy-path sample. Required matrix: **multiple inputs** (e.g. all the sample POs, not one), **multiple dates/periods**, **empty / all-zero / duplicate / oversized** inputs, and **scrambled-order** inputs. Ask "what does the operator actually do?" and reproduce it.
- *Catches:* multi-PO→1-tab (#8), per-block ordering drift (#3), empty-column handling (#5).

### S4 — **Positional + semantic correctness, not presence/equality**
Assert **order** (column order, row/block order, chronological tabs), **population** (every expected cell has its value, not just exists), and **computed correctness** (evaluate formulas via the real engine). "Header text present" / "ARGB equal" are banned as a sufficient pass criterion.
- *Catches:* #2, #3, formula re-indexing bugs.

### S5 — **Contrast / readability gate (WCAG)**
For any text-on-fill output, compute the contrast ratio and **fail below WCAG AA** (4.5:1 normal, 3:1 large). White-on-yellow (1.07:1) should have been an automatic FAIL.
- *Catches:* #6.

### S6 — **Side-by-side reference diff, the way the user judges it**
Render **both** the candidate and the ground-truth reference and diff them visually + positionally, replicating how the operator compares (e.g. "ours vs Valerie's sheet, tab by tab"). The user did this in 30 seconds with two screenshots; QA should automate it.

### S7 — **Validated ≠ deployed: verify the running system**
A PASS is on the artifact **as the user will receive it**. QA confirms the validated build is the one actually deployed/running (commit/version check, or generate from the live endpoint), or **explicitly flags the deploy gap** in the verdict ("PASS on branch; NOT yet on beta"). No silent assumption that merged = live.
- *Catches:* #9 (the most demoralizing one — the user tested stale code for hours).

### S8 — **Question business intent, don't just match the sample**
When output matches the reference but looks odd (empty columns, loud colors, redundant rows), QA raises "is this the intended business behavior?" to the BA/operator instead of rubber-stamping. The reference file is **not** the spec; the documented business rules are.
- *Catches:* hide-empty-columns rule, freight handling, SWS source — surfaced late because no one asked.

### S9 — **No silent green: a passing test must map to a human-meaningful claim**
Every QA assertion states the user-facing property it guarantees ("SWS appears in col A on every row," "one tab per delivery date," "qty legible at AA contrast"). A green suite that asserts the wrong thing is worse than no suite — it manufactures false confidence.

---

## Process notes (orchestration, not just the QA role)

- **The orchestrator (me) failed too:** I trusted QA's programmatic PASS and deployed/re-deployed without rendering and looking, and I left a validated fix un-deployed while the user kept testing. S1, S2, S7 apply to whoever ships, not only the QA role.
- **Add a "definition of done" for visual/operator artifacts:** rendered + looked-at + AA-contrast + real-path + reference-diffed + deploy-confirmed. PASS is not allowed without all six.
- **Cheapest highest-leverage change:** make **S1 (render-and-look)** and **S2 (real artifact)** hard gates. Six of the nine bugs die immediately under those two alone.

---

*Written by the LFM engagement orchestrator for Niko, to feed the apex-team QA role's skills/grounding. Examples are real, from 2026-06-02.*
