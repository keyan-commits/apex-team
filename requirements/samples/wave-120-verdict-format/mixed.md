## coordination/handoffs/qa.md excerpt — MIXED: one good verdict + one bad verdict

This fixture contains BOTH a valid canonical verdict AND a bad verdict.
The check must flag the bad verdict and not suppress it because a good
verdict appears in the same file.

### Wave-119 PASS verdict — PR #386 — SHA a16c924739eddf928f63a257abdd77fbfa6fb1f8
- **Gate role:** qa
- **Timestamp:** 2026-06-04T10:57:30Z
- **Notes:** good verdict — this one is fine

Some narrative prose in between the two verdicts.

### Wave-120 PASS verdict — PR #0 — SHA (pending)
- **Gate role:** qa
- **Timestamp:** 2026-06-04T18:00:00Z
- **Notes:** bad verdict — SHA (pending) is not a 40-char hex string
