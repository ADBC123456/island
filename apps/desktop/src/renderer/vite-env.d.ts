/// <reference types="vite/client" />

import type { CaseStyle, GenerateNameResult, InsertTextRequest, IslandStatus, NativeCommandResult, VariableType } from '@variable-island/shared';

declare global {
  interface Window {
    variableIsland: {
      generateNames(input: { description: string; caseStyle: CaseStyle; variableType: VariableType }): Promise<GenerateNameResult>;
      copyText(text: string): Promise<NativeCommandResult>;
      insertText(request: InsertTextRequest): Promise<NativeCommandResult>;
      onShow(callback: () => void): () => void;
      setIslandStatus(status: IslandStatus): Promise<void>;
      hideIsland(): Promise<void>;
    };
  }
}
