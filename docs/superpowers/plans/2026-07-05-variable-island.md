# Variable Island Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Windows Dynamic Island style variable-name generator with polished Electron/React animations and a C# native helper for reliable auto-insertion.

**Architecture:** Use a pnpm monorepo with an Electron desktop app, a shared TypeScript naming-core package, shared type definitions, static dictionary resources, and a C# helper app. The renderer owns UI state and animations, Electron main owns windows/shortcuts/IPC/storage, and the C# helper owns foreground-window tracking and paste insertion through Windows APIs.

**Tech Stack:** Electron, React, TypeScript, Vite, Framer Motion, Vitest, Testing Library, pnpm workspaces, .NET C# console app, Windows Win32 APIs.

---

## File Structure

Create these files and directories:

```text
apps/desktop/
  package.json
  index.html
  tsconfig.json
  tsconfig.node.json
  vite.renderer.config.ts
  src/main/main.ts
  src/main/windowManager.ts
  src/main/shortcutManager.ts
  src/main/ipcHandlers.ts
  src/main/clipboardService.ts
  src/main/nativeBridge.ts
  src/main/storageService.ts
  src/preload/index.ts
  src/renderer/main.tsx
  src/renderer/App.tsx
  src/renderer/components/IslandShell.tsx
  src/renderer/components/IslandInput.tsx
  src/renderer/components/NamingRuleTabs.tsx
  src/renderer/components/VariableTypeSelector.tsx
  src/renderer/components/CandidateList.tsx
  src/renderer/components/CandidateItem.tsx
  src/renderer/components/StatusToast.tsx
  src/renderer/components/ShortcutHints.tsx
  src/renderer/hooks/useIslandState.ts
  src/renderer/hooks/useKeyboardNavigation.ts
  src/renderer/hooks/useNamingPreview.ts
  src/renderer/styles/island.css
  src/renderer/vite-env.d.ts
apps/native-helper/
  NativeHelper.csproj
  Program.cs
  WindowTracker.cs
  ClipboardService.cs
  InputSender.cs
  JsonResult.cs
packages/shared/
  package.json
  tsconfig.json
  src/index.ts
packages/naming-core/
  package.json
  tsconfig.json
  src/index.ts
  src/types.ts
  src/caseStyle.ts
  src/dictionary.ts
  src/typeInference.ts
  src/localNameGenerator.ts
  src/aiNameGenerator.ts
  src/hybridNameGenerator.ts
  src/__tests__/caseStyle.test.ts
  src/__tests__/localNameGenerator.test.ts
resources/dictionaries/base.zh-cn.json
resources/default-config.json
package.json
pnpm-workspace.yaml
tsconfig.base.json
.gitignore
```

---

### Task 1: Create monorepo foundation

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `resources/default-config.json`
- Create: `resources/dictionaries/base.zh-cn.json`

- [ ] **Step 1: Create root package and workspace files**

Create `package.json`:

```json
{
  "name": "variable-island",
  "version": "0.1.0",
  "private": true,
  "description": "Windows Dynamic Island style variable name generator.",
  "scripts": {
    "dev": "pnpm --filter @variable-island/desktop dev",
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "typecheck": "pnpm -r typecheck"
  },
  "devDependencies": {
    "@types/node": "^20.14.10",
    "typescript": "^5.5.3"
  }
}
```

Create `pnpm-workspace.yaml`:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

Create `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "baseUrl": "."
  }
}
```

Create `.gitignore`:

```gitignore
node_modules/
dist/
out/
.vite/
*.log
.DS_Store
.vs/
bin/
obj/
coverage/
```

- [ ] **Step 2: Create initial resource files**

Create `resources/default-config.json`:

```json
{
  "shortcut": "Alt+Space",
  "defaultCaseStyle": "camelCase",
  "defaultVariableType": "auto",
  "insertMode": "copy",
  "restoreClipboardAfterInsert": false,
  "theme": "dark-glass",
  "animationLevel": "full"
}
```

Create `resources/dictionaries/base.zh-cn.json`:

```json
{
  "是否": ["is", "should"],
  "显示": ["show", "visible"],
  "隐藏": ["hidden", "hide"],
  "用户": ["user"],
  "弹窗": ["modal", "dialog"],
  "名称": ["name"],
  "名字": ["name"],
  "商品": ["product"],
  "列表": ["list", "items"],
  "数据": ["data"],
  "状态": ["status", "state"],
  "登录": ["login", "loggedIn", "auth"],
  "加载": ["loading", "load"],
  "配置": ["config", "settings"],
  "请求": ["request"],
  "响应": ["response"],
  "参数": ["params"],
  "数量": ["count"],
  "索引": ["index"],
  "错误": ["error"],
  "成功": ["success"]
}
```

- [ ] **Step 3: Install root dependencies**

Run:

```bash
pnpm install
```

Expected: install completes and creates `pnpm-lock.yaml`.

- [ ] **Step 4: Verify root scripts are discoverable**

Run:

```bash
pnpm -r --if-present typecheck
```

Expected: command exits successfully because no workspace packages exist yet.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-workspace.yaml tsconfig.base.json .gitignore resources/default-config.json resources/dictionaries/base.zh-cn.json pnpm-lock.yaml
git commit -m "chore: create variable island monorepo"
```

If the directory is not a git repository, skip the commit command and continue.

---

### Task 2: Add shared TypeScript types

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`

- [ ] **Step 1: Create package metadata**

Create `packages/shared/package.json`:

```json
{
  "name": "@variable-island/shared",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "echo shared has no tests"
  }
}
```

Create `packages/shared/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "emitDeclarationOnly": false,
    "module": "ESNext"
  },
  "include": ["src"]
}
```

- [ ] **Step 2: Define shared app contracts**

Create `packages/shared/src/index.ts`:

```ts
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
```

- [ ] **Step 3: Typecheck shared package**

Run:

```bash
pnpm --filter @variable-island/shared typecheck
```

