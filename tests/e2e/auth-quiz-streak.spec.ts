import { test, expect, type Page } from '@playwright/test';

const SLUG = 'testing-principles';
const LESSON_URL = `/lessons/${SLUG}`;
const STORAGE_KEY = `quiz_${SLUG}`;
const TOTAL_QUESTIONS = 20;

/**
 * Drives Better-Auth's social sign-in via Playwright's APIRequestContext so
 * the resulting session cookie lands in the shared browser cookie jar.
 * The server-side `installOAuthMock` (gated by E2E_OAUTH_MOCK=1) intercepts
 * the GitHub HTTP boundary; everything else is the real flow.
 */
async function signInWithMockedGitHub(page: Page): Promise<void> {
  const startRes = await page.request.post('/api/auth/sign-in/social', {
    data: { provider: 'github', callbackURL: '/' },
    headers: { 'content-type': 'application/json' },
  });
  expect(startRes.ok(), `sign-in init failed: ${startRes.status()}`).toBeTruthy();
  const body = (await startRes.json()) as { url?: string };
  expect(body.url, 'sign-in did not return authorize url').toBeTruthy();
  const state = new URL(body.url!).searchParams.get('state');
  expect(state, 'state missing from authorize url').toBeTruthy();

  const cbRes = await page.request.get(
    `/api/auth/callback/github?code=fake-e2e-code&state=${state}`,
    { maxRedirects: 0 },
  );
  // Better-Auth redirects on success; both 302 and 200 are acceptable signals.
  expect(cbRes.status(), `callback status: ${cbRes.status()}`).toBeLessThan(400);
}

test.describe('full sign-in → quiz → lesson complete → profile', () => {
  test.skip(
    process.env.E2E_OAUTH_MOCK !== '1',
    'requires server started with E2E_OAUTH_MOCK=1 + DATABASE_URL — skipped locally without DB',
  );

  test('records score, completion, and streak=1 on profile', async ({ page }) => {
    await page.addLocatorHandler(page.locator('vite-error-overlay'), async (el) => {
      await el.locator('button').first().click();
    });

    // 1. Sign in (mocked OAuth boundary; real session/cookie).
    await signInWithMockedGitHub(page);

    // 2. Open the lesson.
    await page.goto(LESSON_URL);
    await expect(page.locator('h1').first()).toContainText('Testing Principles');
    await expect(page.locator('#quiz')).toBeVisible();

    // 3. Jump to last question via sessionStorage (mirrors smoke spec).
    await page.evaluate(
      ({ key, total }) => {
        const state = {
          currentIndex: total - 1,
          answers: [...Array(total - 1).fill(0), null],
          feedback: false,
          status: 'active',
        };
        sessionStorage.setItem(key, JSON.stringify(state));
      },
      { key: STORAGE_KEY, total: TOTAL_QUESTIONS },
    );
    await page.reload();

    // 4. Answer last question, finish quiz — triggers POST /api/quiz/attempts.
    await expect(page.getByText(`Question ${TOTAL_QUESTIONS} / ${TOTAL_QUESTIONS}`)).toBeVisible();
    await page.locator('#quiz button').first().click();
    await page.getByRole('button', { name: 'See Results' }).click();
    await expect(page.getByText('Quiz Complete')).toBeVisible();

    // 5. Wait for the attempt to persist (signed-in adapter writes server-side).
    await expect(page.getByTestId('quiz-save-status')).toHaveAttribute(
      'data-status',
      'saved',
      { timeout: 10_000 },
    );

    // 6. Mark the lesson complete — POSTs to /api/lessons/:slug/complete.
    const markBtn = page.getByTestId('mark-complete');
    await markBtn.scrollIntoViewIfNeeded();
    await markBtn.click();
    await expect(markBtn).toHaveText('Completed ✓');

    // 7. Open the profile.
    await page.goto('/profile');

    // 8. Streak shows 1 (one active day).
    await expect(page.getByTestId('streak-current')).toContainText('day streak');
    const streakNum = page.locator('.istat__num').first();
    await expect(streakNum).toContainText('1');

    // 9. Lesson completion visible — count + recent activity row.
    await expect(page.getByTestId('completed-count')).toContainText('1');
    await expect(
      page.getByTestId(`activity-row-lesson-${SLUG}`),
    ).toBeVisible();

    // 10. Quiz attempt visible — non-zero attempt count + quiz row in feed.
    await expect(page.getByTestId('attempt-count')).not.toContainText(/^0/);
    await expect(
      page.getByTestId(`activity-row-quiz-${SLUG}`),
    ).toBeVisible();
  });
});
