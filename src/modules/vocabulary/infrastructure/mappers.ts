import { Prisma } from '@prisma/client';

import type {
  Accent,
  PartOfSpeech,
  ReviewCard,
  UserVocabularyState,
  Vocabulary,
} from '@/modules/vocabulary/domain/entities';
import type { UserVocabularyRecord } from '@/modules/vocabulary/application/ports';

/** Canonical include for a full word entry. */
export const vocabularyInclude = {
  meanings: { orderBy: { sortOrder: 'asc' } },
  examples: { orderBy: { sortOrder: 'asc' } },
  pronunciations: { orderBy: { isPrimary: 'desc' } },
  audios: true,
  images: { orderBy: { isPrimary: 'desc' } },
  tags: { include: { tag: true } },
} satisfies Prisma.VocabularyInclude;

export type VocabularyWithRelations = Prisma.VocabularyGetPayload<{
  include: typeof vocabularyInclude;
}>;

export function mapVocabulary(v: VocabularyWithRelations): Vocabulary {
  return {
    id: v.id,
    word: v.word,
    slug: v.slug,
    lemma: v.lemma,
    cefrLevelId: v.cefrLevelId,
    frequencyRank: v.frequencyRank,
    meanings: v.meanings.map((m) => ({
      id: m.id,
      partOfSpeech: m.partOfSpeech as PartOfSpeech,
      definition: m.definition,
      translation: m.translation,
    })),
    examples: v.examples.map((e) => ({
      id: e.id,
      meaningId: e.meaningId,
      text: e.text,
      translation: e.translation,
    })),
    pronunciations: v.pronunciations.map((p) => ({
      id: p.id,
      ipa: p.ipa,
      accent: p.accent as Accent,
      isPrimary: p.isPrimary,
    })),
    audios: v.audios.map((a) => ({
      id: a.id,
      url: a.url,
      accent: (a.accent as Accent | null) ?? null,
    })),
    images: v.images.map((i) => ({
      id: i.id,
      url: i.url,
      alt: i.alt,
      isPrimary: i.isPrimary,
    })),
    tags: v.tags.map((t) => t.tag.name),
  };
}

/** Include for a user entry joined with its full word (review/study cards). */
export const userVocabularyWithVocabularyInclude = {
  vocabulary: { include: vocabularyInclude },
} satisfies Prisma.UserVocabularyInclude;

type UserVocabularyWithVocabulary = Prisma.UserVocabularyGetPayload<{
  include: typeof userVocabularyWithVocabularyInclude;
}>;

/** Map a user entry (+ joined word) to a ReviewCard. Shared by listDue/listStudySet. */
export function toReviewCard(uv: UserVocabularyWithVocabulary): ReviewCard {
  return {
    vocabulary: mapVocabulary(uv.vocabulary),
    state: {
      id: uv.id,
      vocabularyId: uv.vocabularyId,
      status: uv.status as UserVocabularyState['status'],
      isFavorite: uv.isFavorite,
      ease: uv.ease,
      intervalDays: uv.intervalDays,
      repetitions: uv.repetitions,
      dueAt: uv.dueAt.toISOString(),
      lastReviewedAt: uv.lastReviewedAt
        ? uv.lastReviewedAt.toISOString()
        : null,
    },
  };
}

export function mapUserRecord(u: {
  id: string;
  vocabularyId: string;
  status: string;
  isFavorite: boolean;
  ease: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  dueAt: Date;
  lastReviewedAt: Date | null;
}): UserVocabularyRecord {
  return {
    id: u.id,
    vocabularyId: u.vocabularyId,
    status: u.status as UserVocabularyState['status'],
    isFavorite: u.isFavorite,
    ease: u.ease,
    intervalDays: u.intervalDays,
    repetitions: u.repetitions,
    lapses: u.lapses,
    dueAt: u.dueAt.toISOString(),
    lastReviewedAt: u.lastReviewedAt ? u.lastReviewedAt.toISOString() : null,
  };
}
