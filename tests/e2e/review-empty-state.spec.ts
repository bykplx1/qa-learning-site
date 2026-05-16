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

test.describe('review empty-queue state', () => {
  test.skip(
    process.env.E2E_OAUTH_MOCK !== '1',
    'requires server started with E2E_OAUTH_MOCK=1 + DATABASE_URL — skipped locally without DB',
  );

  test('empty state shows celebration, two outbound CTAs, no review-more copy', async ({ page }) => {
    await page.addLocatorHandler(page.locator('vite-error-overlay'), async (el) => {
      await el.locator('button').first().click();
    });

    await signInWithMockedGitHub(page);

    // Navigate to /review without seeding cards — user has no due cards.
    await page.goto('/review');
    await page.waitForLoadState('networkidle');

    const emptyEl = page.getByTestId('review-empty');
    const questionEl = page.getByTestId('review-question');

    const hasCards = await questionEl.isVisible().catch(() => false);
    if (hasCards) {
      // Grade through all cards until the queue is empty.
      let safetyCounter = 0;
      while (safetyCounter < 50) {
        safetyCounter++;
        const stillHasCard = await questionEl.isVisible().catch(() => false);
        if (!stillHasCard) break;
        await page.getByTestId('review-reveal').click();
        await expect(page.getByTestId('review-answer')).toBeVisible();
        await page.getByTestId('grade-4').click();
        await expect(
          page.getByTestId('review-empty').or(page.getByTestId('review-question')),
        ).toBeVisible({ timeout: 10_000 });
      }
    }

    // Assert empty state is now visible.
    await expect(emptyEl).toBeVisible({ timeout: 8_000 });

    // Celebration heading is present.
    await expect(page.getByRole('heading', { name: /done for now/i })).toBeVisible();

    // Outbound CTAs are present with correct hrefs.
    const explainLink = page.getByRole('link', { name: /explain it back/i });
    const projectsLink = page.getByRole('link', { name: /start a project/i });
    await expect(explainLink).toBeVisible();
    await expect(projectsLink).toBeVisible();
    await expect(explainLink).toHaveAttribute('href', '/explain');
    await expect(projectsLink).toHaveAttribute('href', '/projects');

    // No "review more" copy anywhere in the body.
    const bodyText = (await page.textContent('body')) ?? '';
    expect(bodyText).not.toMatch(/review more/i);
    expect(bodyText).not.toMatch(/study more/i);
    expect(bodyText).not.toMatch(/practice more/i);
  });

  test('empty state CTAs are focusable in order (a11y)', async ({ page }) => {
    await signInWithMockedGitHub(page);

    await page.goto('/review');
    await page.waitForLoadState('networkidle');

    const emptyEl = page.getByTestId('review-empty');
    const hasCards = await page.getByTestId('review-question').isVisible().catch(() => false);

    if (hasCards) {
      test.skip(true, 'Cards are due — cannot test empty state focus order in this environment');
      return;
    }

    await expect(emptyEl).toBeVisible({ timeout: 8_000 });

    // Tab to the first CTA.
    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate(() => document.activeElement?.textContent?.trim());
    // Tab to the second CTA.
    await page.keyboard.press('Tab');
    const secondFocused = await page.evaluate(() => document.activeElement?.textContent?.trim());
    // Tab again — focus should leave the region (no trap).
    await page.keyboard.press('Tab');
    const thirdFocused = await page.evaluate(() => document.activeElement?.textContent?.trim());

    // Both CTAs were reached and focus moved beyond them.
    expect([firstFocused, secondFocused]).toContain('Explain it back');
    expect([firstFocused, secondFocused]).toContain('Start a project');
    expect(thirdFocused).not.toBe('Start a project');
  });
});
