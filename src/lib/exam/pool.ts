import { parse } from 'yaml';
import { quizFileSchema, type QuizQuestion } from '../quiz/schema.js';
import { EXAM_QUESTION_COUNT } from './config.js';

const quizFiles = import.meta.glob('../../generated/quiz/*.quiz.yaml', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

export function buildExamPool(): QuizQuestion[] {
  const sortedKeys = Object.keys(quizFiles).sort();
  const buckets: QuizQuestion[][] = [];
  for (const key of sortedKeys) {
    const parsed = quizFileSchema.safeParse(parse(quizFiles[key]));
    if (!parsed.success) continue;
    buckets.push(parsed.data.questions);
  }

  const pool: QuizQuestion[] = [];
  const seenIds = new Set<string>();
  let cursor = 0;
  while (pool.length < EXAM_QUESTION_COUNT) {
    let added = 0;
    for (const bucket of buckets) {
      if (pool.length >= EXAM_QUESTION_COUNT) break;
      if (cursor < bucket.length) {
        const q = bucket[cursor];
        if (!seenIds.has(q.id)) {
          seenIds.add(q.id);
          pool.push(q);
          added++;
        }
      }
    }
    if (added === 0) break;
    cursor++;
  }
  return pool.slice(0, EXAM_QUESTION_COUNT);
}
