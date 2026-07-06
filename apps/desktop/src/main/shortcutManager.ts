import { globalShortcut } from 'electron';
import { rememberActiveWindow } from './nativeBridge.js';
import { loadConfig } from './storageService.js';
import type { WindowManager } from './windowManager.js';

const FALLBACK_SHORTCUT = 'Alt+F';

async function showFromShortcut(windowManager: WindowManager, label: string): Promise<void> {
  console.log(`[shortcut] ${label} triggered`);
  await rememberActiveWindow();
  windowManager.showIsland();
}

export function registerShortcuts(windowManager: WindowManager): void {
  const config = loadConfig();
  const shortcut = config.shortcut;
  const handler = () => showFromShortcut(windowManager, shortcut);

  const ok = globalShortcut.register(shortcut, handler);

  if (!ok) {
    console.warn(`[shortcut] Failed to register ${shortcut}; trying ${FALLBACK_SHORTCUT}`);
    const fallbackOk = globalShortcut.register(
      FALLBACK_SHORTCUT,
      () => showFromShortcut(windowManager, FALLBACK_SHORTCUT)
    );
    if (!fallbackOk) {
      console.warn(`[shortcut] Failed to register fallback ${FALLBACK_SHORTCUT}`);
    } else {
      console.log(`[shortcut] Registered fallback ${FALLBACK_SHORTCUT}`);
    }
  } else {
    console.log(`[shortcut] Registered ${shortcut}`);
  }
}

export function unregisterShortcuts(): void {
  globalShortcut.unregisterAll();
}
