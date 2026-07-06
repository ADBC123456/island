import { execFile } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { app } from 'electron';
import type { NativeCommandResult } from '@variable-island/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function helperPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'native-helper', 'NativeHelper.exe');
  }

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
