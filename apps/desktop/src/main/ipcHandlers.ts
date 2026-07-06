import { ipcMain } from 'electron';
import { LocalNameGenerator } from '@variable-island/naming-core';
import type { GenerateNameRequest, InsertTextRequest, IslandStatus } from '@variable-island/shared';
import { copyText } from './clipboardService.js';
import { translateDescriptionWithDeepLX } from './deeplxService.js';
import { insertText } from './nativeBridge.js';
import type { WindowManager } from './windowManager.js';

export function registerIpcHandlers(windowManager: WindowManager): void {
  const generator = new LocalNameGenerator();

  ipcMain.handle('naming:generate', async (_event, request: GenerateNameRequest) => {
    const translatedDescription = request.translatedDescription
      ?? await translateDescriptionWithDeepLX(request.description);
    return generator.generate(
      translatedDescription
        ? { ...request, translatedDescription }
        : request
    );
  });

  ipcMain.handle('clipboard:copy', async (_event, text: string) => {
    return copyText(text);
  });

  ipcMain.handle('native:insert-text', async (_event, request: InsertTextRequest) => {
    windowManager.hideIsland();
    const result = await insertText(request.text);
    if (!result.success) copyText(request.text);
    return result;
  });

  ipcMain.handle('window:hide-island', async () => {
    windowManager.hideIsland();
  });

  ipcMain.handle(
    'window:set-island-status',
    async (_event, payload: IslandStatus | { status: IslandStatus; width: number; height: number }) => {
      if (typeof payload === 'string') {
        windowManager.setIslandStatus(payload);
      } else {
        windowManager.setIslandStatus(payload.status, { width: payload.width, height: payload.height });
      }
    }
  );

  // Renderer toggles click capture as the cursor enters/leaves the visible
  // island so the transparent window never blocks the apps behind it.
  ipcMain.handle('window:set-ignore-mouse-events', async (_event, ignore: boolean) => {
    windowManager.setIgnoreMouseEvents(ignore);
  });
}
