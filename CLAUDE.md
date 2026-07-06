# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Variable Island (repo dir "Wordlookup") — a Windows Dynamic Island style floating panel that generates English variable names from Chinese/natural-language descriptions. Electron + React + Framer Motion UI, offline naming engine, optional DeepLX translation, and a C# helper for pasting into the previously focused window.

Design spec: `docs/superpowers/specs/2026-07-05-variable-island-design.md`. Implementation plan: `docs/superpowers/plans/2026-07-05-variable-island.md`. The spec says 3 case styles; code now supports 5 (`camelCase`, `PascalCase`, `snake_case`, `CONSTANT_CASE`, `Hungarian`) — code is source of truth.

## Commands

```powershell
pnpm dev          # build shared+naming-core+main once, then vite dev server + tsc --watch (main) + electron
pnpm build        # build all workspace packages
pnpm test         # vitest across all packages
pnpm typecheck    # tsc --noEmit across all packages

# Single package / single test
pnpm --filter @variable-island/naming-core test
pnpm --filter @variable-island/naming-core exec vitest run src/__tests__/caseStyle.test.ts
pnpm --filter @variable-island/desktop test

# C# native helper (required for auto-insert; app runs without it, insert falls back to clipboard)
dotnet build apps/native-helper/NativeHelper.csproj -c Release
# Manual check: apps/native-helper/bin/Release/net8.0-windows/NativeHelper.exe remember|insert <text>
```

`.npmrc` pins the electron binary mirror to npmmirror (China network). `.worktrees/` holds git worktrees for feature branches (gitignored).

Env toggles: `VARIABLE_ISLAND_DIAGNOSTIC_WINDOW=1` runs a framed, opaque, movable debug window (disables island resizing/positioning and blur-to-hide). DeepLX overrides: `VARIABLE_ISLAND_DEEPLX_URL/_TOKEN/_SOURCE_LANG/_TARGET_LANG/_TIMEOUT_MS/_ENABLED` (fallback names `DEEPLX_*`).

## Architecture

pnpm monorepo, 4 workspace packages:

- `packages/shared` — `@variable-island/shared`: all cross-process types (`CaseStyle`, `VariableType`, `IslandStatus`, `GenerateNameRequest/Result`, `AppConfig`, `NativeCommandResult`). Change types here first; everything depends on it.
- `packages/naming-core` — `@variable-island/naming-core`: offline generator. Pipeline: `inferVariableType` → word extraction (DeepLX-translated English words if provided, else built-in zh→en dictionary in `src/dictionary.ts`, else ASCII fallback) → boolean/array word-set variants → `applyCaseStyle` → dedupe + score. `NameGenerator` interface with `LocalNameGenerator` (real), `AiNameGenerator`/`HybridNameGenerator` (stubs reserved for future).
- `apps/desktop` — Electron app, three contexts:
  - `src/main` (compiled by `tsc -p tsconfig.node.json` to `dist/main`, NodeNext ESM): window lifecycle, shortcuts, IPC, storage, DeepLX, native-helper bridge.
  - `src/preload/index.cts` (compiled to `dist/preload/index.cjs`): exposes `window.variableIsland` via contextBridge. Deliberately duplicates types instead of importing shared (CJS constraint) — keep in sync manually.
  - `src/renderer` (Vite + React): owns UI state machine and animations only; all side effects go through `window.variableIsland`.
- `apps/native-helper` — .NET 8 WinForms console exe. Commands: `remember` (store foreground window) and `insert` (clipboard write → restore window → SendInput Ctrl+V). Always prints a `JsonResult` line; Electron's `nativeBridge.ts` parses it and resolves at the hardcoded path `apps/native-helper/bin/Release/net8.0-windows/NativeHelper.exe`.

### Key flows

- **Summon**: global shortcut (`Alt+Space` from config, fallback `Alt+F`) or mouse touching top-center screen edge. `mouseEdgeWatcher` polls adaptively — 240ms when the cursor is far from the top edge, 70ms within 120px of it — and pauses entirely on system suspend/lock (powerMonitor). Pure trigger math in `edgeTrigger.ts` (the unit-tested part). Both paths call native `remember` **before** showing the island so focus can be restored later.
- **Generate**: renderer debounces input 80ms → `naming:generate` IPC → main tries DeepLX translation (only for non-ASCII input, silent fallback on any failure) → `LocalNameGenerator.generate`.
- **Island state machine**: `hidden | compact | expanded | success | error`. The renderer drives status; `apps/desktop/src/renderer/islandMetrics.ts` is the single source of truth for island dimensions (expanded height scales with candidate count). Every status/count change sends `{status, width, height}` via `window:set-island-status`; `WindowManager.setIslandStatus` grows the OS window immediately but delays shrinking (~380ms) so the renderer's spring never gets clipped. `windowManager.ts` keeps only fallback sizes.
- **Insert**: `native:insert-text` hides the island first, then runs the helper; on failure the text is still copied to clipboard and the renderer shows the error toast.
- **Config**: `%APPDATA%/VariableIsland/config.json`, defaults + schema-fill in `storageService.ts` (missing keys are merged and written back). No settings UI yet — edit the file or use env vars.

### Gotchas

- Workspace packages resolve to built output (`main: dist/index.js`). `pnpm dev` builds `shared` and `naming-core` **once** at startup — after editing them, rebuild the package (or restart dev) before the change is visible to main/renderer.
- Main process code must use `.js` extensions in relative imports (NodeNext ESM).
- The island window hides on blur (except diagnostic mode); in dev, main shows the island once ~1s after startup for diagnostics.
- `resources/dictionaries/base.zh-cn.json` and `resources/default-config.json` exist but are **not** loaded at runtime — the live dictionary is `packages/naming-core/src/dictionary.ts` and live defaults are in `storageService.ts`.
- `window-all-closed` is intercepted; quit only happens via `will-quit` (shortcuts + mouse watcher cleanup live there).
