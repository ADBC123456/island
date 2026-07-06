import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const islandCss = readFileSync(new URL('./island.css', import.meta.url), 'utf8');

function ruleBody(selector: string): string {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = islandCss.match(new RegExp(`(?:^|\\n)${escapedSelector}\\s*\\{([^}]*)\\}`, 's'));
  expect(match).not.toBeNull();
  return match?.[1] ?? '';
}

describe('island CSS motion invariants', () => {
  it('keeps candidate transforms owned by Framer Motion only', () => {
    expect(islandCss).not.toMatch(/\.candidate(?::hover|:active)\s*\{[^}]*transform\s*:/s);
    expect(islandCss).not.toMatch(/\.candidate\s*\{[^}]*\btransition\s*:[^}]*transform/s);
  });

  it('keeps the morphing shell on a stable clipped compositor layer', () => {
    const shell = ruleBody('.island-shell');
    expect(shell).toMatch(/\boverflow:\s*hidden\b/);
    expect(shell).toMatch(/\bisolation:\s*isolate\b/);
    expect(shell).toMatch(/\bcontain:\s*layout paint\b/);
    expect(shell).toMatch(/\bwill-change:\s*width,\s*height,\s*border-radius,\s*transform\b/);
    expect(shell).toMatch(/\btransform:\s*translateZ\(0\)/);

    const refract = ruleBody('.island-refract');
    expect(refract).toMatch(/\bwill-change:\s*transform\b/);
    expect(refract).toMatch(/\btransform:\s*translateZ\(0\)/);
  });

  it('keeps dense island content separated by at least 10px', () => {
    expect(ruleBody('.island-input-row')).toMatch(/\bgap:\s*10px\b/);
    expect(ruleBody('.island-content')).toMatch(/\bpadding:\s*0 28px 15px\b/);
    expect(ruleBody('.island-shell-compact .island-content')).toMatch(/\bpadding-inline:\s*28px\b/);
    expect(ruleBody('.island-input-stack')).toMatch(/\bgap:\s*10px\b/);
    expect(ruleBody('.control-row')).toMatch(/\bgap:\s*10px\b/);
    expect(ruleBody('.rule-tabs')).toMatch(/\bgap:\s*10px\b/);
    expect(ruleBody('.rule-tabs')).toMatch(/\bpadding:\s*10px\b/);
    expect(ruleBody('.rule-tab-label')).toMatch(/\bpadding:\s*0 10px\b/);
    expect(ruleBody('.candidate-list')).toMatch(/\bgap:\s*10px\b/);
    expect(ruleBody('.candidate-list')).toMatch(/\bpadding:\s*10px\b/);
    expect(ruleBody('.candidate')).toMatch(/\bgap:\s*12px\b/);
    expect(ruleBody('.candidate')).toMatch(/\bpadding:\s*0 12px\b/);
    expect(ruleBody('.candidate-main')).toMatch(/\bgap:\s*10px\b/);
    expect(ruleBody('.candidate-badge')).toMatch(/\bpadding:\s*0 10px\b/);
    expect(ruleBody('.empty-candidates')).toMatch(/\bgap:\s*10px\b/);
  });
});
