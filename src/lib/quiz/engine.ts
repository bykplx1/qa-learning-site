import type { QuizQuestion } from './schema.js';
import { isCorrect as coreIsCorrect, score } from '../assessment/core.js';

export type QuizMode = 'practice' | 'exam';
export type QuizStatus = 'active' | 'summary';

export interface QuizState {
  mode: QuizMode;
  questions: QuizQuestion[];
  currentIndex: number;
  answers: Array<number | number[] | null>;
  feedback: boolean;
  status: QuizStatus;
}

export interface PersistedQuizState {
  currentIndex: number;
  answers: Array<number | number[] | null>;
  feedback: boolean;
  status: QuizStatus;
}

export type QuizAction =
  | { type: 'answer'; value: number | number[] }
  | { type: 'next' }
  | { type: 'submit' };

export function createQuizState(questions: QuizQuestion[], mode: QuizMode): QuizState {
  return {
    mode,
    questions,
    currentIndex: 0,
    answers: new Array(questions.length).fill(null),
    feedback: false,
    status: 'active',
  };
}

export function persistQuizState(state: QuizState): PersistedQuizState {
  return {
    currentIndex: state.currentIndex,
    answers: state.answers,
    feedback: state.feedback,
    status: state.status,
  };
}

export function restoreQuizState(
  questions: QuizQuestion[],
  mode: QuizMode,
  persisted: PersistedQuizState
): QuizState {
  return { mode, questions, ...persisted };
}

/**
 * Practice-quiz adapter over the shared assessment core.
 * Rules: forward-only navigation; per-question feedback gate (answer locks until
 * 'next' is dispatched); no goto/prev actions.
 */
export function transition(state: QuizState, action: QuizAction): QuizState {
  if (state.status === 'summary') return state;

  switch (action.type) {
    case 'answer': {
      if (state.feedback) return state;
      const answers = [...state.answers];
      answers[state.currentIndex] = action.value;
      return { ...state, answers, feedback: true };
    }
    case 'next': {
      if (!state.feedback) return state;
      const nextIndex = state.currentIndex + 1;
      if (nextIndex >= state.questions.length) {
        return { ...state, status: 'summary', feedback: false };
      }
      return { ...state, currentIndex: nextIndex, feedback: false };
    }
    case 'submit': {
      return { ...state, status: 'summary' };
    }
  }
}

// Re-exported from shared core so existing consumers (exam-mode/runner.ts,
// ExamSummary.tsx) keep working without touching exam-mode in this slice.
export const isCorrect = coreIsCorrect;

export function getScore(state: QuizState): { correct: number; total: number } {
  return score(state.questions, state.answers);
}
