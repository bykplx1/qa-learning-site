import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadQuizProgress,
  saveQuizProgress,
  clearQuizProgress,
  sessionStorageAdapter,
  dbAdapter,
  PENDING_ATTEMPT_KEY,
} from './persistence.js';
import type { PersistedQuizState } from './engine.js';
import type { CompletedAttempt } from './persistence.js';

// ── sessionStorage stub ───────────────────────────────────────────────────────

const store: Record<string, string> = {};

const storageMock = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
};

beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
  vi.stubGlobal('sessionStorage', storageMock);
});

// ── shared progress round-trip ────────────────────────────────────────────────

describe('quiz progress (sessionStorage)', () => {
  const slug = 'test-design-techniques';
  const state: PersistedQuizState = {
    currentIndex: 2,
    answers: [0, null, [1, 2]],
    feedback: false,
    status: 'active',
  };

  it('returns null when nothing is stored', () => {
    expect(loadQuizProgress(slug)).toBeNull();
  });

  it('round-trips save → load', () => {
    saveQuizProgress(slug, state);
    expect(loadQuizProgress(slug)).toEqual(state);
  });

  it('clearQuizProgress removes the stored state', () => {
    saveQuizProgress(slug, state);
    clearQuizProgress(slug);
    expect(loadQuizProgress(slug)).toBeNull();
  });

  it('different slugs are isolated', () => {
    saveQuizProgress('slug-a', { ...state, currentIndex: 1 });
    saveQuizProgress('slug-b', { ...state, currentIndex: 5 });
    expect(loadQuizProgress('slug-a')?.currentIndex).toBe(1);
    expect(loadQuizProgress('slug-b')?.currentIndex).toBe(5);
  });
});

// ── recording fork ────────────────────────────────────────────────────────────

const attempt: CompletedAttempt = {
  attemptId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  quizSlug: 'boundary-value-analysis',
  mode: 'practice',
  score: 7,
  total: 10,
  answers: [0, 1, null],
  durationSec: 120,
};

describe('sessionStorageAdapter.recordAttempt', () => {
  it('stores attempt under PENDING_ATTEMPT_KEY and clears progress', async () => {
    const state: PersistedQuizState = { currentIndex: 0, answers: [], feedback: false, status: 'active' };
    saveQuizProgress(attempt.quizSlug, state);

    const result = await sessionStorageAdapter.recordAttempt(attempt);

    expect(result).toEqual({ id: null });
    const stored = storageMock.getItem(PENDING_ATTEMPT_KEY(attempt.quizSlug));
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!)).toMatchObject({ quizSlug: attempt.quizSlug, score: 7 });
    // progress cleared
    expect(loadQuizProgress(attempt.quizSlug)).toBeNull();
  });
});

describe('dbAdapter.recordAttempt', () => {
  it('POSTs to /api/quiz/attempts and clears progress on success', async () => {
    const state: PersistedQuizState = { currentIndex: 0, answers: [], feedback: false, status: 'active' };
    saveQuizProgress(attempt.quizSlug, state);

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'server-id-123' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await dbAdapter.recordAttempt(attempt);

    expect(result).toEqual({ id: 'server-id-123' });
    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/quiz/attempts');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string);
    expect(body.quiz_slug).toBe(attempt.quizSlug);
    expect(body.attempt_id).toBe(attempt.attemptId);
    // progress cleared
    expect(loadQuizProgress(attempt.quizSlug)).toBeNull();
  });

  it('returns { id: null } when the server responds with an error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const result = await dbAdapter.recordAttempt(attempt);
    expect(result).toEqual({ id: null });
  });
});
