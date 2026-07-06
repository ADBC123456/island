import type { GenerateNameRequest, GenerateNameResult, NameCandidate, VariableType } from '@variable-island/shared';
import { applyCaseStyle } from './caseStyle.js';
import { inferVariableType } from './typeInference.js';
import type { NameGenerator } from './types.js';

interface WordSet {
  words: string[];
  reason: string;
  weight: number;
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
  'in',
  'into',
  'is',
  'of',
  'on',
  'or',
  'that',
  'the',
  'this',
  'to',
  'whether',
  'with'
]);

const booleanSyntaxWords = new Set([
  'are',
  'be',
  'been',
  'being',
  'can',
  'could',
  'did',
  'do',
  'does',
  'has',
  'have',
  'is',
  'should',
  'whether',
  'will'
]);

const actionWords = new Set([
  'add',
  'build',
  'calculate',
  'clear',
  'close',
  'copy',
  'create',
  'delete',
  'download',
  'fetch',
  'filter',
  'format',
  'get',
  'handle',
  'load',
  'open',
  'parse',
  'remove',
  'render',
  'reset',
  'save',
  'search',
  'select',
  'send',
  'set',
  'sort',
  'submit',
  'sync',
  'toggle',
  'update',
  'upload',
  'validate'
]);

const genericTailWords = new Set([
  'data',
  'flag',
  'info',
  'object',
  'value'
]);

const wordAliases: Record<string, string> = {
  amount: 'amount',
  argument: 'arg',
  arguments: 'args',
  cache: 'cache',
  cached: 'cached',
  caching: 'cache',
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
  image: 'image',
  images: 'images',
  info: 'info',
  information: 'info',
  item: 'item',
  items: 'items',
  list: 'list',
  lists: 'list',
  loading: 'loading',
  modal: 'modal',
  modals: 'modal',
  number: 'count',
  opened: 'open',
  opening: 'open',
  parameter: 'params',
  parameters: 'params',
  params: 'params',
  picture: 'image',
  pictures: 'images',
  popup: 'modal',
  quantity: 'count',
  request: 'request',
  requests: 'requests',
  response: 'response',
  responses: 'responses',
  selected: 'selected',
  selecting: 'selected',
  visible: 'visible'
};

const adjectiveToVerb: Record<string, string> = {
  active: 'activate',
  closed: 'close',
  disabled: 'disable',
  enabled: 'enable',
  hidden: 'hide',
  open: 'open',
  selected: 'select',
  visible: 'show'
};

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function normalizeEnglishToken(token: string): string {
  const lower = token.toLowerCase();
  if (/^\d+$/.test(lower)) return lower;
  if (lower.endsWith('ies') && lower.length > 3) return `${lower.slice(0, -3)}y`;
  if (wordAliases[lower]) return wordAliases[lower];
  if (lower.endsWith('ing') && lower.length > 5) return lower.slice(0, -3);
  if (lower.endsWith('ed') && lower.length > 4) return lower.slice(0, -2);
  if (lower.endsWith('s') && lower.length > 3 && !/(ss|us|is)$/.test(lower)) return lower.slice(0, -1);
  return lower;
}

