# Variable Island

Windows floating variable-name assistant inspired by a Dynamic Island style UI. Type a short description, optionally translate non-English input through DeepLX, then generate Codelf-style variable name candidates and copy or insert the selected result.

## Features

- Floating Electron desktop island with compact, expanded, success, and error states.
- Local naming rules for `camelCase`, `PascalCase`, `snake_case`, `CONSTANT_CASE`, and Hungarian style.
- Variable type hints for boolean, string, number, array, object, and function names.
- Optional DeepLX translation before candidate generation.
- Keyboard navigation and copy/insert workflow.
- Native Windows helper for restoring the active window and inserting text.

## Tech Stack

- Electron + React + Vite
- TypeScript
- Framer Motion
- pnpm workspaces
- .NET 8 Windows native helper

## Requirements

- Windows
- Node.js 20+
- pnpm 9+
- .NET 8 SDK, only needed when building the native helper

## Install

```bash
pnpm install
```

## Development

```bash
pnpm dev
```

The desktop app runs from `apps/desktop`. In development it starts the renderer dev server, watches the Electron main process, and launches Electron.

## Build

```bash
pnpm build
```

Build the native helper when insert mode is needed:

```bash
dotnet build apps/native-helper/NativeHelper.csproj -c Release
```

## Test

```bash
pnpm test
pnpm typecheck
```

## Configuration

Runtime config is stored outside the repository at:

```text
%APPDATA%\VariableIsland\config.json
```

Use `resources/config.example.json` as a template. Keep private values, such as DeepLX tokens or private endpoints, only in the runtime config or environment variables. Do not commit them.

Supported DeepLX environment overrides:

```text
VARIABLE_ISLAND_DEEPLX_ENABLED=1
VARIABLE_ISLAND_DEEPLX_URL=http://127.0.0.1:1188/translate
VARIABLE_ISLAND_DEEPLX_TOKEN=
VARIABLE_ISLAND_DEEPLX_SOURCE_LANG=auto
VARIABLE_ISLAND_DEEPLX_TARGET_LANG=EN
VARIABLE_ISLAND_DEEPLX_TIMEOUT_MS=8000
```

## Repository Layout

```text
apps/desktop        Electron main, preload, and React renderer
apps/native-helper  Windows native helper for text insertion
packages/shared     Shared request/result/config types
packages/naming-core Local naming rules and case formatting
resources           Default and example configuration
```

## Privacy

The repository contains source code and example configuration only. It should not contain personal API tokens, private endpoints, generated app config, local environment files, or assistant prompt/planning files.
