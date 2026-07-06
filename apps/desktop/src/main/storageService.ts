import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import type { AppConfig } from '@variable-island/shared';

export const defaultConfig: AppConfig = {
  shortcut: 'Alt+Space',
  defaultCaseStyle: 'camelCase',
  defaultVariableType: 'auto',
  insertMode: 'copy',
  restoreClipboardAfterInsert: false,
  theme: 'dark-glass',
  animationLevel: 'full',
  translationProvider: 'deeplx',
  deeplxUrl: 'http://127.0.0.1:1188/translate',
  deeplxToken: '',
  deeplxSourceLang: 'auto',
  deeplxTargetLang: 'EN-US',
  deeplxTimeoutMs: 1800
};

export function getDataDir(): string {
  const dir = path.join(app.getPath('appData'), 'VariableIsland');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function loadConfig(): AppConfig {
  const file = path.join(getDataDir(), 'config.json');
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(defaultConfig, null, 2), 'utf-8');
    return defaultConfig;
  }
  const userConfig = JSON.parse(fs.readFileSync(file, 'utf-8')) as Partial<AppConfig>;
  const config = { ...defaultConfig, ...userConfig };
  if (Object.keys(defaultConfig).some((key) => !(key in userConfig))) {
    fs.writeFileSync(file, JSON.stringify(config, null, 2), 'utf-8');
  }
  return config;
}
