import { z } from 'zod';

/**
 * Mission Library content schema (Task 04). Authored content lives as JSON under
 * `content/tracks/*.json` and `content/missions/<track>/<id>.json` — NOT hard-coded in
 * components. This schema is the importable contract: a future seed can validate + load these
 * files into the Mission Engine (docs/MISSION_ENGINE.md) without changing the engine/DB/API.
 *
 * Content conventions: `meaning` is a Vietnamese gloss (native-language scaffolding for A0–A1
 * learners, per docs/product); `example`/`dialogue` are natural English at A0–A1.
 */

export const VocabularyItemSchema = z.object({
  word: z.string().min(1),
  ipa: z.string().min(1),
  meaning: z.string().min(1), // Vietnamese gloss
  example: z.string().min(1), // English example sentence
});

export const DialogueLineSchema = z.object({
  speaker: z.string().min(1),
  line: z.string().min(1),
});

export const MultipleChoiceSchema = z.object({
  prompt: z.string().min(1),
  options: z.array(z.string().min(1)).length(4),
  answerIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(1),
});

export const FillBlankSchema = z.object({
  prompt: z.string().min(1), // contains a ___ blank
  answer: z.string().min(1),
  hint: z.string().min(1),
  explanation: z.string().min(1),
});

export const MatchingPairSchema = z.object({
  left: z.string().min(1), // English word
  right: z.string().min(1), // Vietnamese meaning
});

export const MatchingSchema = z.object({
  instruction: z.string().min(1),
  pairs: z.array(MatchingPairSchema).min(3).max(6),
});

export const CompletionCriteriaSchema = z.object({
  type: z.enum(['min_quiz_score', 'all_available_activities']),
  minQuizScore: z.number().min(0).max(1).optional(),
  summary: z.string().min(1),
});

export const MissionContentSchema = z.object({
  id: z.string().regex(/^[a-z]+-\d{2}$/), // e.g. general-01
  trackId: z.string().min(1),
  order: z.number().int().min(1).max(10),
  title: z.string().min(1),
  goal: z.string().min(1), // human learning goal
  difficulty: z.enum(['easy', 'medium', 'hard']),
  estimatedMinutes: z.number().int().min(5).max(30),
  prerequisite: z.string().nullable(), // previous mission id, or null for the first
  completionCriteria: CompletionCriteriaSchema,
  vocabulary: z.array(VocabularyItemSchema).length(8),
  dialogue: z.array(DialogueLineSchema).min(8).max(10),
  exercises: z.object({
    multipleChoice: z.array(MultipleChoiceSchema).length(5),
    fillBlank: z.array(FillBlankSchema).length(3),
    matching: z.array(MatchingSchema).length(2),
  }),
  reviewFocus: z.array(z.string().min(1)).length(5),
});

export const TrackContentSchema = z.object({
  id: z.string().min(1),
  key: z.string().regex(/^[a-z]+$/),
  title: z.string().min(1),
  goal: z.string().min(1), // theme: general | business | construction | travel
  cefr: z.string().min(1),
  description: z.string().min(1),
  missionIds: z.array(z.string()).length(10),
});

export type VocabularyItem = z.infer<typeof VocabularyItemSchema>;
export type DialogueLine = z.infer<typeof DialogueLineSchema>;
export type MissionContent = z.infer<typeof MissionContentSchema>;
export type TrackContent = z.infer<typeof TrackContentSchema>;
