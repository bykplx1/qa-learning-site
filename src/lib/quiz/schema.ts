import { z } from 'zod';

export const quizQuestionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['single', 'multi', 'true_false', 'fill_blank']),
  q: z.string().min(1),
  options: z.array(z.string().min(1)).optional(),
  answer: z.union([z.number().int().nonnegative(), z.array(z.number().int().nonnegative())]),
  hint: z.string().optional(),
  explanation: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.array(z.string().min(1)).optional(),
});

export const taskQuestionSchema = z.object({
  id: z.string().min(1),
  type: z.literal('fill_blank'),
  q: z.string().min(1),
  answer: z.string().min(1),
  hint: z.string().optional(),
  explanation: z.string().optional(),
});

export const quizFileSchema = z.object({
  lesson: z.string().min(1),
  questions: z.array(quizQuestionSchema),
});

// Dedicated ISTQB certificate exam bank — same question shape as a quiz, but
// keyed by certificate id rather than a lesson slug.
export const examBankSchema = z.object({
  certificate: z.string().min(1),
  questions: z.array(quizQuestionSchema).min(1),
});

export const tasksFileSchema = z.object({
  lesson: z.string().min(1),
  tasks: z.array(taskQuestionSchema),
});

export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
export type TaskQuestion = z.infer<typeof taskQuestionSchema>;
export type QuizFile = z.infer<typeof quizFileSchema>;
export type TasksFile = z.infer<typeof tasksFileSchema>;
export type ExamBank = z.infer<typeof examBankSchema>;
