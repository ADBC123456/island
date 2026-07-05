import { globalShortcut } from 'electron';
import { rememberActiveWindow } from './nativeBridge.js';
import type { WindowManager } from './windowManager.js';

export function registerShortcuts(windowManager: WindowManager): void {
  const ok = globalShortcut.register('Alt+F', async () => {
    console.log('[shortcut] Alt+F triggered');
    await rememberActiveWindow();
    windowManager.showIsland();
  });

  if (!ok) {
    console.warn('[shortcut] Failed to register Alt+F shortcut');
  } else {
    console.log('[shortcut] Registered Alt+F');
  }
}

export function unregisterShortcuts(): void {
  globalShortcut.unregisterAll();
}
