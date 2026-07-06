# Variable Island

一个 Windows 桌面悬浮变量命名工具。输入变量用途描述后，应用会生成 Codelf 风格的变量名候选，并支持复制或插入到当前窗口。中文等非英文描述可以选择先通过 DeepLX 翻译成英文，再进入本地命名规则。

## 功能特性

- Dynamic Island 风格的 Electron 悬浮窗口，包含紧凑、展开、成功、错误等状态。
- 本地变量命名规则，支持 `camelCase`、`PascalCase`、`snake_case`、`CONSTANT_CASE` 和匈牙利命名风格。
- 支持变量类型提示：布尔值、字符串、数字、数组、对象、函数等。
- 可选 DeepLX 翻译，用于中文等非英文描述的变量名生成。
- 支持键盘导航、复制候选名、插入候选名。
- Windows 原生辅助程序用于恢复前台窗口并发送文本输入。

## 技术栈

- Electron + React + Vite
- TypeScript
- Framer Motion
- pnpm workspace
- .NET 8 Windows 原生辅助程序

## 环境要求

- Windows
- Node.js 20+
- pnpm 9+
- .NET 8 SDK，仅在需要构建原生辅助程序时使用

## 安装依赖

```bash
pnpm install
```

## 本地开发

```bash
pnpm dev
```

桌面端代码位于 `apps/desktop`。开发命令会启动 Vite renderer dev server，监听 Electron main 进程编译，并启动 Electron。

## 构建

```bash
pnpm build
```

如果需要使用“插入文本”能力，还需要构建 Windows 原生辅助程序：

```bash
dotnet build apps/native-helper/NativeHelper.csproj -c Release
```

## 测试与类型检查

```bash
pnpm test
pnpm typecheck
```

## 配置

运行时配置文件存放在仓库外部：

```text
%APPDATA%\VariableIsland\config.json
```

可以参考 `resources/config.example.json` 创建本地配置。DeepLX token、私有接口地址等敏感信息只应放在运行时配置或环境变量中，不要提交到仓库。

DeepLX 相关环境变量：

```text
VARIABLE_ISLAND_DEEPLX_ENABLED=1
VARIABLE_ISLAND_DEEPLX_URL=http://127.0.0.1:1188/translate
VARIABLE_ISLAND_DEEPLX_TOKEN=
VARIABLE_ISLAND_DEEPLX_SOURCE_LANG=auto
VARIABLE_ISLAND_DEEPLX_TARGET_LANG=EN
VARIABLE_ISLAND_DEEPLX_TIMEOUT_MS=8000
```

`translationProvider` 设置为 `deeplx` 时会启用 DeepLX 翻译；设置为 `disabled` 时只使用本地命名规则。

## 目录结构

```text
apps/desktop         Electron main、preload 和 React renderer
apps/native-helper   Windows 原生辅助程序
packages/shared      共享类型定义
packages/naming-core 本地命名规则与大小写格式化
resources            默认配置与示例配置
```

## 隐私说明

仓库只包含项目源码和示例配置，不应包含个人 API token、私有接口地址、生成的本地配置、环境变量文件或助手提示/规划文件。
