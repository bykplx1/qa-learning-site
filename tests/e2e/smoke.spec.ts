import { test, expect } from '@playwright/test';

const CLUSTER = 'test-design';
const SLUG = 'exploratory-testing';
const LESSON_URL = `/lessons/${CLUSTER}/${SLUG}`;
const STORAGE_KEY = `quiz_${SLUG}`;
const TOTAL_QUESTIONS = 20;

test('home → lesson → quiz → refresh restores state → finish → summary', async ({ page }) => {
  // Auto-dismiss vite error overlay that appears in dev mode (pagefind not built)
  await page.addLocatorHandler(page.locator('vite-error-overlay'), async (el) => {
    await el.locator('button').first().click();
  });

  // 1. Home loads
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();

  // 2. Navigate to lesson via link. The home page surfaces lessons in two
  // regions (curated track tiles + "Latest lessons" list) — scope by href
  // so we pick the lesson row regardless of which surface is rendering it.
  await page.locator(`a[href="${LESSON_URL}"]`).first().click();
  await expect(page).toHaveURL(LESSON_URL);
  await expect(page.locator('h1').first()).toContainText('Exploratory Testing');

  // 3. Quiz section loads (React island: client:load)
  await expect(page.locator('#quiz')).toBeVisible();
  await expect(page.getByText(`Question 1 / ${TOTAL_QUESTIONS}`)).toBeVisible();

  // 4. Wait for QuizRunner to finish hydrating, then click first option button
  await expect(page.locator('#quiz [data-quiz-ready="true"]')).toBeVisible();
  await page.locator('#quiz button').first().click();

  // 5. Feedback appears
  await expect(page.getByText(/✓ Correct!|✗ Incorrect/)).toBeVisible({ timeout: 10_000 });

  // 6. Refresh mid-quiz
  await page.reload();
  await expect(page.locator('#quiz')).toBeVisible();

  // 7. State restored — still on Q1 with feedback visible
  await expect(page.getByText(`Question 1 / ${TOTAL_QUESTIONS}`)).toBeVisible();
  await expect(page.getByText(/✓ Correct!|✗ Incorrect/)).toBeVisible();
  await expect(page.getByRole('button', { name: /Next Question|See Results/ })).toBeVisible();

  // 8. Jump to last question via sessionStorage to keep test fast
  await page.evaluate(
    ({ key, total }) => {
      const state = {
        currentIndex: total - 1,
        answers: [...Array(total - 1).fill(0), null],
        feedback: false,
        status: 'active',
      };
      sessionStorage.setItem(key, JSON.stringify(state));
    },
    { key: STORAGE_KEY, total: TOTAL_QUESTIONS },
  );
  await page.reload();

  // 9. On last question — answer it
  await expect(page.getByText(`Question ${TOTAL_QUESTIONS} / ${TOTAL_QUESTIONS}`)).toBeVisible();
  await expect(page.locator('#quiz [data-quiz-ready="true"]')).toBeVisible();
  await page.locator('#quiz button').first().click();
  await expect(page.getByRole('button', { name: 'See Results' })).toBeVisible();
  await page.getByRole('button', { name: 'See Results' }).click();

  // 10. Summary visible
  await expect(page.getByText('Quiz Complete')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry Quiz' })).toBeVisible();
});
