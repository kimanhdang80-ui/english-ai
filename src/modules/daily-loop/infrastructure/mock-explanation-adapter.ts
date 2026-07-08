import type { Explanation } from '@/modules/daily-loop/domain/entities';
import type {
  ExplanationInput,
  ExplanationPort,
} from '@/modules/daily-loop/application/ports';

/**
 * Mock explanation adapter (rule-based, NO AI). Implements the same `ExplanationPort`
 * a real AI adapter will implement — swap it at the container with zero service changes.
 */
export class MockExplanationAdapter implements ExplanationPort {
  readonly source = 'mock';

  async explainWord({
    word,
    definition,
    example,
  }: ExplanationInput): Promise<Explanation> {
    const meaning = definition.trim().replace(/\.$/, '').toLowerCase();
    const base = `“${word}” means ${meaning}.`;
    const ex = example ? ` For example: ${example}` : '';
    return { text: base + ex, source: this.source };
  }
}
