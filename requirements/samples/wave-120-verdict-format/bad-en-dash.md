## coordination/handoffs/qa.md excerpt — BAD: en-dash (U+2013) instead of em-dash (U+2014)

This fixture uses en-dashes (–, U+2013) as separators instead of the required
em-dashes (—, U+2014). The characters look similar but are different Unicode
code points and will fail the canonical regex.

### Wave-120 PASS verdict – PR #0 – SHA 017145022ee78d2849356f9ef3d56ddb42adf577
- **Gate role:** qa
- **Timestamp:** 2026-06-04T18:00:00Z
- **Notes:** bad — separators are en-dashes (U+2013) not em-dashes (U+2014)
