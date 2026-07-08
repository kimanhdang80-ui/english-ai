import { describe, expect, it } from 'vitest';

import { PromptRenderer } from './prompt-renderer';

const renderer = new PromptRenderer();

describe('PromptRenderer', () => {
  it('substitutes provided variables', () => {
    const { rendered, missing } = renderer.render(
      'Teach {{WORD}} to a {{LEVEL}} learner.',
      { WORD: 'apple', LEVEL: 'A1' },
    );
    expect(rendered).toBe('Teach apple to a A1 learner.');
    expect(missing).toEqual([]);
  });

  it('reports missing/empty variables and leaves the token unresolved', () => {
    const { rendered, missing } = renderer.render(
      'Teach {{WORD}} in {{LANGUAGE}}.',
      { WORD: 'apple', LANGUAGE: '  ' },
    );
    expect(missing).toEqual(['LANGUAGE']);
    expect(rendered).toContain('{{LANGUAGE}}');
  });

  it('handles whitespace inside tokens', () => {
    const { rendered } = renderer.render('Hi {{  NAME  }}', { NAME: 'Sam' });
    expect(rendered).toBe('Hi Sam');
  });

  it('lists distinct declared tokens', () => {
    expect(renderer.tokens('{{A}} {{B}} {{A}}')).toEqual(['A', 'B']);
  });
});
