/**
 * Dev/preview-only test accounts.
 *
 * Lets us log in as a fixed test persona to walk auth-gated UX (profile, review,
 * projects, exam) on local dev AND on Vercel preview deployments — where real
 * OAuth can't run because preview URLs aren't registered redirect URIs.
 *
 * Unlike `test-auth-mock.ts` (CI e2e: one hardcoded user, zero DB), this path
 * issues a *real* session backed by *real* seeded DB rows, so the genuine
 * production code paths (loadProfile, streak, FSRS, …) are exercised.
 *
 * SECURITY — this is an impersonation backdoor. It is fenced three ways:
 *   1. Hard stop: returns disabled whenever VERCEL_ENV === 'production'.
 *   2. Opt-in: requires ENABLE_TEST_LOGIN === '1'.
 *   3. Secret: issuing a session requires the caller to present TEST_LOGIN_SECRET.
 * The cookie itself is HMAC-signed so it cannot be forged client-side.
 *
 * Server-only. Never import this from a client:* island.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

// ─── Personas ───────────────────────────────────────────────────────────────

export interface Persona {
  /** URL-friendly key used in the picker and POST body. */
  key: string;
  /** Stable DB user id — seeded rows are keyed on this. */
  id: string;
  name: string;
  email: string;
  image: string | null;
  blurb: string;
  /** When true, login seeds progress (quizzes, completions, streak, review cards). */
  populated: boolean;
}

export const personas: Persona[] = [
  {
    key: 'empty',
    id: 'test-empty-user',
    name: 'Tess Newbie',
    email: 'test-empty@qa-learning.test',
    image: null,
    blurb: 'Brand-new account — empty profile, no streak, zero progress. Tests first-run / onboarding UX.',
    populated: false,
  },
  {
    key: 'power',
    id: 'test-power-user',
    name: 'Parker Power',
    email: 'test-power@qa-learning.test',
    image: null,
    blurb: 'Seeded with quiz attempts, completed lessons, a multi-day streak, a project submission, and review cards. Tests dashboards / profile UX.',
    populated: true,
  },
];

const personaById = new Map(personas.map((p) => [p.id, p]));
const personaByKey = new Map(personas.map((p) => [p.key, p]));

export function getPersona(key: string | null | undefined): Persona | undefined {
  return key ? personaByKey.get(key) : undefined;
}

// ─── Guard ──────────────────────────────────────────────────────────────────

/**
 * Single source of truth for whether the test-login path is live.
 * Evaluated per request / at module load — env is stable per deployment.
 */
export function testLoginEnabled(): boolean {
  // Absolute hard stop. Nothing below can re-enable it in production.
  if (process.env.VERCEL_ENV === 'production') return false;
  return process.env.ENABLE_TEST_LOGIN === '1';
}

/** Constant-time compare of the caller-supplied key against TEST_LOGIN_SECRET. */
export function verifyKey(provided: string | null | undefined): boolean {
  const expected = process.env.TEST_LOGIN_SECRET;
  // A misconfigured preview (flag on, secret unset) must NOT be loggable into.
  if (!expected) return false;
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// ─── Cookie ───────────────────────────────────────────────────────────────--

const COOKIE_NAME = 'test-login.session';
const MAX_AGE_SEC = 7 * 24 * 60 * 60;

function signingSecret(): string {
  return process.env.BETTER_AUTH_SECRET ?? process.env.TEST_LOGIN_SECRET ?? 'test-login-dev-secret';
}

function sign(personaId: string): string {
  return createHmac('sha256', signingSecret()).update(personaId).digest('base64url');
}

function cookieValue(persona: Persona): string {
  return `${persona.id}.${sign(persona.id)}`;
}

/** Returns the persona for a valid signed cookie value, or null. */
function personaFromCookie(value: string): Persona | null {
  const dot = value.lastIndexOf('.');
  if (dot < 0) return null;
  const id = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  const expected = sign(id);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return personaById.get(id) ?? null;
}

function isSecureContext(): boolean {
  return (
    Boolean(process.env.VERCEL_ENV) || (process.env.BETTER_AUTH_URL ?? '').startsWith('https:')
  );
}

export function loginCookieHeader(persona: Persona): string {
  const secure = isSecureContext() ? '; Secure' : '';
  return `${COOKIE_NAME}=${cookieValue(persona)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_SEC}${secure}`;
}

export function logoutCookieHeader(): string {
  const secure = isSecureContext() ? '; Secure' : '';
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

function parseCookies(header: string | null): Map<string, string> {
  const map = new Map<string, string>();
  if (!header) return map;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    map.set(part.slice(0, idx).trim(), part.slice(idx + 1).trim());
  }
  return map;
}

// ─── Session resolution ───────────────────────────────────────────────────--

export type TestSession = {
  session: {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
    ipAddress: null;
    userAgent: null;
  };
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: true;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
    githubHandle: null;
  };
} | null;

