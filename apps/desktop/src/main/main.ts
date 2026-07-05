import { app, type Event } from 'electron';
import { registerIpcHandlers } from './ipcHandlers.js';
import { registerShortcuts, unregisterShortcuts } from './shortcutManager.js';
import { WindowManager } from './windowManager.js';

let windowManager: WindowManager;

async function bootstrap(): Promise<void> {
  await app.whenReady();
  windowManager = new WindowManager();
  windowManager.create();
  registerIpcHandlers(windowManager);
  registerShortcuts(windowManager);

  app.on('activate', () => {
    windowManager.showIsland();
  });
}

app.on('will-quit', () => {
  unregisterShortcuts();
});

app.on('window-all-closed', (event: Event) => {
  event.preventDefault();
});

void bootstrap();
