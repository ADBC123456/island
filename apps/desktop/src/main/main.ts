import { app, type Event } from 'electron';
import { registerIpcHandlers } from './ipcHandlers.js';
import { startMouseEdgeWatcher, stopMouseEdgeWatcher } from './mouseEdgeWatcher.js';
import { registerShortcuts, unregisterShortcuts } from './shortcutManager.js';
import { WindowManager } from './windowManager.js';

let windowManager: WindowManager;

async function bootstrap(): Promise<void> {
  await app.whenReady();
  windowManager = new WindowManager();
  windowManager.create();
  registerIpcHandlers(windowManager);
  registerShortcuts(windowManager);
  startMouseEdgeWatcher(windowManager);

  if (process.env.VITE_DEV_SERVER_URL) {
    setTimeout(() => {
      console.log('[dev] showing island once for startup diagnostics');
      windowManager.showIsland();
    }, 1000);
  }

  app.on('activate', () => {
    windowManager.showIsland();
  });
}

app.on('will-quit', () => {
  stopMouseEdgeWatcher();
  unregisterShortcuts();
});

app.on('window-all-closed', (event: Event) => {
  event.preventDefault();
});

void bootstrap();
