import type { PersistedQuizState, QuizMode } from './engine.js';

export interface CompletedAttempt {
  quizSlug: string;
  mode: QuizMode;
  score: number;
  total: number;
  answers: Array<number | number[] | null>;
  durationSec: number;
}

export interface QuizPersistenceAdapter {
  loadProgress(quizSlug: string): PersistedQuizState | null;
  saveProgress(quizSlug: string, state: PersistedQuizState): void;
  clearProgress(quizSlug: string): void;
  recordAttempt(attempt: CompletedAttempt): Promise<{ id: string | null }>;
}

const STORAGE_KEY = (slug: string) => `quiz_${slug}`;

export const sessionStorageAdapter: QuizPersistenceAdapter = {
  loadProgress(quizSlug) {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY(quizSlug));
      return raw ? (JSON.parse(raw) as PersistedQuizState) : null;
    } catch {
      return null;
    }
  },
  saveProgress(quizSlug, state) {
    try {
      sessionStorage.setItem(STORAGE_KEY(quizSlug), JSON.stringify(state));
    } catch {}
  },
  clearProgress(quizSlug) {
    try {
      sessionStorage.removeItem(STORAGE_KEY(quizSlug));
    } catch {}
  },
  async recordAttempt() {
    return { id: null };
  },
};

export const dbAdapter: QuizPersistenceAdapter = {
  loadProgress(quizSlug) {
    return sessionStorageAdapter.loadProgress(quizSlug);
  },
  saveProgress(quizSlug, state) {
    sessionStorageAdapter.saveProgress(quizSlug, state);
  },
  clearProgress(quizSlug) {
    sessionStorageAdapter.clearProgress(quizSlug);
  },
  async recordAttempt(attempt) {
    const res = await fetch('/api/quiz/attempts', {
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
    if (!res.ok) return { id: null };
    const data = (await res.json()) as { id?: string };
    return { id: data.id ?? null };
  },
};

export function selectAdapter(isSignedIn: boolean): QuizPersistenceAdapter {
  return isSignedIn ? dbAdapter : sessionStorageAdapter;
}
