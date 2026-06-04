## coordination/handoffs/qa.md excerpt — BAD: 7-char short SHA

This fixture simulates a HANDOFF doc where the role used a 7-character
abbreviated SHA instead of the required full 40-character SHA.

### Wave-120 PASS verdict — PR #0 — SHA abc1234
- **Gate role:** qa
- **Timestamp:** 2026-06-04T18:00:00Z
- **Notes:** bad — SHA is only 7 chars; must be exactly 40 lowercase hex chars
