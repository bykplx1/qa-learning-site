import type { QuizQuestion } from './schema.js';

export type QuizMode = 'practice';
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

export function isCorrect(question: QuizQuestion, answer: number | number[] | null): boolean {
  if (answer === null) return false;
  const expected = question.answer;
  if (Array.isArray(expected)) {
    if (!Array.isArray(answer)) return false;
    if (expected.length !== answer.length) return false;
    return expected.every((v) => (answer as number[]).includes(v));
  }
  if (Array.isArray(answer)) return false;
  return expected === answer;
}

export function getScore(state: QuizState): { correct: number; total: number } {
  const correct = state.questions.filter((q, i) => isCorrect(q, state.answers[i])).length;
  return { correct, total: state.questions.length };
}
