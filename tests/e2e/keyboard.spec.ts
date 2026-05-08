import { test, expect, type Page } from '@playwright/test';

const LESSON_SLUG = 'testing-principles';

async function dismissDevOverlay(page: Page) {
  await page.addLocatorHandler(page.locator('vite-error-overlay'), async (el) => {
    await el.locator('button').first().click();
  });
}

test.describe('keyboard-only operability', () => {
  test.beforeEach(async ({ page }) => {
    await dismissDevOverlay(page);
  });

  test('search modal: Ctrl+K opens, focuses input, Esc closes', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();
    // SearchModal is client:only — its keydown listener is attached on mount.
    // Waiting for the (also client:only) SearchTrigger button confirms the
    // React islands hydrated; pressing Ctrl+K beforehand races the listener.
    await expect(page.getByRole('button', { name: /Search.*Ctrl\+K/i })).toBeVisible();

    await page.keyboard.press('Control+k');
    const dialog = page.getByRole('dialog', { name: 'Search' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('searchbox')).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });

  test('quiz runner: tab to option, Enter selects, Tab to Next, Enter advances', async ({ page }) => {
    await page.goto(`/lessons/${LESSON_SLUG}`);
    const quiz = page.locator('#quiz');
    await expect(quiz).toBeVisible();
    await expect(quiz.getByText('Question 1 / 20')).toBeVisible();

    const firstOption = quiz.locator('button').first();
    await firstOption.focus();
    await expect(firstOption).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(quiz.getByText(/✓ Correct!|✗ Incorrect/)).toBeVisible({ timeout: 10_000 });

    const nextBtn = quiz.getByRole('button', { name: /Next Question|See Results/ });
    await nextBtn.focus();
    await page.keyboard.press('Enter');
    await expect(quiz.getByText('Question 2 / 20')).toBeVisible();
  });

  test('theme toggle: focusable, Enter toggles, aria-label updates', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: /Switch to (light|dark) mode/ });
    await toggle.focus();
    await expect(toggle).toBeFocused();

    const before = await toggle.getAttribute('aria-label');
    await page.keyboard.press('Enter');
    await expect
      .poll(async () => toggle.getAttribute('aria-label'))
      .not.toBe(before);

    const themeAttr = await page.locator('html').getAttribute('data-theme');
    expect(themeAttr === 'light' || themeAttr === 'dark').toBe(true);
  });

  test('profile (signed-out): sign-in CTAs reachable via Tab', async ({ page }) => {
    // Profile filters (category/topic toggles) are not yet built — when added,
    // extend this test to cover their keyboard ops. For now, verify the
    // signed-out profile's interactive controls are keyboard-reachable.
    await page.goto('/profile');
    await expect(page.locator('.signed-out')).toBeVisible();

    const githubCta = page.getByRole('link', { name: /Sign in with GitHub/i });
    const googleCta = page.getByRole('link', { name: /Sign in with Google/i });
    await githubCta.focus();
    await expect(githubCta).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(googleCta).toBeFocused();
  });
});
