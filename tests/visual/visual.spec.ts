import { test, expect, type Page } from '@playwright/test';

// Visual fixture: a live curriculum topic that has a generated quiz. The flat
// `/lessons/<slug>` route and the `testing-principles` vault slug were both
// retired in #294, so the spec targets the canonical `/lessons/<cluster>/<slug>`.
const LESSON_CLUSTER = 'test-design';
const LESSON_SLUG = 'test-design-techniques';
const LESSON_PATH = `/lessons/${LESSON_CLUSTER}/${LESSON_SLUG}`;
const QUIZ_STORAGE_KEY = `quiz_${LESSON_SLUG}`;

/**
 * Linux-only — local font rendering diverges enough to invalidate baselines.
 * Visual baselines are produced and consumed by CI exclusively.
 */
test.skip(process.platform !== 'linux', 'visual snapshots run on Linux only');

async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.addInitScript((t: string) => {
    try {
      localStorage.setItem('theme', t);
    } catch {
      /* storage may be unavailable on some routes */
    }
  }, theme);
}

async function dismissDevOverlay(page: Page) {
  await page.addLocatorHandler(page.locator('vite-error-overlay'), async (el) => {
    await el.locator('button').first().click();
  });
}

async function settle(page: Page) {
  await page.evaluate(async () => {
    if ('fonts' in document) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (document as any).fonts.ready;
    }
  });
}

async function clearQuizState(page: Page) {
  await page.addInitScript((key: string) => {
    try {
      sessionStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }, QUIZ_STORAGE_KEY);
}

async function disableStickyNav(page: Page) {
  // Element screenshots of #quiz include the sticky nav overlap; sub-pixel
  // font AA on the nav varies between runs and trips strict diff comparison.
  await page.addInitScript(() => {
    const apply = () => {
      const s = document.createElement('style');
      s.textContent = '.nav{position:static !important}';
      document.head.appendChild(s);
    };
    if (document.head) apply();
    else document.addEventListener('DOMContentLoaded', apply, { once: true });
  });
}

for (const theme of ['light', 'dark'] as const) {
  test.describe(`${theme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      await setTheme(page, theme);
      await dismissDevOverlay(page);
      await disableStickyNav(page);
    });

    test('home', async ({ page }) => {
      await page.goto('/');
      await settle(page);
      await expect(page).toHaveScreenshot(`home-${theme}.png`, { fullPage: true });
    });

    test('lesson', async ({ page }) => {
      await clearQuizState(page);
      await page.goto(LESSON_PATH);
      await expect(page.locator('#quiz')).toBeVisible();
      await settle(page);
      await expect(page).toHaveScreenshot(`lesson-${theme}.png`, { fullPage: true });
    });

    test('quiz mid-attempt', async ({ page }) => {
      await clearQuizState(page);
      await page.goto(LESSON_PATH);
      const quiz = page.locator('#quiz');
      await expect(quiz).toBeVisible();
      // React island hydration: the question indicator only paints after
      // mount, so clicking before this races the handler binding.
      await expect(quiz.getByText(/Question 1 \/ \d+/)).toBeVisible();
      await quiz.locator('button').first().click();
      await expect(quiz.getByText(/✓ Correct!|✗ Incorrect/)).toBeVisible({
        timeout: 10_000,
      });
      await settle(page);
      await expect(quiz).toHaveScreenshot(`quiz-mid-${theme}.png`);
    });

    test('profile (anonymous)', async ({ page }) => {
      await page.goto('/profile');
      await expect(page.locator('.signed-out')).toBeVisible();
      await settle(page);
      await expect(page).toHaveScreenshot(`profile-${theme}.png`, { fullPage: true });
    });
  });
}
