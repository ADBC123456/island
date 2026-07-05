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
  animationLevel: 'full'
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
  return { ...defaultConfig, ...JSON.parse(fs.readFileSync(file, 'utf-8')) };
}
