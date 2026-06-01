import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function dismissDevOverlay(page: Page) {
  await page.addLocatorHandler(page.locator('vite-error-overlay'), async (el) => {
    await el.locator('button').first().click();
  });
}

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
  expect(cbRes.status(), `callback status: ${cbRes.status()}`).toBeLessThan(400);
}

async function runAxe(page: Page, name: string) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

  const blocking = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  const lesser = results.violations.filter(
    (v) => v.impact === 'moderate' || v.impact === 'minor',
  );

  for (const v of lesser) {
    const targets = v.nodes.map((n) => n.target.join(' ')).join('; ');
    console.warn(`[a11y:${name}] ${v.impact}: ${v.id} (${v.nodes.length}) — ${v.help}\n  ${targets}`);
  }

  const detail =
    blocking.length === 0
      ? ''
      : '\n' +
        blocking
          .map((v) => {
            const targets = v.nodes.map((n) => n.target.join(' ')).join('; ');
            return `  [${v.impact}] ${v.id}: ${v.help}\n    nodes: ${targets}\n    help: ${v.helpUrl}`;
          })
          .join('\n');

  expect(blocking, `Serious/critical a11y violations on "${name}":${detail}`).toEqual([]);
}

test.describe('a11y — authenticated surfaces (WCAG 2.2 AA)', () => {
  test.skip(
    process.env.E2E_OAUTH_MOCK !== '1',
    'requires server started with E2E_OAUTH_MOCK=1 + DATABASE_URL — skipped locally without DB',
  );

  test.beforeEach(async ({ page }) => {
    await dismissDevOverlay(page);
    await signInWithMockedGitHub(page);
  });

  test('profile (authenticated) — signed-in shell passes axe', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // ProfileShell is client:only — wait for React hydration to resolve the
    // signed-in state (identity section or signed-out section, either is loaded).
    await expect(
      page.locator('.identity').or(page.locator('.signed-out')),
    ).toBeVisible({ timeout: 15_000 });

    // Confirm we are actually signed in (not the anonymous fallback).
    await expect(page.locator('.signed-out')).toHaveCount(0);
    await expect(page.locator('.identity')).toBeVisible();

    await runAxe(page, 'profile-authenticated');
  });

  test('exam runner — mid-exam state passes axe', async ({ page }) => {
    await page.goto('/exam/ctfl');

    // Wait for the ExamRunner React island to hydrate — start gate appears.
    await expect(page.getByTestId('exam-start-gate')).toBeVisible({ timeout: 15_000 });

    // Start the exam so the question + timer + radiogroup render.
    await page.getByTestId('exam-start-btn').click();
    await expect(page.getByTestId('exam-timer')).toBeVisible();

    // Confirm a question with answer options is rendered before scanning.
    await expect(page.getByTestId('exam-option-0')).toBeVisible();

    await runAxe(page, 'exam-mid');
  });
});
