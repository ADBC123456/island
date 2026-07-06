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

  it('does not append visible for non-visibility boolean descriptions', async () => {
    const generator = new LocalNameGenerator();
    const result = await generator.generate({
      description: '是否启用缓存',
      caseStyle: 'camelCase',
      variableType: 'auto'
    });

    expect(result.candidates.map((candidate) => candidate.name)).toContain('isEnabledCache');
    expect(result.candidates.map((candidate) => candidate.name)).not.toContain('isEnabledCacheVisible');
  });

  it('generates candidates from expanded programming dictionary', async () => {
    const generator = new LocalNameGenerator();
    const result = await generator.generate({
      description: '分页请求参数',
      caseStyle: 'camelCase',
      variableType: 'auto'
    });

    expect(result.candidates.map((candidate) => candidate.name)).toContain('paginationRequestParams');
  });

  it('uses translated description before local dictionary fallback', async () => {
    const generator = new LocalNameGenerator();
    const result = await generator.generate({
      description: '是否启用缓存',
      translatedDescription: 'whether to enable cache',
      caseStyle: 'camelCase',
      variableType: 'auto'
    });

    expect(result.translatedDescription).toBe('whether to enable cache');
    expect(result.translationProvider).toBe('deeplx');
    expect(result.candidates[0]?.name).toBe('isEnabledCache');
    expect(result.candidates[0]?.reason).toBe('deeplx translation');
  });

  it('builds names from translated English phrases when the local dictionary is incomplete', async () => {
    const generator = new LocalNameGenerator();
    const result = await generator.generate({
      description: '装载完成标记',
      translatedDescription: 'page load complete flag',
      caseStyle: 'camelCase',
      variableType: 'auto'
    });

    expect(result.candidates.map((candidate) => candidate.name)).toContain('pageLoadCompleteFlag');
  });
});