Expected: PASS with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add packages/shared
git commit -m "feat: add shared app contracts"
```

---

### Task 3: Implement naming-core with tests

**Files:**
- Create: `packages/naming-core/package.json`
- Create: `packages/naming-core/tsconfig.json`
- Create: `packages/naming-core/src/types.ts`
- Create: `packages/naming-core/src/caseStyle.ts`
- Create: `packages/naming-core/src/dictionary.ts`
- Create: `packages/naming-core/src/typeInference.ts`
- Create: `packages/naming-core/src/localNameGenerator.ts`
- Create: `packages/naming-core/src/aiNameGenerator.ts`
- Create: `packages/naming-core/src/hybridNameGenerator.ts`
- Create: `packages/naming-core/src/index.ts`
- Create: `packages/naming-core/src/__tests__/caseStyle.test.ts`
- Create: `packages/naming-core/src/__tests__/localNameGenerator.test.ts`

- [ ] **Step 1: Create package metadata**

Create `packages/naming-core/package.json`:

```json
{
  "name": "@variable-island/naming-core",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@variable-island/shared": "workspace:*"
  },
  "devDependencies": {
    "vitest": "^2.0.5"
  }
}
```

Create `packages/naming-core/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "module": "ESNext",
    "types": ["vitest/globals"]
  },
  "include": ["src"]
}
```

- [ ] **Step 2: Write failing tests**

Create `packages/naming-core/src/__tests__/caseStyle.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { applyCaseStyle } from '../caseStyle';

describe('applyCaseStyle', () => {
  it('formats camelCase', () => {
    expect(applyCaseStyle(['user', 'modal', 'visible'], 'camelCase', 'auto')).toBe('userModalVisible');
  });

  it('formats PascalCase', () => {
    expect(applyCaseStyle(['user', 'modal', 'visible'], 'PascalCase', 'auto')).toBe('UserModalVisible');
  });

  it('formats Hungarian boolean', () => {
    expect(applyCaseStyle(['user', 'modal', 'visible'], 'Hungarian', 'boolean')).toBe('bUserModalVisible');
  });
});
```

Create `packages/naming-core/src/__tests__/localNameGenerator.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { LocalNameGenerator } from '../localNameGenerator';

describe('LocalNameGenerator', () => {
  it('generates boolean modal candidates from Chinese description', async () => {
    const generator = new LocalNameGenerator();
    const result = await generator.generate({
      description: '是否显示用户弹窗',
      caseStyle: 'camelCase',
      variableType: 'auto'
    });

    expect(result.candidates.map((candidate) => candidate.name)).toContain('isUserModalVisible');
    expect(result.candidates[0]?.score).toBeGreaterThan(0.5);
  });

  it('generates PascalCase for product list', async () => {
    const generator = new LocalNameGenerator();
    const result = await generator.generate({
      description: '商品列表',
      caseStyle: 'PascalCase',
      variableType: 'array'
    });

    expect(result.candidates.map((candidate) => candidate.name)).toContain('ProductList');
  });
});
```

- [ ] **Step 3: Run tests and verify they fail**

Run:

```bash
pnpm install
pnpm --filter @variable-island/naming-core test
```

Expected: FAIL because implementation files do not exist.

- [ ] **Step 4: Implement naming-core**

Create `packages/naming-core/src/types.ts`:

```ts
import type { GenerateNameRequest, GenerateNameResult } from '@variable-island/shared';

export interface NameGenerator {
  generate(request: GenerateNameRequest): Promise<GenerateNameResult>;
}
```

Create `packages/naming-core/src/caseStyle.ts`:

```ts
import type { CaseStyle, VariableType } from '@variable-island/shared';

const hungarianPrefixes: Record<Exclude<VariableType, 'auto'>, string> = {
  boolean: 'b',
  string: 'str',
  number: 'num',
  array: 'arr',
  object: 'obj',
  function: 'fn'
};

function capitalize(value: string): string {
  if (value.length === 0) return value;
  return value[0]!.toUpperCase() + value.slice(1);
}

function normalizeToken(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, '').trim();
}

export function applyCaseStyle(words: string[], caseStyle: CaseStyle, variableType: VariableType): string {
  const cleanWords = words.map(normalizeToken).filter(Boolean);
  if (cleanWords.length === 0) return '';

  if (caseStyle === 'PascalCase') {
    return cleanWords.map(capitalize).join('');
  }

  if (caseStyle === 'Hungarian') {
    const prefix = variableType === 'auto' ? 'v' : hungarianPrefixes[variableType];
    return `${prefix}${cleanWords.map(capitalize).join('')}`;
  }

  const [first, ...rest] = cleanWords;
  return `${first!.toLowerCase()}${rest.map(capitalize).join('')}`;
}
```

Create `packages/naming-core/src/dictionary.ts`:

```ts
export const builtInDictionary: Record<string, string[]> = {
  是否: ['is', 'should'],
  显示: ['show', 'visible'],
  隐藏: ['hidden', 'hide'],
  用户: ['user'],
  弹窗: ['modal', 'dialog'],
  名称: ['name'],
  名字: ['name'],
  商品: ['product'],
  列表: ['list', 'items'],
  数据: ['data'],
  状态: ['status', 'state'],
  登录: ['login', 'loggedIn', 'auth'],
  加载: ['loading', 'load'],
  配置: ['config', 'settings'],
  请求: ['request'],
  响应: ['response'],
  参数: ['params'],
  数量: ['count'],
  索引: ['index'],
  错误: ['error'],
  成功: ['success']
};

export function translateDescription(description: string): string[][] {
  const hits: string[][] = [];
  for (const [source, translations] of Object.entries(builtInDictionary)) {
    if (description.includes(source)) {
      hits.push(translations);
    }
  }
  return hits;
}
```

Create `packages/naming-core/src/typeInference.ts`:

```ts
import type { VariableType } from '@variable-island/shared';

export function inferVariableType(description: string, requested: VariableType): VariableType {
  if (requested !== 'auto') return requested;
  if (/是否|有没有|能否|可否|is|has|should/i.test(description)) return 'boolean';
  if (/列表|数组|集合|items|list|array/i.test(description)) return 'array';
  if (/数量|个数|count|num|number/i.test(description)) return 'number';
  if (/方法|函数|回调|function|handler/i.test(description)) return 'function';
  if (/名称|名字|标题|文本|string|text|name/i.test(description)) return 'string';
  return 'object';
}
```

Create `packages/naming-core/src/localNameGenerator.ts`:

```ts
import type { GenerateNameRequest, GenerateNameResult, NameCandidate } from '@variable-island/shared';
import { applyCaseStyle } from './caseStyle';
import { translateDescription } from './dictionary';
import { inferVariableType } from './typeInference';
import type { NameGenerator } from './types';

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function pickPrimaryWords(groups: string[][]): string[] {
  return groups.map((group) => group[0]!).filter(Boolean);
}

