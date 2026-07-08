import type {
  PromptTemplate,
  PromptVersion,
} from '@/modules/ai/domain/entities';

import { MODELS } from './models';

/**
 * Prompt template registry — prompts as **versioned data**, not inline strings in
 * services ("Không hard-code prompt"). This is the seed source for the (future)
 * `prompt_templates` table; until persistence lands it is served in-memory.
 *
 * Variables use `{{UPPER_SNAKE}}` tokens resolved by the PromptRenderer:
 * {{WORD}} {{TOPIC}} {{LEVEL}} {{LANGUAGE}} {{GOAL}} {{STYLE}}.
 */
export interface PromptTemplateSeed {
  template: PromptTemplate;
  versions: PromptVersion[];
}

const CREATED_AT = '2026-07-01T00:00:00.000Z';

export const PROMPT_TEMPLATE_REGISTRY: PromptTemplateSeed[] = [
  {
    template: {
      id: 'tpl-vocabulary-lesson',
      key: 'vocabulary-lesson',
      name: 'Vocabulary Lesson',
      description:
        'Generate a short vocabulary lesson for a single word at a given level.',
      category: 'vocabulary',
      activeVersion: 1,
      variables: [
        {
          name: 'WORD',
          description: 'The headword to teach.',
          required: true,
          type: 'string',
          example: 'apple',
        },
        {
          name: 'LEVEL',
          description: 'CEFR level of the learner.',
          required: true,
          type: 'enum',
          allowed: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
          example: 'A1',
        },
        {
          name: 'LANGUAGE',
          description: "Learner's native language.",
          required: true,
          type: 'string',
          example: 'Vietnamese',
        },
        {
          name: 'GOAL',
          description: 'Learning goal / context.',
          required: false,
          type: 'string',
          example: 'everyday conversation',
        },
        {
          name: 'STYLE',
          description: 'Tone/style of the lesson.',
          required: false,
          type: 'string',
          example: 'friendly and simple',
        },
      ],
    },
    versions: [
      {
        id: 'tpl-vocabulary-lesson-v1',
        templateId: 'tpl-vocabulary-lesson',
        version: 1,
        status: 'active',
        model: MODELS.SONNET,
        maxOutputTokens: 500,
        createdAt: CREATED_AT,
        notes: 'Initial foundation version.',
        body: [
          'You are an English teacher creating a lesson for a {{LEVEL}} learner',
          'whose native language is {{LANGUAGE}}.',
          'Teach the word "{{WORD}}".',
          'Learning goal: {{GOAL}}. Style: {{STYLE}}.',
          'Return a simple definition, one example sentence, and the translation.',
        ].join(' '),
      },
    ],
  },
  {
    template: {
      id: 'tpl-grammar-explanation',
      key: 'grammar-explanation',
      name: 'Grammar Explanation',
      description: 'Explain a grammar point at a given level.',
      category: 'grammar',
      activeVersion: 1,
      variables: [
        {
          name: 'TOPIC',
          description: 'The grammar point to explain.',
          required: true,
          type: 'string',
          example: 'present simple',
        },
        {
          name: 'LEVEL',
          description: 'CEFR level of the learner.',
          required: true,
          type: 'enum',
          allowed: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
          example: 'A2',
        },
        {
          name: 'LANGUAGE',
          description: "Learner's native language.",
          required: true,
          type: 'string',
          example: 'Vietnamese',
        },
        {
          name: 'GOAL',
          description: 'Learning goal / context.',
          required: false,
          type: 'string',
          example: 'passing an exam',
        },
        {
          name: 'STYLE',
          description: 'Tone/style of the explanation.',
          required: false,
          type: 'string',
          example: 'clear and concise',
        },
      ],
    },
    versions: [
      {
        id: 'tpl-grammar-explanation-v1',
        templateId: 'tpl-grammar-explanation',
        version: 1,
        status: 'active',
        model: MODELS.SONNET,
        maxOutputTokens: 700,
        createdAt: CREATED_AT,
        notes: 'Initial foundation version.',
        body: [
          'Explain the grammar point "{{TOPIC}}" to a {{LEVEL}} learner',
          'in {{LANGUAGE}}. Goal: {{GOAL}}. Style: {{STYLE}}.',
          'Give the rule, two example sentences, and one common mistake.',
        ].join(' '),
      },
    ],
  },
  {
    template: {
      id: 'tpl-vocabulary-explanation',
      key: 'vocabulary-explanation',
      name: 'Vocabulary Explanation',
      description:
        'Explain a single word simply for a learner (replaces the mock explanation).',
      category: 'vocabulary',
      activeVersion: 1,
      variables: [
        {
          name: 'WORD',
          description: 'The headword to explain.',
          required: true,
          type: 'string',
          example: 'apple',
        },
        {
          name: 'DEFINITION',
          description:
            'The known dictionary definition to ground the explanation.',
          required: true,
          type: 'string',
          example: 'a round fruit with red or green skin',
        },
        {
          name: 'EXAMPLE',
          description: 'An example sentence, if available.',
          required: false,
          type: 'string',
          example: 'I eat an apple every day.',
        },
        {
          name: 'LEVEL',
          description: 'CEFR level of the learner.',
          required: true,
          type: 'enum',
          allowed: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
          example: 'A1',
        },
        {
          name: 'LANGUAGE',
          description: "Learner's native language for a short gloss.",
          required: false,
          type: 'string',
          example: 'Vietnamese',
        },
      ],
    },
    versions: [
      {
        id: 'tpl-vocabulary-explanation-v1',
        templateId: 'tpl-vocabulary-explanation',
        version: 1,
        status: 'active',
        model: MODELS.HAIKU,
        maxOutputTokens: 200,
        createdAt: CREATED_AT,
        notes: 'Ground explanation in the provided definition; keep it short.',
        body: [
          'You are a friendly English teacher for a {{LEVEL}} learner.',
          'Explain the word "{{WORD}}" in one or two simple sentences,',
          'grounded in this meaning: "{{DEFINITION}}".',
          'If helpful, use this example: "{{EXAMPLE}}".',
          'Optionally add a short {{LANGUAGE}} gloss in parentheses.',
          'Do not invent facts beyond the given meaning.',
        ].join(' '),
      },
    ],
  },
  {
    template: {
      id: 'tpl-vocabulary-example',
      key: 'vocabulary-example',
      name: 'Vocabulary Example Sentence',
      description:
        'Generate one natural example sentence using a word at a level.',
      category: 'vocabulary',
      activeVersion: 1,
      variables: [
        {
          name: 'WORD',
          description: 'The word to use in a sentence.',
          required: true,
          type: 'string',
          example: 'apple',
        },
        {
          name: 'LEVEL',
          description: 'CEFR level of the learner.',
          required: true,
          type: 'enum',
          allowed: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
          example: 'A1',
        },
      ],
    },
    versions: [
      {
        id: 'tpl-vocabulary-example-v1',
        templateId: 'tpl-vocabulary-example',
        version: 1,
        status: 'active',
        model: MODELS.HAIKU,
        maxOutputTokens: 120,
        createdAt: CREATED_AT,
        notes: 'One short, natural, level-appropriate sentence.',
        body: [
          'Write exactly one natural English example sentence using the word',
          '"{{WORD}}", suitable for a {{LEVEL}} learner.',
          'Return only the sentence, with no quotes or extra commentary.',
        ].join(' '),
      },
    ],
  },
  {
    template: {
      id: 'tpl-short-answer-feedback',
      key: 'short-answer-feedback',
      name: 'Short Answer Feedback',
      description:
        "Give brief, encouraging feedback on a learner's short answer.",
      category: 'generic',
      activeVersion: 1,
      variables: [
        {
          name: 'QUESTION',
          description: 'The prompt the learner answered.',
          required: true,
          type: 'string',
          example: 'What is the opposite of "big"?',
        },
        {
          name: 'EXPECTED',
          description: 'The expected/correct answer to ground the feedback.',
          required: true,
          type: 'string',
          example: 'small',
        },
        {
          name: 'ANSWER',
          description: "The learner's actual answer.",
          required: true,
          type: 'string',
          example: 'little',
        },
        {
          name: 'LEVEL',
          description: 'CEFR level of the learner.',
          required: true,
          type: 'enum',
          allowed: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
          example: 'A1',
        },
        {
          name: 'LANGUAGE',
          description: "Learner's native language for a short gloss.",
          required: false,
          type: 'string',
          example: 'Vietnamese',
        },
      ],
    },
    versions: [
      {
        id: 'tpl-short-answer-feedback-v1',
        templateId: 'tpl-short-answer-feedback',
        version: 1,
        status: 'active',
        model: MODELS.HAIKU,
        maxOutputTokens: 200,
        createdAt: CREATED_AT,
        notes: 'Ground the verdict in EXPECTED; never invent a score.',
        body: [
          'A {{LEVEL}} learner answered the question "{{QUESTION}}".',
          'Expected answer: "{{EXPECTED}}". Their answer: "{{ANSWER}}".',
          'In two short sentences, say whether it is correct, and if not, gently',
          'give the correct answer and one tip. Be encouraging.',
        ].join(' '),
      },
    ],
  },
];
