import { estimateTokens } from '@/modules/ai/domain/token-estimator';

/** Application-facing token estimator (wraps the pure heuristic). */
export class TokenEstimator {
  estimate(text: string): number {
    return estimateTokens(text);
  }
}
