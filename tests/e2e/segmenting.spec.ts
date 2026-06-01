/**
 * Regression guard: full-page lesson render (Issue #535).
 *
 * Now that SegmentedLesson is removed, every lesson section must be
 * visible on first load with no hidden/inert/aria-hidden segments.
 * The right-side TOC provides in-page navigation.
 *
 * Uses /lessons/test-design/exploratory-testing — 7 h2 sections,
 * previously the canonical "long lesson" used by the old segmenting tests.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const LESSON = '/lessons/test-design/exploratory-testing';

test.describe('full-page lesson render', () => {
  test('all h2 sections are visible on first load (no segmenting)', async ({ page }) => {
    await page.goto(LESSON);
    await expect(page.locator('h1').first()).toBeVisible();

    const body = page.locator('[data-lesson-body]');
    const h2s = body.locator('h2');
    const count = await h2s.count();
    expect(count).toBeGreaterThan(1);

    // Every h2 must be visible — no inert or aria-hidden segments.
    for (let i = 0; i < count; i++) {
      const h2 = h2s.nth(i);
      await expect(h2).toBeVisible();
      await expect(h2).not.toHaveAttribute('inert', '');
      await expect(h2).not.toHaveAttribute('aria-hidden', 'true');
    }
  });

  test('Continue-to-segment control is absent', async ({ page }) => {
    await page.goto(LESSON);
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.getByTestId('segment-continue-btn')).toHaveCount(0);
    await expect(page.getByTestId('segment-continue')).toHaveCount(0);
  });

  test('TOC links are present and scroll to sections', async ({ page }) => {
    await page.goto(LESSON);
    await expect(page.locator('h1').first()).toBeVisible();

    // The TOC sidebar should contain at least one anchor link.
    const tocLinks = page.locator('.lesson-toc a[href^="#"]');
    const tocCount = await tocLinks.count();
    expect(tocCount).toBeGreaterThan(0);

    // Click the first TOC link and confirm it resolves to a heading.
    const firstLink = tocLinks.first();
    const href = await firstLink.getAttribute('href');
    expect(href).toBeTruthy();

    await firstLink.click();
    // Use the href directly — Playwright's locator supports attribute selectors.
    await expect(page.locator(`[id="${href!.slice(1)}"]`)).toBeVisible();
  });

  test('a11y: no serious/critical violations on full-render lesson', async ({ page }) => {
    await page.goto(LESSON);
    await expect(page.locator('h1').first()).toBeVisible();

    const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
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

    expect(blocking, `Serious/critical a11y violations on lesson:${detail}`).toEqual([]);
  });
});