function makeBooleanAlternatives(words: string[]): string[][] {
  const withoutIsOrShould = words.filter((word) => word !== 'is' && word !== 'should' && word !== 'show');
  const visibleWords = withoutIsOrShould.includes('visible')
    ? withoutIsOrShould
    : [...withoutIsOrShould, 'visible'];
  return [
    ['is', ...visibleWords.filter((word) => word !== 'is')],
    ['should', 'show', ...withoutIsOrShould.filter((word) => word !== 'visible')]
  ];
}

function sanitizeEnglishFallback(description: string): string[] {
  const ascii = description
    .replace(/[^a-zA-Z0-9\s_-]/g, ' ')
    .split(/[\s_-]+/)
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
  return ascii.length > 0 ? ascii : ['value'];
}

export class LocalNameGenerator implements NameGenerator {
  async generate(request: GenerateNameRequest): Promise<GenerateNameResult> {
    const variableType = inferVariableType(request.description, request.variableType);
    const translatedGroups = translateDescription(request.description);
    const primaryWords = translatedGroups.length > 0
      ? pickPrimaryWords(translatedGroups)
      : sanitizeEnglishFallback(request.description);

    const wordSets: string[][] = [primaryWords];
    if (variableType === 'boolean') {
      wordSets.unshift(...makeBooleanAlternatives(primaryWords));
    }
    if (variableType === 'array' && !primaryWords.includes('list') && !primaryWords.includes('items')) {
      wordSets.unshift([...primaryWords, 'list']);
    }

    const candidates: NameCandidate[] = unique(
      wordSets
        .map((words) => applyCaseStyle(words, request.caseStyle, variableType))
        .filter(Boolean)
    ).map((name, index) => ({
      name,
      score: Math.max(0.95 - index * 0.08, 0.55),
      reason: variableType === 'boolean' ? 'boolean intent detected' : 'local dictionary match'
    }));

    return { candidates };
  }
}
```

Create `packages/naming-core/src/aiNameGenerator.ts`:

```ts
import type { GenerateNameRequest, GenerateNameResult } from '@variable-island/shared';
import type { NameGenerator } from './types';

export class AiNameGenerator implements NameGenerator {
  async generate(_request: GenerateNameRequest): Promise<GenerateNameResult> {
    return { candidates: [] };
  }
}
```

Create `packages/naming-core/src/hybridNameGenerator.ts`:

```ts
import type { GenerateNameRequest, GenerateNameResult } from '@variable-island/shared';
import { AiNameGenerator } from './aiNameGenerator';
import { LocalNameGenerator } from './localNameGenerator';
import type { NameGenerator } from './types';

export class HybridNameGenerator implements NameGenerator {
  constructor(
    private readonly local: NameGenerator = new LocalNameGenerator(),
    private readonly ai: NameGenerator = new AiNameGenerator()
  ) {}

  async generate(request: GenerateNameRequest): Promise<GenerateNameResult> {
    const localResult = await this.local.generate(request);
    if (localResult.candidates.length >= 3) return localResult;
    const aiResult = await this.ai.generate(request);
    return { candidates: [...localResult.candidates, ...aiResult.candidates] };
  }
}
```

Create `packages/naming-core/src/index.ts`:

```ts
export type { NameGenerator } from './types';
export { applyCaseStyle } from './caseStyle';
export { LocalNameGenerator } from './localNameGenerator';
export { AiNameGenerator } from './aiNameGenerator';
export { HybridNameGenerator } from './hybridNameGenerator';
export { inferVariableType } from './typeInference';
```

- [ ] **Step 5: Run tests**

Run:

```bash
pnpm --filter @variable-island/naming-core test
pnpm --filter @variable-island/naming-core typecheck
```

Expected: all tests pass and typecheck has no errors.

- [ ] **Step 6: Commit**

```bash
git add packages/naming-core package.json pnpm-lock.yaml
git commit -m "feat: add offline naming core"
```

---

### Task 4: Scaffold Electron desktop app

**Files:**
- Create: `apps/desktop/package.json`
- Create: `apps/desktop/tsconfig.json`
- Create: `apps/desktop/tsconfig.node.json`
- Create: `apps/desktop/vite.renderer.config.ts`
- Create: `apps/desktop/index.html`
- Create: `apps/desktop/src/preload/index.ts`
- Create: `apps/desktop/src/renderer/vite-env.d.ts`
- Create: `apps/desktop/src/renderer/main.tsx`
- Create: `apps/desktop/src/renderer/App.tsx`

- [ ] **Step 1: Create package and configs**

Create `apps/desktop/package.json`:

```json
{
  "name": "@variable-island/desktop",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "dist/main/main.js",
  "scripts": {
    "dev": "concurrently -k \"vite --config vite.renderer.config.ts --host 127.0.0.1\" \"wait-on tcp:5173 && tsx src/main/main.ts\"",
    "build": "tsc -p tsconfig.node.json && vite build --config vite.renderer.config.ts",
    "typecheck": "tsc -p tsconfig.json --noEmit && tsc -p tsconfig.node.json --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@variable-island/naming-core": "workspace:*",
    "@variable-island/shared": "workspace:*",
    "@vitejs/plugin-react": "^4.3.1",
    "electron": "^31.2.1",
    "framer-motion": "^11.3.8",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/react": "^16.0.0",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "concurrently": "^8.2.2",
    "tsx": "^4.16.2",
    "vite": "^5.3.4",
    "vitest": "^2.0.5",
    "wait-on": "^7.2.0"
  }
}
```

Create `apps/desktop/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client", "vitest/globals"]
  },
  "include": ["src/renderer", "src/preload"]
}
```

Create `apps/desktop/tsconfig.node.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "types": ["node"]
  },
  "include": ["src/main", "src/preload"]
}
```

Create `apps/desktop/vite.renderer.config.ts`:

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true
  },
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: false
  }
});
```

- [ ] **Step 2: Create renderer entry**

Create `apps/desktop/index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Variable Island</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/renderer/main.tsx"></script>
  </body>
</html>
```

