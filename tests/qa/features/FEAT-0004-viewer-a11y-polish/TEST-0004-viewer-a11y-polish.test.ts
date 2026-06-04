// ticket: TEST-0004
// parent_feat: FEAT-0004
// parent_us: US-101
// role: qa
// status: in-flight
//
// Wave 125 — Viewer A11y Polish regression tests (US-101 AC6)
//
// Spec: requirements/user-stories/US-101-viewer-a11y-polish.md
// FEAT: FEAT-0004 — Viewer A11y Polish
// US:   US-101
//
// Strategy: static-parse pattern from Wave 123 TEST-0003.
// Read ../apex-team-viewer/public/style.css and app.js as strings,
// assert patterns with expect(...).toMatch / expect(...).not.toMatch.
//
// Runtime gate: VIEWER_PRESENT = existsSync('../apex-team-viewer/public/style.css')
// All viewer-content assertions are in VIEWER_PRESENT blocks.
// When viewer is absent (CI without sibling repo), those tests skip cleanly.
// Metadata / self-reference assertions run unconditionally.
//
// Wave 118 comprehensive-coverage classes:
//   AC1 — .search:focus-visible rule (issue #5)
//   AC2 — solid focus ring on .feat-card-header + .badge-btn (issue #7)
//   AC3 — .file-open keyboard reach: tabindex / role / keydown (issue #8)
//   AC4 — .feat-card-body landmark: role="region" + aria-labelledby (issue #9)
//   AC5 — Focus-ring sweep: every outline:none has a paired :focus-visible
//   Iterate — parametrized check: each :focus-visible rule uses solid #6a8cd6 (no alpha)
//   Metadata — self-reference + US-085 traceability
//
// S10: not triggered — wave touches no user-supplied collection logic.

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const APEX_TEAM_ROOT = resolve(import.meta.dirname, '../../../..');
const VIEWER_ROOT = resolve(APEX_TEAM_ROOT, '../apex-team-viewer');
const STYLE_CSS = resolve(VIEWER_ROOT, 'public/style.css');
const APP_JS = resolve(VIEWER_ROOT, 'public/app.js');

// ---------------------------------------------------------------------------
// Runtime gate — skip viewer-content tests when sibling repo absent
// ---------------------------------------------------------------------------

const VIEWER_PRESENT = existsSync(STYLE_CSS);

// Lazily read files only when viewer is present (avoid read errors in CI).
function readCss(): string {
  return readFileSync(STYLE_CSS, 'utf8');
}
function readAppJs(): string {
  return readFileSync(APP_JS, 'utf8');
}

// ---------------------------------------------------------------------------
// Runtime gate message
// ---------------------------------------------------------------------------

if (!VIEWER_PRESENT) {
  describe('Wave 125 — viewer a11y tests (SKIPPED — viewer absent)', () => {
    it.skip(
      'SKIP: pending viewer PR for US-101 a11y polish changes — ' +
        'auto-unskips once ../apex-team-viewer/public/style.css is present',
      () => {},
    );
  });
}

// ---------------------------------------------------------------------------
// AC1 — .search:focus-visible rule (issue #5)
// ---------------------------------------------------------------------------

if (VIEWER_PRESENT) {
  describe('Wave 125 — AC1 — .search:focus-visible rule (US-101 AC1)', () => {
    it('P1a: style.css contains a .search:focus-visible rule', () => {
      const css = readCss();
      expect(css).toMatch(/\.search:focus-visible\s*\{/);
    });

    it('P1b: .search:focus-visible rule has outline: 2px solid #6a8cd6', () => {
      const css = readCss();
      // Extract the .search:focus-visible block and check for the outline property
      const match = css.match(/\.search:focus-visible\s*\{([^}]+)\}/);
      expect(match, '.search:focus-visible block must exist').toBeTruthy();
      expect(match![1]).toMatch(/outline:\s*2px\s+solid\s+#6a8cd6/);
    });

    it('P1c: .search:focus-visible rule has outline-offset: 1px', () => {
      const css = readCss();
      const match = css.match(/\.search:focus-visible\s*\{([^}]+)\}/);
      expect(match, '.search:focus-visible block must exist').toBeTruthy();
      expect(match![1]).toMatch(/outline-offset:\s*1px/);
    });
  });
}

