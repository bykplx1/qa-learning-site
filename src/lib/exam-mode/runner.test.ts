import { describe, expect, it, vi } from 'vitest';
import {
  createExamState,
  examTransition,
  scoreExam,
  createExamRunner,
  type ExamState,
  type ExamResult,
} from './runner.js';
import type { Clock } from '../exam-timer/timer.js';
import type { QuizQuestion } from '../quiz/schema.js';

function makeQuestions(n: number): QuizQuestion[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `q-${String(i + 1).padStart(3, '0')}`,
    type: 'single' as const,
    q: `Question ${i + 1}`,
    options: ['A', 'B', 'C', 'D'],
    answer: 0,
    explanation: `Explanation ${i + 1}`,
  }));
}

interface FakeClock {
  clock: Clock;
  advance: (ms: number) => void;
}
function makeFakeClock(): FakeClock {
  let now = 0;
  let nextId = 1;
  type Task = { id: number; at: number; cb: () => void };
  let tasks: Task[] = [];
  const clock: Clock = {
    now: () => now,
    setTimeout: (cb, ms) => {
      const id = nextId++;
      tasks.push({ id, at: now + ms, cb });
      return id;
    },
    clearTimeout: (h) => {
      tasks = tasks.filter((t) => t.id !== h);
    },
  };
  const advance = (ms: number) => {
    const target = now + ms;
    while (true) {
      const due = tasks.filter((t) => t.at <= target).sort((a, b) => a.at - b.at);
      if (due.length === 0) break;
      const next = due[0];
      tasks = tasks.filter((t) => t.id !== next.id);
      now = next.at;
      next.cb();
    }
    now = target;
  };
  return { clock, advance };
}

describe('examTransition — state machine', () => {
  it('answer stores value at currentIndex; status stays active', () => {
    const qs = makeQuestions(3);
    let state = createExamState(qs);
    state = examTransition(state, { type: 'answer', value: 2 });
    expect(state.answers[0]).toBe(2);
    expect(state.status).toBe('active');
  });

  it('answer can be overwritten before submit', () => {
    const qs = makeQuestions(3);
    let state = createExamState(qs);
    state = examTransition(state, { type: 'answer', value: 1 });
    state = examTransition(state, { type: 'answer', value: 3 });
    expect(state.answers[0]).toBe(3);
  });

  it('next/prev navigate between questions', () => {
    const qs = makeQuestions(3);
    let state = createExamState(qs);
    state = examTransition(state, { type: 'next' });
    expect(state.currentIndex).toBe(1);
    state = examTransition(state, { type: 'next' });
    expect(state.currentIndex).toBe(2);
    state = examTransition(state, { type: 'next' });
    expect(state.currentIndex).toBe(2); // clamped
    state = examTransition(state, { type: 'prev' });
    expect(state.currentIndex).toBe(1);
  });

  it('goto out-of-range is no-op', () => {
    const qs = makeQuestions(3);
    let state = createExamState(qs);
    state = examTransition(state, { type: 'goto', index: 99 });
    expect(state.currentIndex).toBe(0);
    state = examTransition(state, { type: 'goto', index: -1 });
    expect(state.currentIndex).toBe(0);
    state = examTransition(state, { type: 'goto', index: 2 });
    expect(state.currentIndex).toBe(2);
  });

  it('submit moves to summary; further actions are no-ops', () => {
    const qs = makeQuestions(2);
    let state = createExamState(qs);
    state = examTransition(state, { type: 'answer', value: 0 });
    state = examTransition(state, { type: 'submit' });
    expect(state.status).toBe('summary');
    const frozen = state;
    state = examTransition(state, { type: 'answer', value: 1 });
    state = examTransition(state, { type: 'next' });
    expect(state).toEqual(frozen);
  });
});

describe('exam state — never reveals correctness mid-exam', () => {
  // ExamState shape has no `feedback` flag — that's the structural guarantee.
  // These tests assert the runner does not surface correctness while status is 'active'.

  it('ExamState has no feedback flag', () => {
    const state = createExamState(makeQuestions(3));
    expect('feedback' in state).toBe(false);
  });

  it('answering does not set any correctness flag on state', () => {
    const qs = makeQuestions(3);
    let state: ExamState = createExamState(qs);
    state = examTransition(state, { type: 'answer', value: 0 }); // correct
    state = examTransition(state, { type: 'next' });
    state = examTransition(state, { type: 'answer', value: 3 }); // wrong
    expect('feedback' in state).toBe(false);
    expect(state.status).toBe('active');
    // No "isCorrect"-shaped key leaked into state
    const keys = Object.keys(state);
    expect(keys).toEqual(expect.arrayContaining(['questions', 'currentIndex', 'answers', 'status']));
  });

  it('runner.getState() during exam never exposes correctness', () => {
    const { clock } = makeFakeClock();
    const onFinalize = vi.fn();
    const runner = createExamRunner({
      questions: makeQuestions(3),
      durationMs: 60_000,
      clock,
      onFinalize,
    });
    runner.start();
    runner.dispatch({ type: 'answer', value: 0 });
    runner.dispatch({ type: 'next' });
    runner.dispatch({ type: 'answer', value: 1 });
    const s = runner.getState();
    expect(s.status).toBe('active');
    expect('feedback' in s).toBe(false);
  });
});

