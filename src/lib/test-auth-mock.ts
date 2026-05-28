/**
 * Server-side fetch interceptor + zero-DB auth mock for E2E tests.
 *
 * When E2E_OAUTH_MOCK=1, intercepts outbound calls to GitHub OAuth endpoints
 * and returns deterministic test responses. Also exports helpers used by API
 * route handlers to short-circuit all DB calls during the e2e-a11y CI job
 * (which sets E2E_OAUTH_MOCK=1 but does not provide DATABASE_URL).
 *
 * Imported as a side effect from src/lib/auth.ts when the env flag is set.
 * Nothing in this file is bundled for production.
 */

import { randomUUID } from 'node:crypto';
import type { LessonMetaRecord } from './curriculum/lesson-meta';

// ─── Constants ────────────────────────────────────────────────────────────────

export const MOCK_SESSION_TOKEN = 'mock-e2e-session-token';
export const MOCK_USER_ID = 'mock-e2e-user-id';

const MOCK_USER = {
  id: MOCK_USER_ID,
  name: 'E2E User',
  email: 'e2e@example.com',
  emailVerified: true,
  image: 'https://example.com/e2e.png',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  githubHandle: 'e2e-user',
};

const MOCK_SESSION = {
  id: 'mock-e2e-session-id',
  userId: MOCK_USER_ID,
  token: MOCK_SESSION_TOKEN,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ipAddress: null,
  userAgent: null,
};

// ─── In-memory store (survives across requests within one dev-server process) ─
// Anchored to globalThis so module re-evaluation (Vite HMR, SSR worker isolation)
// does not produce a second instance that is invisible to the read path.

interface StoredAttempt {
  id: string;
  quizSlug: string;
  mode: string;
  score: number;
  total: number;
  answers: unknown[];
  durationSec: number;
  attemptedAt: Date;
}

interface StoredLesson {
  lessonSlug: string;
  completedAt: Date;
}

interface MockStore {
  attempts: StoredAttempt[];
  lessons: StoredLesson[];
  reset(): void;
}

const _global = globalThis as typeof globalThis & { __mockStore?: MockStore };
if (!_global.__mockStore) {
  _global.__mockStore = {
    attempts: [],
    lessons: [],
    reset() {
      this.attempts = [];
      this.lessons = [];
    },
  };
}

export const mockStore: MockStore = _global.__mockStore;

// ─── OAuth fetch interceptor ──────────────────────────────────────────────────

let installed = false;