function extractTranslatedWords(translatedDescription?: string): string[] {
  if (!translatedDescription) return [];

  const rawTokens = translatedDescription
    .replace(/pop[\s-]+up/gi, ' popup ')
    .split(/[^a-zA-Z0-9$]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const words: string[] = [];
  for (const token of rawTokens) {
    const normalized = normalizeEnglishToken(token);
    if (!normalized || englishStopWords.has(normalized)) continue;
    if (words.at(-1) === normalized) continue;
    words.push(normalized);
  }

  return unique(words).filter((word) => word.length < 32);
}

function stripBooleanSyntax(words: string[]): string[] {
  return words.filter((word) => !booleanSyntaxWords.has(word));
}

function removeWords(words: string[], remove: Set<string>): string[] {
  return words.filter((word) => !remove.has(word));
}

function compactWords(words: string[]): string[] {
  if (words.length <= 2) return words;
  const compacted = [...words];
  while (compacted.length > 2 && genericTailWords.has(compacted.at(-1)!)) {
    compacted.pop();
  }
  return compacted;
}

function pluralize(word: string): string {
  if (word.endsWith('s')) return word;
  if (word.endsWith('y')) return `${word.slice(0, -1)}ies`;
  if (/(x|ch|sh)$/.test(word)) return `${word}es`;
  return `${word}s`;
}

function verbPhrase(words: string[]): string[] {
  if (words.length === 0) return [];
  const [first, ...rest] = words;
  const verb = adjectiveToVerb[first!] ?? first!;
  return [verb, ...rest];
}

function makeBooleanWordSets(words: string[]): WordSet[] {
  const semanticWords = stripBooleanSyntax(words);
  const withoutShow = removeWords(semanticWords, new Set(['display', 'show']));
  const shouldAppendVisible = semanticWords.some((word) => ['display', 'show', 'visible'].includes(word));
  const visibleWords = shouldAppendVisible
    ? [...removeWords(withoutShow, new Set(['visible'])), 'visible']
    : semanticWords;
  const hasWords = semanticWords.includes('exists')
    ? ['has', ...removeWords(semanticWords, new Set(['exists']))]
    : [];

  return [
    { words: ['is', ...visibleWords], reason: 'codelf boolean rule', weight: 1 },
    { words: ['should', ...verbPhrase(semanticWords)], reason: 'codelf boolean rule', weight: 0.94 },
    ...(hasWords.length > 1 ? [{ words: hasWords, reason: 'codelf boolean rule', weight: 0.9 }] : [])
  ];
}

function makeArrayWordSets(words: string[]): WordSet[] {
  const itemWords = removeWords(words, new Set(['array', 'collection', 'items', 'list', 'lists']));
  const base = itemWords.length > 0 ? itemWords : words;
  const item = base.at(-1);

  return [
    { words: [...base, 'list'], reason: 'codelf collection rule', weight: 1 },
    ...(item ? [{ words: [...base.slice(0, -1), pluralize(item)], reason: 'codelf collection rule', weight: 0.94 }] : []),
    { words: [...base, 'items'], reason: 'codelf collection rule', weight: 0.9 }
  ];
}

function makeFunctionWordSets(words: string[]): WordSet[] {
  const startsWithAction = actionWords.has(words[0] ?? '');
  return [
    { words: startsWithAction ? words : ['handle', ...words], reason: 'codelf function rule', weight: 1 },
    ...(startsWithAction ? [] : [{ words: ['get', ...words], reason: 'codelf function rule', weight: 0.92 }]),
    { words: verbPhrase(words), reason: 'codelf function rule', weight: 0.88 }
  ];
}

function makeObjectWordSets(words: string[], variableType: VariableType): WordSet[] {
  const sets: WordSet[] = [
    { words, reason: 'codelf direct phrase', weight: 1 }
  ];

  const compact = compactWords(words);
  if (compact.join('|') !== words.join('|')) {
    sets.push({ words: compact, reason: 'codelf compact phrase', weight: 0.9 });
  }

  if (variableType === 'number' && !words.includes('count')) {
    sets.unshift({ words: [...words, 'count'], reason: 'codelf numeric rule', weight: 1 });
  }

  return sets;
}

function makeWordSets(words: string[], variableType: VariableType): WordSet[] {
  if (variableType === 'boolean') return makeBooleanWordSets(words);
  if (variableType === 'array') return makeArrayWordSets(words);
  if (variableType === 'function') return makeFunctionWordSets(words);
  return makeObjectWordSets(words, variableType);
}

function isValidCandidateName(name: string): boolean {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name) || /^[A-Z][A-Z0-9_]*$/.test(name) || /^[a-z][a-z0-9_]*$/.test(name);
}

export class LocalNameGenerator implements NameGenerator {
  async generate(request: GenerateNameRequest): Promise<GenerateNameResult> {
    const translatedWords = extractTranslatedWords(request.translatedDescription);
    if (translatedWords.length === 0) {
      return {
        candidates: [],
        ...(request.translatedDescription ? { translatedDescription: request.translatedDescription } : {}),
        translationProvider: 'none'
      };
    }

    const typeInferenceSource = `${request.description} ${request.translatedDescription ?? ''}`;
    const variableType = inferVariableType(typeInferenceSource, request.variableType);
    const wordSets = makeWordSets(translatedWords, variableType);
    const seen = new Set<string>();

    const candidates: NameCandidate[] = wordSets
      .map(({ words, reason, weight }) => ({
        name: applyCaseStyle(words, request.caseStyle, variableType),
        reason,
        weight
      }))
      .filter(({ name }) => {
        if (!name || !isValidCandidateName(name) || name.length > 64 || seen.has(name.toLowerCase())) return false;
        seen.add(name.toLowerCase());
        return true;
      })
      .map(({ name, reason, weight }, index) => ({
        name,
        score: Math.max(weight - index * 0.04, 0.55),
        reason
      }));

    return {
      candidates,
      ...(request.translatedDescription ? { translatedDescription: request.translatedDescription } : {}),
      translationProvider: 'deeplx'
    };
  }
}
