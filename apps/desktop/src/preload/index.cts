import { contextBridge, ipcRenderer } from 'electron';

type CaseStyle = 'camelCase' | 'PascalCase' | 'snake_case' | 'CONSTANT_CASE' | 'Hungarian';
type IslandStatus = 'hidden' | 'compact' | 'expanded' | 'success' | 'error';
type VariableType = 'auto' | 'boolean' | 'string' | 'number' | 'array' | 'object' | 'function';

interface InsertTextRequest {
  text: string;
}

contextBridge.exposeInMainWorld('variableIsland', {
  generateNames(input: { description: string; caseStyle: CaseStyle; variableType: VariableType; translatedDescription?: string }) {
    return ipcRenderer.invoke('naming:generate', input);
  },
  copyText(text: string) {
    return ipcRenderer.invoke('clipboard:copy', text);
  },
  insertText(request: InsertTextRequest) {
    return ipcRenderer.invoke('native:insert-text', request);
  },
  onShow(callback: () => void) {
    const listener = () => callback();
    ipcRenderer.on('island:show', listener);
    return () => ipcRenderer.removeListener('island:show', listener);
  },
  setIslandStatus(status: IslandStatus) {
    return ipcRenderer.invoke('window:set-island-status', status);
  },
  hideIsland() {
    return ipcRenderer.invoke('window:hide-island');
  }
});
