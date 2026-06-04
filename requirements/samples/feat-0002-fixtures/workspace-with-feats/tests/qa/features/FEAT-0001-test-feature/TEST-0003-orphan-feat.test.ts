---
ticket: TEST-0003
parent_feat: FEAT-9999
parent_us: US-100
role: qa
status: in-flight
---
// Fixture: test file with parent_feat pointing to non-existent FEAT-9999.
// Should still be grouped under FEAT-9999 with title fallback (graceful, no crash).
