import { clipboard } from 'electron';
import type { NativeCommandResult } from '@variable-island/shared';

export function copyText(text: string): NativeCommandResult {
  clipboard.writeText(text);
  return { success: true, method: 'electron-clipboard' };
}
