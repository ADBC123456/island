# Variable Island Design

Date: 2026-07-05
Status: Approved for implementation planning

## 1. Product Goal

Variable Island is a Windows desktop utility for programmers. It appears as a top-centered Dynamic Island style floating panel and helps users generate variable names from short natural-language descriptions.

The first version prioritizes a polished, animated UI experience while keeping the naming engine offline and extensible. AI integration is not implemented in v1, but the generator architecture must reserve interfaces for future AI and hybrid generation.

## 2. Confirmed Technical Direction

Use the heavy UI animation plan:

- Desktop shell: Electron
- UI: React + TypeScript
- Animation: Framer Motion
- System insertion compatibility: C# Native Helper using Windows APIs
- First naming engine: offline local generator
- Future extension: AI generator and hybrid generator interfaces

The UI should reference WinIsland's general interaction style: top-centered capsule, dark glass look, elastic expansion, smooth collapse, and lightweight always-on-top presence. Do not copy WinIsland source code or GPL assets into this project.

## 3. Primary User Flow

1. User is coding in an editor or IDE.
2. User presses the global shortcut, default `Alt + Space`.
3. Electron main process asks the C# helper to remember the current foreground window.
4. The island appears near the top center of the current display.
5. User types a description, for example `是否显示用户弹窗`.
6. The island expands and shows naming rules, type selector, and candidate names.
7. User chooses a candidate with arrow keys or mouse.
8. User presses:
   - `Enter` to copy the variable name to clipboard.
   - `Ctrl + Enter` to insert the variable name into the previously focused editor.
9. On success, the island shows a short success state and hides.
10. On insertion failure, the variable name remains copied and the island shows an error hint.

## 4. UI States

### Hidden

The window is not visible. The app waits for a global shortcut.

### Compact

The island appears as a small capsule with a focused input field.

Expected behavior:

- Top-centered floating position.
- Dark translucent glass surface.
- Large rounded corners.
- Input focused immediately.
- `Esc` hides the island.

### Expanded

The island expands after the input has content.

Content:

- Description input.
- Naming rule tabs: `camelCase`, `PascalCase`, `Hungarian`.
- Variable type selector: `auto`, `boolean`, `string`, `number`, `array`, `object`, `function`.
- Candidate list.
- Shortcut hints.

Keyboard behavior:

- `ArrowUp` / `ArrowDown`: change selected candidate.
- `Tab`: switch naming rule.
- `Enter`: copy selected candidate.
- `Ctrl + Enter`: insert selected candidate.
- `Esc`: hide.
- `Ctrl + ,`: open settings later; optional for v1.

### Success

Short feedback after copy or insertion.

Examples:

- `Copied: isUserModalVisible`
- `Inserted`

The island should contract and hide after roughly 800 ms.

### Error

Shown when automatic insertion fails.

Message example:

`插入失败，已复制到剪贴板。目标窗口可能以管理员身份运行。`

The island hides after a short delay. Clipboard fallback remains available.

## 5. Visual and Animation Design

### Window

Electron `BrowserWindow` requirements:

- Transparent background.
- Frameless.
- Always on top.
- Skip taskbar.
- Non-resizable for v1.
- Top-centered placement on the active display.

Initial target dimensions:

- Compact: about `300 x 56`.
- Expanded: about `640 x 240-320`.
- Window bounds may be slightly larger than the visible island to allow shadows.

### Glass Surface

CSS-level v1 glass style:

- Background: dark translucent, approximately `rgba(16,16,20,0.72)`.
- Backdrop blur: about `24px` where supported.
- Border: subtle white translucent stroke.
- Shadow: soft dark shadow.

Later versions may add true desktop capture blur, but v1 should use CSS and avoid low-level capture complexity.

### Motion

Use Framer Motion for:

- Hidden to compact entrance.
- Compact to expanded size transition.
- Candidate list staggered entrance.
- Naming rule pill selection layout animation.
- Success feedback contraction.

Recommended spring baseline:

- Type: `spring`.
- Stiffness: about `420`.
- Damping: about `34`.
- Mass: about `0.8`.

Animation must feel responsive and not delay keyboard-driven workflows.

## 6. Architecture

Project structure:

```text
variable-island/
├─ apps/
│  ├─ desktop/
│  │  ├─ src/
│  │  │  ├─ main/
│  │  │  ├─ preload/
│  │  │  └─ renderer/
│  │  └─ package.json
│  └─ native-helper/
│     ├─ NativeHelper.csproj
│     ├─ Program.cs
│     ├─ WindowTracker.cs
│     ├─ ClipboardService.cs
│     └─ InputSender.cs
├─ packages/
│  ├─ naming-core/
│  └─ shared/
├─ resources/
│  ├─ dictionaries/
│  └─ default-config.json
└─ package.json
```

### Electron Main Process

Responsibilities:

- Create and position the transparent island window.
- Register global shortcut.
- Manage tray later.
- Handle IPC from renderer.
- Read/write config and local data.
- Call C# Native Helper.
- Use Electron clipboard for copy-only mode.

Main modules:

- `windowManager.ts`
- `shortcutManager.ts`
- `nativeBridge.ts`
- `clipboardService.ts`
- `storageService.ts`
- `ipcHandlers.ts`

