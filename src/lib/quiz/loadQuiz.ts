import { parse } from 'yaml';
import { quizFileSchema, type QuizFile, type QuizQuestion } from './schema.js';
import { repairWin1252 } from '../encoding/repair.js';

// Eagerly load all quiz YAML files at build time via Vite's import.meta.glob.
// Using ?raw so we receive the raw string and can apply repairWin1252 before parsing.
const quizGlob = import.meta.glob('../../generated/quiz/*.quiz.yaml', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

/** Derive the topic slug from a glob key like `../../generated/quiz/api-testing.quiz.yaml`. */
export function slugFromGlobKey(key: string): string {
  const base = key.split('/').pop() ?? key;
  return base.replace(/\.quiz\.yaml$/, '');
}

export interface LoadedQuiz extends QuizFile {
  slug: string;
}

/**
 * Parse, repair, and validate a single raw YAML string.
 * Returns the validated quiz + its slug, or null if validation fails.
 * Validation failures are logged with console.warn (skip-with-warn).
 */
function parseOne(raw: string, slug: string): LoadedQuiz | null {
  const repaired = repairWin1252(raw);
  const result = quizFileSchema.safeParse(parse(repaired));
  if (!result.success) {
    console.warn(`[quiz/loadQuiz] Schema validation failed for "${slug}":`, result.error.issues);
    return null;
  }
  return { slug, ...result.data };
}

let _cache: LoadedQuiz[] | null = null;

/**
 * Returns all quizzes, validated and win1252-repaired.
 * Result is memoised for the lifetime of the build/request.
 */
export function loadAllQuizzes(): LoadedQuiz[] {
  if (_cache) return _cache;
  const result: LoadedQuiz[] = [];
  for (const [key, raw] of Object.entries(quizGlob)) {
    const slug = slugFromGlobKey(key);
    const quiz = parseOne(raw, slug);
    if (quiz) result.push(quiz);
  }
  _cache = result;
  return result;
}

/**
 * Returns the quiz for a single topic slug, or null if not found / fails validation.
 */
export function loadQuizBySlug(slug: string): LoadedQuiz | null {
  const all = loadAllQuizzes();
  return all.find((q) => q.slug === slug) ?? null;
}

/**
 * Returns only quizzes whose slug is in the provided live-curriculum slug set.
 * Use this instead of loadAllQuizzes() wherever counts must reflect reachable content.
 */
export function loadReachableQuizzes(liveSlugs: ReadonlySet<string>): LoadedQuiz[] {
  return loadAllQuizzes().filter((q) => liveSlugs.has(q.slug));
}

/**
 * Returns all validated, win1252-repaired quiz questions from all files,
 * with each question id namespaced as `<slug>:<id>`.
 * Used by exam/pool.ts as the canonical pool source.
 */
export function loadExamPool(): Array<{ slug: string; questions: QuizQuestion[] }> {
  return loadAllQuizzes().map((quiz) => ({
    slug: quiz.slug,
    questions: quiz.questions.map((q) => ({ ...q, id: `${quiz.slug}:${q.id}` })),
  }));
}

/**
 * Like loadExamPool() but scoped to banks matching the live-curriculum slug set.
 * Pass the slug set derived from getCollection('curriculum') at the call site.
 */
export function loadReachableExamPool(
  liveSlugs: ReadonlySet<string>,
): Array<{ slug: string; questions: QuizQuestion[] }> {
  return loadReachableQuizzes(liveSlugs).map((quiz) => ({
    slug: quiz.slug,
    questions: quiz.questions.map((q) => ({ ...q, id: `${quiz.slug}:${q.id}` })),
  }));
}
