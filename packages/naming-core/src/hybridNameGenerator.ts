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
