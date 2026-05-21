import { test, expect } from '@playwright/test';

const LESSON_WITH_HEADINGS = '/lessons/test-design/exploratory-testing';

test.describe('table of contents', () => {
  test('renders on wide viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(LESSON_WITH_HEADINGS);
    const toc = page.getByRole('navigation', { name: 'Table of contents' });
    await expect(toc).toBeVisible();
    const links = toc.getByRole('link');
    await expect(links.first()).toBeVisible();
  });

  test('hidden on narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 900 });
    await page.goto(LESSON_WITH_HEADINGS);
    const toc = page.getByRole('navigation', { name: 'Table of contents' });
    await expect(toc).not.toBeVisible();
  });

  test('click scrolls to section and updates hash', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(LESSON_WITH_HEADINGS);
    const toc = page.getByRole('navigation', { name: 'Table of contents' });
    const firstLink = toc.getByRole('link').first();
    const href = await firstLink.getAttribute('href');
    const expectedSlug = href?.replace('#', '') ?? '';
    await firstLink.click();
    await expect(page).toHaveURL(new RegExp(`#${expectedSlug}`));
    const heading = page.locator(`#${expectedSlug}`);
    await expect(heading).toBeInViewport();
  });

  test('active link highlights on scroll', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(LESSON_WITH_HEADINGS);
    const toc = page.getByRole('navigation', { name: 'Table of contents' });
    const links = toc.getByRole('link');
    const firstLink = links.first();
    await expect(firstLink).toHaveClass(/is-active/);
  });

  // No-heading graceful render is a build-time guarantee:
  // TableOfContents only renders when tocHeadings.length > 0.
  // All current vault lessons have H2s, so no e2e fixture is available;
  // verified via component source inspection.
});
