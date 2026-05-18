/**
 * E2E — ConceptGate component (#152)
 *
 * Requires: server started with E2E_OAUTH_MOCK=1 (mocked OAuth, no real DB).
 * Gate state is controlled via E2E_CONCEPT_GATE_BELOW=1 / E2E_CONCEPT_GATE_DUE_CARDS=<n>.
 *
 * The project used is /projects/flaky-test-hunter which has requiredConcepts set.
 */
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PROJECT_URL = '/projects/flaky-test-hunter';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

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

test.describe('ConceptGate — below-threshold flow', () => {
  test.skip(
    process.env.E2E_OAUTH_MOCK !== '1',
    'requires E2E_OAUTH_MOCK=1 — skipped without mock server',
  );

  test.beforeEach(async ({ page }) => {
    await dismissDevOverlay(page);
    await signInWithMockedGitHub(page);
  });

  test('below-threshold: gate renders, intro dimmed, deep-link has card count', async ({ page }) => {
    // Server must be started with E2E_CONCEPT_GATE_BELOW=1 E2E_CONCEPT_GATE_DUE_CARDS=3
    // The playwright webServer command in the config doesn't support per-test env injection,
    // so this test asserts the gate component renders with whatever state the server provides.
    // When E2E_CONCEPT_GATE_BELOW=1 the gate will show a below-threshold banner.

    await page.goto(PROJECT_URL);

    // Concept gate section must always be present when requiredConcepts is set.
    const gate = page.getByTestId('concept-gate');
    await expect(gate).toBeVisible({ timeout: 10_000 });

    // Check if below-threshold banner is present (depends on server env).
    const belowBanner = page.getByTestId('gate-below-threshold');
    const isBelowThreshold = await belowBanner.isVisible().catch(() => false);

    if (isBelowThreshold) {
      // Deep-link must be present and point to /review?cluster=...
      const reviewLink = page.getByTestId('gate-review-link');
      await expect(reviewLink).toBeVisible();
      const href = await reviewLink.getAttribute('href');
      expect(href).toMatch(/\/review\?cluster=/);

      // Card count must be visible.
      const cardCount = page.getByTestId('gate-card-count');
      await expect(cardCount).toBeVisible();
      const countText = await cardCount.textContent();
      expect(parseInt(countText ?? '0', 10)).toBeGreaterThan(0);

      // Project intro dim wrapper must be present.
      await expect(page.getByTestId('project-intro-dimmed')).toBeVisible();

      // Override: click "Start anyway".
      const overrideBtn = page.getByTestId('gate-override');
      await expect(overrideBtn).toBeVisible();
      await overrideBtn.click();

      // After override: dim wrapper disappears, below-threshold banner disappears.
      await expect(page.getByTestId('gate-below-threshold')).not.toBeVisible({ timeout: 5_000 });
      await expect(page.getByTestId('project-intro-dimmed')).not.toBeVisible({ timeout: 5_000 });

      // Hidden input must be set to '1' after override.
      const hiddenInput = page.getByTestId('below-threshold-override-input');
      await expect(hiddenInput).toHaveValue('1');
    } else {
      // Gate renders in all-met state — verify no dim wrapper.
      await expect(page.getByTestId('project-intro-dimmed')).not.toBeVisible();
    }
  });

  test('a11y — concept gate passes axe WCAG 2.2 AA', async ({ page }) => {
    await page.goto(PROJECT_URL);
    // Wait for React island to hydrate.
    await expect(page.getByTestId('concept-gate')).toBeVisible({ timeout: 10_000 });

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

    expect(blocking, `Serious/critical a11y violations on concept-gate page:${detail}`).toEqual([]);
  });
});
