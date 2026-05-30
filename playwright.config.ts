import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4321',
    // Astro 6's security.checkOrigin returns 403 for non-GET requests whose
    // Content-Type is form-like (incl. text/plain — Playwright's default for
    // empty-body POSTs) when Origin doesn't match the URL origin. Setting
    // Origin here keeps all page.request.* calls same-origin so the SRS
    // /api/review/* endpoints accept them.
    extraHTTPHeaders: { Origin: 'http://localhost:4321' },
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    {
      // WebKit (Safari engine) — most divergent rendering behaviour.
      // Scoped to smoke + a11y specs only; visual snapshots are chromium/Linux-only
      // and are managed via the separate playwright.visual.config.ts config.
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testMatch: ['**/smoke.spec.ts', '**/a11y.spec.ts'],
    },
  ],
  webServer: {
    // Dev server runs SSR endpoints (profile, /api/*) needed by the v2 auth E2E.
    // The Vercel adapter's `dist/client/` static output cannot serve these routes.
    command: 'npm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