Create `apps/desktop/src/renderer/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />

import type { CaseStyle, GenerateNameResult, InsertTextRequest, NativeCommandResult, VariableType } from '@variable-island/shared';

declare global {
  interface Window {
    variableIsland: {
      generateNames(input: { description: string; caseStyle: CaseStyle; variableType: VariableType }): Promise<GenerateNameResult>;
      copyText(text: string): Promise<NativeCommandResult>;
      insertText(request: InsertTextRequest): Promise<NativeCommandResult>;
      hideIsland(): Promise<void>;
    };
  }
}
```

Create `apps/desktop/src/renderer/main.tsx`:

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/island.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

Create `apps/desktop/src/renderer/App.tsx`:

```tsx
export function App() {
  return <div className="app-root">Variable Island</div>;
}
```

Create `apps/desktop/src/preload/index.ts`:

```ts
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
```

- [ ] **Step 3: Install dependencies and typecheck**

Run:

```bash
pnpm install
pnpm --filter @variable-island/desktop typecheck
```

Expected: no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add apps/desktop package.json pnpm-lock.yaml
git commit -m "feat: scaffold electron react desktop app"
```

---

### Task 5: Implement Electron main window, shortcut, IPC, and clipboard

**Files:**
- Create: `apps/desktop/src/main/main.ts`
- Create: `apps/desktop/src/main/windowManager.ts`
- Create: `apps/desktop/src/main/shortcutManager.ts`
- Create: `apps/desktop/src/main/ipcHandlers.ts`
- Create: `apps/desktop/src/main/clipboardService.ts`
- Create: `apps/desktop/src/main/nativeBridge.ts`
- Create: `apps/desktop/src/main/storageService.ts`

- [ ] **Step 1: Implement window manager**

Create `apps/desktop/src/main/windowManager.ts`:

```ts
import { BrowserWindow, screen } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class WindowManager {
  private window: BrowserWindow | null = null;

  create(): BrowserWindow {
    this.window = new BrowserWindow({
      width: 760,
      height: 380,
      frame: false,
      transparent: true,
      resizable: false,
      movable: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      show: false,
      hasShadow: false,
      backgroundColor: '#00000000',
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    this.window.setAlwaysOnTop(true, 'screen-saver');
    this.positionTopCenter();

    if (process.env.VITE_DEV_SERVER_URL) {
      void this.window.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else {
      void this.window.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    return this.window;
  }

  getWindow(): BrowserWindow {
    if (!this.window) throw new Error('Island window has not been created');
    return this.window;
  }

  showIsland(): void {
    const win = this.getWindow();
    this.positionTopCenter();
    win.show();
    win.focus();
    win.webContents.send('island:show');
  }

  hideIsland(): void {
    if (this.window) this.window.hide();
  }

  positionTopCenter(): void {
    if (!this.window) return;
    const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
    const bounds = display.workArea;
    const winBounds = this.window.getBounds();
    const x = Math.round(bounds.x + (bounds.width - winBounds.width) / 2);
    const y = Math.round(bounds.y + 12);
    this.window.setPosition(x, y, false);
  }
}
```

- [ ] **Step 2: Implement services**

Create `apps/desktop/src/main/clipboardService.ts`:

```ts
import { clipboard } from 'electron';
import type { NativeCommandResult } from '@variable-island/shared';

export function copyText(text: string): NativeCommandResult {
  clipboard.writeText(text);
  return { success: true, method: 'electron-clipboard' };
}
```

Create `apps/desktop/src/main/storageService.ts`:

```ts
import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import type { AppConfig } from '@variable-island/shared';

export const defaultConfig: AppConfig = {
  shortcut: 'Alt+Space',
  defaultCaseStyle: 'camelCase',
  defaultVariableType: 'auto',
  insertMode: 'copy',
  restoreClipboardAfterInsert: false,
  theme: 'dark-glass',
  animationLevel: 'full'
};

export function getDataDir(): string {
  const dir = path.join(app.getPath('appData'), 'VariableIsland');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function loadConfig(): AppConfig {
  const file = path.join(getDataDir(), 'config.json');
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(defaultConfig, null, 2), 'utf-8');
    return defaultConfig;
  }
  return { ...defaultConfig, ...JSON.parse(fs.readFileSync(file, 'utf-8')) };
}
```

Create `apps/desktop/src/main/nativeBridge.ts`:

```ts
import { execFile } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NativeCommandResult } from '@variable-island/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function helperPath(): string {
  return path.resolve(__dirname, '../../../native-helper/bin/Release/net8.0-windows/NativeHelper.exe');
}

function runHelper(args: string[]): Promise<NativeCommandResult> {
  return new Promise((resolve) => {
    execFile(helperPath(), args, { windowsHide: true }, (error, stdout) => {
      if (error) {
        resolve({ success: false, errorCode: 'HELPER_FAILED', message: error.message });
        return;
      }
      try {
        resolve(JSON.parse(stdout.trim()) as NativeCommandResult);
      } catch {
        resolve({ success: false, errorCode: 'HELPER_BAD_OUTPUT', message: stdout.trim() });
      }
    });
  });
}

export function rememberActiveWindow(): Promise<NativeCommandResult> {
  return runHelper(['remember']);
}

export function insertText(text: string): Promise<NativeCommandResult> {
  return runHelper(['insert', text]);
}
```

- [ ] **Step 3: Implement shortcut and IPC**

Create `apps/desktop/src/main/shortcutManager.ts`:

```ts
import { globalShortcut } from 'electron';
import { rememberActiveWindow } from './nativeBridge';
import type { WindowManager } from './windowManager';

export function registerShortcuts(windowManager: WindowManager): void {
  const ok = globalShortcut.register('Alt+Space', async () => {
    await rememberActiveWindow();
    windowManager.showIsland();
  });

  if (!ok) {
    console.warn('Failed to register Alt+Space shortcut');
  }
}

export function unregisterShortcuts(): void {
  globalShortcut.unregisterAll();
}
```

Create `apps/desktop/src/main/ipcHandlers.ts`:

```ts
import { ipcMain } from 'electron';
import { LocalNameGenerator } from '@variable-island/naming-core';
import type { GenerateNameRequest, InsertTextRequest } from '@variable-island/shared';
import { copyText } from './clipboardService';
import { insertText } from './nativeBridge';
import type { WindowManager } from './windowManager';

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
```

Create `apps/desktop/src/main/main.ts`:

```ts
import { app } from 'electron';
import { registerIpcHandlers } from './ipcHandlers';
import { registerShortcuts, unregisterShortcuts } from './shortcutManager';
import { WindowManager } from './windowManager';

let windowManager: WindowManager;

async function bootstrap(): Promise<void> {
  await app.whenReady();
  windowManager = new WindowManager();
  windowManager.create();
  registerIpcHandlers(windowManager);
  registerShortcuts(windowManager);

  app.on('activate', () => {
    windowManager.showIsland();
  });
}

app.on('will-quit', () => {
  unregisterShortcuts();
});

app.on('window-all-closed', (event) => {
  event.preventDefault();
});

void bootstrap();
```

- [ ] **Step 4: Typecheck desktop app**

Run:

```bash
pnpm --filter @variable-island/desktop typecheck
```

Expected: no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/src/main apps/desktop/src/preload
git commit -m "feat: add electron window shortcut and ipc services"
```

---

### Task 6: Build animated island renderer UI

**Files:**
- Modify: `apps/desktop/src/renderer/App.tsx`
- Create: all files under `apps/desktop/src/renderer/components/`
- Create: all files under `apps/desktop/src/renderer/hooks/`
- Create: `apps/desktop/src/renderer/styles/island.css`

- [ ] **Step 1: Implement state hook**

Create `apps/desktop/src/renderer/hooks/useIslandState.ts`:

```ts
import { useMemo, useState } from 'react';
import type { CaseStyle, IslandStatus, NameCandidate, VariableType } from '@variable-island/shared';

export interface IslandState {
  status: IslandStatus;
  description: string;
  caseStyle: CaseStyle;
  variableType: VariableType;
  candidates: NameCandidate[];
  selectedIndex: number;
  message: string;
}

export function useIslandState() {
  const [state, setState] = useState<IslandState>({
    status: 'compact',
    description: '',
    caseStyle: 'camelCase',
    variableType: 'auto',
    candidates: [],
    selectedIndex: 0,
    message: ''
  });

  const selectedCandidate = useMemo(
    () => state.candidates[state.selectedIndex],
    [state.candidates, state.selectedIndex]
  );

  return { state, setState, selectedCandidate };
}
```

Create `apps/desktop/src/renderer/hooks/useNamingPreview.ts`:

```ts
import { useEffect } from 'react';
import type { IslandState } from './useIslandState';

export function useNamingPreview(state: IslandState, setState: React.Dispatch<React.SetStateAction<IslandState>>) {
  useEffect(() => {
    let cancelled = false;
    const description = state.description.trim();
    if (!description) {
      setState((current) => ({ ...current, status: 'compact', candidates: [], selectedIndex: 0 }));
      return;
    }

    const timer = window.setTimeout(async () => {
      const result = await window.variableIsland.generateNames({
        description,
        caseStyle: state.caseStyle,
        variableType: state.variableType
      });
      if (!cancelled) {
        setState((current) => ({ ...current, status: 'expanded', candidates: result.candidates, selectedIndex: 0 }));
      }
    }, 80);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [state.description, state.caseStyle, state.variableType, setState]);
}
```

Create `apps/desktop/src/renderer/hooks/useKeyboardNavigation.ts`:

```ts
import { useEffect } from 'react';
import type { CaseStyle } from '@variable-island/shared';
import type { IslandState } from './useIslandState';

const rules: CaseStyle[] = ['camelCase', 'PascalCase', 'Hungarian'];

export function useKeyboardNavigation(
  state: IslandState,
  setState: React.Dispatch<React.SetStateAction<IslandState>>,
  onCopy: () => void,
  onInsert: () => void
) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        void window.variableIsland.hideIsland();
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setState((current) => ({
          ...current,
          selectedIndex: Math.min(current.selectedIndex + 1, Math.max(current.candidates.length - 1, 0))
        }));
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setState((current) => ({ ...current, selectedIndex: Math.max(current.selectedIndex - 1, 0) }));
      }
      if (event.key === 'Tab') {
        event.preventDefault();
        const index = rules.indexOf(state.caseStyle);
        setState((current) => ({ ...current, caseStyle: rules[(index + 1) % rules.length]! }));
      }
      if (event.key === 'Enter' && event.ctrlKey) {
        event.preventDefault();
        onInsert();
      } else if (event.key === 'Enter') {
        event.preventDefault();
        onCopy();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [state.caseStyle, setState, onCopy, onInsert]);
}
```

- [ ] **Step 2: Implement components**

Create `apps/desktop/src/renderer/components/IslandInput.tsx`:

```tsx
import { useEffect, useRef } from 'react';

interface Props {
  value: string;
  onChange(value: string): void;
}

export function IslandInput({ value, onChange }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.focus(), []);

  return (
    <input
      ref={ref}
      className="island-input"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="描述变量用途..."
      spellCheck={false}
    />
  );
}
```

Create `apps/desktop/src/renderer/components/NamingRuleTabs.tsx`:

```tsx
import { motion } from 'framer-motion';
import type { CaseStyle } from '@variable-island/shared';

const rules: CaseStyle[] = ['camelCase', 'PascalCase', 'Hungarian'];

interface Props {
  value: CaseStyle;
  onChange(value: CaseStyle): void;
}

export function NamingRuleTabs({ value, onChange }: Props) {
  return (
    <div className="rule-tabs">
      {rules.map((rule) => (
        <button key={rule} className="rule-tab" onClick={() => onChange(rule)}>
          {value === rule && <motion.span layoutId="active-rule" className="rule-tab-active" />}
          <span className="rule-tab-label">{rule}</span>
        </button>
      ))}
    </div>
  );
}
```

Create `apps/desktop/src/renderer/components/VariableTypeSelector.tsx`:

```tsx
import type { VariableType } from '@variable-island/shared';

const types: VariableType[] = ['auto', 'boolean', 'string', 'number', 'array', 'object', 'function'];

interface Props {
  value: VariableType;
  onChange(value: VariableType): void;
}

export function VariableTypeSelector({ value, onChange }: Props) {
  return (
    <select className="type-select" value={value} onChange={(event) => onChange(event.target.value as VariableType)}>
      {types.map((type) => (
        <option key={type} value={type}>{type}</option>
      ))}
    </select>
  );
}
```

Create `apps/desktop/src/renderer/components/CandidateItem.tsx`:

```tsx
import { motion } from 'framer-motion';
import type { NameCandidate } from '@variable-island/shared';

interface Props {
  candidate: NameCandidate;
  selected: boolean;
  index: number;
  onSelect(): void;
}

export function CandidateItem({ candidate, selected, index, onSelect }: Props) {
  return (
    <motion.button
      className={selected ? 'candidate selected' : 'candidate'}
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.035 }}
      onClick={onSelect}
    >
      <span className="candidate-name">{candidate.name}</span>
      {index === 0 && <span className="candidate-badge">推荐</span>}
    </motion.button>
  );
}
```

Create `apps/desktop/src/renderer/components/CandidateList.tsx`:

```tsx
import type { NameCandidate } from '@variable-island/shared';
import { CandidateItem } from './CandidateItem';

interface Props {
  candidates: NameCandidate[];
  selectedIndex: number;
  onSelect(index: number): void;
}

export function CandidateList({ candidates, selectedIndex, onSelect }: Props) {
  if (candidates.length === 0) {
    return <div className="empty-candidates">输入描述后生成变量名</div>;
  }

  return (
    <div className="candidate-list">
      {candidates.map((candidate, index) => (
        <CandidateItem
          key={`${candidate.name}-${index}`}
          candidate={candidate}
          selected={selectedIndex === index}
          index={index}
          onSelect={() => onSelect(index)}
        />
      ))}
    </div>
  );
}
```

Create `apps/desktop/src/renderer/components/StatusToast.tsx`:

```tsx
interface Props {
  message: string;
  kind: 'success' | 'error';
}

export function StatusToast({ message, kind }: Props) {
  return <div className={`status-toast ${kind}`}>{message}</div>;
}
```

Create `apps/desktop/src/renderer/components/ShortcutHints.tsx`:

```tsx
export function ShortcutHints() {
  return (
    <div className="shortcut-hints">
      <span>Enter 复制</span>
      <span>Ctrl+Enter 插入</span>
      <span>↑↓ 选择</span>
      <span>Tab 切换</span>
      <span>Esc 关闭</span>
    </div>
  );
}
```

Create `apps/desktop/src/renderer/components/IslandShell.tsx`:

```tsx
import { AnimatePresence, motion } from 'framer-motion';
import type { IslandStatus } from '@variable-island/shared';
import { IslandInput } from './IslandInput';
import { NamingRuleTabs } from './NamingRuleTabs';
import { VariableTypeSelector } from './VariableTypeSelector';
import { CandidateList } from './CandidateList';
import { ShortcutHints } from './ShortcutHints';
import { StatusToast } from './StatusToast';
import type { IslandState } from '../hooks/useIslandState';

interface Props {
  state: IslandState;
  setState: React.Dispatch<React.SetStateAction<IslandState>>;
}

function dimensions(status: IslandStatus) {
  if (status === 'expanded') return { width: 640, minHeight: 246, borderRadius: 28 };
  if (status === 'success' || status === 'error') return { width: 360, minHeight: 58, borderRadius: 29 };
  return { width: 300, minHeight: 56, borderRadius: 28 };
}

export function IslandShell({ state, setState }: Props) {
  const isFeedback = state.status === 'success' || state.status === 'error';

  return (
    <main className="island-stage">
      <motion.section
        className="island-shell"
        animate={dimensions(state.status)}
        initial={{ opacity: 0, y: -20, scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.8 }}
      >
        <AnimatePresence mode="wait">
          {isFeedback ? (
            <motion.div key="feedback" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <StatusToast message={state.message} kind={state.status === 'success' ? 'success' : 'error'} />
            </motion.div>
          ) : (
            <motion.div key="editor" className="island-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <IslandInput
                value={state.description}
                onChange={(description) => setState((current) => ({ ...current, description }))}
              />
              <AnimatePresence>
                {state.status === 'expanded' && (
                  <motion.div className="expanded-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                    <div className="control-row">
                      <NamingRuleTabs value={state.caseStyle} onChange={(caseStyle) => setState((current) => ({ ...current, caseStyle }))} />
                      <VariableTypeSelector value={state.variableType} onChange={(variableType) => setState((current) => ({ ...current, variableType }))} />
                    </div>
                    <CandidateList
                      candidates={state.candidates}
                      selectedIndex={state.selectedIndex}
                      onSelect={(selectedIndex) => setState((current) => ({ ...current, selectedIndex }))}
                    />
                    <ShortcutHints />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    </main>
  );
}
```

- [ ] **Step 3: Wire App**

Replace `apps/desktop/src/renderer/App.tsx` with:

```tsx
import { useCallback } from 'react';
import { IslandShell } from './components/IslandShell';
import { useIslandState } from './hooks/useIslandState';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import { useNamingPreview } from './hooks/useNamingPreview';

export function App() {
  const { state, setState, selectedCandidate } = useIslandState();
  useNamingPreview(state, setState);

  const showFeedback = useCallback((status: 'success' | 'error', message: string) => {
    setState((current) => ({ ...current, status, message }));
    window.setTimeout(() => window.variableIsland.hideIsland(), status === 'success' ? 800 : 1800);
  }, [setState]);

  const copySelected = useCallback(async () => {
    if (!selectedCandidate) return;
    const result = await window.variableIsland.copyText(selectedCandidate.name);
    showFeedback(result.success ? 'success' : 'error', result.success ? `Copied: ${selectedCandidate.name}` : '复制失败');
  }, [selectedCandidate, showFeedback]);

  const insertSelected = useCallback(async () => {
    if (!selectedCandidate) return;
    const result = await window.variableIsland.insertText({ text: selectedCandidate.name });
    showFeedback(result.success ? 'success' : 'error', result.success ? 'Inserted' : '插入失败，已复制到剪贴板');
  }, [selectedCandidate, showFeedback]);

  useKeyboardNavigation(state, setState, copySelected, insertSelected);

  return <IslandShell state={state} setState={setState} />;
}
```

- [ ] **Step 4: Add CSS**

Create `apps/desktop/src/renderer/styles/island.css`:

```css
html,
body,
#root {
  width: 100%;
  height: 100%;
  margin: 0;
  overflow: hidden;
  background: transparent;
  font-family: Inter, "Segoe UI", system-ui, sans-serif;
  color: white;
}

* {
  box-sizing: border-box;
}

button,
input,
select {
  font: inherit;
}

.island-stage {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 18px;
  pointer-events: none;
}

.island-shell {
  pointer-events: auto;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(22, 22, 28, 0.82), rgba(8, 8, 12, 0.74));
  backdrop-filter: blur(24px) saturate(140%);
  border: 1px solid rgba(255, 255, 255, 0.13);
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.island-content {
  padding: 10px 14px 12px;
}

.island-input {
  width: 100%;
  height: 36px;
  border: none;
  outline: none;
  background: transparent;
  color: #fff;
  font-size: 15px;
  text-align: center;
}

.island-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.expanded-content {
  padding-top: 8px;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.rule-tabs {
  display: flex;
  flex: 1;
  padding: 3px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.07);
}

.rule-tab {
  position: relative;
  flex: 1;
  height: 30px;
  border: none;
  color: rgba(255, 255, 255, 0.78);
  background: transparent;
  border-radius: 999px;
  cursor: pointer;
}

.rule-tab-active {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
}

.rule-tab-label {
  position: relative;
  z-index: 1;
}

.type-select {
  height: 36px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  color: white;
  background: rgba(255, 255, 255, 0.08);
  padding: 0 10px;
  outline: none;
}

.type-select option {
  color: #111;
}

.candidate-list {
  display: grid;
  gap: 7px;
}

.candidate {
  width: 100%;
  height: 38px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  color: white;
  background: rgba(255, 255, 255, 0.06);
  cursor: pointer;
}

.candidate.selected {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 255, 255, 0.2);
}

.candidate-name {
  font-family: "JetBrains Mono", Consolas, monospace;
  font-size: 14px;
}

.candidate-badge {
  color: #9cffcb;
  font-size: 12px;
}

.empty-candidates {
  height: 72px;
  display: grid;
  place-items: center;
  color: rgba(255, 255, 255, 0.45);
}

.shortcut-hints {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 10px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.46);
}

.status-toast {
  height: 58px;
  display: grid;
  place-items: center;
  font-size: 14px;
}

.status-toast.success {
  color: #9cffcb;
}

.status-toast.error {
  color: #ffb4b4;
}
```

- [ ] **Step 5: Typecheck**

Run:

```bash
pnpm --filter @variable-island/desktop typecheck
```

Expected: no TypeScript errors.

- [ ] **Step 6: Manual UI verification**

Run:

```bash
pnpm dev
```

Expected: pressing `Alt+Space` opens a top-centered dark glass island. Typing `是否显示用户弹窗` expands the UI and shows animated candidates.

- [ ] **Step 7: Commit**

```bash
git add apps/desktop/src/renderer
git commit -m "feat: build animated variable island ui"
```

---

### Task 7: Implement C# Native Helper

**Files:**
- Create: `apps/native-helper/NativeHelper.csproj`
- Create: `apps/native-helper/Program.cs`
- Create: `apps/native-helper/WindowTracker.cs`
- Create: `apps/native-helper/ClipboardService.cs`
- Create: `apps/native-helper/InputSender.cs`
- Create: `apps/native-helper/JsonResult.cs`

- [ ] **Step 1: Create C# project**

Create `apps/native-helper/NativeHelper.csproj`:

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net8.0-windows</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <UseWindowsForms>true</UseWindowsForms>
    <AssemblyName>NativeHelper</AssemblyName>
  </PropertyGroup>
</Project>
```

Create `apps/native-helper/JsonResult.cs`:

```csharp
using System.Text.Json;

public sealed record JsonResult(bool Success, string? Method = null, string? TargetWindow = null, string? ErrorCode = null, string? Message = null)
{
    public string ToJson() => JsonSerializer.Serialize(new
    {
        success = Success,
        method = Method,
        targetWindow = TargetWindow,
        errorCode = ErrorCode,
        message = Message
    });
}
```

- [ ] **Step 2: Implement window tracking**

Create `apps/native-helper/WindowTracker.cs`:

```csharp
using System.Runtime.InteropServices;
using System.Text;

public static class WindowTracker
{
    private static readonly string StateFile = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
        "VariableIsland",
        "active-window.txt"
    );

    [DllImport("user32.dll")]
    private static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    private static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    private static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);

    public static JsonResult Remember()
    {
        Directory.CreateDirectory(Path.GetDirectoryName(StateFile)!);
        var handle = GetForegroundWindow();
        File.WriteAllText(StateFile, handle.ToInt64().ToString());
        return new JsonResult(true, "remember-window", GetWindowTitle(handle));
    }

    public static JsonResult Restore()
    {
        if (!File.Exists(StateFile))
        {
            return new JsonResult(false, ErrorCode: "NO_REMEMBERED_WINDOW", Message: "No remembered foreground window.");
        }

        var raw = File.ReadAllText(StateFile).Trim();
        if (!long.TryParse(raw, out var value) || value == 0)
        {
            return new JsonResult(false, ErrorCode: "BAD_WINDOW_HANDLE", Message: "Remembered window handle is invalid.");
        }

        var handle = new IntPtr(value);
        var ok = SetForegroundWindow(handle);
        return ok
            ? new JsonResult(true, "restore-window", GetWindowTitle(handle))
            : new JsonResult(false, ErrorCode: "RESTORE_WINDOW_FAILED", Message: "Failed to restore foreground window.");
    }

    private static string GetWindowTitle(IntPtr handle)
    {
        var builder = new StringBuilder(256);
        GetWindowText(handle, builder, builder.Capacity);
        return builder.ToString();
    }
}
```

- [ ] **Step 3: Implement clipboard and input sender**

Create `apps/native-helper/ClipboardService.cs`:

```csharp
using System.Windows.Forms;

