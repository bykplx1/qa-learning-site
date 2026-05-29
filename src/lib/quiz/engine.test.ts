import { describe, expect, it } from 'vitest';
import {
  createQuizState,
  persistQuizState,
  restoreQuizState,
  transition,
  isCorrect,
  getScore,
} from './engine.js';
import type { QuizQuestion } from './schema.js';

function makeQuestions(n: number): QuizQuestion[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `q-${String(i + 1).padStart(3, '0')}`,
    type: 'single' as const,
    q: `Question ${i + 1}`,
    options: ['A) Option A', 'B) Option B', 'C) Option C', 'D) Option D'],
    answer: 0,
  }));
}

describe('createQuizState', () => {
  it('initialises 5-question state', () => {
    const state = createQuizState(makeQuestions(5), 'practice');
    expect(state.currentIndex).toBe(0);
    expect(state.answers).toEqual([null, null, null, null, null]);
    expect(state.feedback).toBe(false);
    expect(state.status).toBe('active');
    expect(state.mode).toBe('practice');
  });
});

describe('5-question happy path', () => {
  it('answer all correctly and reach summary with perfect score', () => {
    const qs = makeQuestions(5);
    let state = createQuizState(qs, 'practice');

    for (let i = 0; i < 5; i++) {
      expect(state.currentIndex).toBe(i);
      expect(state.feedback).toBe(false);

      state = transition(state, { type: 'answer', value: 0 });
      expect(state.feedback).toBe(true);
      expect(state.answers[i]).toBe(0);

      state = transition(state, { type: 'next' });
    }

    expect(state.status).toBe('summary');
    const { correct, total } = getScore(state);
    expect(correct).toBe(5);
    expect(total).toBe(5);
  });

  it('last question next goes to summary, not index 5', () => {
    const qs = makeQuestions(2);
    let state = createQuizState(qs, 'practice');
    state = transition(state, { type: 'answer', value: 0 });
    state = transition(state, { type: 'next' });
    state = transition(state, { type: 'answer', value: 0 });
    state = transition(state, { type: 'next' });
    expect(state.status).toBe('summary');
    expect(state.currentIndex).toBe(1);
  });
});

// Quiz-adapter delta: feedback gate + forward-only navigation
describe('transition guards (quiz adapter rules)', () => {
  it('cannot answer twice on same question (feedback gate)', () => {
    const qs = makeQuestions(2);
    let state = createQuizState(qs, 'practice');
    state = transition(state, { type: 'answer', value: 0 });
    const firstAnswer = state.answers[0];
    state = transition(state, { type: 'answer', value: 1 });
    expect(state.answers[0]).toBe(firstAnswer);
  });

  it('next without answering is no-op (feedback gate)', () => {
    const qs = makeQuestions(2);
    let state = createQuizState(qs, 'practice');
    state = transition(state, { type: 'next' });
    expect(state.currentIndex).toBe(0);
    expect(state.feedback).toBe(false);
  });

  it('transitions after summary are no-ops', () => {
    const qs = makeQuestions(1);
    let state = createQuizState(qs, 'practice');
    state = transition(state, { type: 'answer', value: 0 });
    state = transition(state, { type: 'next' });
    expect(state.status).toBe('summary');
    const frozen = state;
    state = transition(state, { type: 'answer', value: 1 });
    expect(state).toEqual(frozen);
    state = transition(state, { type: 'next' });
    expect(state).toEqual(frozen);
  });
});

// isCorrect re-exported from shared core — smoke-test the re-export
describe('isCorrect (re-export from shared core)', () => {
  it('single answer: correct index', () => {
    const q = makeQuestions(1)[0];
    expect(isCorrect(q, 0)).toBe(true);
    expect(isCorrect(q, 1)).toBe(false);
    expect(isCorrect(q, null)).toBe(false);
  });
});

describe('sessionStorage resume', () => {
  it('restores identical state after serialize / deserialize', () => {
    const qs = makeQuestions(5);
    let state = createQuizState(qs, 'practice');

    // Answer Q1 correctly, advance; answer Q2 incorrectly, show feedback
    state = transition(state, { type: 'answer', value: 0 });
    state = transition(state, { type: 'next' });
    state = transition(state, { type: 'answer', value: 1 }); // wrong

    // Persist → serialize → deserialize → restore (simulates page refresh)
    const serialized = JSON.stringify(persistQuizState(state));
    const deserialized = JSON.parse(serialized);
    const restored = restoreQuizState(qs, 'practice', deserialized);

    expect(restored.currentIndex).toBe(state.currentIndex);
    expect(restored.answers).toEqual(state.answers);
    expect(restored.feedback).toBe(state.feedback);
    expect(restored.status).toBe(state.status);
    expect(restored.questions).toEqual(qs);

    // Engine continues correctly from restored state
    const afterNext = transition(restored, { type: 'next' });
    expect(afterNext.currentIndex).toBe(2);
    expect(afterNext.feedback).toBe(false);
  });
});
