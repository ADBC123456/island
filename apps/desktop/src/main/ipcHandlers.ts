import { ipcMain } from 'electron';
import { LocalNameGenerator } from '@variable-island/naming-core';
import type { GenerateNameRequest, InsertTextRequest } from '@variable-island/shared';
import { copyText } from './clipboardService.js';
import { insertText } from './nativeBridge.js';
import type { WindowManager } from './windowManager.js';

export function registerIpcHandlers(windowManager: WindowManager): void {
  const generator = new LocalNameGenerator();

  ipcMain.handle('naming:generate', async (_event, request: GenerateNameRequest) => {
    return generator.generate(request);
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
}
