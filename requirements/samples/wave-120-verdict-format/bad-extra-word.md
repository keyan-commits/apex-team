## coordination/handoffs/qa.md excerpt — BAD: extra word after verdict type

This fixture simulates Wave 119's failure pattern where "viewer PR #3"
appeared instead of "PR #3" — the word "viewer" is an extra token that
breaks the canonical format.

### Wave-119 PASS verdict — viewer PR #3 — SHA abc1234567890abcdef1234567890abcdef12345
- **Gate role:** qa
- **Timestamp:** 2026-06-04T18:00:00Z
- **Notes:** bad — "viewer" is an extra word before "PR #N" that is not in the canonical format
