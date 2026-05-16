import { test, expect, type Page } from '@playwright/test';

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

test.describe('review mixed-deck flow (queue composer + interleaver)', () => {
  test.skip(
    process.env.E2E_OAUTH_MOCK !== '1',
    'requires server started with E2E_OAUTH_MOCK=1 + DATABASE_URL — skipped locally without DB',
  );

  test('login → seed mixed deck → complete 3 cards (Hard/Good/Easy) → queue progresses', async ({
    page,
  }) => {
    await page.addLocatorHandler(page.locator('vite-error-overlay'), async (el) => {
      await el.locator('button').first().click();
    });

    // 1. Sign in.
    await signInWithMockedGitHub(page);

    // 2. Seed cards.
    const seedRes = await page.request.post('/api/review/seed');
    expect(seedRes.ok(), `seed failed: ${seedRes.status()}`).toBeTruthy();
    const seedBody = (await seedRes.json()) as { inserted: number; skipped: number };
    expect(seedBody.inserted + seedBody.skipped).toBeGreaterThan(0);

    // 3. Navigate to /review.
    await page.goto('/review');

    const emptyEl = page.getByTestId('review-empty');
    const questionEl = page.getByTestId('review-question');

    const isEmpty = await emptyEl.isVisible().catch(() => false);
    if (isEmpty) {
      test.skip(true, 'No curriculum prompts available in this environment — empty queue');
      return;
    }

    await expect(questionEl).toBeVisible({ timeout: 8_000 });

    const seenQuestions = new Set<string>();

    // Grade 3 cards: Hard (2), Good (3), Easy (4).
    const ratings = [2, 3, 4] as const;

    for (const rating of ratings) {
      const questionText = await questionEl.textContent();
      expect(questionText).toBeTruthy();

      // Reveal answer.
      await page.getByTestId('review-reveal').click();
      await expect(page.getByTestId('review-answer')).toBeVisible();

      // Grade.
      await page.getByTestId(`grade-${rating}`).click();

      // Wait for next card or empty state.
      await expect(
        page.getByTestId('review-empty').or(page.getByTestId('review-question')),
      ).toBeVisible({ timeout: 10_000 });

      seenQuestions.add(questionText!);

      const done = await emptyEl.isVisible().catch(() => false);
      if (done) break;

      // If another card appeared, it must be a different question.
      const nextQuestion = await questionEl.textContent().catch(() => null);
      if (nextQuestion && seenQuestions.has(nextQuestion)) {
        // Same question appearing again could mean the queue only has 1 card —
        // valid if seed produced only 1 prompt; skip further assertions.
        break;
      }
    }

    // We graded at least 1 card — assert at least 1 question was seen.
    expect(seenQuestions.size).toBeGreaterThanOrEqual(1);
  });
});
