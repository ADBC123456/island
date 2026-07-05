import { globalShortcut } from 'electron';
import { rememberActiveWindow } from './nativeBridge.js';
import type { WindowManager } from './windowManager.js';

export function registerShortcuts(windowManager: WindowManager): void {
  const ok = globalShortcut.register('Alt+F', async () => {
    await rememberActiveWindow();
    windowManager.showIsland();
  });

  if (!ok) {
    console.warn('Failed to register Alt+F shortcut');
  }
}

export function unregisterShortcuts(): void {
  globalShortcut.unregisterAll();
}
