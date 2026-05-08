import { parse } from 'yaml';
import { sortLessons, type LessonEntry } from '../lessons/order.js';
import { quizFileSchema, type QuizQuestion } from '../quiz/schema.js';
import { EXAM_QUESTION_COUNT } from './config.js';

const quizFiles = import.meta.glob('../../generated/quiz/*.quiz.yaml', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

function lookupQuizYaml(slug: string): string | null {
  const suffix = `${slug}.quiz.yaml`;
  for (const key of Object.keys(quizFiles)) {
    if (key.endsWith(suffix)) return quizFiles[key];
  }
  return null;
}

export function buildExamPool(lessons: LessonEntry[]): QuizQuestion[] {
  const sorted = sortLessons(lessons);
  const buckets: QuizQuestion[][] = [];
  for (const lesson of sorted) {
    const yaml = lookupQuizYaml(lesson.data.slug);
    if (!yaml) continue;
    const parsed = quizFileSchema.safeParse(parse(yaml));
    if (!parsed.success) continue;
    buckets.push(parsed.data.questions);
  }

  const pool: QuizQuestion[] = [];
  let cursor = 0;
  while (pool.length < EXAM_QUESTION_COUNT) {
    let added = 0;
    for (const bucket of buckets) {
      if (pool.length >= EXAM_QUESTION_COUNT) break;
      if (cursor < bucket.length) {
        pool.push(bucket[cursor]);
        added++;
      }
    }
    if (added === 0) break;
    cursor++;
  }
  return pool.slice(0, EXAM_QUESTION_COUNT);
}
