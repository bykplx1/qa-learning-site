import { describe, expect, it } from 'vitest';
import { isCorrect, score } from './core.js';
import type { QuizQuestion } from '../quiz/schema.js';

function makeQuestion(answer: number | number[]): QuizQuestion {
  return {
    id: 'q-001',
    type: Array.isArray(answer) ? 'multi' : 'single',
    q: 'Test question',
    options: ['A) A', 'B) B', 'C) C', 'D) D'],
    answer,
  };
}

describe('isCorrect', () => {
  it('single answer: correct index', () => {
    const q = makeQuestion(0);
    expect(isCorrect(q, 0)).toBe(true);
    expect(isCorrect(q, 1)).toBe(false);
    expect(isCorrect(q, null)).toBe(false);
  });

  it('single answer: rejects array answer', () => {
    const q = makeQuestion(0);
    expect(isCorrect(q, [0])).toBe(false);
  });

  it('multi answer: order-independent set equality', () => {
    const q = makeQuestion([0, 2]);
    expect(isCorrect(q, [0, 2])).toBe(true);
    expect(isCorrect(q, [2, 0])).toBe(true);
    expect(isCorrect(q, [0])).toBe(false);
    expect(isCorrect(q, [0, 1])).toBe(false);
    expect(isCorrect(q, null)).toBe(false);
  });

  it('multi answer: rejects scalar answer', () => {
    const q = makeQuestion([0, 2]);
    expect(isCorrect(q, 0)).toBe(false);
  });
});

describe('score', () => {
  it('counts correct answers against total', () => {
    const qs = [makeQuestion(0), makeQuestion(1), makeQuestion([0, 2])];
    const answers = [0, 0, [0, 2]];
    expect(score(qs, answers)).toEqual({ correct: 2, total: 3 });
  });

  it('null answers count as incorrect', () => {
    const qs = [makeQuestion(0), makeQuestion(1)];
    expect(score(qs, [null, null])).toEqual({ correct: 0, total: 2 });
  });

  it('perfect score', () => {
    const qs = [makeQuestion(0), makeQuestion(1)];
    expect(score(qs, [0, 1])).toEqual({ correct: 2, total: 2 });
  });
});
