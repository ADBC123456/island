import type { CaseStyle, VariableType } from '@variable-island/shared';

const hungarianPrefixes: Record<Exclude<VariableType, 'auto'>, string> = {
  boolean: 'b',
  string: 'str',
  number: 'num',
  array: 'arr',
  object: 'obj',
  function: 'fn'
};

function capitalize(value: string): string {
  if (value.length === 0) return value;
  return value[0]!.toUpperCase() + value.slice(1);
}

function normalizeToken(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, '').trim();
}

export function applyCaseStyle(words: string[], caseStyle: CaseStyle, variableType: VariableType): string {
  const cleanWords = words.map(normalizeToken).filter(Boolean);
  if (cleanWords.length === 0) return '';

  if (caseStyle === 'snake_case') {
    return cleanWords.map((word) => word.toLowerCase()).join('_');
  }

  if (caseStyle === 'CONSTANT_CASE') {
    return cleanWords.map((word) => word.toUpperCase()).join('_');
  }

  if (caseStyle === 'PascalCase') {
    return cleanWords.map(capitalize).join('');
  }

  if (caseStyle === 'Hungarian') {
    const prefix = variableType === 'auto' ? 'v' : hungarianPrefixes[variableType];
    return `${prefix}${cleanWords.map(capitalize).join('')}`;
  }

  const [first, ...rest] = cleanWords;
  return `${first!.toLowerCase()}${rest.map(capitalize).join('')}`;
}