export function installOAuthMock(): void {
  if (installed) return;
  installed = true;

  const realFetch = globalThis.fetch;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : (input as Request).url;

    if (url.includes('github.com/login/oauth/access_token')) {
      return new Response(
        JSON.stringify({
          access_token: 'gho_e2e_test',
          token_type: 'bearer',
          scope: 'read:user,user:email',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }
    if (url.includes('api.github.com/user/emails')) {
      return new Response(
        JSON.stringify([{ email: 'e2e@example.com', primary: true, verified: true }]),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }
    if (url.includes('api.github.com/user')) {
      return new Response(
        JSON.stringify({
          id: 99001,
          login: 'e2e-user',
          name: 'E2E User',
          email: 'e2e@example.com',
          avatar_url: 'https://example.com/e2e.png',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    return realFetch(input, init);
  }) as typeof fetch;
}

// ─── Cookie helpers ───────────────────────────────────────────────────────────

function parseCookies(cookieHeader: string | null): Map<string, string> {
  const map = new Map<string, string>();
  if (!cookieHeader) return map;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    try {
      map.set(part.slice(0, idx).trim(), decodeURIComponent(part.slice(idx + 1).trim()));
    } catch {
      map.set(part.slice(0, idx).trim(), part.slice(idx + 1).trim());
    }
  }
  return map;
}

function hasMockToken(headers: Headers): boolean {
  const cookies = parseCookies(headers.get('cookie'));
  return (
    cookies.get('better-auth.session_token') === MOCK_SESSION_TOKEN ||
    cookies.get('__Secure-better-auth.session_token') === MOCK_SESSION_TOKEN
  );
}

// ─── getSession mock ──────────────────────────────────────────────────────────

export type MockSession = { session: typeof MOCK_SESSION; user: typeof MOCK_USER } | null;

export function getMockSession(headers: Headers): MockSession {
  return hasMockToken(headers) ? { session: MOCK_SESSION, user: MOCK_USER } : null;
}

// ─── Mock user seeding ────────────────────────────────────────────────────────
// FK-bound tables (review_cards, self_explanations, quiz_attempts, ...) require
// the mock user row to exist before any write referencing MOCK_USER_ID succeeds.
// Idempotent and memoized — first caller does the insert, subsequent callers
// await the same promise.

let mockUserSeeded: Promise<void> | null = null;

export function ensureMockUser(): Promise<void> {
  if (mockUserSeeded) return mockUserSeeded;
  // No DB attached (e.g. e2e-a11y job before PR #216) — nothing to seed.
  if (!process.env.DATABASE_URL) {
    mockUserSeeded = Promise.resolve();
    return mockUserSeeded;
  }
  mockUserSeeded = (async () => {
    const { db } = await import('../db');
    const { users, sessions } = await import('../db/schema');
    await db
      .insert(users)
      .values({
        id: MOCK_USER.id,
        email: MOCK_USER.email,
        name: MOCK_USER.name,
        avatar: MOCK_USER.image,
        githubHandle: MOCK_USER.githubHandle,
        emailVerified: MOCK_USER.emailVerified,
      })
      .onConflictDoNothing();
    await db
      .insert(sessions)
      .values({
        id: MOCK_SESSION.id,
        userId: MOCK_SESSION.userId,
        token: MOCK_SESSION.token,
        expiresAt: MOCK_SESSION.expiresAt,
      })
      .onConflictDoNothing();
  })();
  return mockUserSeeded;
}

// ─── Mock auth handler ────────────────────────────────────────────────────────

const SESSION_COOKIE = `better-auth.session_token=${MOCK_SESSION_TOKEN}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`;

export type MockAuth = {
  handler: (request: Request) => Response;
  api: {
    getSession: (opts: { headers: Headers }) => Promise<MockSession>;
  };
};

export function createMockAuth(): MockAuth {
  return {
    handler(request: Request): Response {
      const url = new URL(request.url);
      const path = url.pathname;

      // POST /api/auth/sign-in/social → return fake GitHub authorize URL
      if (request.method === 'POST' && path.includes('/sign-in/social')) {
        const githubAuthorize = new URL('https://github.com/login/oauth/authorize');
        githubAuthorize.searchParams.set('client_id', process.env.GITHUB_CLIENT_ID ?? 'mock');
        githubAuthorize.searchParams.set('state', 'mock-e2e-state');
        githubAuthorize.searchParams.set('redirect_uri', `${url.origin}/api/auth/callback/github`);
        return new Response(JSON.stringify({ url: githubAuthorize.toString() }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }

      // GET /api/auth/callback/github → set session cookie + redirect
      if (request.method === 'GET' && path.includes('/callback/github')) {
        const callbackURL = url.searchParams.get('callbackURL') ?? '/';
        return new Response(null, {
          status: 302,
          headers: { location: callbackURL, 'set-cookie': SESSION_COOKIE },
        });
      }

      // GET /api/auth/get-session → return session JSON (used by auth client)
      if (request.method === 'GET' && path.includes('/get-session')) {
        const session = getMockSession(request.headers);
        return new Response(JSON.stringify(session ? { session: MOCK_SESSION, user: MOCK_USER } : null), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }

      // POST /api/auth/sign-out → clear cookie
      if (path.includes('/sign-out')) {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: {
            'content-type': 'application/json',
            'set-cookie': 'better-auth.session_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
          },
        });
      }

      return new Response('Not found (mock auth)', { status: 404 });
    },

    api: {
      async getSession({ headers }: { headers: Headers }): Promise<MockSession> {
        return getMockSession(headers);
      },
    },
  };
}

// ─── Mock DB query helpers ────────────────────────────────────────────────────

export async function mockRecordQuizAttempt(input: {
  userId: string;
  attemptId: string;
  quizSlug: string;
  mode: string;
  score: number;
  total: number;
  answers: unknown[];
  durationSec?: number;
}): Promise<{ id: string }> {
  const id = randomUUID();
  mockStore.attempts.push({
    id,
    quizSlug: input.quizSlug,
    mode: input.mode,
    score: input.score,
    total: input.total,
    answers: input.answers,
    durationSec: input.durationSec ?? 0,
    attemptedAt: new Date(),
  });
  return { id };
}

export function mockMarkLessonComplete(input: { lessonSlug: string }): void {
  const existing = mockStore.lessons.find((l) => l.lessonSlug === input.lessonSlug);
  if (!existing) {
    mockStore.lessons.push({ lessonSlug: input.lessonSlug, completedAt: new Date() });
  }
}

export function mockLoadProfile(lessonMetaMap?: Map<string, LessonMetaRecord>) {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const hasActivityToday =
    mockStore.attempts.some((a) => a.attemptedAt.toISOString().slice(0, 10) === todayStr) ||
    mockStore.lessons.some((l) => l.completedAt.toISOString().slice(0, 10) === todayStr);

  const lessonHref = (slug: string, suffix = ''): string => {
    const cluster = lessonMetaMap?.get(slug)?.cluster;
    return cluster ? `/lessons/${cluster}/${slug}${suffix}` : `/lessons/${slug}${suffix}`;
  };
  const lessonTitle = (slug: string): string => lessonMetaMap?.get(slug)?.title ?? slug;

  const recentActivity = [
    ...mockStore.lessons.map((l) => ({
      kind: 'lesson' as const,
      slug: l.lessonSlug,
      title: lessonTitle(l.lessonSlug),
      timestamp: l.completedAt,
      href: lessonHref(l.lessonSlug),
    })),
    ...mockStore.attempts.map((a) => ({
      kind: 'quiz' as const,
      slug: a.quizSlug,
      title: lessonTitle(a.quizSlug),
      timestamp: a.attemptedAt,
      href: lessonHref(a.quizSlug, '#quiz'),
      score: a.score,
      total: a.total,
      mode: a.mode,
    })),
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return {
    streak: { current: hasActivityToday ? 1 : 0, longest: hasActivityToday ? 1 : 0 },
    heatmap: { year: today.getUTCFullYear(), cells: [] },
    categoryProgress: [],
    accuracyByTopic: [],
    recentActivity,
    submissions: [],
    completedCount: mockStore.lessons.length,
    attemptCount: mockStore.attempts.length,
    retentionSummary: { retentionPct: null, latestStabilityDays: null, dueCount: 0 },
    selfExplanationCount: 0,
    cardsPerSession: null,
  };
}