function sessionFor(persona: Persona): NonNullable<TestSession> {
  const now = new Date();
  return {
    session: {
      id: `test-session-${persona.id}`,
      userId: persona.id,
      token: `test-token-${persona.id}`,
      expiresAt: new Date(Date.now() + MAX_AGE_SEC * 1000),
      createdAt: now,
      updatedAt: now,
      ipAddress: null,
      userAgent: null,
    },
    user: {
      id: persona.id,
      name: persona.name,
      email: persona.email,
      emailVerified: true,
      image: persona.image,
      createdAt: now,
      updatedAt: now,
      githubHandle: null,
    },
  };
}

/**
 * Resolve the test session from a valid signed cookie. Shape matches what
 * better-auth's getSession returns, so all consumers treat it identically.
 */
export function getTestSession(headers: Headers): TestSession {
  const raw = parseCookies(headers.get('cookie')).get(COOKIE_NAME);
  if (!raw) return null;
  const persona = personaFromCookie(raw);
  return persona ? sessionFor(persona) : null;
}

/**
 * Intercept the better-auth client routes the UI calls so the persona session
 * is visible client-side and sign-out clears the test cookie. Returns null to
 * fall through to the real auth handler (e.g. when no test cookie is present,
 * so real OAuth still works on preview if it's ever configured).
 */
export async function handleTestAuthRoute(request: Request): Promise<Response | null> {
  const path = new URL(request.url).pathname;
  const session = getTestSession(request.headers);

  if (request.method === 'GET' && path.endsWith('/get-session')) {
    if (!session) return null;
    return new Response(JSON.stringify(session), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (path.includes('/sign-out')) {
    if (!session) return null;
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'content-type': 'application/json', 'set-cookie': logoutCookieHeader() },
    });
  }

  return null;
}

// ─── Seeding ──────────────────────────────────────────────────────────────--
// All DB / content imports are lazy so this module stays cheap to import from
// auth.ts and never pulls astro:content into contexts that don't seed.

/** Ensure the persona's user row exists, and (if populated) its progress data. */
export async function ensurePersona(persona: Persona): Promise<void> {
  if (!process.env.DATABASE_URL) return;
  const { db } = await import('../db');
  const { users } = await import('../db/schema');

  await db
    .insert(users)
    .values({
      id: persona.id,
      email: persona.email,
      name: persona.name,
      avatar: persona.image,
      emailVerified: true,
    })
    .onConflictDoNothing();

  if (persona.populated) {
    await seedProgress(persona.id);
  } else {
    await resetProgress(persona.id);
  }
}

/**
 * Wipes all progress rows for a user so the empty persona is truly clean on
 * every login. Scoped to the progress tables only — the users row is kept so
 * FK constraints are satisfied. review_logs cascade-delete via review_cards FK.
 */
export async function resetProgress(userId: string): Promise<void> {
  const { db } = await import('../db');
  const { eq } = await import('drizzle-orm');
  const {
    lessonViews,
    quizAttempts,
    dailyActivity,
    projectSubmissions,
    reviewCards,
    selfExplanations,
    userSettings,
  } = await import('../db/schema');

  await db.delete(reviewCards).where(eq(reviewCards.userId, userId));
  await db.delete(selfExplanations).where(eq(selfExplanations.userId, userId));
  await db.delete(projectSubmissions).where(eq(projectSubmissions.userId, userId));
  await db.delete(quizAttempts).where(eq(quizAttempts.userId, userId));
  await db.delete(lessonViews).where(eq(lessonViews.userId, userId));
  await db.delete(dailyActivity).where(eq(dailyActivity.userId, userId));
  await db.delete(userSettings).where(eq(userSettings.userId, userId));
}

async function seedProgress(userId: string): Promise<void> {
  const { getQuizAttemptCount, recordQuizAttempt, markLessonComplete, submitProject } = await import(
    '../db/queries'
  );

  // Idempotent: if this persona already has quiz attempts, it's been seeded.
  if ((await getQuizAttemptCount(userId)) > 0) return;

  const DAY = 24 * 60 * 60 * 1000;
  const now = Date.now();

  // A quiz on each of the last 5 days → 5-day streak + heatmap cells.
  const quizSlugs = [
    'qa-mindset',
    'test-design-techniques',
    'api-testing',
    'playwright',
    'risk-based-testing',
  ];
  for (let i = 0; i < quizSlugs.length; i++) {
    await recordQuizAttempt({
      userId,
      quizSlug: quizSlugs[i],
      mode: 'practice',
      score: 6 + (i % 4),
      total: 10,
      answers: [0, 1, 2, 3, 0, 1, 2, 3, 0, 1],
      durationSec: 120 + i * 15,
      attemptedAt: new Date(now - i * DAY),
    });
  }

  // A few completed lessons (lands on today's activity).
  for (const slug of ['what-is-qa-quality', 'qa-mindset', 'test-design-techniques']) {
    await markLessonComplete({ userId, lessonSlug: slug, timeSpentSec: 480 });
  }

  // One project submission.
  await submitProject({
    userId,
    projectSlug: 'qa-foundations-field-report',
    reflection: 'Seeded submission for the Parker Power test persona.',
    isPublic: false,
  });

  // Review cards across all topics (non-fatal if content load hiccups).
  try {
    const { seedForUser } = await import('./srs/seed');
    await seedForUser(userId);
  } catch {
    /* review-card seeding is best-effort */
  }
}
