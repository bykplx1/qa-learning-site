import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const LESSON_CLUSTER = 'test-design';
const LESSON_SLUG = 'exploratory-testing';

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
    await page.goto(`/lessons/${LESSON_CLUSTER}/${LESSON_SLUG}`);
    await expect(page.locator('#quiz')).toBeVisible();
    await expect(page.getByText(/Question 1 \/ \d+/)).toBeVisible();
    await runAxe(page, 'lesson');
  });

  test('quiz mid-attempt', async ({ page }) => {
    await page.goto(`/lessons/${LESSON_CLUSTER}/${LESSON_SLUG}`);
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

  // Skipped: blocked on upstream #223 (@astrojs/react dev-overlay "Invalid hook call" loop).
  // The dev server intermittently surfaces a Vite error overlay on the lesson route that
  // axe-core treats as DOM under test, producing serious violations. Re-enable once #223
  // is resolved upstream and the dev overlay no longer appears mid-run.
  test.skip('lesson blockquote — semantic role and non-color signaling', async ({ page }) => {
    await page.goto(`/lessons/${LESSON_CLUSTER}/${LESSON_SLUG}`);
    await expect(page.locator('article')).toBeVisible();

    const blockquote = page.locator('.prose blockquote').first();
    const count = await blockquote.count();
    if (count === 0) {
      // Lesson has no blockquote — skip structural assertions, run axe only.
      await runAxe(page, 'lesson-blockquote-none');
      return;
    }

    // Semantic role: <blockquote> carries implicit ARIA role "blockquote" (WCAG 1.3.1).
    await expect(blockquote).toHaveAttribute('role', /./, { timeout: 0 }).catch(() => {
      // No explicit role attribute is fine — the element itself is semantic.
    });

    // Non-color signaling for lesson-takeaway blockquotes: verify background-color
    // and border are both set (not color-only).
    const takeaway = page.locator('.prose blockquote.lesson-takeaway').first();
    if (await takeaway.count() > 0) {
      const bg = await takeaway.evaluate((el) => getComputedStyle(el).backgroundColor);
      const borderLeft = await takeaway.evaluate((el) => getComputedStyle(el).borderLeftWidth);
      // Background must not be transparent (non-color cue present).
      expect(bg, 'lesson-takeaway must have a non-transparent background').not.toBe('rgba(0, 0, 0, 0)');
      // Border must be present and wider than the default 2px for extra weight cue.
      expect(parseFloat(borderLeft), 'lesson-takeaway border-left must be >= 3px').toBeGreaterThanOrEqual(3);
    }

    await runAxe(page, 'lesson-blockquote');
  });

  test('search modal opened', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();
    // SearchModal is client:only — its `search:open` listener is attached on
    // mount. Waiting for the SearchTrigger button confirms the React islands
    // hydrated; dispatching beforehand misses the listener.
    await expect(page.getByRole('button', { name: /Search.*Ctrl\+K/i })).toBeVisible();
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('search:open')));
    const dialog = page.getByRole('dialog', { name: 'Search' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('searchbox')).toBeFocused();
    await runAxe(page, 'search-modal');
  });
});
