import { type QuizQuestion } from '../quiz/schema.js';
import { loadExamPool, slugFromGlobKey } from '../quiz/loadQuiz.js';
import { EXAM_QUESTION_COUNT } from './config.js';

export { slugFromGlobKey as slugFromKey };

export function buildExamPool(): QuizQuestion[] {
  const poolBuckets = loadExamPool();
  const sortedBuckets = poolBuckets.slice().sort((a, b) => a.slug.localeCompare(b.slug));
  const buckets: QuizQuestion[][] = sortedBuckets.map((b) => b.questions);

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
