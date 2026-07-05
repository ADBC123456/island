import { describe, expect, it } from 'vitest';
import { applyCaseStyle } from '../caseStyle';

describe('applyCaseStyle', () => {
  it('formats camelCase', () => {
    expect(applyCaseStyle(['user', 'modal', 'visible'], 'camelCase', 'auto')).toBe('userModalVisible');
  });

  it('formats PascalCase', () => {
    expect(applyCaseStyle(['user', 'modal', 'visible'], 'PascalCase', 'auto')).toBe('UserModalVisible');
  });

  it('formats Hungarian boolean', () => {
    expect(applyCaseStyle(['user', 'modal', 'visible'], 'Hungarian', 'boolean')).toBe('bUserModalVisible');
  });
});
