import type { GenerateNameRequest, GenerateNameResult, NameCandidate } from '@variable-island/shared';
import { applyCaseStyle } from './caseStyle.js';
import { translateDescription } from './dictionary.js';
import { inferVariableType } from './typeInference.js';
import type { NameGenerator } from './types.js';

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function pickPrimaryWords(groups: string[][]): string[] {
  return groups.map((group) => group[0]!).filter(Boolean);
}

function makeBooleanAlternatives(words: string[]): string[][] {
  const withoutIsOrShould = words.filter((word) => word !== 'is' && word !== 'should' && word !== 'show');
  const visibleWords = withoutIsOrShould.includes('visible')
    ? withoutIsOrShould
    : [...withoutIsOrShould, 'visible'];
  return [
    ['is', ...visibleWords.filter((word) => word !== 'is')],
    ['should', 'show', ...withoutIsOrShould.filter((word) => word !== 'visible')]
  ];
}

function sanitizeEnglishFallback(description: string): string[] {
  const ascii = description
    .replace(/[^a-zA-Z0-9\s_-]/g, ' ')
    .split(/[\s_-]+/)
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
  return ascii.length > 0 ? ascii : ['value'];
}

export class LocalNameGenerator implements NameGenerator {
  async generate(request: GenerateNameRequest): Promise<GenerateNameResult> {
    const variableType = inferVariableType(request.description, request.variableType);
    const translatedGroups = translateDescription(request.description);
    const primaryWords = translatedGroups.length > 0
      ? pickPrimaryWords(translatedGroups)
      : sanitizeEnglishFallback(request.description);

    const wordSets: string[][] = [primaryWords];
    if (variableType === 'boolean') {
      wordSets.unshift(...makeBooleanAlternatives(primaryWords));
    }
    if (variableType === 'array' && !primaryWords.includes('list') && !primaryWords.includes('items')) {
      wordSets.unshift([...primaryWords, 'list']);
    }

    const candidates: NameCandidate[] = unique(
      wordSets
        .map((words) => applyCaseStyle(words, request.caseStyle, variableType))
        .filter(Boolean)
    ).map((name, index) => ({
      name,
      score: Math.max(0.95 - index * 0.08, 0.55),
      reason: variableType === 'boolean' ? 'boolean intent detected' : 'local dictionary match'
    }));

    return { candidates };
  }
}
