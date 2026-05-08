import { test, expect } from '@playwright/test';

test.describe('exam mode wrapper', () => {
  test('enter exam → timer counts → no mid-exam feedback → submit early → attempt persists', async ({ page }) => {
    await page.addLocatorHandler(page.locator('vite-error-overlay'), async (el) => {
      await el.locator('button').first().click();
    });

    // Suppress the submit confirm() so the early-submit path runs unattended.
    page.on('dialog', (d) => d.accept());

    // 1. Home loads, exam CTA visible.
    await page.goto('/');
    await expect(page.getByTestId('hero-exam-cta')).toBeVisible();
    await page.getByTestId('hero-exam-cta').click();

    // 2. Exam page loads.
    await expect(page).toHaveURL('/exam');
    await expect(page.locator('h1')).toContainText('Mock exam');

    // 3. Timer is visible and counting down (sample two readings).
    const timer = page.getByTestId('exam-timer');
    await expect(timer).toBeVisible();
    const t1 = (await timer.textContent())?.trim();
    expect(t1).toMatch(/^\d{2}:\d{2}$/);
    await page.waitForTimeout(2_500);
    const t2 = (await timer.textContent())?.trim();
    expect(t2).not.toBe(t1); // timer ticked

    // 4. Mid-exam there is no correctness feedback after answering.
    await page.getByTestId('exam-option-0').click();
    await expect(page.getByText(/✓ Correct!/)).toHaveCount(0);
    await expect(page.getByText(/✗ Incorrect/)).toHaveCount(0);
    await expect(page.getByTestId('exam-summary')).toHaveCount(0);
    await expect(page.getByText(/Correct answer:/)).toHaveCount(0);

    // 5. Answer count reflects selection.
    await expect(page.getByTestId('exam-answered-count')).toContainText('1 answered');

    // 6. Navigate forward, answer Q2, then submit early.
    await page.getByTestId('exam-next').click();
    await page.getByTestId('exam-option-1').click();
    await expect(page.getByTestId('exam-answered-count')).toContainText('2 answered');

    await page.getByTestId('exam-submit-early').click();

    // 7. Summary screen renders with all sections.
    const summary = page.getByTestId('exam-summary');
    await expect(summary).toBeVisible();

    // raw score is a non-negative integer
    await expect(page.getByTestId('exam-score')).toHaveText(/^\d+$/);

    // pass/fail badge present, percentage shown, threshold quoted
    const badge = page.getByTestId('exam-pass-badge');
    await expect(badge).toBeVisible();
    await expect(badge).toHaveAttribute('data-passed', /^(true|false)$/);
    await expect(page.getByTestId('exam-pct')).toContainText(/\d+% \(.*65%/);

    // time taken renders in mm:ss
    await expect(page.getByTestId('exam-time-taken')).toHaveText(/time taken · \d{2}:\d{2}/);

    // per-question grid: question text + user's answer + correct answer + explanation
    await expect(page.getByTestId('exam-review-grid')).toBeVisible();
    await expect(page.getByTestId('exam-review-0')).toBeVisible();
    await expect(page.getByTestId('exam-review-0-your')).toContainText('Your answer:');
    await expect(page.getByTestId('exam-review-0-correct')).toContainText('Correct answer:');

    // 8. Anonymous run: persistence runs against sessionStorage; not signed in note shows.
    await expect(page.getByTestId('exam-save-status')).toContainText('not signed in');

    // 9. Confirm pending attempt landed in sessionStorage with mode=exam.
    const stored = await page.evaluate(() =>
      sessionStorage.getItem('quiz_attempt_mock-exam'),
    );
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored as string);
    expect(parsed.mode).toBe('exam');
    expect(parsed.quizSlug).toBe('mock-exam');
    expect(parsed.total).toBeGreaterThan(0);
    expect(Array.isArray(parsed.answers)).toBe(true);
  });
});
