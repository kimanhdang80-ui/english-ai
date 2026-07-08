'use client';

import * as React from 'react';

import { Button, type ButtonProps } from '@/components/ui/button';
import { apiPost } from '@/lib/api-client';
import type { UserVocabularyState } from '@/modules/vocabulary/domain/entities';

/** Adds a word to the learner's set via POST /api/v1/user-vocabulary. */
export function AddToLearningButton({
  vocabularyId,
  size = 'sm',
  variant = 'default',
}: {
  vocabularyId: string;
} & Pick<ButtonProps, 'size' | 'variant'>) {
  const [state, setState] = React.useState<
    'idle' | 'loading' | 'added' | 'error'
  >('idle');

  async function add() {
    setState('loading');
    try {
      await apiPost<UserVocabularyState>('/api/v1/user-vocabulary', {
        vocabularyId,
      });
      setState('added');
    } catch {
      setState('error');
    }
  }

  return (
    <Button
      size={size}
      variant={state === 'added' ? 'outline' : variant}
      onClick={add}
      disabled={state === 'loading' || state === 'added'}
    >
      {state === 'added'
        ? 'Added ✓'
        : state === 'loading'
          ? 'Adding…'
          : state === 'error'
            ? 'Retry'
            : 'Add to learning'}
    </Button>
  );
}
