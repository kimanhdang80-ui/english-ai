/**
 * Dashboard AI-Coach message — the swap seam for the AI Daily Coach (docs/product/AI_DAILY_COACH.md).
 *
 * Today this is a DETERMINISTIC MOCK built from real learner signals (no AI, no randomness).
 * Later, a real adapter (e.g. `AiTextService`) produces the same `CoachMessage` shape from the
 * learner's actual mistakes — swap `buildCoachMessage` for the AI call at the container/page with
 * no change to the presentational `AiCoachCard`. Framework-free & pure (easy to unit-test).
 */

export interface CoachMessage {
  text: string;
  /** 'mock' now; becomes 'ai' when a provider produces the message. */
  source: 'mock' | 'ai';
}

export interface CoachSignals {
  displayName: string | null;
  streak: number;
  dueNow: number;
  totalWords: number;
  /** A word the learner is still working on (drives the "let's review X" nudge). */
  topWeakWord: string | null;
}

/**
 * Chooses one encouraging, specific, next-step message (MICROCOPY_GUIDE voice) by priority:
 * weak word → due reviews → streak → brand-new. Never shaming; always points forward.
 */
export function buildCoachMessage(signals: CoachSignals): CoachMessage {
  const name = signals.displayName?.trim();
  const hi = name ? `${name}, ` : '';

  if (signals.topWeakWord) {
    return {
      source: 'mock',
      text: `${hi}yesterday “${signals.topWeakWord}” tripped you up — that's normal. Let's review it in today's lesson so it sticks.`,
    };
  }
  if (signals.dueNow > 0) {
    const s = signals.dueNow === 1 ? 'word is' : 'words are';
    return {
      source: 'mock',
      text: `${hi}${signals.dueNow} ${s} ready to review. A quick review now locks them into long-term memory.`,
    };
  }
  if (signals.streak > 0) {
    return {
      source: 'mock',
      text: `${hi}you're on a ${signals.streak}-day streak — one short lesson today keeps it going.`,
    };
  }
  if (signals.totalWords === 0) {
    return {
      source: 'mock',
      text: `Welcome${name ? `, ${name}` : ''}! Let's start small — today's lesson takes about 12 minutes. I'll guide you the whole way.`,
    };
  }
  return {
    source: 'mock',
    text: `${hi}nice and steady. Today's lesson adds a few new words and reviews what you've learned.`,
  };
}
