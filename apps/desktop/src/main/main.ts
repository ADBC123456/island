import { app, type Event } from 'electron';
import { registerIpcHandlers } from './ipcHandlers.js';
import { startMouseEdgeWatcher, stopMouseEdgeWatcher } from './mouseEdgeWatcher.js';
import { registerShortcuts, unregisterShortcuts } from './shortcutManager.js';
import { WindowManager } from './windowManager.js';

// One island per machine; a second launch just exits.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  bootstrapApp();
}

function bootstrapApp(): void {
  let windowManager: WindowManager | undefined;

  app.on('second-instance', () => {
    windowManager?.showIsland();
  });

  async function bootstrap(): Promise<void> {
    await app.whenReady();
    const manager = new WindowManager();
    windowManager = manager;
    manager.create();
    registerIpcHandlers(manager);
    registerShortcuts(manager);
    startMouseEdgeWatcher(manager);

    setTimeout(() => {
      console.log('[window] showing island once after startup');
      manager.showIsland();
    }, 1000);

    app.on('activate', () => {
      manager.showIsland();
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
}
