import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function dismissDevOverlay(page: Page) {
  await page.addLocatorHandler(page.locator('vite-error-overlay'), async (el) => {
    await el.locator('button').first().click();
  });
}

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

test.describe('retention — demoted-metrics panel', () => {
  test('renders all four strikethrough items on /me/retention', async ({ page }) => {
    await dismissDevOverlay(page);
    await signInWithMockedGitHub(page);

    await page.goto('/me/retention');
    await page.waitForLoadState('networkidle');

    const panel = page.getByTestId('demoted-metrics');
    await expect(panel).toBeVisible({ timeout: 8_000 });

    // All four <s> labels present
    await expect(panel.locator('s').filter({ hasText: 'Streak length' })).toBeVisible();
    await expect(panel.locator('s').filter({ hasText: 'Lessons completed' })).toBeVisible();
    await expect(panel.locator('s').filter({ hasText: 'Time on site' })).toBeVisible();
    await expect(panel.locator('s').filter({ hasText: 'Percentile rank' })).toBeVisible();
  });

  test('each demoted item carries an aria-label with "demoted metric"', async ({ page }) => {
    await dismissDevOverlay(page);
    await signInWithMockedGitHub(page);

    await page.goto('/me/retention');
    await page.waitForLoadState('networkidle');

    const panel = page.getByTestId('demoted-metrics');
    const sEls = panel.locator('s');
    const count = await sEls.count();
    expect(count).toBe(4);

    for (let i = 0; i < count; i++) {
      const label = await sEls.nth(i).getAttribute('aria-label');
      expect(label, `<s> element ${i} missing aria-label`).toBeTruthy();
      expect(label!.toLowerCase()).toContain('demoted metric');
    }
  });

  test('a11y — /me/retention passes axe with demoted panel', async ({ page }) => {
    await dismissDevOverlay(page);
    await signInWithMockedGitHub(page);

    await page.goto('/me/retention');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('demoted-metrics')).toBeVisible({ timeout: 8_000 });

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(blocking, 'Serious/critical a11y violations on /me/retention').toEqual([]);
  });
});
