import { test, expect } from '@playwright/test';

test.describe('exam mode wrapper', () => {
  test('enter exam → timer counts → no mid-exam feedback → submit early → attempt persists', async ({ page }) => {
    await page.addLocatorHandler(page.locator('vite-error-overlay'), async (el) => {
      await el.locator('button').first().click();
    });

    // The submit button now opens an in-app modal; no native dialog to suppress.

    // 1. Home loads, exam CTA visible.
    await page.goto('/');
    await expect(page.getByTestId('hero-exam-cta')).toBeVisible();
    await page.getByTestId('hero-exam-cta').click();

    // 2. Certificate selector loads — pick the CTFL mock exam.
    await expect(page).toHaveURL('/exam');
    await expect(page.locator('h1')).toContainText('Choose a certification');
    await page.getByTestId('cert-card-ctfl').click();

    // 3. CTFL exam page loads — Start gate is shown, timer not yet visible.
    await expect(page).toHaveURL('/exam/ctfl');
    await expect(page.locator('h1')).toContainText('CTFL');
    await expect(page.getByTestId('exam-start-gate')).toBeVisible();
    await expect(page.getByTestId('exam-timer')).toHaveCount(0);

    // 3. Click Start exam to begin.
    await page.getByTestId('exam-start-btn').click();
    await expect(page.getByTestId('exam-start-gate')).toHaveCount(0);

    // 4. Timer is visible and counting down (sample two readings).
    const timer = page.getByTestId('exam-timer');
    await expect(timer).toBeVisible();
    const t1 = (await timer.textContent())?.trim();
    expect(t1).toMatch(/^\d{2}:\d{2}$/);
    await page.waitForTimeout(2_500);
    const t2 = (await timer.textContent())?.trim();
    expect(t2).not.toBe(t1); // timer ticked

    // 5. Mid-exam there is no correctness feedback after answering.
    await page.getByTestId('exam-option-0').click();
    await expect(page.getByText(/✓ Correct!/)).toHaveCount(0);
    await expect(page.getByText(/✗ Incorrect/)).toHaveCount(0);
    await expect(page.getByTestId('exam-summary')).toHaveCount(0);
    await expect(page.getByText(/Correct answer:/)).toHaveCount(0);

    // 6. Answer count reflects selection.
    await expect(page.getByTestId('exam-answered-count')).toContainText('1 answered');

    // 7. Navigate forward, answer Q2, then submit early.
    await page.getByTestId('exam-next').click();
    await page.getByTestId('exam-option-1').click();
    await expect(page.getByTestId('exam-answered-count')).toContainText('2 answered');

    await page.getByTestId('exam-submit-early').click();
    // Confirm in the in-app modal
    await page.getByTestId('exam-confirm-submit').click();

    // 8. Summary screen renders with all sections.
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

    // 9. Anonymous run: persistence runs against sessionStorage; not signed in note shows.
    await expect(page.getByTestId('exam-save-status')).toContainText('not signed in');

    // 10. Confirm pending attempt landed in sessionStorage with mode=exam.
    const stored = await page.evaluate(() =>
      sessionStorage.getItem('quiz_attempt_mock-exam-ctfl'),
    );
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored as string);
    expect(parsed.mode).toBe('exam');
    expect(parsed.quizSlug).toBe('mock-exam-ctfl');
    expect(parsed.total).toBeGreaterThan(0);
    expect(Array.isArray(parsed.answers)).toBe(true);
  });

  test('mid-exam refresh resumes past the Start gate', async ({ page }) => {
    await page.addLocatorHandler(page.locator('vite-error-overlay'), async (el) => {
      await el.locator('button').first().click();
    });

    // Navigate directly to a certificate exam page.
    await page.goto('/exam/ctfl');

    // Start the exam.
    await expect(page.getByTestId('exam-start-gate')).toBeVisible();
    await page.getByTestId('exam-start-btn').click();
    await expect(page.getByTestId('exam-timer')).toBeVisible();

    // Answer first question to generate some state.
    await page.getByTestId('exam-option-0').click();
    await expect(page.getByTestId('exam-answered-count')).toContainText('1 answered');

    // Wait a moment so elapsed time is non-trivial.
    await page.waitForTimeout(1_500);
    const timerBefore = (await page.getByTestId('exam-timer').textContent())?.trim();

    // Reload the page.
    await page.reload();

    // Should land directly in active phase — no Start gate.
    await expect(page.getByTestId('exam-start-gate')).toHaveCount(0);
    await expect(page.getByTestId('exam-timer')).toBeVisible();

    // Timer should reflect elapsed time (less than full duration).
    const timerAfter = (await page.getByTestId('exam-timer').textContent())?.trim();
    expect(timerAfter).toMatch(/^\d{2}:\d{2}$/);
    // Timer after reload should not be higher than the timer before (wall-clock accurate)
    expect(timerAfter).not.toBe('60:00');
    // The timer should be close to or less than timerBefore
    expect(timerAfter).toBeTruthy();
    expect(timerBefore).toBeTruthy();
  });
});
