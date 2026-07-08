/**
 * Rough token estimator (pure, no tokenizer dependency). Heuristic: ~4 chars/token.
 * Good enough for budgeting/validation in the foundation; a real tokenizer can be
 * swapped in behind the same signature later.
 */
export function estimateTokens(text: string): number {
  const len = text.trim().length;
  return len === 0 ? 0 : Math.ceil(len / 4);
}