public static class ClipboardService
{
    public static JsonResult WriteText(string text)
    {
        try
        {
            Clipboard.SetText(text, TextDataFormat.UnicodeText);
            return new JsonResult(true, "clipboard-write");
        }
        catch (Exception ex)
        {
            return new JsonResult(false, ErrorCode: "CLIPBOARD_WRITE_FAILED", Message: ex.Message);
        }
    }
}
```

Create `apps/native-helper/InputSender.cs`:

```csharp
using System.Runtime.InteropServices;

public static class InputSender
{
    private const ushort VK_CONTROL = 0x11;
    private const ushort VK_V = 0x56;
    private const uint INPUT_KEYBOARD = 1;
    private const uint KEYEVENTF_KEYUP = 0x0002;

    [StructLayout(LayoutKind.Sequential)]
    private struct INPUT
    {
        public uint type;
        public KEYBDINPUT ki;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct KEYBDINPUT
    {
        public ushort wVk;
        public ushort wScan;
        public uint dwFlags;
        public uint time;
        public IntPtr dwExtraInfo;
    }

    [DllImport("user32.dll", SetLastError = true)]
    private static extern uint SendInput(uint nInputs, INPUT[] pInputs, int cbSize);

    public static JsonResult SendPaste()
    {
        var inputs = new[]
        {
            KeyDown(VK_CONTROL),
            KeyDown(VK_V),
            KeyUp(VK_V),
            KeyUp(VK_CONTROL)
        };
        var sent = SendInput((uint)inputs.Length, inputs, Marshal.SizeOf<INPUT>());
        return sent == inputs.Length
            ? new JsonResult(true, "sendinput-ctrl-v")
            : new JsonResult(false, ErrorCode: "SENDINPUT_FAILED", Message: $"Sent {sent} of {inputs.Length} inputs.");
    }

