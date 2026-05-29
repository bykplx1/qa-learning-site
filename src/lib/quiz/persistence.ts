import type { PersistedQuizState } from './engine.js';

export interface CompletedAttempt {
  attemptId: string;
  quizSlug: string;
  mode: import('./engine.js').QuizMode;
  score: number;
  total: number;
  answers: Array<number | number[] | null>;
  durationSec: number;
}

// ── Pluggable seam: only the variation that is real ──────────────────────────
// Progress (resume) is always sessionStorage — see the functions below.
// Only where a completed attempt goes (local vs. server POST) varies by auth state.

export interface QuizPersistenceAdapter {
  recordAttempt(attempt: CompletedAttempt): Promise<{ id: string | null }>;
}

// ── In-flight quiz progress — sessionStorage, always ─────────────────────────

const PROGRESS_KEY = (slug: string) => `quiz_${slug}`;
export const PENDING_ATTEMPT_KEY = (slug: string) => `quiz_attempt_${slug}`;

export function loadQuizProgress(quizSlug: string): PersistedQuizState | null {
  try {
    const raw = sessionStorage.getItem(PROGRESS_KEY(quizSlug));
    return raw ? (JSON.parse(raw) as PersistedQuizState) : null;
  } catch {
    return null;
  }
}

export function saveQuizProgress(quizSlug: string, state: PersistedQuizState): void {
  try {
    sessionStorage.setItem(PROGRESS_KEY(quizSlug), JSON.stringify(state));
  } catch {}
}

export function clearQuizProgress(quizSlug: string): void {
  try {
    sessionStorage.removeItem(PROGRESS_KEY(quizSlug));
  } catch {}
}

// ── Adapters: differ only in where a completed attempt is recorded ────────────

export const sessionStorageAdapter: QuizPersistenceAdapter = {
  async recordAttempt(attempt) {
    try {
      sessionStorage.setItem(PENDING_ATTEMPT_KEY(attempt.quizSlug), JSON.stringify(attempt));
      clearQuizProgress(attempt.quizSlug);
    } catch {}
    return { id: null };
  },
};

export const dbAdapter: QuizPersistenceAdapter = {
  async recordAttempt(attempt) {
    const res = await fetch('/api/quiz/attempts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        attempt_id: attempt.attemptId,
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
    clearQuizProgress(attempt.quizSlug);
    return { id: data.id ?? null };
  },
};

export function selectAdapter(isSignedIn: boolean): QuizPersistenceAdapter {
  return isSignedIn ? dbAdapter : sessionStorageAdapter;
}
