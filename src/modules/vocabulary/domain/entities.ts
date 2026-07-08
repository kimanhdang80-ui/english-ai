/**
 * Vocabulary — domain read models (framework-free, no Prisma imports).
 * Enum unions mirror the Prisma enums.
 */

export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'pronoun'
  | 'preposition'
  | 'conjunction'
  | 'determiner'
  | 'interjection'
  | 'phrase';

export type VocabularyStatus = 'new' | 'learning' | 'known' | 'mastered';
export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';
export type Accent = 'us' | 'uk';

export interface Meaning {
  id: string;
  partOfSpeech: PartOfSpeech;
  definition: string;
  translation: string | null;
}

export interface Example {
  id: string;
  meaningId: string | null;
  text: string;
  translation: string | null;
}

export interface Pronunciation {
  id: string;
  ipa: string;
  accent: Accent;
  isPrimary: boolean;
}

export interface AudioClip {
  id: string;
  url: string;
  accent: Accent | null;
}

export interface Image {
  id: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
}

/** Full word entry for the detail/flashcard views. */
export interface Vocabulary {
  id: string;
  word: string;
  slug: string;
  lemma: string | null;
  cefrLevelId: string | null;
  frequencyRank: number | null;
  meanings: Meaning[];
  examples: Example[];
  pronunciations: Pronunciation[];
  audios: AudioClip[];
  images: Image[];
  tags: string[];
}

/** Lightweight row for the list view. */
export interface VocabularySummary {
  id: string;
  word: string;
  slug: string;
  primaryPos: PartOfSpeech | null;
  primaryDefinition: string | null;
  ipa: string | null;
}

/** A learner's state for a word (SRS + favorite). */
export interface UserVocabularyState {
  id: string;
  vocabularyId: string;
  status: VocabularyStatus;
  isFavorite: boolean;
  ease: number;
  intervalDays: number;
  repetitions: number;
  dueAt: string; // ISO
  lastReviewedAt: string | null;
}

/** A card = the word plus the learner's state (used by review/flashcards). */
export interface ReviewCard {
  vocabulary: Vocabulary;
  state: UserVocabularyState;
}

export interface VocabularyStats {
  totalWords: number;
  studying: number;
  learned: number;
  dueToday: number;
  completionRate: number; // 0..1
}
