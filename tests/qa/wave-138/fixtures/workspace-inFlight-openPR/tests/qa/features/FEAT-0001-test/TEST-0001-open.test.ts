// ticket: TEST-0001
// parent_feat: FEAT-0001
// parent_us: US-001
// role: qa
// status: in-flight

/**
 * Fixture test file: status in-flight but parent PR is open (not merged).
 * status-reconcile must NOT touch this file.
 */

import { describe, it, expect } from 'vitest';

describe('open PR fixture test', () => {
  it('placeholder', () => {
    expect(true).toBe(true);
  });
});