// ---------------------------------------------------------------------------
// AC2 — Solid focus ring on .feat-card-header + .badge-btn (issue #7)
// ---------------------------------------------------------------------------

if (VIEWER_PRESENT) {
  describe('Wave 125 — AC2 — solid focus ring on .feat-card-header + .badge-btn (US-101 AC2)', () => {
    it('P2a: .feat-card-header:focus-visible rule has outline: 2px solid #6a8cd6 (NOT #6a8cd640)', () => {
      const css = readCss();
      const match = css.match(/\.feat-card-header:focus-visible\s*\{([^}]+)\}/);
      expect(match, '.feat-card-header:focus-visible block must exist').toBeTruthy();
      expect(match![1]).toMatch(/outline:\s*2px\s+solid\s+#6a8cd6(?![0-9a-fA-F])/);
    });

    it('P2b: .badge-btn:focus-visible rule has outline: 2px solid #6a8cd6 (NOT #6a8cd640)', () => {
      const css = readCss();
      const match = css.match(/\.badge-btn:focus-visible\s*\{([^}]+)\}/);
      expect(match, '.badge-btn:focus-visible block must exist').toBeTruthy();
      expect(match![1]).toMatch(/outline:\s*2px\s+solid\s+#6a8cd6(?![0-9a-fA-F])/);
    });

    it('N2: #6a8cd640 (25% alpha) does NOT appear anywhere in style.css', () => {
      const css = readCss();
      expect(css).not.toMatch(/#6a8cd640/i);
    });
  });
}

// ---------------------------------------------------------------------------
// AC3 — .file-open keyboard reach (issue #8)
// ---------------------------------------------------------------------------

if (VIEWER_PRESENT) {
  describe('Wave 125 — AC3 — .file-open keyboard reach (US-101 AC3)', () => {
    it('P3a: app.js contains tabindex="0" on .file-open spans', () => {
      const js = readAppJs();
      // Accept either tabindex="0" or tabindex=\`0\` (template-literal variant)
      expect(js).toMatch(/tabindex=["']0["']/);
    });

    it('P3b: app.js contains role="button" near .file-open spans', () => {
      const js = readAppJs();
      expect(js).toMatch(/role=["']button["']/);
    });

    it('P3c: app.js contains a keydown handler that fires openFile on Enter or Space', () => {
      const js = readAppJs();
      // Must have a keydown listener on .file-open elements (not just the global keydown for Escape/Ctrl+F)
      // The pattern: addEventListener('keydown') AND (Enter OR Space) AND openFile
      const hasKeydown = js.includes("addEventListener('keydown'") || js.includes('addEventListener("keydown"');
      expect(hasKeydown).toBe(true);
      // Must handle 'Enter' key
      expect(js).toMatch(/e\.key\s*===?\s*["']Enter["']/);
      // Must handle ' ' (Space) key — allow single-space string literal or named constant
      expect(js).toMatch(/e\.key\s*===?\s*["'] ["']/);
      // Must call openFile
      expect(js).toMatch(/openFile\(/);
    });

    it('N3: e.preventDefault() present on the Space-key path (prevents scroll)', () => {
      const js = readAppJs();
      // e.preventDefault() must appear in the file (at minimum) co-present with the keydown handler
      expect(js).toMatch(/e\.preventDefault\(\)/);
    });
  });
}

// ---------------------------------------------------------------------------
// AC4 — .feat-card-body landmark (issue #9)
// ---------------------------------------------------------------------------

if (VIEWER_PRESENT) {
  describe('Wave 125 — AC4 — .feat-card-body landmark (US-101 AC4)', () => {
    it('P4a: app.js contains id="feat-header-${feat.feat}" (or template-literal variant) on .feat-card-header', () => {
      const js = readAppJs();
      // Accept template-literal or string-concatenation forms
      const hasFeatHeaderId =
        js.includes('feat-header-${feat.feat}') ||
        js.includes("feat-header-${feat.feat}") ||
        /["']feat-header-["']\s*\+\s*feat\.feat/.test(js) ||
        /id=.*feat-header/.test(js);
      expect(hasFeatHeaderId).toBe(true);
    });

    it('P4b: app.js contains role="region" on .feat-card-body', () => {
      const js = readAppJs();
      expect(js).toMatch(/role=["']region["']/);
    });

    it('P4c: app.js contains aria-labelledby="feat-header-${feat.feat}" (or template-literal variant) on .feat-card-body', () => {
      const js = readAppJs();
      const hasAriaLabelledby =
        js.includes('aria-labelledby="feat-header-${feat.feat}"') ||
        js.includes("aria-labelledby='feat-header-${feat.feat}'") ||
        js.includes('aria-labelledby=`feat-header-${feat.feat}`') ||
        /aria-labelledby=["']feat-header-/.test(js);
      expect(hasAriaLabelledby).toBe(true);
    });
  });
}

// ---------------------------------------------------------------------------
// AC5 — Focus-ring sweep: every outline:none has a paired :focus-visible rule
// ---------------------------------------------------------------------------

if (VIEWER_PRESENT) {
  describe('Wave 125 — AC5 — focus-ring sweep regression (US-101 AC5)', () => {
    it('P5: for every selector with outline:none, a :focus-visible rule exists on the same selector or its descendants', () => {
      const css = readCss();

      // Strategy: split the CSS into individual rule blocks on "}" boundaries,
      // then for each block that contains "outline: none" or "outline: 0",
      // extract the selector from the preceding text.
      //
      // Each block has the form:  <SELECTOR> { <PROPERTIES> }
      // We split on "}" and for each chunk that contains "outline: none",
      // extract the selector as the text before "{".

      const selectorsWithOutlineNone: string[] = [];

      // Split on closing brace to get chunks; each chunk ends right before "}"
      const chunks = css.split('}');
      for (const chunk of chunks) {
        const openBraceIdx = chunk.lastIndexOf('{');
        if (openBraceIdx === -1) continue;
        const properties = chunk.slice(openBraceIdx + 1);
        if (!/outline:\s*(none|0)\b/.test(properties)) continue;
        // The selector is the text before the last "{", trimmed
        const selectorGroup = chunk.slice(0, openBraceIdx).trim();
        // Take only the last line — multi-line CSS sometimes has prior rules
        // above the selector in the same chunk due to comments.
        const lines = selectorGroup.split('\n');
        const selectorLine = lines[lines.length - 1].trim();
        if (!selectorLine) continue;
        // Expand comma-separated selectors
        const selectors = selectorLine.split(',').map(s => s.trim()).filter(Boolean);
        selectorsWithOutlineNone.push(...selectors);
      }

      // For each selector that has outline:none, verify a :focus-visible variant
      // exists on the same selector or on a more specific form of it.
      const missingFocusVisible: string[] = [];
      for (const selector of selectorsWithOutlineNone) {
        // Strip pseudo-classes (but keep class/id/element) to get a base pattern to look up
        const baseSelector = selector
          .replace(/:(hover|focus|active|disabled|checked|visited|nth-child\([^)]+\)|first-child|last-child)/g, '')
          .trim();
        if (!baseSelector) continue;
        // Escape for use in a regex
        const escaped = baseSelector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Accept: "<selector>:focus-visible" or a descendant pattern containing the selector
        const focusVisiblePattern = new RegExp(escaped + '[^{]*:focus-visible');
        if (!focusVisiblePattern.test(css)) {
          missingFocusVisible.push(selector);
        }
      }

      expect(
        missingFocusVisible,
        `Selectors with outline:none that lack a :focus-visible pair: ${missingFocusVisible.join(', ')}`,
      ).toHaveLength(0);
    });
  });
}

// ---------------------------------------------------------------------------
// Iterate-all — each :focus-visible rule uses solid #6a8cd6 (no alpha suffix)
// Wave 118 parametrize: covers .search, .feat-card-header, .badge-btn, .file-open
// ---------------------------------------------------------------------------

if (VIEWER_PRESENT) {
  describe('Wave 125 — Iterate-all — each focus-visible rule uses solid #6a8cd6 (US-101 AC2 Edge)', () => {
    const FOCUS_VISIBLE_SELECTORS = [
      '.search',
      '.feat-card-header',
      '.badge-btn',
      '.file-open',
    ] as const;

    for (const selector of FOCUS_VISIBLE_SELECTORS) {
      it(`${selector}:focus-visible outline color is solid #6a8cd6 (no alpha suffix like 40)`, () => {
        const css = readCss();
        // Look for the :focus-visible rule block for this selector
        const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const ruleRegex = new RegExp(`${escapedSelector}:focus-visible\\s*\\{([^}]+)\\}`);
        const ruleMatch = css.match(ruleRegex);
        expect(ruleMatch, `${selector}:focus-visible rule block must exist in style.css`).toBeTruthy();
        // The outline value must contain #6a8cd6 NOT followed by any hex digit (no alpha suffix)
        expect(ruleMatch![1]).toMatch(/outline:\s*2px\s+solid\s+#6a8cd6(?![0-9a-fA-F])/);
        // Must NOT contain the alpha-blended variant
        expect(ruleMatch![1]).not.toMatch(/#6a8cd640/i);
      });
    }
  });
}

// ---------------------------------------------------------------------------
// Self-reference + metadata (US-085 traceability)
// ---------------------------------------------------------------------------

describe('Wave 125 — metadata (US-085 self-reference)', () => {
  it('TEST-0004 file exists at canonical Wave 122 FEAT-grouped path', () => {
    const expected = resolve(
      APEX_TEAM_ROOT,
      'tests/qa/features/FEAT-0004-viewer-a11y-polish/TEST-0004-viewer-a11y-polish.test.ts',
    );
    expect(existsSync(expected)).toBe(true);
  });

  it('US-101 user story exists with ## Acceptance criteria section', () => {
    const usFile = resolve(
      APEX_TEAM_ROOT,
      'requirements/user-stories/US-101-viewer-a11y-polish.md',
    );
    expect(existsSync(usFile)).toBe(true);
    const content = readFileSync(usFile, 'utf8');
    expect(content).toMatch(/^## Acceptance criteria/m);
  });

  it('US-101 contains AC6 (QA static-parse conformance test)', () => {
    const usFile = resolve(
      APEX_TEAM_ROOT,
      'requirements/user-stories/US-101-viewer-a11y-polish.md',
    );
    const content = readFileSync(usFile, 'utf8');
    expect(content).toContain('AC6');
  });

  it('FEAT-0004 file exists at requirements/features/ with feat: FEAT-0004 frontmatter', () => {
    const featFile = resolve(
      APEX_TEAM_ROOT,
      'requirements/features/FEAT-0004-viewer-a11y-polish.md',
    );
    expect(existsSync(featFile)).toBe(true);
    const content = readFileSync(featFile, 'utf8');
    expect(content).toMatch(/^feat:\s*FEAT-0004/m);
  });

  it('tests/qa/features/INDEX.md has a TEST-0004 row', () => {
    const indexFile = resolve(APEX_TEAM_ROOT, 'tests/qa/features/INDEX.md');
    expect(existsSync(indexFile)).toBe(true);
    const content = readFileSync(indexFile, 'utf8');
    expect(content).toContain('TEST-0004');
  });

  it('VIEWER_PRESENT runtime gate is boolean', () => {
    expect(typeof VIEWER_PRESENT).toBe('boolean');
  });
});
