import type { GenerateNameRequest, GenerateNameResult } from '@variable-island/shared';
import type { NameGenerator } from './types.js';

export class AiNameGenerator implements NameGenerator {
  async generate(_request: GenerateNameRequest): Promise<GenerateNameResult> {
    return { candidates: [] };
  }
}
