import { describe, expect, it } from 'vitest';
import { LocalNameGenerator } from '../localNameGenerator.js';

describe('LocalNameGenerator', () => {
  it('generates boolean modal candidates from Chinese description', async () => {
    const generator = new LocalNameGenerator();
    const result = await generator.generate({
      description: '是否显示用户弹窗',
      caseStyle: 'camelCase',
      variableType: 'auto'
    });

    expect(result.candidates.map((candidate) => candidate.name)).toContain('isUserModalVisible');
    expect(result.candidates[0]?.score).toBeGreaterThan(0.5);
  });

  it('generates PascalCase for product list', async () => {
    const generator = new LocalNameGenerator();
    const result = await generator.generate({
      description: '商品列表',
      caseStyle: 'PascalCase',
      variableType: 'array'
    });

    expect(result.candidates.map((candidate) => candidate.name)).toContain('ProductList');
  });
});
