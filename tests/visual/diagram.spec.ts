import { test, expect } from '@playwright/test';

/**
 * Linux-only — local font rendering diverges enough to invalidate baselines.
 * Visual baselines are produced and consumed by CI exclusively.
 * Regenerate via workflow_dispatch on ci.yml with update_visual_baselines=true.
 */
test.skip(process.platform !== 'linux', 'visual snapshots run on Linux only');

test.describe('Diagram component visual', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/__fixture__/diagram');
    // Wait for Mermaid island to hydrate and render SVG
    await page.waitForSelector('#mermaid-section .mdx-diagram__svg-wrap', { timeout: 15_000 });
  });

  test('mermaid diagram — light', async ({ page }) => {
    await expect(page.locator('#mermaid-section')).toHaveScreenshot('diagram-mermaid-light.png');
  });

  test('inline SVG diagram — light', async ({ page }) => {
    await expect(page.locator('#inline-svg-section')).toHaveScreenshot('diagram-inline-svg-light.png');
  });

  test('skip=atomic-fact hides diagram', async ({ page }) => {
    const skipped = page.locator('.mdx-diagram--skipped');
    await expect(skipped).toBeHidden();
    // Control element confirms the rest of the page rendered
    await expect(page.locator('#skip-control')).toBeVisible();
  });
});