    private static INPUT KeyDown(ushort key) => new()
    {
        type = INPUT_KEYBOARD,
        ki = new KEYBDINPUT { wVk = key }
    };

    private static INPUT KeyUp(ushort key) => new()
    {
        type = INPUT_KEYBOARD,
        ki = new KEYBDINPUT { wVk = key, dwFlags = KEYEVENTF_KEYUP }
    };
}
```

- [ ] **Step 4: Implement command entry**

Create `apps/native-helper/Program.cs`:

```csharp
using System.Threading;

[STAThread]
static int Main(string[] args)
{
    JsonResult result;
    try
    {
        if (args.Length == 0)
        {
            result = new JsonResult(false, ErrorCode: "NO_COMMAND", Message: "Command is required.");
        }
        else if (args[0] == "remember")
        {
            result = WindowTracker.Remember();
        }
        else if (args[0] == "insert" && args.Length >= 2)
        {
            var text = args[1];
            var clipboard = ClipboardService.WriteText(text);
            if (!clipboard.Success)
            {
                result = clipboard;
            }
            else
            {
                Thread.Sleep(80);
                var restore = WindowTracker.Restore();
                if (!restore.Success)
                {
                    result = restore;
                }
                else
                {
                    Thread.Sleep(80);
                    result = InputSender.SendPaste();
                }
            }
        }
        else
        {
            result = new JsonResult(false, ErrorCode: "UNKNOWN_COMMAND", Message: string.Join(' ', args));
        }
    }
    catch (Exception ex)
    {
        result = new JsonResult(false, ErrorCode: "UNHANDLED_EXCEPTION", Message: ex.Message);
    }

    Console.WriteLine(result.ToJson());
    return result.Success ? 0 : 1;
}
```

- [ ] **Step 5: Build helper**

Run:

```bash
dotnet build apps/native-helper/NativeHelper.csproj -c Release
```

Expected: build succeeds and creates `apps/native-helper/bin/Release/net8.0-windows/NativeHelper.exe`.

- [ ] **Step 6: Manual helper verification**

Run in a Windows terminal:

```bash
apps/native-helper/bin/Release/net8.0-windows/NativeHelper.exe remember
```

Expected JSON:

```json
{"success":true,"method":"remember-window","targetWindow":"...","errorCode":null,"message":null}
```

Then focus Notepad and run:

```bash
apps/native-helper/bin/Release/net8.0-windows/NativeHelper.exe insert isUserModalVisible
```

Expected: `isUserModalVisible` is pasted into Notepad and JSON success is printed.

- [ ] **Step 7: Commit**

```bash
git add apps/native-helper
git commit -m "feat: add windows native paste helper"
```

---

### Task 8: Integrate and verify full flow

**Files:**
- Modify: `apps/desktop/src/main/nativeBridge.ts` if helper path needs correction after build.
- Modify: `apps/desktop/src/renderer/App.tsx` if feedback timing needs adjustment.

- [ ] **Step 1: Build all workspaces and helper**

Run:

```bash
pnpm build
dotnet build apps/native-helper/NativeHelper.csproj -c Release
```

Expected: both commands succeed.

- [ ] **Step 2: Run all tests and typechecks**

Run:

```bash
pnpm test
pnpm typecheck
```

Expected: all workspace tests pass and no TypeScript errors occur.

- [ ] **Step 3: Manual copy flow**

Run:

```bash
pnpm dev
```

Manual steps:

1. Press `Alt+Space`.
2. Type `是否显示用户弹窗`.
3. Press `Enter`.
4. Paste into Notepad with `Ctrl+V`.

Expected: Notepad receives `isUserModalVisible` or the selected candidate.

- [ ] **Step 4: Manual auto-insert flow**

Manual steps:

1. Open Notepad and click into the text area.
2. Press `Alt+Space`.
3. Type `是否显示用户弹窗`.
4. Press `Ctrl+Enter`.

Expected: island hides and Notepad receives the selected variable name.

- [ ] **Step 5: Manual editor compatibility smoke test**

Repeat the auto-insert flow in:

```text
VS Code
Cursor
JetBrains IDE if installed
Visual Studio if installed
```

Expected: insertion succeeds in normal privilege windows. If target editor runs as administrator while Variable Island does not, insertion may fail and the UI must show `插入失败，已复制到剪贴板`.

- [ ] **Step 6: Commit final integration changes**

```bash
git add .
git commit -m "feat: integrate animated island copy and insert flow"
```

---

## Self-Review

Spec coverage:

- Dynamic Island style top-centered UI: Tasks 5 and 6.
- Heavy UI animation with Framer Motion: Task 6.
- Electron + React + TypeScript: Task 4.
- C# Native Helper with Windows APIs: Task 7.
- Offline local generator: Task 3.
- AI and hybrid generator interfaces: Task 3.
- Clipboard copy and auto-insert: Tasks 5, 7, and 8.
- Local config and dictionaries: Tasks 1 and 5.
- Error fallback to clipboard: Task 5 and Task 8.

Placeholder scan:

- No implementation placeholders are intentionally left.
- Deferred product features are not part of the MVP tasks and are excluded from implementation steps.

Type consistency:

- `CaseStyle`, `VariableType`, `GenerateNameRequest`, `GenerateNameResult`, `InsertTextRequest`, and `NativeCommandResult` are defined in `@variable-island/shared` and reused consistently.
- Renderer IPC calls match preload API names.
- Main process IPC channel names match preload usage.
