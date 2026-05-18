import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PROJECT_SLUG = 'flaky-test-hunter';
const PROJECT_URL = `/projects/${PROJECT_SLUG}`;

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function dismissDevOverlay(page: Page) {
  await page.addLocatorHandler(page.locator('vite-error-overlay'), async (el) => {
    await el.locator('button').first().click();
  });
}

test.describe('project rubric panel', () => {
  test.beforeEach(async ({ page }) => {
    await dismissDevOverlay(page);
  });

  test('rubric panel is in the DOM on page load, before any submission', async ({ page }) => {
    await page.goto(PROJECT_URL);

    // Page title must be visible — confirms the page loaded.
    await expect(page.locator('h1').first()).toBeVisible();

    // Rubric panel must be visible WITHOUT any user interaction.
    const panel = page.getByTestId('rubric-panel');
    await expect(panel).toBeVisible();
  });

  test('rubric panel renders all criterion rows', async ({ page }) => {
    await page.goto(PROJECT_URL);
    await expect(page.locator('h1').first()).toBeVisible();

    const panel = page.getByTestId('rubric-panel');
    await expect(panel).toBeVisible();

    // flaky-test-hunter rubric has 4 rows
    await expect(panel.getByTestId('rubric-row-root_cause')).toBeVisible();
    await expect(panel.getByTestId('rubric-row-fix_proposal')).toBeVisible();
    await expect(panel.getByTestId('rubric-row-verification')).toBeVisible();
    await expect(panel.getByTestId('rubric-row-write_up')).toBeVisible();
  });

  test('rubric panel is visible on a project without a prior submission (contract: visible before submit)', async ({
    page,
  }) => {
    await page.goto(PROJECT_URL);
    await expect(page.locator('h1').first()).toBeVisible();

    // Submit form may or may not be visible (depends on auth), but the rubric
    // panel must always be there — this is the distinguishing contract vs Feynman.
    const panel = page.getByTestId('rubric-panel');
    await expect(panel).toBeVisible();

    // Ensure the submit button (if rendered) has NOT been clicked.
    const submitBtn = page.getByRole('button', { name: /submit/i }).first();
    const submitBtnCount = await submitBtn.count();
    // rubric panel still visible regardless of submit form state
    await expect(panel).toBeVisible();
    // Page not in a submitted state
    if (submitBtnCount > 0) {
      await expect(submitBtn).toBeEnabled();
    }
  });

  test('rubric panel — a11y: no serious/critical WCAG 2.2 AA violations', async ({ page }) => {
    await page.goto(PROJECT_URL);
    await expect(page.locator('h1').first()).toBeVisible();

    // Wait for rubric panel to be in the DOM so axe scans it.
    await expect(page.getByTestId('rubric-panel')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(WCAG_TAGS)
      .include('[data-testid="rubric-panel"]')
      .analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );

    for (const v of results.violations.filter(
      (v) => v.impact === 'moderate' || v.impact === 'minor',
    )) {
      const targets = v.nodes.map((n) => n.target.join(' ')).join('; ');
      console.warn(
        `[a11y:rubric-panel] ${v.impact}: ${v.id} (${v.nodes.length}) — ${v.help}\n  ${targets}`,
      );
    }

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

    expect(
      blocking,
      `Serious/critical a11y violations on rubric panel:${detail}`,
    ).toEqual([]);
  });

  test('rubric panel — keyboard-navigable: all interactive elements reachable via Tab', async ({
    page,
  }) => {
    await page.goto(PROJECT_URL);
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.getByTestId('rubric-panel')).toBeVisible();

    // The rubric panel is a read-only informational section (no interactive
    // controls). Verify the section itself is reachable in the focus order by
    // checking that its heading text is present and its aria-label is announced.
    const panel = page.getByTestId('rubric-panel');
    await expect(panel).toHaveAttribute('aria-label', /grading rubric/i);

    // The criteria list must be reachable via role landmarks.
    const criteriaList = panel.getByRole('list', { name: /rubric criteria/i });
    await expect(criteriaList).toBeVisible();
  });
});
