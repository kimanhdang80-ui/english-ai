import { describe, expect, it } from 'vitest';

import { ContentValidator } from './content-validator';
import { estimateTokens } from './token-estimator';

const validator = new ContentValidator();

describe('estimateTokens', () => {
  it('estimates ~chars/4 and 0 for empty', () => {
    expect(estimateTokens('')).toBe(0);
    expect(estimateTokens('     ')).toBe(0);
    expect(estimateTokens('abcd')).toBe(1);
    expect(estimateTokens('abcde')).toBe(2);
  });
});

describe('ContentValidator.validatePrompt', () => {
  it('flags an empty prompt', () => {
    const r = validator.validatePrompt('   ');
    expect(r.valid).toBe(false);
    expect(r.issues[0]?.code).toBe('EMPTY_PROMPT');
  });

  it('passes a non-empty prompt', () => {
    expect(validator.validatePrompt('hello').valid).toBe(true);
  });
});

describe('ContentValidator.validateOutput', () => {
  it('flags empty output', () => {
    const r = validator.validateOutput('');
    expect(r.valid).toBe(false);
    expect(r.issues[0]?.code).toBe('EMPTY_OUTPUT');
  });

  it('flags output that exceeds the token budget', () => {
    const long = 'x'.repeat(400); // ~100 tokens
    const r = validator.validateOutput(long, { maxTokens: 10 });
    expect(r.valid).toBe(false);
    expect(r.issues.some((i) => i.code === 'OUTPUT_TOO_LONG')).toBe(true);
  });

  it('flags invalid JSON when format=json', () => {
    const r = validator.validateOutput('not json', { format: 'json' });
    expect(r.issues.some((i) => i.code === 'INVALID_FORMAT')).toBe(true);
  });

  it('flags missing required keys in valid JSON', () => {
    const r = validator.validateOutput('{"a":1}', {
      format: 'json',
      requiredKeys: ['a', 'b'],
    });
    expect(r.issues.some((i) => i.code === 'MISSING_KEY')).toBe(true);
    expect(r.valid).toBe(false);
  });

  it('passes well-formed output within budget', () => {
    const r = validator.validateOutput('{"a":1,"b":2}', {
      format: 'json',
      requiredKeys: ['a', 'b'],
      maxTokens: 100,
    });
    expect(r.valid).toBe(true);
  });
});
