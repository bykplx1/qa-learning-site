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

test.describe('/review chrome — streak and progress bar absence (Flow P5.4)', () => {
  test.skip(
    process.env.E2E_OAUTH_MOCK !== '1',
    'requires server started with E2E_OAUTH_MOCK=1 + DATABASE_URL — skipped locally without DB',
  );

  test('no streak counter in /review DOM', async ({ page }) => {
    await signInWithMockedGitHub(page);
    await page.goto('/review');
    await page.waitForLoadState('networkidle');

    const bodyText = (await page.textContent('body')) ?? '';
    expect(bodyText).not.toMatch(/streak/i);
  });

  test('no "N of M" card progress text in /review DOM', async ({ page }) => {
    await signInWithMockedGitHub(page);

    const seedRes = await page.request.post('/api/review/seed');
    expect(seedRes.ok(), `seed failed: ${seedRes.status()}`).toBeTruthy();

    await page.goto('/review');
    await page.waitForLoadState('networkidle');

    const bodyText = (await page.textContent('body')) ?? '';
    // Matches patterns like "3 of 14", "card 1 of 5", "1 of 1".
    expect(bodyText).not.toMatch(/\d+\s+of\s+\d+/i);
  });
});
