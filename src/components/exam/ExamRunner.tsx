import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { authClient } from '../../lib/auth-client';
import type { QuizQuestion } from '../../lib/quiz/schema.js';
import {
  createExamRunner,
  type ExamResult,
  type ExamRunnerHandle,
  type ExamState,
} from '../../lib/exam-mode/runner.js';
import { selectAdapter, type QuizPersistenceAdapter } from '../../lib/quiz/persistence.js';
import ExamSummary, { type SaveStatus } from './ExamSummary';

interface Props {
  questions: QuizQuestion[];
  examSlug: string;
  durationMs?: number;
}

const DEFAULT_DURATION_MS = 60 * 60 * 1000;

function formatClock(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface QuestionScreenProps {
  state: ExamState;
  remainingMs: number;
  onAnswer: (value: number | number[] | null) => void;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onGoto: (i: number) => void;
}

function QuestionScreen({ state, remainingMs, onAnswer, onPrev, onNext, onSubmit, onGoto }: QuestionScreenProps) {
  const q = state.questions[state.currentIndex];
  const answer = state.answers[state.currentIndex];
  const isMulti = q.type === 'multi';
  const isLast = state.currentIndex + 1 === state.questions.length;
  const isFirst = state.currentIndex === 0;
  const lowTime = remainingMs <= 5 * 60 * 1000;

  const [multiSelection, setMultiSelection] = useState<number[]>([]);
  const radioGroupRef = useRef<HTMLDivElement>(null);
  const questionStemId = `question-stem-${state.currentIndex}`;

  useEffect(() => {
    if (isMulti && Array.isArray(answer)) setMultiSelection(answer);
    else setMultiSelection([]);
  }, [state.currentIndex, isMulti, answer]);

  const handleOption = (i: number) => {
    if (isMulti) {
      const next = multiSelection.includes(i)
        ? multiSelection.filter((x) => x !== i)
        : [...multiSelection, i];
      const sorted = [...next].sort((a, b) => a - b);
      setMultiSelection(sorted);
      onAnswer(sorted.length ? sorted : null);
    } else {
      onAnswer(i);
    }
  };

  // Arrow-key navigation for single-choice radiogroup
  const handleRadioGroupKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isMulti) return;
    const opts = q.options ?? [];
    const currentAnswer = typeof answer === 'number' ? answer : 0;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      const next = (currentAnswer + 1) % opts.length;
      onAnswer(next);
      const buttons = radioGroupRef.current?.querySelectorAll<HTMLElement>('[role="radio"]');
      buttons?.[next]?.focus();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = (currentAnswer - 1 + opts.length) % opts.length;
      onAnswer(prev);
      const buttons = radioGroupRef.current?.querySelectorAll<HTMLElement>('[role="radio"]');
      buttons?.[prev]?.focus();
    }
  };

  const answeredCount = state.answers.filter((a) => a !== null).length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <span className="eyebrow">exam mode · 60-minute · ISTQB-style</span>
          <h2
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 30,
              fontWeight: 400,
              letterSpacing: '-0.02em',
              margin: '8px 0 0',
              color: 'var(--ink)',
              lineHeight: 1.15,
            }}
          >
            Mock exam
          </h2>
        </div>
        <div
          data-testid="exam-timer"
          aria-live="polite"
          aria-label={`Time remaining ${formatClock(remainingMs)}`}
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 22,
            padding: '10px 16px',
            borderRadius: 10,
            border: '1px solid var(--rule)',
            background: lowTime ? 'var(--accent-soft)' : 'var(--paper-2)',
            color: lowTime ? 'var(--accent-strong)' : 'var(--ink)',
            fontVariantNumeric: 'tabular-nums',
            fontWeight: 600,
          }}
        >
          {formatClock(remainingMs)}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, fontSize: 12, color: 'var(--ink-3)', fontFamily: 'var(--mono)' }}>
        <span>Q {state.currentIndex + 1} / {state.questions.length}</span>
        <span data-testid="exam-answered-count">{answeredCount} answered</span>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 28, flexWrap: 'wrap' }}>
        {state.questions.map((_, i) => {
          const answered = state.answers[i] !== null;
          const isCurrent = i === state.currentIndex;
          return (
            <button
              type="button"
              key={i}
              aria-label={`Go to question ${i + 1}${answered ? ' (answered)' : ''}`}
              onClick={() => onGoto(i)}
              data-testid={`exam-nav-${i}`}
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                border: isCurrent ? '2px solid var(--accent)' : '1px solid var(--rule)',
                background: answered ? 'var(--ink)' : 'var(--paper)',
                color: answered ? 'var(--paper)' : 'var(--ink-3)',
                fontSize: 11,
                fontFamily: 'var(--mono)',
                cursor: 'pointer',
              }}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <div className="card" style={{ padding: 28 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>
          Q{String(state.currentIndex + 1).padStart(2, '0')} · {isMulti ? 'multi-select' : 'single choice'}
        </div>
        <div
          id={questionStemId}
          style={{
            fontFamily: 'var(--serif)',
            fontSize: 22,
            lineHeight: 1.3,
            letterSpacing: '-0.015em',
            margin: '0 0 24px',
            color: 'var(--ink)',
          }}
        >
          {q.q}
        </div>

        {q.options && (
          <div
            ref={radioGroupRef}
            role={isMulti ? 'group' : 'radiogroup'}
            aria-labelledby={questionStemId}
            style={{ display: 'grid', gap: 10 }}
            onKeyDown={isMulti ? undefined : handleRadioGroupKeyDown}
          >
            {q.options.map((opt, i) => {
              const isSelected = isMulti
                ? multiSelection.includes(i)
                : answer === i;
              const stateClass = isSelected ? 'qopt qopt--selected' : 'qopt qopt--idle';
              // Single-choice: roving tabindex — only selected (or first if none) is in tab order
              const tabIndex = isMulti
                ? 0
                : (typeof answer === 'number' ? answer === i : i === 0)
                  ? 0
                  : -1;
              return (
                <button
                  key={i}
                  type="button"
                  role={isMulti ? 'checkbox' : 'radio'}
                  aria-checked={isSelected}
                  tabIndex={tabIndex}
                  className={stateClass}
                  onClick={() => handleOption(i)}
                  data-testid={`exam-option-${i}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, gap: 12, flexWrap: 'wrap' }}>
        <button type="button" className="btn btn--ghost" onClick={onPrev} disabled={isFirst} data-testid="exam-prev">
          ← Previous
        </button>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={onSubmit}
            data-testid="exam-submit-early"
          >
            Submit exam
          </button>
          <button type="button" className="btn btn--primary" onClick={onNext} disabled={isLast} data-testid="exam-next">
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ExamRunner({ questions, examSlug, durationMs = DEFAULT_DURATION_MS }: Props) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [state, setState] = useState<ExamState>(() => ({
    questions,
    currentIndex: 0,
    answers: new Array(questions.length).fill(null),
    status: 'active',
  }));
  const [remainingMs, setRemainingMs] = useState<number>(durationMs);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const runnerRef = useRef<ExamRunnerHandle | null>(null);
  const submittedRef = useRef<boolean>(false);

  const adapter: QuizPersistenceAdapter = useMemo(
    () => selectAdapter(signedIn === true),
    [signedIn],
  );

  useEffect(() => {
    let cancelled = false;
    authClient.getSession().then((res) => {
      if (cancelled) return;
      const data = (res && 'data' in res ? res.data : res) as { user?: { id?: string } } | null;
      setSignedIn(!!data?.user?.id);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const runner = createExamRunner({
      questions,
      durationMs,
      onTick: (ms) => setRemainingMs(ms),
      onStateChange: (s) => setState(s),
      onFinalize: (r) => {
        setRemainingMs(0);
        setResult(r);
      },
    });
    runnerRef.current = runner;
    runner.start();
    setRemainingMs(runner.getRemaining());
    return () => {
      runner.stop();
    };
  }, [questions, durationMs]);

  useEffect(() => {
    if (!result) return;
    if (signedIn === null) return;
    if (submittedRef.current) return;
    submittedRef.current = true;
    if (signedIn) setSaveStatus('saving');
    adapter
      .recordAttempt({
        quizSlug: examSlug,
        mode: 'exam',
        score: result.score,
        total: result.total,
        answers: result.answers,
        durationSec: result.durationSec,
      })
      .then(({ id }) => {
        if (signedIn) setSaveStatus(id ? 'saved' : 'error');
      })
      .catch(() => {
        if (signedIn) setSaveStatus('error');
      });
  }, [adapter, examSlug, result, signedIn]);

  const handleAnswer = useCallback((value: number | number[] | null) => {
    runnerRef.current?.dispatch({ type: 'answer', value });
  }, []);
  const handlePrev = useCallback(() => {
    runnerRef.current?.dispatch({ type: 'prev' });
  }, []);
  const handleNext = useCallback(() => {
    runnerRef.current?.dispatch({ type: 'next' });
  }, []);
  const handleSubmit = useCallback(() => {
    if (!confirm('Submit exam now? Your remaining time will be discarded.')) return;
    runnerRef.current?.dispatch({ type: 'submit' });
  }, []);
  const handleGoto = useCallback((i: number) => {
    runnerRef.current?.dispatch({ type: 'goto', index: i });
  }, []);

  return (
    <section style={{ marginTop: 24 }} data-testid="exam-runner">
      {state.status === 'summary' && result ? (
        <ExamSummary
          questions={state.questions}
          answers={state.answers}
          score={result.score}
          total={result.total}
          durationSec={result.durationSec}
          reason={result.reason}
          signedIn={signedIn}
          saveStatus={saveStatus}
          retryHref="?reset=1"
        />
      ) : (
        <QuestionScreen
          state={state}
          remainingMs={remainingMs}
          onAnswer={handleAnswer}
          onPrev={handlePrev}
          onNext={handleNext}
          onSubmit={handleSubmit}
          onGoto={handleGoto}
        />
      )}
    </section>
  );
}
