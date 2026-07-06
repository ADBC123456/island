import { loadConfig } from './storageService.js';

const DEFAULT_DEEPLX_URL = 'http://127.0.0.1:1188/translate';
const DEFAULT_TARGET_LANG = 'EN-US';
const DEFAULT_SOURCE_LANG = 'auto';
const DEFAULT_TIMEOUT_MS = 1800;

interface DeepLxResponse {
  code?: number;
  data?: unknown;
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
  return timeoutMs;
}

function readDeepLxConfig(): DeepLxConfig {
  const appConfig = loadConfig();

  return {
    enabled: appConfig.translationProvider === 'deeplx'
      && parseEnabled(readEnv('VARIABLE_ISLAND_DEEPLX_ENABLED', 'DEEPLX_ENABLED')),
    endpoint: readEnv('VARIABLE_ISLAND_DEEPLX_URL', 'DEEPLX_API_URL') ?? appConfig.deeplxUrl ?? DEFAULT_DEEPLX_URL,
    token: (readEnv('VARIABLE_ISLAND_DEEPLX_TOKEN', 'DEEPLX_TOKEN') ?? appConfig.deeplxToken) || undefined,
    sourceLang: readEnv('VARIABLE_ISLAND_DEEPLX_SOURCE_LANG', 'DEEPLX_SOURCE_LANG') ?? appConfig.deeplxSourceLang ?? DEFAULT_SOURCE_LANG,
    targetLang: readEnv('VARIABLE_ISLAND_DEEPLX_TARGET_LANG', 'DEEPLX_TARGET_LANG') ?? appConfig.deeplxTargetLang ?? DEFAULT_TARGET_LANG,
    timeoutMs: parseTimeout(
      readEnv('VARIABLE_ISLAND_DEEPLX_TIMEOUT_MS', 'DEEPLX_TIMEOUT_MS') ?? String(appConfig.deeplxTimeoutMs)
    )
  };
}

function shouldTranslateDescription(description: string): boolean {
  return /[^\x00-\x7F]/.test(description);
}

export async function translateDescriptionWithDeepLX(description: string): Promise<string | undefined> {
  const text = description.trim();
  const config = readDeepLxConfig();
  if (!text || !config.enabled || !shouldTranslateDescription(text)) return undefined;

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
    if (typeof payload.data !== 'string' || payload.data.trim().length === 0) {
      console.warn(`[deeplx] translation response did not contain data: ${payload.message ?? 'empty data'}`);
      return undefined;
    }

    return payload.data.trim();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[deeplx] translation unavailable: ${message}`);
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}
