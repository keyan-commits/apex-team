---
feat: FEAT-0002
title: "Unterminated frontmatter — no closing delimiter
status: active

This file intentionally lacks the closing --- delimiter.
The parseFrontmatter function will return null (end === -1).
This file should land in ungrouped, not in any FEAT group.
