import type { GenerateNameRequest, GenerateNameResult, NameCandidate } from '@variable-island/shared';
import { applyCaseStyle } from './caseStyle.js';
import { translateDescription } from './dictionary.js';
import { inferVariableType } from './typeInference.js';
import type { NameGenerator } from './types.js';

function pickPrimaryWords(groups: string[][]): string[] {
  return groups.map((group) => group[0]!).filter(Boolean);
}

const englishStopWords = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'been',
  'being',
  'by',
  'for',
  'from',
  'if',
  'is',
  'of',
  'on',
  'or',
  'the',
  'to',
  'whether',
  'with'
]);

const wordAliases: Record<string, string> = {
  active: 'active',
  closed: 'closed',
  closing: 'closed',
  config: 'config',
  configuration: 'config',
  configurations: 'config',
  disable: 'disabled',
  disabled: 'disabled',
  disabling: 'disabled',
  display: 'show',
  displayed: 'show',
  displaying: 'show',
  enable: 'enabled',
  enabled: 'enabled',
  enabling: 'enabled',
  exist: 'exists',
  exists: 'exists',
  hidden: 'hidden',
  hiding: 'hidden',
  identifier: 'id',
  identifiers: 'ids',
  info: 'info',
  information: 'info',
  list: 'list',
  lists: 'list',
  modal: 'modal',
  modals: 'modal',
  opened: 'open',
  opening: 'open',
  parameter: 'params',
  parameters: 'params',
  params: 'params',
  popup: 'modal',
  request: 'request',
  requests: 'requests',
  response: 'response',
  responses: 'responses',
  selected: 'selected',
  selecting: 'selected',
  visible: 'visible'
};

function normalizeEnglishToken(token: string): string {
  const lower = token.toLowerCase();
  if (/^\d+$/.test(lower)) return lower;
  if (lower.endsWith('ies') && lower.length > 3) return `${lower.slice(0, -3)}y`;
  if (wordAliases[lower]) return wordAliases[lower];
  if (lower.endsWith('s') && lower.length > 3 && !/(ss|us|is)$/.test(lower)) return lower.slice(0, -1);
  return lower;
}

function extractTranslatedWords(translatedDescription?: string): string[] {
  if (!translatedDescription) return [];

  const rawTokens = translatedDescription
    .replace(/pop[\s-]+up/gi, ' popup ')
    .split(/[^a-zA-Z0-9]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const words: string[] = [];
  for (const token of rawTokens) {
    const lower = token.toLowerCase();
    const previous = words.at(-1);
    if (englishStopWords.has(lower) && !(lower === 'in' && previous === 'logged')) continue;

    const normalized = normalizeEnglishToken(lower);
    if (!normalized || words.at(-1) === normalized) continue;
    words.push(normalized);
  }

  return words;
}

function makeBooleanAlternatives(words: string[], description: string): string[][] {
  const withoutBooleanSyntax = words.filter((word) => ![
    'are',
    'be',
    'been',
    'being',
    'can',
    'display',
    'displayed',
    'displaying',
    'is',
    'should',
    'show',
    'whether'
  ].includes(word));
  const shouldAppendVisible = words.includes('visible') || words.includes('show') || /显示|可见/.test(description);
  const withoutVisible = withoutBooleanSyntax.filter((word) => word !== 'visible');
  const visibleWords = withoutBooleanSyntax.includes('visible')
    ? withoutBooleanSyntax
    : shouldAppendVisible
      ? [...withoutVisible, 'visible']
      : withoutBooleanSyntax;
  return [
    ['is', ...visibleWords.filter((word) => word !== 'is')],
    shouldAppendVisible
      ? ['should', 'show', ...withoutVisible]
      : ['should', ...withoutBooleanSyntax]
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
    const typeInferenceSource = request.translatedDescription
      ? `${request.description} ${request.translatedDescription}`
      : request.description;
    const variableType = inferVariableType(typeInferenceSource, request.variableType);
    const translatedWords = extractTranslatedWords(request.translatedDescription);
    const translatedGroups = translateDescription(request.description);
    const primaryWords = translatedWords.length > 0
      ? translatedWords
      : translatedGroups.length > 0
      ? pickPrimaryWords(translatedGroups)
      : sanitizeEnglishFallback(request.description);
    const reason = translatedWords.length > 0 ? 'deeplx translation' : 'local dictionary match';

    const wordSets: Array<{ words: string[]; reason: string }> = [{ words: primaryWords, reason }];
    if (variableType === 'boolean') {
      wordSets.unshift(...makeBooleanAlternatives(primaryWords, request.description).map((words) => ({ words, reason })));
    }
    if (variableType === 'array' && !primaryWords.includes('list') && !primaryWords.includes('items')) {
      wordSets.unshift({ words: [...primaryWords, 'list'], reason });
    }
    if (translatedWords.length > 0 && translatedGroups.length > 0) {
      wordSets.push({ words: pickPrimaryWords(translatedGroups), reason: 'local dictionary match' });
    }

    const seen = new Set<string>();
    const candidates: NameCandidate[] = wordSets
      .map(({ words, reason: candidateReason }) => ({
        name: applyCaseStyle(words, request.caseStyle, variableType),
        reason: variableType === 'boolean' && candidateReason !== 'deeplx translation'
          ? 'boolean intent detected'
          : candidateReason
      }))
      .filter(({ name }) => {
        if (!name || seen.has(name)) return false;
        seen.add(name);
        return true;
      })
      .map(({ name, reason: candidateReason }, index) => ({
        name,
        score: Math.max(0.95 - index * 0.08, 0.55),
        reason: candidateReason
      }));

    return {
      candidates,
      ...(request.translatedDescription ? { translatedDescription: request.translatedDescription } : {}),
      translationProvider: translatedWords.length > 0 ? 'deeplx' : 'local'
    };
  }
}
