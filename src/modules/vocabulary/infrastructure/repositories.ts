import 'server-only';

import type { PrismaClient } from '@prisma/client';

import {
  toPage,
  toSkipTake,
  type Page,
  type PageQuery,
} from '@/modules/learning/domain/pagination';
import type {
  PartOfSpeech,
  ReviewCard,
  Vocabulary,
  VocabularyStats,
  VocabularySummary,
} from '@/modules/vocabulary/domain/entities';
import type { QuizItem } from '@/modules/vocabulary/domain/quiz';
import type {
  UserVocabularyRecord,
  UserVocabularyRepository,
  VocabularyFilter,
  VocabularyRepository,
} from '@/modules/vocabulary/application/ports';

import {
  mapUserRecord,
  mapVocabulary,
  toReviewCard,
  userVocabularyWithVocabularyInclude,
  vocabularyInclude,
} from './mappers';

export class PrismaVocabularyRepository implements VocabularyRepository {
  constructor(private readonly db: PrismaClient) {}

  async list(
    filter: VocabularyFilter,
    page: PageQuery,
  ): Promise<Page<VocabularySummary>> {
    const where = {
      deletedAt: null,
      status: 'published' as const,
      ...(filter.cefrLevelId ? { cefrLevelId: filter.cefrLevelId } : {}),
      ...(filter.search
        ? { word: { contains: filter.search, mode: 'insensitive' as const } }
        : {}),
      ...(filter.tag ? { tags: { some: { tag: { slug: filter.tag } } } } : {}),
    };
    const [rows, total] = await Promise.all([
      this.db.vocabulary.findMany({
        where,
        orderBy: [{ frequencyRank: 'asc' }, { word: 'asc' }],
        include: {
          meanings: { take: 1, orderBy: { sortOrder: 'asc' } },
          pronunciations: { take: 1, orderBy: { isPrimary: 'desc' } },
        },
        ...toSkipTake(page),
      }),
      this.db.vocabulary.count({ where }),
    ]);
    const items: VocabularySummary[] = rows.map((r) => ({
      id: r.id,
      word: r.word,
      slug: r.slug,
      primaryPos: (r.meanings[0]?.partOfSpeech as PartOfSpeech) ?? null,
      primaryDefinition: r.meanings[0]?.definition ?? null,
      ipa: r.pronunciations[0]?.ipa ?? null,
    }));
    return toPage(items, total, page);
  }

  async findById(id: string): Promise<Vocabulary | null> {
    const row = await this.db.vocabulary.findFirst({
      where: { id, deletedAt: null },
      include: vocabularyInclude,
    });
    return row ? mapVocabulary(row) : null;
  }

  async quizItems(limit: number): Promise<QuizItem[]> {
    const rows = await this.db.vocabulary.findMany({
      where: { deletedAt: null, status: 'published' },
      orderBy: [{ frequencyRank: 'asc' }, { word: 'asc' }],
      take: limit,
      include: {
        meanings: { take: 1, orderBy: { sortOrder: 'asc' } },
        examples: { take: 1, orderBy: { sortOrder: 'asc' } },
      },
    });
    return rows
      .filter((r) => r.meanings.length > 0)
      .map((r) => ({
        id: r.id,
        word: r.word,
        definition: r.meanings[0]!.definition,
        exampleText: r.examples[0]?.text ?? null,
      }));
  }
}

export class PrismaUserVocabularyRepository implements UserVocabularyRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByUserAndVocabulary(
    userId: string,
    vocabularyId: string,
  ): Promise<UserVocabularyRecord | null> {
    const row = await this.db.userVocabulary.findUnique({
      where: { userId_vocabularyId: { userId, vocabularyId } },
    });
    return row ? mapUserRecord(row) : null;
  }

  async create(
    userId: string,
    vocabularyId: string,
  ): Promise<UserVocabularyRecord> {
    const row = await this.db.userVocabulary.create({
      data: { userId, vocabularyId, dueAt: new Date(), status: 'new' },
    });
    return mapUserRecord(row);
  }

  async findForUser(
    id: string,
    userId: string,
  ): Promise<UserVocabularyRecord | null> {
    const row = await this.db.userVocabulary.findFirst({
      where: { id, userId },
    });
    return row ? mapUserRecord(row) : null;
  }

  async setFavorite(
    id: string,
    userId: string,
    isFavorite: boolean,
  ): Promise<UserVocabularyRecord> {
    await this.db.userVocabulary.updateMany({
      where: { id, userId },
      data: { isFavorite },
    });
    const row = await this.db.userVocabulary.findUniqueOrThrow({
      where: { id },
    });
    return mapUserRecord(row);
  }

  async recordReview(params: {
    id: string;
    userId: string;
    rating: 'again' | 'hard' | 'good' | 'easy';
    prevIntervalDays: number;
    prevEase: number;
    result: {
      ease: number;
      intervalDays: number;
      repetitions: number;
      lapses: number;
      dueAt: Date;
      status: 'new' | 'learning' | 'known' | 'mastered';
    };
    now: Date;
  }): Promise<UserVocabularyRecord> {
    const { id, userId, rating, prevIntervalDays, prevEase, result, now } =
      params;
    const [updated] = await this.db.$transaction([
      this.db.userVocabulary.update({
        where: { id },
        data: {
          ease: result.ease,
          intervalDays: result.intervalDays,
          repetitions: result.repetitions,
          lapses: result.lapses,
          dueAt: result.dueAt,
          status: result.status,
          lastReviewedAt: now,
        },
      }),
      this.db.reviewHistory.create({
        data: {
          userVocabularyId: id,
          userId,
          rating,
          prevIntervalDays,
          newIntervalDays: result.intervalDays,
          prevEase,
          newEase: result.ease,
          reviewedAt: now,
        },
      }),
    ]);
    return mapUserRecord(updated);
  }

  async listDue(
    userId: string,
    now: Date,
    limit: number,
  ): Promise<ReviewCard[]> {
    const rows = await this.db.userVocabulary.findMany({
      where: { userId, dueAt: { lte: now }, status: { not: 'mastered' } },
      orderBy: { dueAt: 'asc' },
      take: limit,
      include: userVocabularyWithVocabularyInclude,
    });
    return rows.map(toReviewCard);
  }

  async listStudySet(userId: string, limit: number): Promise<ReviewCard[]> {
    const rows = await this.db.userVocabulary.findMany({
      where: { userId },
      orderBy: { dueAt: 'asc' },
      take: limit,
      include: userVocabularyWithVocabularyInclude,
    });
    return rows.map(toReviewCard);
  }

  async stats(userId: string): Promise<VocabularyStats> {
    const now = new Date();
    const [totalWords, studying, learned, dueToday] = await Promise.all([
      this.db.vocabulary.count({
        where: { deletedAt: null, status: 'published' },
      }),
      this.db.userVocabulary.count({ where: { userId } }),
      this.db.userVocabulary.count({
        where: { userId, status: { in: ['known', 'mastered'] } },
      }),
      this.db.userVocabulary.count({
        where: { userId, dueAt: { lte: now }, status: { not: 'mastered' } },
      }),
    ]);
    return {
      totalWords,
      studying,
      learned,
      dueToday,
      completionRate: totalWords > 0 ? learned / totalWords : 0,
    };
  }
}
