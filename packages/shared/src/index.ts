export type CaseStyle = 'camelCase' | 'PascalCase' | 'snake_case' | 'CONSTANT_CASE' | 'Hungarian';

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
  translatedDescription?: string;
}

export interface NameCandidate {
  name: string;
  score: number;
  reason?: string;
}

export interface GenerateNameResult {
  candidates: NameCandidate[];
  translatedDescription?: string;
  translationProvider?: 'deeplx' | 'none';
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
  translationProvider: 'deeplx' | 'disabled';
  deeplxUrl: string;
  deeplxToken: string;
  deeplxSourceLang: string;
  deeplxTargetLang: string;
  deeplxTimeoutMs: number;
}
