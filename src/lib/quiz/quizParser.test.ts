import { describe, expect, it } from 'vitest';
import { parseQuiz } from './quizParser';

const LESSON = 'testing-principles';

const MINIMAL_QUIZ = `---
slug: testing-principles
---

## Quiz: Multiple Choice (2)

### Q1. Which principle states tests cannot prove a system is defect-free?
- A) Pesticide paradox
- B) Testing shows presence of defects
- C) Exhaustive testing is impossible
- D) Defect clustering

**Answer:** B
**Hint:** Read principle #1 literally.
**Why:** Tests reveal failures only when they trigger them.

### Q2. What is the pesticide paradox?
- A) Bugs accumulate in old code
- B) Repeated tests stop finding new defects
- C) Test data poisons production
- D) Too many tests slow regression

**Answer:** B
**Hint:** Like real pesticide — pests adapt.
**Why:** Static test set covers fixed paths.
`;

describe('parseQuiz', () => {
  it('parses question text and options correctly', () => {
    const result = parseQuiz(MINIMAL_QUIZ, LESSON);
    expect(result.lesson).toBe(LESSON);
    expect(result.questions).toHaveLength(2);
    const q1 = result.questions[0];
    expect(q1.q).toBe('Which principle states tests cannot prove a system is defect-free?');
    expect(q1.options).toEqual([
      'A) Pesticide paradox',
      'B) Testing shows presence of defects',
      'C) Exhaustive testing is impossible',
      'D) Defect clustering',
    ]);
  });

  it('maps answer letter to 0-based index', () => {
    const result = parseQuiz(MINIMAL_QUIZ, LESSON);
    // B → index 1
    expect(result.questions[0].answer).toBe(1);
    expect(result.questions[0].type).toBe('single');
  });

  it('generates IDs from lesson slug prefix', () => {
    const result = parseQuiz(MINIMAL_QUIZ, LESSON);
    expect(result.questions[0].id).toBe('tp-001');
    expect(result.questions[1].id).toBe('tp-002');
  });

  it('parses hint and explanation', () => {
    const result = parseQuiz(MINIMAL_QUIZ, LESSON);
    expect(result.questions[0].hint).toBe('Read principle #1 literally.');
    expect(result.questions[0].explanation).toBe('Tests reveal failures only when they trigger them.');
  });

  it('handles multi-letter answer as multi type with array', () => {
    const md = `## Quiz: Multiple Choice (1)

### Q1. Select all that apply.
- A) Option A
- B) Option B
- C) Option C
- D) Option D

**Answer:** BD
**Hint:** Two answers.
**Why:** Both apply.
`;
    const result = parseQuiz(md, LESSON);
    expect(result.questions[0].type).toBe('multi');
    expect(result.questions[0].answer).toEqual([1, 3]);
  });

  it('handles CRLF line endings', () => {
    const crlf = MINIMAL_QUIZ.replace(/\n/g, '\r\n');
    const result = parseQuiz(crlf, LESSON);
    expect(result.questions).toHaveLength(2);
    expect(result.questions[0].answer).toBe(1);
  });

  it('handles trailing whitespace on lines', () => {
    const withTrailing = MINIMAL_QUIZ.replace(/\n/g, '   \n');
    const result = parseQuiz(withTrailing, LESSON);
    expect(result.questions[0].q).toBe('Which principle states tests cannot prove a system is defect-free?');
  });

  it('returns empty questions array when no quiz section present', () => {
    const md = `---\nslug: test\n---\n\n# Just prose\n\nNo quiz here.\n`;
    const result = parseQuiz(md, 'test');
    expect(result.questions).toHaveLength(0);
  });

  it('throws with lesson and question number when Answer is missing', () => {
    const md = `## Quiz: Multiple Choice (1)

### Q1. Question without answer?
- A) Option A
- B) Option B

**Hint:** A hint.
`;
    expect(() => parseQuiz(md, LESSON)).toThrowError(/testing-principles.*Q1|Q1.*testing-principles/);
  });

  it('handles multi-line MC options', () => {
    const md = `## Quiz: Multiple Choice (1)

### Q1. Choose the best answer.
- A) Short option
- B) A longer option that continues
  on the next line
- C) Another option
- D) Last option

**Answer:** B
**Hint:** Hint.
**Why:** Why.
`;
    const result = parseQuiz(md, LESSON);
    expect(result.questions[0].options?.[1]).toMatch(/^B\) A longer option/);
  });

  it('output validates against quizFileSchema', () => {
    const result = parseQuiz(MINIMAL_QUIZ, LESSON);
    // parseQuiz already runs quizFileSchema.parse internally — no throw means valid
    expect(result.questions[0].id).toBeTruthy();
  });
});
