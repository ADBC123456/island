import { describe, expect, it } from 'vitest';
import { LocalNameGenerator } from '../localNameGenerator.js';

describe('LocalNameGenerator', () => {
  it('does not generate from the removed local dictionary', async () => {
    const generator = new LocalNameGenerator();
    const result = await generator.generate({
      description: '分页请求参数',
      caseStyle: 'camelCase',
      variableType: 'auto'
    });

    expect(result.candidates).toEqual([]);
    expect(result.translationProvider).toBe('none');
  });

  it('generates Codelf-style boolean candidates from translated text', async () => {
    const generator = new LocalNameGenerator();
    const result = await generator.generate({
      description: '是否显示用户弹窗',
      translatedDescription: 'Whether to show user popup',
      caseStyle: 'camelCase',
      variableType: 'auto'
    });

    expect(result.translationProvider).toBe('deeplx');
    expect(result.candidates.map((candidate) => candidate.name)).toContain('isUserModalVisible');
    expect(result.candidates.map((candidate) => candidate.name)).toContain('shouldShowUserModal');
    expect(result.candidates[0]?.reason).toBe('codelf boolean rule');
  });

  it('keeps enable/disable descriptions as boolean names', async () => {
    const generator = new LocalNameGenerator();
    const result = await generator.generate({
      description: '是否启用缓存',
      translatedDescription: 'Whether to enable caching',
      caseStyle: 'camelCase',
      variableType: 'auto'
    });

    expect(result.candidates.map((candidate) => candidate.name)).toContain('isEnabledCache');
    expect(result.candidates.map((candidate) => candidate.name)).toContain('shouldEnableCache');
    expect(result.candidates.map((candidate) => candidate.name)).not.toContain('isEnabledCacheVisible');
  });

  it('generates collection names from translated text', async () => {
    const generator = new LocalNameGenerator();
    const result = await generator.generate({
      description: '商品列表',
      translatedDescription: 'product list',
      caseStyle: 'PascalCase',
      variableType: 'array'
    });

    expect(result.candidates.map((candidate) => candidate.name)).toContain('ProductList');
    expect(result.candidates.map((candidate) => candidate.name)).toContain('Products');
  });

  it('generates snake_case names', async () => {
    const generator = new LocalNameGenerator();
    const result = await generator.generate({
      description: '分页请求参数',
      translatedDescription: 'pagination request parameters',
      caseStyle: 'snake_case',
      variableType: 'auto'
    });

    expect(result.candidates.map((candidate) => candidate.name)).toContain('pagination_request_params');
  });

  it('generates CONSTANT_CASE names', async () => {
    const generator = new LocalNameGenerator();
    const result = await generator.generate({
      description: '最大重试次数',
      translatedDescription: 'maximum retry count',
      caseStyle: 'CONSTANT_CASE',
      variableType: 'number'
    });

    expect(result.candidates.map((candidate) => candidate.name)).toContain('MAXIMUM_RETRY_COUNT');
  });

  it('generates function-style candidates from action words', async () => {
    const generator = new LocalNameGenerator();
    const result = await generator.generate({
      description: '校验用户输入',
      translatedDescription: 'validate user input',
      caseStyle: 'camelCase',
      variableType: 'auto'
    });

    expect(result.candidates[0]?.name).toBe('validateUserInput');
    expect(result.candidates[0]?.reason).toBe('codelf function rule');
  });
});
