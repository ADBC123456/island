/// <reference types="vite/client" />

import type { CaseStyle, GenerateNameResult, InsertTextRequest, IslandStatus, NativeCommandResult, VariableType } from '@variable-island/shared';

declare global {
  interface Window {
    variableIsland: {
      generateNames(input: { description: string; caseStyle: CaseStyle; variableType: VariableType; translatedDescription?: string }): Promise<GenerateNameResult>;
      copyText(text: string): Promise<NativeCommandResult>;
      insertText(request: InsertTextRequest): Promise<NativeCommandResult>;
      onShow(callback: () => void): () => void;
      setIslandStatus(payload: { status: IslandStatus; width: number; height: number }): Promise<void>;
      setIgnoreMouseEvents(ignore: boolean): Promise<void>;
      hideIsland(): Promise<void>;
    };
  }
}
