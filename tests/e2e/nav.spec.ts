import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function dismissDevOverlay(page: Page) {
  await page.addLocatorHandler(page.locator('vite-error-overlay'), async (el) => {
    await el.locator('button').first().click();
  });
}

test.describe('mobile nav drawer', () => {
  test.beforeEach(async ({ page }) => {
    await dismissDevOverlay(page);
  });

  test('mobile: toggle visible, nav links hidden, drawer interaction', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();

    const desktopNav = page.locator('nav.nav__links');
    await expect(desktopNav).toBeHidden();

    const toggle = page.getByRole('button', { name: /Open menu/i });
    await expect(toggle).toBeVisible();

    await toggle.click();

    const drawer = page.locator('#mobile-nav');
    await expect(drawer).toBeVisible();
    await expect(drawer).not.toHaveAttribute('inert');

    const firstLink = drawer.locator('a').first();
    await expect(firstLink).toBeFocused();
  });

  test('mobile: Tab cycles within drawer', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();

    const toggle = page.getByRole('button', { name: /Open menu/i });
    await toggle.click();

    const drawer = page.locator('#mobile-nav');
    await expect(drawer).toBeVisible();

    const links = drawer.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);

    // Tab through all links then wrap to first
    for (let i = 1; i < count; i++) {
      await page.keyboard.press('Tab');
    }
    await expect(links.last()).toBeFocused();

    // One more Tab should wrap to first (focus trap)
    await page.keyboard.press('Tab');
    await expect(links.first()).toBeFocused();
  });

  test('mobile: Esc closes drawer, focus returns to toggle', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();

    const toggle = page.getByRole('button', { name: /Open menu/i });
    await toggle.click();

    const drawer = page.locator('#mobile-nav');
    await expect(drawer).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(drawer).not.toBeVisible();

    await expect(page.getByRole('button', { name: /Open menu/i })).toBeFocused();
  });

  test('mobile: scrim click closes drawer', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();

    const toggle = page.getByRole('button', { name: /Open menu/i });
    await toggle.click();

    const drawer = page.locator('#mobile-nav');
    await expect(drawer).toBeVisible();

    const scrim = page.locator('.mobile-nav__scrim');
    await expect(scrim).toBeVisible();
    await scrim.click();

    await expect(drawer).not.toBeVisible();
  });

  test('mobile: first nav link has expected href', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();

    const toggle = page.getByRole('button', { name: /Open menu/i });
    await toggle.click();

    const drawer = page.locator('#mobile-nav');
    await expect(drawer).toBeVisible();

    const firstLink = drawer.locator('a').first();
    await expect(firstLink).toHaveAttribute('href', '/lessons');
  });

  test('mobile: axe a11y while drawer is open', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();

    const toggle = page.getByRole('button', { name: /Open menu/i });
    await toggle.click();

    const drawer = page.locator('#mobile-nav');
    await expect(drawer).toBeVisible();

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
              return `  [${v.impact}] ${v.id}: ${v.help}\n    nodes: ${targets}\n    help: ${v.helpUrl}`;
            })
            .join('\n');
    expect(blocking, `Serious/critical a11y violations on "mobile-nav-open":${detail}`).toEqual([]);
  });

  test('desktop: toggle hidden, nav links visible', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();

    const desktopNav = page.locator('nav.nav__links');
    await expect(desktopNav).toBeVisible();

    const toggle = page.locator('.nav__toggle');
    await expect(toggle).toBeHidden();
  });
});
