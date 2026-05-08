import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ExamRunner from './ExamRunner';
import ExamSummary from './ExamSummary';
import type { QuizQuestion } from '../../lib/quiz/schema.js';

function makeQuestions(n: number): QuizQuestion[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `q-${i + 1}`,
    type: 'single' as const,
    q: `What is question ${i + 1}?`,
    options: ['Alpha', 'Beta', 'Gamma', 'Delta'],
    answer: 0,
    explanation: `Because answer ${i + 1}.`,
  }));
}

const LEAK_PATTERNS = [
  /✓\s*correct/i,
  /✗\s*wrong/i,
  /correct answer:/i,
  /your answer:/i,
  /pill--pass/,
  /exam-pass-badge/,
  /exam-summary/,
  /\bWhy:/,
];

describe('ExamRunner — no correctness leak before submission', () => {
  it('initial render has status=active and contains no correctness or summary markers', () => {
    const html = renderToStaticMarkup(
      <ExamRunner questions={makeQuestions(3)} examSlug="mock-exam" durationMs={60_000} />,
    );
    for (const p of LEAK_PATTERNS) {
      expect(html, `leaked pattern ${p}`).not.toMatch(p);
    }
    // QuestionScreen rendered (positive control)
    expect(html).toMatch(/exam-timer/);
    expect(html).toMatch(/exam-option-0/);
  });
});

describe('ExamSummary — positive control', () => {
  it('renders correctness, threshold, time-taken, and per-question grid', () => {
    const qs = makeQuestions(2);
    const html = renderToStaticMarkup(
      <ExamSummary
        questions={qs}
        answers={[0, 2]}
        score={1}
        total={2}
        durationSec={125}
        reason="submitted"
        retryHref="/exam"
      />,
    );
    expect(html).toMatch(/exam-summary/);
    expect(html).toMatch(/✓\s*correct/);
    expect(html).toMatch(/✗\s*wrong/);
    expect(html).toMatch(/Your answer:/);
    expect(html).toMatch(/Correct answer:/);
    expect(html).toMatch(/02:05/);
    expect(html).toMatch(/65%/);
  });
});