describe('createExamRunner — onExpire path', () => {
  it('timer expiry triggers final scored attempt with current answers exactly once', () => {
    const { clock, advance } = makeFakeClock();
    const onFinalize = vi.fn<(r: ExamResult) => void>();
    const runner = createExamRunner({
      questions: makeQuestions(3),
      durationMs: 5_000,
      clock,
      tickIntervalMs: 1000,
      onFinalize,
    });
    runner.start();
    runner.dispatch({ type: 'answer', value: 0 }); // correct
    runner.dispatch({ type: 'next' });
    runner.dispatch({ type: 'answer', value: 2 }); // wrong; q3 left null
    advance(10_000);

    expect(onFinalize).toHaveBeenCalledTimes(1);
    const result = onFinalize.mock.calls[0][0];
    expect(result.reason).toBe('expired');
    expect(result.answers).toEqual([0, 2, null]);
    expect(result.score).toBe(1);
    expect(result.total).toBe(3);
    expect(runner.getState().status).toBe('summary');
  });

  it('no double-finalize: submit after expiry is ignored', () => {
    const { clock, advance } = makeFakeClock();
    const onFinalize = vi.fn();
    const runner = createExamRunner({
      questions: makeQuestions(2),
      durationMs: 1_000,
      clock,
      onFinalize,
    });
    runner.start();
    advance(2_000);
    runner.dispatch({ type: 'submit' });
    expect(onFinalize).toHaveBeenCalledTimes(1);
    expect(onFinalize.mock.calls[0][0].reason).toBe('expired');
  });

  it('manual submit produces same end shape with reason="submitted"', () => {
    const { clock } = makeFakeClock();
    const onFinalize = vi.fn<(r: ExamResult) => void>();
    const runner = createExamRunner({
      questions: makeQuestions(2),
      durationMs: 60_000,
      clock,
      onFinalize,
    });
    runner.start();
    runner.dispatch({ type: 'answer', value: 0 });
    runner.dispatch({ type: 'submit' });
    expect(onFinalize).toHaveBeenCalledTimes(1);
    const result = onFinalize.mock.calls[0][0];
    expect(result.reason).toBe('submitted');
    expect(result.score).toBe(1);
  });

  it('expiry while no answers submitted finalizes with all nulls and score 0', () => {
    const { clock, advance } = makeFakeClock();
    const onFinalize = vi.fn<(r: ExamResult) => void>();
    const runner = createExamRunner({
      questions: makeQuestions(3),
      durationMs: 1_000,
      clock,
      onFinalize,
    });
    runner.start();
    advance(2_000);
    expect(onFinalize).toHaveBeenCalledTimes(1);
    expect(onFinalize.mock.calls[0][0].answers).toEqual([null, null, null]);
    expect(onFinalize.mock.calls[0][0].score).toBe(0);
  });

  it('stop after submit is idempotent', () => {
    const { clock } = makeFakeClock();
    const onFinalize = vi.fn();
    const runner = createExamRunner({
      questions: makeQuestions(1),
      durationMs: 60_000,
      clock,
      onFinalize,
    });
    runner.start();
    runner.dispatch({ type: 'submit' });
    expect(() => runner.stop()).not.toThrow();
  });
});

describe('scoreExam', () => {
  it('counts correct vs total, ignoring null answers', () => {
    const qs = makeQuestions(4);
    const state: ExamState = {
      questions: qs,
      currentIndex: 0,
      answers: [0, 1, null, 0],
      status: 'summary',
    };
    expect(scoreExam(state)).toEqual({ correct: 2, total: 4 });
  });
});

describe('createExamRunner — durationSec from originalStartedAt (#392)', () => {
  it('uses current startedAtWall when no originalStartedAt provided', () => {
    const { clock, advance } = makeFakeClock();
    const onFinalize = vi.fn<(r: ExamResult) => void>();
    const runner = createExamRunner({
      questions: makeQuestions(1),
      durationMs: 10_000,
      clock,
      onFinalize,
    });
    runner.start();
    advance(5_000);
    runner.dispatch({ type: 'submit' });
    const result = onFinalize.mock.calls[0][0];
    expect(result.durationSec).toBe(5);
  });

  it('uses originalStartedAt to compute full elapsed time for resumed attempts', () => {
    const { clock, advance } = makeFakeClock();
    const onFinalize = vi.fn<(r: ExamResult) => void>();
    // Simulate: original exam started 30s ago, runner now has 70s remaining of a 100s exam.
    // originalStartedAt = clock.now() - 30_000 (but clock starts at 0)
    // We set originalStartedAt to -30_000 so that when clock is at 0+70s=70s, elapsed=100s.
    const originalStartedAt = -30_000; // 30s before clock epoch
    const runner = createExamRunner({
      questions: makeQuestions(1),
      durationMs: 70_000, // remaining duration passed to runner
      originalStartedAt,
      clock,
      onFinalize,
    });
    runner.start();
    advance(70_000); // timer expires; clock.now() = 70_000
    // durationSec should be (70_000 - (-30_000)) / 1000 = 100s
    const result = onFinalize.mock.calls[0][0];
    expect(result.durationSec).toBe(100);
  });

  it('originalStartedAt overrides startedAtWall even when both are set', () => {
    const { clock, advance } = makeFakeClock();
    const onFinalize = vi.fn<(r: ExamResult) => void>();
    // Clock starts at 0; originalStartedAt = -10_000 means original start was 10s before epoch.
    const runner = createExamRunner({
      questions: makeQuestions(1),
      durationMs: 60_000,
      originalStartedAt: -10_000,
      clock,
      onFinalize,
    });
    runner.start(); // startedAtWall = 0
    advance(5_000); // clock.now() = 5_000
    runner.dispatch({ type: 'submit' });
    // durationSec = (5_000 - (-10_000)) / 1000 = 15s (not 5s from startedAtWall)
    const result = onFinalize.mock.calls[0][0];
    expect(result.durationSec).toBe(15);
  });
});
