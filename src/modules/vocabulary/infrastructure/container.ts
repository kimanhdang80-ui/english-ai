import 'server-only';

import { prisma } from '@/lib/prisma';

import { UserVocabularyService } from '@/modules/vocabulary/application/services/user-vocabulary-service';
import { VocabularyService } from '@/modules/vocabulary/application/services/vocabulary-service';

import {
  PrismaUserVocabularyRepository,
  PrismaVocabularyRepository,
} from './repositories';

/**
 * Composition root for the Vocabulary module — wires services to Prisma repos.
 * Presentation (routes / server components) imports `vocabulary` only.
 */
const vocabularyRepo = new PrismaVocabularyRepository(prisma);
const userVocabularyRepo = new PrismaUserVocabularyRepository(prisma);

export const vocabulary = {
  catalog: new VocabularyService(vocabularyRepo),
  learner: new UserVocabularyService(userVocabularyRepo),
};

export type VocabularyContainer = typeof vocabulary;
