import { loadConfig } from './storageService.js';

const DEFAULT_DEEPLX_URL = 'http://127.0.0.1:1188/translate';
const DEFAULT_TARGET_LANG = 'EN';
const DEFAULT_SOURCE_LANG = 'auto';
const DEFAULT_TIMEOUT_MS = 8000;
const MIN_TIMEOUT_MS = 8000;
const MAX_TRANSLATION_ATTEMPTS = 2;

interface DeepLxResponse {
  code?: number;
  data?: unknown;
  result?: unknown;
  text?: unknown;
  translatedText?: unknown;
  translation?: unknown;
  translations?: unknown;
  message?: string;
}

interface DeepLxConfig {
  enabled: boolean;
  endpoint: string;
  token: string | undefined;
  sourceLang: string;
  targetLang: string;
  timeoutMs: number;
}

const translationCache = new Map<string, Promise<string | undefined>>();

function readEnv(name: string, fallbackName?: string): string | undefined {
  const value = process.env[name]?.trim();
  if (value) return value;
  if (!fallbackName) return undefined;
  return process.env[fallbackName]?.trim() || undefined;
}

function parseEnabled(value: string | undefined): boolean {
  if (!value) return true;
  return !['0', 'false', 'off', 'no'].includes(value.toLowerCase());
}

function parseTimeout(value: string | undefined): number {
  if (!value) return DEFAULT_TIMEOUT_MS;
  const timeoutMs = Number.parseInt(value, 10);
  if (!Number.isFinite(timeoutMs) || timeoutMs < 300) return DEFAULT_TIMEOUT_MS;
  return Math.max(timeoutMs, MIN_TIMEOUT_MS);
}

function pickString(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

function normalizeEndpoint(value: string): string {
  const endpoint = value.trim();
  if (!endpoint) return DEFAULT_DEEPLX_URL;

  try {
    const url = new URL(endpoint);
    if (!url.pathname.endsWith('/translate')) {
      url.pathname = `${url.pathname.replace(/\/$/, '')}/translate`;
    }
    return url.toString();
  } catch {
    return endpoint.endsWith('/translate') ? endpoint : `${endpoint.replace(/\/$/, '')}/translate`;
  }
}

function normalizeLanguageCode(value: string): string {
  const normalized = value.trim().toUpperCase();
  if (!normalized) return DEFAULT_TARGET_LANG;
  if (normalized === 'AUTO') return 'auto';
  if (normalized === 'EN-US' || normalized === 'EN-GB') return 'EN';
  if (normalized === 'ZH-CN' || normalized === 'ZH-HANS') return 'ZH';
  if (normalized === 'ZH-TW' || normalized === 'ZH-HANT') return 'ZH';
  return normalized;
}

function readDeepLxConfig(): DeepLxConfig {
  const appConfig = loadConfig();
  const configuredTimeout = typeof appConfig.deeplxTimeoutMs === 'number'
    ? String(appConfig.deeplxTimeoutMs)
    : undefined;
  const provider = String(appConfig.translationProvider).trim().toLowerCase();

  return {
    enabled: provider === 'deeplx'
      && parseEnabled(readEnv('VARIABLE_ISLAND_DEEPLX_ENABLED', 'DEEPLX_ENABLED')),
    endpoint: normalizeEndpoint(pickString(
      readEnv('VARIABLE_ISLAND_DEEPLX_URL', 'DEEPLX_API_URL') ?? appConfig.deeplxUrl,
      DEFAULT_DEEPLX_URL
    )),
    token: (readEnv('VARIABLE_ISLAND_DEEPLX_TOKEN', 'DEEPLX_TOKEN') ?? appConfig.deeplxToken) || undefined,
    sourceLang: normalizeLanguageCode(pickString(
      readEnv('VARIABLE_ISLAND_DEEPLX_SOURCE_LANG', 'DEEPLX_SOURCE_LANG') ?? appConfig.deeplxSourceLang,
      DEFAULT_SOURCE_LANG
    )),
    targetLang: normalizeLanguageCode(pickString(
      readEnv('VARIABLE_ISLAND_DEEPLX_TARGET_LANG', 'DEEPLX_TARGET_LANG') ?? appConfig.deeplxTargetLang,
      DEFAULT_TARGET_LANG
    )),
    timeoutMs: parseTimeout(
      readEnv('VARIABLE_ISLAND_DEEPLX_TIMEOUT_MS', 'DEEPLX_TIMEOUT_MS') ?? configuredTimeout
    )
  };
}

function shouldTranslateDescription(description: string): boolean {
  return /[^\x00-\x7F]/.test(description);
}

function pickTranslatedText(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || undefined;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const text = pickTranslatedText(item);
      if (text) return text;
    }
    return undefined;
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of ['text', 'data', 'translation', 'translatedText', 'target', 'value']) {
      const text = pickTranslatedText(record[key]);
      if (text) return text;
    }
  }

  return undefined;
}

function readTranslatedText(payload: DeepLxResponse): string | undefined {
  return pickTranslatedText(payload.data)
    ?? pickTranslatedText(payload.text)
    ?? pickTranslatedText(payload.translatedText)
    ?? pickTranslatedText(payload.translation)
    ?? pickTranslatedText(payload.result)
    ?? pickTranslatedText(payload.translations);
}

export async function translateDescriptionWithDeepLX(description: string): Promise<string | undefined> {
  const text = description.trim();
  const config = readDeepLxConfig();
  if (!text || !config.enabled || !shouldTranslateDescription(text)) return undefined;

  const cacheKey = `${config.endpoint}|${config.token ?? ''}|${config.sourceLang}|${config.targetLang}|${text}`;
  const cached = translationCache.get(cacheKey);
  if (cached) return cached;

  const request = requestDeepLXTranslation(text, config);
  translationCache.set(cacheKey, request);
  const result = await request;
  if (!result) translationCache.delete(cacheKey);
  if (translationCache.size > 100) {
    const firstKey = translationCache.keys().next().value;
    if (firstKey) translationCache.delete(firstKey);
  }
  return result;
}

async function requestDeepLXTranslation(text: string, config: DeepLxConfig): Promise<string | undefined> {
  for (let attempt = 1; attempt <= MAX_TRANSLATION_ATTEMPTS; attempt += 1) {
    const result = await requestDeepLXTranslationAttempt(text, config);
    if (result || attempt === MAX_TRANSLATION_ATTEMPTS) return result;
    console.warn(`[deeplx] translation attempt ${attempt} failed; retrying`);
  }

  return undefined;
}

async function requestDeepLXTranslationAttempt(text: string, config: DeepLxConfig): Promise<string | undefined> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (config.token) {
    headers.Authorization = `Bearer ${config.token}`;
  }

  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        text,
        source_lang: config.sourceLang,
        target_lang: config.targetLang
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      console.warn(`[deeplx] translation failed with HTTP ${response.status}`);
      return undefined;
    }

    const payload = (await response.json()) as DeepLxResponse;
    const translatedText = readTranslatedText(payload);
    if (!translatedText) {
      console.warn(`[deeplx] translation response did not contain data: ${payload.message ?? 'empty data'}`);
      return undefined;
    }

    console.log(`[deeplx] translation ok (${config.sourceLang}->${config.targetLang})`);
    return translatedText;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[deeplx] translation unavailable: ${message}`);
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}
