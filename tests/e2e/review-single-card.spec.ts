import { test, expect, type Page } from '@playwright/test';

/**
 * Drives Better-Auth's social sign-in via Playwright's APIRequestContext so
 * the resulting session cookie lands in the shared browser cookie jar.
 * Requires server started with E2E_OAUTH_MOCK=1 + DATABASE_URL.
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
  expect(cbRes.status(), `callback status: ${cbRes.status()}`).toBeLessThan(400);
}

test.describe('review single-card flow', () => {
  test.skip(
    process.env.E2E_OAUTH_MOCK !== '1',
    'requires server started with E2E_OAUTH_MOCK=1 + DATABASE_URL — skipped locally without DB',
  );

  test('login → seed → grade Good → reload → card no longer due', async ({ page }) => {
    await page.addLocatorHandler(page.locator('vite-error-overlay'), async (el) => {
      await el.locator('button').first().click();
    });

    // 1. Sign in (mocked OAuth boundary; real session/cookie).
    await signInWithMockedGitHub(page);

    // 2. Seed cards for the authenticated user.
    const seedRes = await page.request.post('/api/review/seed');
    expect(seedRes.ok(), `seed failed: ${seedRes.status()}`).toBeTruthy();
    const seedBody = (await seedRes.json()) as { inserted: number; skipped: number };
    // At least one card must exist for the test to be meaningful.
    expect(seedBody.inserted + seedBody.skipped).toBeGreaterThan(0);

    // 3. Navigate to /review — should show the first due card.
    await page.goto('/review');

    // If no curriculum prompts exist in the test environment, the empty state renders.
    // In that case, skip the grading assertions.
    const emptyEl = page.getByTestId('review-empty');
    const questionEl = page.getByTestId('review-question');

    const isEmpty = await emptyEl.isVisible().catch(() => false);
    if (isEmpty) {
      test.skip(true, 'No curriculum prompts available in this environment — empty queue');
      return;
    }

    await expect(questionEl).toBeVisible({ timeout: 8_000 });

    // 4. Record the question text so we can assert it's gone after grading.
    const questionText = await questionEl.textContent();
    expect(questionText).toBeTruthy();

    // 5. Reveal the answer.
    await page.getByTestId('review-reveal').click();
    await expect(page.getByTestId('review-answer')).toBeVisible();

    // 6. Grade as "Good" (rating 3).
    await page.getByTestId('grade-3').click();

    // 7. After grading Good, the card is scheduled far in the future.
    //    Expect either: next card shown, or empty state.
    await expect(page.getByTestId('review-empty').or(page.getByTestId('review-question'))).toBeVisible({
      timeout: 10_000,
    });

    // 8. Reload — the just-graded card should not appear (it's due in the future).
    await page.reload();
    await page.waitForLoadState('networkidle');

    const emptyAfter = page.getByTestId('review-empty');
    const questionAfter = page.getByTestId('review-question');

    const isEmptyAfter = await emptyAfter.isVisible().catch(() => false);
    if (!isEmptyAfter) {
      // Another card is due — verify it's not the same question
      const nextText = await questionAfter.textContent();
      expect(nextText).not.toBe(questionText);
    }
    // Either empty (card graded off the queue) or a different card — both satisfy the AC.
  });
});
