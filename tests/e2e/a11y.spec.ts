import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const LESSON_SLUG = 'testing-principles';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function dismissDevOverlay(page: Page) {
  await page.addLocatorHandler(page.locator('vite-error-overlay'), async (el) => {
    await el.locator('button').first().click();
  });
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
    // Non-blocking: surfaced in test output for awareness.
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

test.describe('a11y — WCAG 2.2 AA', () => {
  test.beforeEach(async ({ page }) => {
    await dismissDevOverlay(page);
  });

  test('home', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();
    await runAxe(page, 'home');
  });

  test('lesson', async ({ page }) => {
    await page.goto(`/lessons/${LESSON_SLUG}`);
    await expect(page.locator('#quiz')).toBeVisible();
    await expect(page.getByText(/Question 1 \/ \d+/)).toBeVisible();
    await runAxe(page, 'lesson');
  });

  test('quiz mid-attempt', async ({ page }) => {
    await page.goto(`/lessons/${LESSON_SLUG}`);
    const quiz = page.locator('#quiz');
    await expect(quiz).toBeVisible();
    await expect(quiz.getByText(/Question 1 \/ \d+/)).toBeVisible();
    await quiz.locator('button').first().click();
    await expect(quiz.getByText(/✓ Correct!|✗ Incorrect/)).toBeVisible({ timeout: 10_000 });
    await runAxe(page, 'quiz');
  });

  test('profile (anonymous)', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.locator('.signed-out')).toBeVisible();
    await runAxe(page, 'profile');
  });

  test('search modal opened', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('search:open')));
    const dialog = page.getByRole('dialog', { name: 'Search' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('searchbox')).toBeFocused();
    await runAxe(page, 'search-modal');
  });
});
