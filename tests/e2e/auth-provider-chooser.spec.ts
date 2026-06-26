/**
 * E2E — Auth provider chooser (#257)
 *
 * Asserts that unauthenticated visits to protected surfaces redirect to
 * /login (the provider chooser) rather than a hardcoded GitHub URL.
 * Also runs axe a11y assertions on the chooser page itself.
 *
 * Note: the full OAuth account-switching behavior (GitHub allow_signup,
 * Google prompt=select_account) cannot be verified locally — there is no
 * real OAuth provider in this environment. The server-side config change
 * in src/lib/auth.ts is the deliverable for that runtime behavior.
 *
 * Project pages hit a real DB; the redirect check works without auth because
 * the server redirects before any DB query.
 */
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function dismissDevOverlay(page: Page) {
  await page.addLocatorHandler(page.locator('vite-error-overlay'), async (el) => {
    await el.locator('button').first().click();
  });
}

test.describe('auth provider chooser — #257', () => {
  test.beforeEach(async ({ page }) => {
    await dismissDevOverlay(page);
  });

  test('unauthenticated visit to /projects/[slug] redirects to /login', async ({ page }) => {
    await page.goto('/projects/flaky-test-hunter', { waitUntil: 'load' });
    // The page itself renders but shows a sign-in link, not a direct GitHub redirect.
    // Verify we are NOT on a github.com URL.
    expect(page.url()).not.toContain('github.com');
    // Verify the sign-in link on the page points to /login (not hardcoded GitHub).
    const signInLink = page.getByRole('link', { name: /sign in/i }).first();
    await expect(signInLink).toBeVisible({ timeout: 8_000 });
    const href = await signInLink.getAttribute('href');
    expect(href).toMatch(/^\/login/);
    expect(href).not.toContain('github');
  });

  test('unauthenticated visit to /explain redirects to /login with next param', async ({ page }) => {
    await page.goto('/explain', { waitUntil: 'load' });
    await expect(page).toHaveURL(/\/login/);
    const url = new URL(page.url());
    expect(url.pathname).toBe('/login');
    expect(url.searchParams.get('next')).toBe('/explain');
  });

  test('/login page renders both provider buttons', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toBeVisible();

    // Buttons POST to /api/auth/sign-in/social (not GET links) — see #521 fix.
    const githubBtn = page.getByRole('button', { name: /continue with github/i });
    const googleBtn = page.getByRole('button', { name: /continue with google/i });

    await expect(githubBtn).toBeVisible();
    await expect(googleBtn).toBeVisible();

    // Each button carries its provider in a data attribute.
    expect(await githubBtn.getAttribute('data-provider')).toBe('github');
    expect(await googleBtn.getAttribute('data-provider')).toBe('google');
  });

  test('/login page preserves next param in provider data-callback', async ({ page }) => {
    await page.goto('/login?next=%2Fprojects%2Fflaky-test-hunter');
    await expect(page.locator('h1')).toBeVisible();

    const githubBtn = page.getByRole('button', { name: /continue with github/i });
    const googleBtn = page.getByRole('button', { name: /continue with google/i });

    // callbackURL is stored in data-callback and passed as POST body on click.
    const githubCallback = await githubBtn.getAttribute('data-callback');
    const googleCallback = await googleBtn.getAttribute('data-callback');

    expect(githubCallback).toContain('/projects/flaky-test-hunter');
    expect(googleCallback).toContain('/projects/flaky-test-hunter');
  });

  test('/login chooser buttons are keyboard accessible (a11y)', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toBeVisible();

    // Both buttons must be reachable by Tab and have accessible names.
    const githubBtn = page.getByRole('button', { name: /continue with github/i });
    const googleBtn = page.getByRole('button', { name: /continue with google/i });
    await expect(githubBtn).toBeVisible();
    await expect(googleBtn).toBeVisible();

    // axe a11y scan — serious/critical violations fail the test.
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    const detail =
      blocking.length === 0
        ? ''
        : '\n' +
          blocking
            .map((v) => {
              const targets = v.nodes.map((n) => n.target.join(' ')).join('; ');
              return `  [${v.impact}] ${v.id}: ${v.help}\n    nodes: ${targets}`;
            })
            .join('\n');
    expect(blocking, `Serious/critical a11y violations on /login:${detail}`).toEqual([]);
  });
});
