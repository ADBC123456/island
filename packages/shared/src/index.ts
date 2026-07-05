export type CaseStyle = 'camelCase' | 'PascalCase' | 'Hungarian';

export type VariableType =
  | 'auto'
  | 'boolean'
  | 'string'
  | 'number'
  | 'array'
  | 'object'
  | 'function';

export type IslandStatus = 'hidden' | 'compact' | 'expanded' | 'success' | 'error';

export interface GenerateNameRequest {
  description: string;
  caseStyle: CaseStyle;
  variableType: VariableType;
  language?: string;
}

export interface NameCandidate {
  name: string;
  score: number;
  reason?: string;
}

export interface GenerateNameResult {
  candidates: NameCandidate[];
}

export interface InsertTextRequest {
  text: string;
}

export interface NativeCommandResult {
  success: boolean;
  method?: string;
  targetWindow?: string;
  errorCode?: string;
  message?: string;
}

export interface AppConfig {
  shortcut: string;
  defaultCaseStyle: CaseStyle;
  defaultVariableType: VariableType;
  insertMode: 'copy' | 'insert';
  restoreClipboardAfterInsert: boolean;
  theme: 'dark-glass';
  animationLevel: 'full' | 'reduced';
}
