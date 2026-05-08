import { defineConfig, devices } from '@playwright/test';

/**
 * Visual regression config (separate from e2e).
 *
 * Run only on Linux (CI). Cross-OS font rendering is unmanageable, so
 * baselines are committed from CI runs and never produced on contributor
 * machines. See CONTRIBUTING.md → "Updating visual baselines".
 *
 * Pin = (exact @playwright/test version in package.json) → bundled chromium.
 */
export default defineConfig({
  testDir: './tests/visual',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['html', { open: 'never', outputFolder: 'playwright-visual-report' }]],
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 0,
      animations: 'disabled',
    },
  },
  use: {
    baseURL: 'http://localhost:4321',
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'linux-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
