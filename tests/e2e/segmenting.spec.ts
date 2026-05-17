/**
 * E2E tests for long-lesson segmenting (Issue #149).
 *
 * Uses /lessons/testing-principles which has 9 h2 sections — well above the
 * LONG_LESSON_H2_THRESHOLD of 3 — so segmenting is guaranteed to activate.
 *
 * Assertions:
 *   - "Continue to segment 2" button is visible and focusable after page load.
 *   - Content beyond segment 1 is hidden (aria-hidden / inert).
 *   - Clicking the button reveals segment 2 and hides the "Continue" button until
 *     all remaining segments are progressively unlocked.
 *   - No auto-advance: waiting after page load does NOT reveal more content.
 *   - A11y: Continue button has a descriptive aria-label; axe sees no
 *     serious/critical violations on the segmented state.
 */

import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const LONG_LESSON = '/lessons/testing-principles';

async function dismissDevOverlay(page: Page) {
  await page.addLocatorHandler(page.locator('vite-error-overlay'), async (el) => {
    await el.locator('button').first().click();
  });
}

test.describe('long-lesson segmenting', () => {
  test.beforeEach(async ({ page }) => {
    await dismissDevOverlay(page);
  });

  test('Continue button is visible on a long lesson', async ({ page }) => {
    await page.goto(LONG_LESSON);
    await expect(page.locator('h1').first()).toBeVisible();

    // SegmentedLesson is client:load; wait for hydration.
    const continueBtn = page.getByTestId('segment-continue-btn');
    await expect(continueBtn).toBeVisible({ timeout: 10_000 });
  });

  test('Continue button has descriptive aria-label', async ({ page }) => {
    await page.goto(LONG_LESSON);
    const continueBtn = page.getByTestId('segment-continue-btn');
    await expect(continueBtn).toBeVisible({ timeout: 10_000 });

    const label = await continueBtn.getAttribute('aria-label');
    expect(label).toMatch(/segment 2/i);
  });

  test('content after first h2 is hidden before Continue is clicked', async ({ page }) => {
    await page.goto(LONG_LESSON);
    const continueBtn = page.getByTestId('segment-continue-btn');
    await expect(continueBtn).toBeVisible({ timeout: 10_000 });

    // All h2s after the first should be in hidden sections.
    const body = page.locator('[data-lesson-body]');
    const allH2s = body.locator('h2');
    const count = await allH2s.count();
    expect(count).toBeGreaterThan(1);

    // The 2nd h2 starts segment 2 and is rendered as a faded "preview" — it
    // stays visually present so readers see what's coming, but the impl marks
    // it inert + aria-hidden so it's out of tab order / SR tree. Assert that
    // semantic-hiding contract rather than visual visibility.
    const secondH2 = allH2s.nth(1);
    await expect(secondH2).toHaveAttribute('inert', '');
    await expect(secondH2).toHaveAttribute('aria-hidden', 'true');
  });

  test('clicking Continue reveals next segment', async ({ page }) => {
    await page.goto(LONG_LESSON);
    const continueBtn = page.getByTestId('segment-continue-btn');
    await expect(continueBtn).toBeVisible({ timeout: 10_000 });

    const body = page.locator('[data-lesson-body]');
    const secondH2 = body.locator('h2').nth(1);
    // Before click, segment 2 is inert (see preview-heading note above).
    await expect(secondH2).toHaveAttribute('inert', '');

    await continueBtn.click();

    // After click, inert is removed and the heading is interactive again.
    await expect(secondH2).not.toHaveAttribute('inert', '', { timeout: 5_000 });
    await expect(secondH2).not.toHaveAttribute('aria-hidden', 'true');
  });

  test('no auto-advance: waiting does not reveal hidden segments', async ({ page }) => {
    await page.goto(LONG_LESSON);
    const continueBtn = page.getByTestId('segment-continue-btn');
    await expect(continueBtn).toBeVisible({ timeout: 10_000 });

    const body = page.locator('[data-lesson-body]');
    const secondH2 = body.locator('h2').nth(1);

    // Wait 2 seconds without clicking — second segment must still be inert.
    await page.waitForTimeout(2_000);
    await expect(secondH2).toHaveAttribute('inert', '');
    await expect(secondH2).toHaveAttribute('aria-hidden', 'true');
    await expect(continueBtn).toBeVisible();
  });

  test('Continue button is keyboard-focusable', async ({ page }) => {
    await page.goto(LONG_LESSON);
    const continueBtn = page.getByTestId('segment-continue-btn');
    await expect(continueBtn).toBeVisible({ timeout: 10_000 });

    await continueBtn.focus();
    await expect(continueBtn).toBeFocused();
  });

  test('Enter key on Continue button reveals next segment', async ({ page }) => {
    await page.goto(LONG_LESSON);
    const continueBtn = page.getByTestId('segment-continue-btn');
    await expect(continueBtn).toBeVisible({ timeout: 10_000 });

    const body = page.locator('[data-lesson-body]');
    const secondH2 = body.locator('h2').nth(1);
    // Pre-condition: segment 2 is inert before the keypress.
    await expect(secondH2).toHaveAttribute('inert', '');

    await continueBtn.focus();
    await page.keyboard.press('Enter');

    // After Enter, inert/aria-hidden are cleared on segment 2.
    await expect(secondH2).not.toHaveAttribute('inert', '', { timeout: 5_000 });
    await expect(secondH2).not.toHaveAttribute('aria-hidden', 'true');
  });

  test('a11y: no serious/critical violations on segmented lesson', async ({ page }) => {
    await page.goto(LONG_LESSON);
    const continueBtn = page.getByTestId('segment-continue-btn');
    await expect(continueBtn).toBeVisible({ timeout: 10_000 });

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

    expect(blocking, `Serious/critical a11y violations on segmented lesson:${detail}`).toEqual([]);
  });
});
