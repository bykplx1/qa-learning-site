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
      // The count is informational only (no target gate, per product decision).
      const wordcount = page.getByTestId('feynman-wordcount');
      await expect(wordcount).toContainText('6');
      await expect(wordcount).toContainText('words written');
    });

    test('submit is disabled only while empty, then enabled once anything is written', async ({
      page,
    }) => {
      await page.goto(LESSON);
      await page.waitForLoadState('networkidle');

      const submitBtn = page.getByTestId('feynman-submit');
      // Empty textarea → disabled (the only gate is non-empty, not a word target).
      await expect(submitBtn).toBeDisabled();

      const textarea = page.getByTestId('feynman-textarea');
      // A few words — well under the ~150 target — must already enable submit.
      await textarea.fill('just a few words');
      await expect(submitBtn).toBeEnabled();
    });
  });

  // ------------------------------------------------------------------
  // Retrieval Prompt — closed-book (no answer reveal by design)
  // ------------------------------------------------------------------
  test.describe('Retrieval Prompt (closed-book)', () => {
    test('prompt renders its question and a self-check hint, with no answer-reveal control', async ({
      page,
    }) => {
      await page.goto(LESSON);
      await page.waitForLoadState('networkidle');

      const prompt = page.locator('.mdx-prompt').first();
      await expect(prompt).toBeVisible();

      // The question body (authored as the component's children) is visible.
      await expect(prompt.locator('.mdx-prompt__body')).not.toBeEmpty();

      // Closed-book retrieval: there is deliberately no "Reveal answer" affordance.
      await expect(prompt.locator('.mdx-prompt__reveal')).toHaveCount(0);
      await expect(prompt.locator('.mdx-prompt__hint')).toBeVisible();
    });
  });

  // ------------------------------------------------------------------
  // #517 — Practice Task completion button is interactive
  // ------------------------------------------------------------------
  test.describe('Practice Task completion (#517)', () => {
    test('clicking the button removes it and shows the completion state', async ({ page }) => {
      await page.goto(LESSON);
      await page.waitForLoadState('networkidle');

      const button = page.locator('[data-testid^="practice-task-submit-"]').first();
      await expect(button).toBeVisible();

      await button.click();

      // Button disappears — React state updated.
      await expect(button).not.toBeVisible({ timeout: 5_000 });

      // Completion message appears. Lesson tasks embed their assessment criteria
      // inline, so completion simply confirms and points back to the task body.
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
