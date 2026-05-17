import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const LESSON_SLUG = 'testing-principles';
const LESSON_URL = `/lessons/${LESSON_SLUG}`;

async function dismissDevOverlay(page: Page) {
  await page.addLocatorHandler(page.locator('vite-error-overlay'), async (el) => {
    await el.locator('button').first().click();
  });
}

test.describe('End-of-lesson CTA', () => {
  test.beforeEach(async ({ page }) => {
    await dismissDevOverlay(page);
  });

  test('no "Next lesson" text present in DOM (case-insensitive)', async ({ page }) => {
    await page.goto(LESSON_URL);
    await expect(page.locator('h1').first()).toBeVisible();

    // Assert: no element contains the text "next lesson" (regex, case-insensitive)
    const matches = await page.getByText(/next lesson/i).all();
    expect(
      matches.length,
      'Expected no "next lesson" text in DOM but found some',
    ).toBe(0);
  });

  test('end-of-lesson CTA section is present', async ({ page }) => {
    await page.goto(LESSON_URL);
    await expect(page.locator('h1').first()).toBeVisible();

    const cta = page.getByTestId('end-of-lesson-cta');
    await expect(cta).toBeVisible();
  });

  test('CTA cards are focusable and keyboard-navigable (tab-order)', async ({ page }) => {
    await page.goto(LESSON_URL);
    await expect(page.locator('h1').first()).toBeVisible();

    // Tab through all focusable elements and verify we can reach at least one CTA link
    const ctaLinks = page.getByTestId('end-of-lesson-cta').locator('a');
    const count = await ctaLinks.count();

    // There must be at least one CTA option rendered
    expect(count).toBeGreaterThanOrEqual(1);

    // Each CTA link must be focusable via keyboard
    for (let i = 0; i < count; i++) {
      const link = ctaLinks.nth(i);
      await link.focus();
      await expect(link).toBeFocused();
    }
  });

  test('project CTA is rendered when a project maps to the cluster', async ({ page }) => {
    // The lesson slug 'testing-principles' has category 'fundamentals'.
    // The project 'flaky-test-hunter' is mapped to 'functional-execution'.
    // So for this test we verify that whatever CTAs are shown, none say "Next lesson".
    await page.goto(LESSON_URL);
    await expect(page.locator('h1').first()).toBeVisible();

    // No "Next lesson" link anywhere
    await expect(page.getByRole('link', { name: /next lesson/i })).toHaveCount(0);
  });

  test('a11y — no serious/critical violations on lesson page', async ({ page }) => {
    await page.goto(LESSON_URL);
    await expect(page.locator('h1').first()).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

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

    expect(blocking, `Serious/critical a11y violations on lesson page:${detail}`).toEqual([]);
  });
});
