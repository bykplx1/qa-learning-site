import type { CompletedAttempt } from '../quiz/persistence.js';

const QUIZ_ATTEMPT_PREFIX = 'quiz_attempt_';
const LESSON_COMPLETE_PREFIX = 'lesson_complete_';

export interface MergeStorage {
  keys(): string[];
  getItem(key: string): string | null;
  removeItem(key: string): void;
}

export interface PendingMerge {
  quizAttempts: Array<{ key: string; attempt: CompletedAttempt }>;
  lessonCompletes: Array<{ key: string; slug: string }>;
}

export interface MergeResult {
  uploaded: { quizzes: number; lessons: number };
  failedKeys: string[];
}

export function collectPending(storage: MergeStorage): PendingMerge {
  const quizAttempts: PendingMerge['quizAttempts'] = [];
  const lessonCompletes: PendingMerge['lessonCompletes'] = [];

  for (const key of storage.keys()) {
    if (key.startsWith(QUIZ_ATTEMPT_PREFIX)) {
      const raw = storage.getItem(key);
      if (!raw) continue;
      try {
        const attempt = JSON.parse(raw) as CompletedAttempt;
        if (
          attempt &&
          typeof attempt.quizSlug === 'string' &&
          typeof attempt.score === 'number' &&
          typeof attempt.total === 'number' &&
          Array.isArray(attempt.answers)
        ) {
          quizAttempts.push({ key, attempt });
        }
      } catch {
        // skip malformed
      }
    } else if (key.startsWith(LESSON_COMPLETE_PREFIX)) {
      const slug = key.slice(LESSON_COMPLETE_PREFIX.length);
      if (slug) lessonCompletes.push({ key, slug });
    }
  }

  return { quizAttempts, lessonCompletes };
}

export async function runSessionMerge(opts: {
  storage: MergeStorage;
  fetchFn?: typeof fetch;
}): Promise<MergeResult> {
  const fetchFn = opts.fetchFn ?? fetch;
  const pending = collectPending(opts.storage);
  const failedKeys: string[] = [];
  let quizzesOk = 0;
  let lessonsOk = 0;

  for (const { key, attempt } of pending.quizAttempts) {
    try {
      const res = await fetchFn('/api/quiz/attempts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          quiz_slug: attempt.quizSlug,
          mode: attempt.mode,
          score: attempt.score,
          total: attempt.total,
          answers: attempt.answers,
          duration_sec: attempt.durationSec,
        }),
      });
      if (res.ok) {
        opts.storage.removeItem(key);
        quizzesOk += 1;
      } else {
        failedKeys.push(key);
      }
    } catch {
      failedKeys.push(key);
    }
  }

  for (const { key, slug } of pending.lessonCompletes) {
    try {
      const res = await fetchFn(`/api/lessons/${encodeURIComponent(slug)}/complete`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        opts.storage.removeItem(key);
        lessonsOk += 1;
      } else {
        failedKeys.push(key);
      }
    } catch {
      failedKeys.push(key);
    }
  }

  return { uploaded: { quizzes: quizzesOk, lessons: lessonsOk }, failedKeys };
}
