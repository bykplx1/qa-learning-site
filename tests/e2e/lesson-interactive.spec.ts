/**
 * Regression guard for issues #515, #516, #517.
 *
 * Verifies that interactive lesson components are fully clickable and hydrate
 * on a real lesson page. Root cause: SegmentedLesson set `inert` on hidden
 * segments, silently swallowing all interaction. SegmentedLesson was removed
 * in PR #537; these specs prevent future regressions.
 *
 * Test lesson: /lessons/test-design/test-design-techniques
 * — contains FeynmanEditor, Prompt (<details>/<summary>), and PracticeTask.
 */

import { test, expect, type Page } from '@playwright/test';

const LESSON = '/lessons/test-design/test-design-techniques';

async function dismissDevOverlay(page: Page) {
  await page.addLocatorHandler(page.locator('vite-error-overlay'), async (el) => {
    await el.locator('button').first().click();
  });
}

test.describe('lesson interactive components', () => {
  test.beforeEach(async ({ page }) => {
    await dismissDevOverlay(page);
  });

  // ------------------------------------------------------------------
  // #515 — Feynman answer block is clickable and React-hydrated
  // ------------------------------------------------------------------
  test.describe('Feynman editor (#515)', () => {
    test('textarea accepts input and word count updates', async ({ page }) => {
      await page.goto(LESSON);
      await page.waitForLoadState('networkidle');

      const textarea = page.getByTestId('feynman-textarea');
      await expect(textarea).toBeVisible();

      // Typing should work — click first to focus.
      await textarea.click();
      await expect(textarea).toBeFocused();

      // Fill with a known word count (6 words).
      await textarea.fill('hello world testing one two three');

      // Word count indicator must update — this requires React to be hydrated.
      const wordcount = page.getByTestId('feynman-wordcount');
      await expect(wordcount).toContainText('6');
      await expect(wordcount).toContainText('144 more to go');
    });

    test('submit button stays disabled until word target is met', async ({ page }) => {
      await page.goto(LESSON);
      await page.waitForLoadState('networkidle');

      const submitBtn = page.getByTestId('feynman-submit');
      await expect(submitBtn).toBeDisabled();

      const textarea = page.getByTestId('feynman-textarea');
      // Empty textarea → still disabled.
      await textarea.click();
      await expect(submitBtn).toBeDisabled();
    });
  });

  // ------------------------------------------------------------------
  // #516 — Retrieval Prompt "Reveal answer" works (mouse + keyboard)
  // ------------------------------------------------------------------
  test.describe('Retrieval Prompt reveal (#516)', () => {
    test('clicking summary toggles answer visible (mouse)', async ({ page }) => {
      await page.goto(LESSON);

      const details = page.locator('.mdx-prompt__reveal').first();
      await expect(details).toBeVisible();

      const summary = details.locator('summary');
      const answer = details.locator('.mdx-prompt__answer');

      // Answer hidden before interaction.
      await expect(answer).not.toBeVisible();

      await summary.click();

      // Answer must appear after click.
      await expect(answer).toBeVisible();
    });

    test('Enter key on summary reveals answer (keyboard)', async ({ page }) => {
      await page.goto(LESSON);

      const details = page.locator('.mdx-prompt__reveal').first();
      const summary = details.locator('summary');
      const answer = details.locator('.mdx-prompt__answer');

      await summary.focus();
      await page.keyboard.press('Enter');

      await expect(answer).toBeVisible();
    });

    test('Space key on summary reveals answer (keyboard)', async ({ page }) => {
      await page.goto(LESSON);

      const details = page.locator('.mdx-prompt__reveal').first();
      const summary = details.locator('summary');
      const answer = details.locator('.mdx-prompt__answer');

      await summary.focus();
      await page.keyboard.press('Space');

      await expect(answer).toBeVisible();
    });
  });

  // ------------------------------------------------------------------
  // #517 — Practice Task "reveal rubric" button is interactive
  // ------------------------------------------------------------------
  test.describe('Practice Task reveal rubric (#517)', () => {
    test('clicking reveal button removes button and shows completion state', async ({ page }) => {
      await page.goto(LESSON);
      await page.waitForLoadState('networkidle');

      const button = page.locator('[data-testid^="practice-task-submit-"]').first();
      await expect(button).toBeVisible();

      await button.click();

      // Button disappears — React state updated.
      await expect(button).not.toBeVisible({ timeout: 5_000 });

      // Completion message appears (lesson tasks embed their rubric in the
      // task body; the registry fallback shows a self-evaluation prompt).
      const complete = page.locator('[data-testid^="practice-task-complete-"]').first();
      await expect(complete).toBeVisible({ timeout: 3_000 });
      await expect(complete).toContainText('complete');
    });

    test('practice task body (with inline rubric) remains visible after reveal', async ({
      page,
    }) => {
      await page.goto(LESSON);
      await page.waitForLoadState('networkidle');

      const task = page.locator('[data-testid^="practice-task-tdt"]').first();
      await expect(task).toBeVisible();

      // Task body with inline rubric content is always visible.
      const body = task.locator('.mdx-task__body');
      await expect(body).toBeVisible();

      const button = task.locator('[data-testid^="practice-task-submit-"]');
      await button.click();

      // Body with rubric text stays visible after submission.
      await expect(body).toBeVisible();
    });
  });
});