### Preload

Expose a minimal safe API through `contextBridge`.

Renderer must not use Node integration directly.

### React Renderer

Key components:

- `IslandShell.tsx`: animated root shell and state-dependent layout.
- `IslandInput.tsx`: focused text input.
- `NamingRuleTabs.tsx`: animated naming rule tabs.
- `VariableTypeSelector.tsx`: type selector.
- `CandidateList.tsx`: animated candidate list.
- `CandidateItem.tsx`: one candidate row.
- `StatusToast.tsx`: success/error feedback.
- `ShortcutHints.tsx`: keyboard hints.

Key hooks:

- `useIslandState.ts`
- `useKeyboardNavigation.ts`
- `useNamingPreview.ts`

### C# Native Helper

Responsibilities:

- Remember the foreground window before the island steals focus.
- Restore the remembered window.
- Write text to clipboard when doing auto-insert.
- Send `Ctrl + V` via `SendInput`.
- Return JSON result to Electron.

Core Windows APIs:

- `GetForegroundWindow`
- `SetForegroundWindow`
- Clipboard APIs
- `SendInput`

Automatic insertion must use clipboard plus paste. It must not simulate character-by-character typing.

MVP communication mode:

- Electron calls helper as a command-line executable.

Future communication mode:

- Long-running helper with named pipe IPC.

## 7. Naming Core

The first version uses offline generation.

Input request shape:

```ts
interface GenerateNameRequest {
  description: string;
  caseStyle: 'camelCase' | 'PascalCase' | 'Hungarian';
  variableType: 'auto' | 'boolean' | 'string' | 'number' | 'array' | 'object' | 'function';
  language?: string;
}
```

Output shape:

```ts
interface GenerateNameResult {
  candidates: Array<{
    name: string;
    score: number;
    reason?: string;
  }>;
}
```

Generator abstraction:

```ts
interface NameGenerator {
  generate(request: GenerateNameRequest): Promise<GenerateNameResult>;
}
```

Implementations:

- `LocalNameGenerator`: implemented in v1.
- `AiNameGenerator`: reserved for future use.
- `HybridNameGenerator`: reserved for future use.

Local generation pipeline:

1. Normalize input.
2. Detect intent and variable type.
3. Translate known Chinese programming terms using local dictionaries.
4. Combine candidate terms.
5. Apply case style.
6. Rank candidates.

Examples:

- `是否显示用户弹窗` -> `isUserModalVisible`, `shouldShowUserModal`, `isUserDialogVisible`.
- `用户名称` -> `userName`, `username`, `name`.
- `商品列表` -> `productList`, `products`, `productItems`.

## 8. Local Data

Use local-only data in v1.

Data directory:

```text
%APPDATA%/VariableIsland/
├─ config.json
├─ user-dictionary.json
├─ history.json
└─ logs/
```

Default config:

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

Dictionary files in `resources/dictionaries` provide built-in translations and common programming terms.

## 9. Error Handling

### Insert Failure

If native insertion fails:

- Keep or write the selected variable name in clipboard.
- Show error state.
- Mention possible causes such as administrator privilege mismatch.

### Shortcut Conflict

If the default shortcut registration fails:

- Start app normally.
- Show a clear warning.
- Allow future settings to change shortcut.

### Empty or Unknown Description

If local generator cannot confidently translate input:

- Still produce sanitized phonetic or simple English-like candidates where possible later.
- For v1, show a friendly empty state or generic fallback candidates.

## 10. Testing and Verification Strategy

### Naming Core

Unit tests for:

- Case conversion.
- Type detection.
- Boolean prefix behavior.
- Hungarian prefixes.
- Dictionary translation and ranking.

### Renderer

Component or interaction tests for:

- Compact to expanded state.
- Keyboard selection.
- Rule switching.
- Copy/insert IPC calls.

### Main Process

Tests or manual verification for:

- Global shortcut registration.
- Window show/hide.
- Clipboard copy.
- Native helper command invocation.

### Native Helper

Manual and unit-level verification for:

- Remember active window.
- Clipboard write.
- SendInput paste.
- JSON success/failure output.

Manual compatibility targets:

- VS Code
- Cursor
- JetBrains IDE
- Visual Studio
- Notepad

## 11. MVP Scope

Must have:

- Electron + React + TypeScript scaffold.
- Transparent top-centered island window.
- Framer Motion animated shell.
- Dark glass UI.
- Global shortcut summon.
- Input and candidate list.
- `camelCase`, `PascalCase`, `Hungarian`.
- Offline local generator.
- Copy to clipboard.
- C# Helper automatic insert.
- Failure fallback to clipboard.

Deferred:

- Real AI calls.
- Cloud sync.
- Account system.
- Plugin marketplace.
- Team dictionary.
- Dedicated IDE plugins.
- Full settings UI polish.

## 12. Implementation Order

1. Scaffold monorepo and Electron React app.
2. Build static island UI.
3. Add Framer Motion state transitions.
4. Add renderer state and keyboard navigation.
5. Implement naming-core local generator.
6. Wire IPC for copy and insert.
7. Implement global shortcut and window manager.
8. Implement C# Native Helper.
9. Add local config and dictionaries.
10. Run verification across copy and insert flows.
