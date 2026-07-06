import { describe, expect, it } from 'vitest';
import { applyCaseStyle } from '../caseStyle.js';

describe('applyCaseStyle', () => {
  it('formats camelCase', () => {
    expect(applyCaseStyle(['user', 'modal', 'visible'], 'camelCase', 'auto')).toBe('userModalVisible');
  });

  it('formats PascalCase', () => {
    expect(applyCaseStyle(['user', 'modal', 'visible'], 'PascalCase', 'auto')).toBe('UserModalVisible');
  });

  it('formats snake_case', () => {
    expect(applyCaseStyle(['user', 'modal', 'visible'], 'snake_case', 'auto')).toBe('user_modal_visible');
  });

  it('formats CONSTANT_CASE', () => {
    expect(applyCaseStyle(['user', 'modal', 'visible'], 'CONSTANT_CASE', 'auto')).toBe('USER_MODAL_VISIBLE');
  });

  it('formats Hungarian boolean', () => {
    expect(applyCaseStyle(['user', 'modal', 'visible'], 'Hungarian', 'boolean')).toBe('bUserModalVisible');
  });
});
