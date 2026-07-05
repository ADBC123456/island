import { contextBridge, ipcRenderer } from 'electron';
import type { CaseStyle, InsertTextRequest, VariableType } from '@variable-island/shared';

contextBridge.exposeInMainWorld('variableIsland', {
  generateNames(input: { description: string; caseStyle: CaseStyle; variableType: VariableType }) {
    return ipcRenderer.invoke('naming:generate', input);
  },
  copyText(text: string) {
    return ipcRenderer.invoke('clipboard:copy', text);
  },
  insertText(request: InsertTextRequest) {
    return ipcRenderer.invoke('native:insert-text', request);
  },
  hideIsland() {
    return ipcRenderer.invoke('window:hide-island');
  }
});
