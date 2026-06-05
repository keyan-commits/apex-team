// ticket: TEST-0001
// parent_feat: FEAT-0001
// parent_us: US-001
// role: qa
// status: in-flight
// MALFORMED: unclosed block below

/*
 * This file has a frontmatter section with no closing delimiter — used to
 * test fail-soft behaviour in status-reconcile. The script should log a
 * warning and skip this file without crashing.
 */

import { describe, it, expect } from 'vitest';

describe('malformed fixture test', () => {
  it('placeholder', () => {
    expect(true).toBe(true);
  });
});
