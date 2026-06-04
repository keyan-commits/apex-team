---
ticket: US-004
role: business-analyst
status: "unclosed string value
---
# US-004 — Malformed Frontmatter (fixture for fail-soft YAML test)

This file has deliberately broken YAML frontmatter (unclosed string in the status field).
The malformation is the unclosed quote in status — the outer --- delimiters are present.
