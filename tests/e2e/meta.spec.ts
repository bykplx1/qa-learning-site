import { test, expect, type Page } from '@playwright/test';

async function dismissDevOverlay(page: Page) {
  await page.addLocatorHandler(page.locator('vite-error-overlay'), async (el) => {
    await el.locator('button').first().click();
  });
}

async function meta(page: Page, key: 'name' | 'property', value: string) {
  return page.locator(`head meta[${key}="${value}"]`).getAttribute('content');
}

async function expectFullMetaSet(page: Page, opts: {
  url: RegExp | string;
  ogType: 'website' | 'article';
  imageMatches: RegExp;
}) {
  expect(await meta(page, 'property', 'og:title')).toBeTruthy();
  expect(await meta(page, 'property', 'og:description')).toBeTruthy();
  expect(await meta(page, 'property', 'og:type')).toBe(opts.ogType);
  const ogUrl = await meta(page, 'property', 'og:url');
  expect(ogUrl).toBeTruthy();
  if (typeof opts.url === 'string') expect(ogUrl).toContain(opts.url);
  else expect(ogUrl ?? '').toMatch(opts.url);
  const ogImage = await meta(page, 'property', 'og:image');
  expect(ogImage ?? '').toMatch(opts.imageMatches);

  expect(await meta(page, 'name', 'twitter:card')).toBe('summary_large_image');
  expect(await meta(page, 'name', 'twitter:title')).toBeTruthy();
  expect(await meta(page, 'name', 'twitter:description')).toBeTruthy();
  expect(await meta(page, 'name', 'twitter:image')).toBe(ogImage);
}

test('index page exposes complete OG/Twitter meta with default image', async ({ page }) => {
  await dismissDevOverlay(page);
  await page.goto('/');
  await expectFullMetaSet(page, {
    url: '/',
    ogType: 'website',
    imageMatches: /\/og\/default\.png$/,
  });
});

test('lesson page references its per-slug OG image and article type', async ({ page }) => {
  await dismissDevOverlay(page);
  const slug = 'testing-principles';
  await page.goto(`/lessons/${slug}`);
  await expectFullMetaSet(page, {
    url: `/lessons/${slug}`,
    ogType: 'article',
    imageMatches: new RegExp(`/og/${slug}\\.png$`),
  });
});

test('projects index exposes website OG with default image', async ({ page }) => {
  await dismissDevOverlay(page);
  await page.goto('/projects');
  await expectFullMetaSet(page, {
    url: '/projects',
    ogType: 'website',
    imageMatches: /\/og\/default\.png$/,
  });
});
