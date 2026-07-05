import type { GenerateNameRequest, GenerateNameResult } from '@variable-island/shared';

export interface NameGenerator {
  generate(request: GenerateNameRequest): Promise<GenerateNameResult>;
}
