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

const TEST_SLUG = 'boundary-value-analysis';

const LONG_EXPLANATION = `
Boundary value analysis is a software testing technique that focuses on testing the
boundaries between partitions. The key idea is that errors tend to cluster at the
edges of input ranges rather than in the middle. For example, if a function accepts
integers from 1 to 100, you would test 0, 1, 2, 99, 100, and 101 — the values just
outside and just inside the valid range. This is based on the observation that
programmers often make off-by-one errors when handling boundary conditions. A common
analogy is a speed limit sign: most drivers don't drive at exactly 45 mph all the time,
but they pay close attention at 55 mph where the ticket risk begins. In practice,
boundary value analysis is typically combined with equivalence partitioning to achieve
good coverage without testing every possible value. It is especially effective for
numeric inputs, dates, and string lengths. One gap I noticed is I am less certain about
how to handle open versus closed intervals in formal notation.
`.trim();

test.describe('Feynman explain — submission + rubric reveal', () => {
  test.skip(
    process.env.E2E_OAUTH_MOCK !== '1',
    'requires server started with E2E_OAUTH_MOCK=1 + DATABASE_URL — skipped locally without DB',
  );

  test('write ~150 words → submit → rubric appears (hidden before submit) → self-score persists', async ({
    page,
  }) => {
    await page.addLocatorHandler(page.locator('vite-error-overlay'), async (el) => {
      await el.locator('button').first().click();
    });

    await signInWithMockedGitHub(page);

    // Navigate to the explain page (the editor renders directly).
    await page.goto(`/explain/${TEST_SLUG}`);
    await page.waitForLoadState('networkidle');

    // Rubric must NOT be visible before submission.
    await expect(page.getByTestId('feynman-rubric')).not.toBeVisible();
    await expect(page.getByTestId('feynman-form')).toBeVisible();

    // Type explanation text.
    const textarea = page.getByTestId('feynman-textarea');
    await expect(textarea).toBeVisible();
    await textarea.fill(LONG_EXPLANATION);

    // Word count is informational only; submit is enabled as soon as there's text.
    await expect(page.getByTestId('feynman-wordcount')).toContainText('words written');

    // Submit the explanation.
    const submitBtn = page.getByTestId('feynman-submit');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Rubric appears after submission.
    await expect(page.getByTestId('feynman-rubric')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId('feynman-form')).not.toBeVisible();

    // Score each criterion.
    for (const key of ['clarity', 'accuracy', 'analogy', 'gaps']) {
      const scoreGroup = page.getByTestId(`rubric-score-${key}`);
      await expect(scoreGroup).toBeVisible();
      // Click score 4 for each.
      await scoreGroup.locator('button').nth(3).click();
    }

    // Save scores.
    await page.getByTestId('feynman-save').click();

    // Saved confirmation appears.
    await expect(page.getByTestId('feynman-saved')).toBeVisible({ timeout: 8_000 });
  });
});
