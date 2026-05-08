import type { QuizQuestion } from '../quiz/schema.js';
import { isCorrect } from '../quiz/engine.js';
import { createExamTimer, type Clock, type ExamTimer } from '../exam-timer/timer.js';

export type ExamStatus = 'active' | 'summary';

export interface ExamState {
  questions: QuizQuestion[];
  currentIndex: number;
  answers: Array<number | number[] | null>;
  status: ExamStatus;
}

export type ExamAction =
  | { type: 'answer'; value: number | number[] | null }
  | { type: 'goto'; index: number }
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'submit' };

export interface ExamResult {
  answers: Array<number | number[] | null>;
  score: number;
  total: number;
  durationSec: number;
  reason: 'expired' | 'submitted';
}

export function createExamState(questions: QuizQuestion[]): ExamState {
  return {
    questions,
    currentIndex: 0,
    answers: new Array(questions.length).fill(null),
    status: 'active',
  };
}

export function examTransition(state: ExamState, action: ExamAction): ExamState {
  if (state.status === 'summary') return state;

  switch (action.type) {
    case 'answer': {
      const answers = [...state.answers];
      answers[state.currentIndex] = action.value;
      return { ...state, answers };
    }
    case 'goto': {
      if (action.index < 0 || action.index >= state.questions.length) return state;
      return { ...state, currentIndex: action.index };
    }
    case 'next': {
      const nextIndex = state.currentIndex + 1;
      if (nextIndex >= state.questions.length) return state;
      return { ...state, currentIndex: nextIndex };
    }
    case 'prev': {
      const prevIndex = state.currentIndex - 1;
      if (prevIndex < 0) return state;
      return { ...state, currentIndex: prevIndex };
    }
    case 'submit': {
      return { ...state, status: 'summary' };
    }
  }
}

export function scoreExam(state: ExamState): { correct: number; total: number } {
  const correct = state.questions.filter((q, i) => isCorrect(q, state.answers[i])).length;
  return { correct, total: state.questions.length };
}

export interface ExamRunnerOptions {
  questions: QuizQuestion[];
  durationMs: number;
  clock?: Clock;
  tickIntervalMs?: number;
  onTick?: (remainingMs: number) => void;
  onStateChange?: (state: ExamState) => void;
  onFinalize: (result: ExamResult) => void;
}

export interface ExamRunnerHandle {
  start: () => void;
  stop: () => void;
  getState: () => ExamState;
  getRemaining: () => number;
  dispatch: (action: ExamAction) => void;
}

export function createExamRunner(opts: ExamRunnerOptions): ExamRunnerHandle {
  const { questions, durationMs, clock, tickIntervalMs, onTick, onStateChange, onFinalize } = opts;

  let state = createExamState(questions);
  let startedAtWall: number | null = null;
  let finalized = false;
  let timer: ExamTimer | null = null;

  const finalize = (reason: 'expired' | 'submitted') => {
    if (finalized) return;
    finalized = true;
    timer?.stop();
    state = examTransition(state, { type: 'submit' });
    const { correct, total } = scoreExam(state);
    const nowMs = clock ? clock.now() : Date.now();
    const durationSec = startedAtWall === null ? 0 : Math.max(0, Math.floor((nowMs - startedAtWall) / 1000));
    onStateChange?.(state);
    onFinalize({ answers: state.answers, score: correct, total, durationSec, reason });
  };

  const apply = (action: ExamAction) => {
    if (finalized) return;
    if (action.type === 'submit') {
      finalize('submitted');
      return;
    }
    const next = examTransition(state, action);
    if (next === state) return;
    state = next;
    onStateChange?.(state);
  };

  return {
    start() {
      if (timer || finalized) return;
      startedAtWall = clock ? clock.now() : Date.now();
      timer = createExamTimer({
        durationMs,
        clock,
        tickIntervalMs,
        onTick,
        onExpire: () => finalize('expired'),
      });
      timer.start();
    },
    stop() {
      timer?.stop();
    },
    getState() {
      return state;
    },
    getRemaining() {
      return timer ? timer.getRemaining() : durationMs;
    },
    dispatch(action) {
      apply(action);
    },
  };
}
