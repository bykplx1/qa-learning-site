import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { authClient } from '../../lib/auth-client';
import type { QuizQuestion } from '../../lib/quiz/schema.js';
import { isCorrect } from '../../lib/quiz/engine.js';
import {
  createExamRunner,
  type ExamResult,
  type ExamRunnerHandle,
  type ExamState,
} from '../../lib/exam-mode/runner.js';
import { selectAdapter, type QuizPersistenceAdapter } from '../../lib/quiz/persistence.js';

interface Props {
  questions: QuizQuestion[];
  examSlug: string;
  durationMs?: number;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const DEFAULT_DURATION_MS = 60 * 60 * 1000;

function formatClock(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
      <path d="M5 12l5 5 9-11" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
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
          <div style={{ display: 'grid', gap: 10 }}>
            {q.options.map((opt, i) => {
              const isSelected = isMulti
                ? multiSelection.includes(i)
                : answer === i;
              const stateClass = isSelected ? 'qopt qopt--selected' : 'qopt qopt--idle';
              return (
                <button
                  key={i}
                  type="button"
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

interface SummaryProps {
  state: ExamState;
  result: ExamResult | null;
  signedIn: boolean | null;
  saveStatus: SaveStatus;
}

function SummaryScreen({ state, result, signedIn, saveStatus }: SummaryProps) {
  const score = result ? result.score : 0;
  const total = result ? result.total : state.questions.length;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const passed = score / Math.max(total, 1) >= 0.65;

  return (
    <div data-testid="exam-summary">
      <span className="eyebrow">Exam complete · {result?.reason === 'expired' ? 'time expired' : 'submitted'}</span>
      <div
        style={{
          fontFamily: 'var(--serif)',
          fontSize: 72,
          fontWeight: 400,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          margin: '10px 0 4px',
          color: 'var(--ink)',
        }}
      >
        {score}
        <span style={{ color: 'var(--ink-3)', fontSize: 40 }}>/{total}</span>
      </div>
      <div
        className={passed ? 'pill pill--pass' : 'pill pill--accent'}
        style={{ padding: '8px 14px', fontSize: 13, fontFamily: 'var(--sans)', fontWeight: 500 }}
      >
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: passed ? 'var(--pass)' : 'var(--accent)',
            color: 'white',
            display: 'grid',
            placeItems: 'center',
            marginRight: 4,
          }}
        >
          {passed ? <CheckIcon /> : <XIcon />}
        </span>
        {passed ? `Passed · ${pct}% (≥ 65% threshold)` : `Below threshold · ${pct}% (need ≥ 65%)`}
      </div>

      <div style={{ marginTop: 28 }}>
        <span className="eyebrow">review · per-question</span>
        <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
          {state.questions.map((q, i) => {
            const ans = state.answers[i];
            const correct = isCorrect(q, ans);
            return (
              <div key={q.id} className="card" style={{ padding: '14px 18px' }} data-testid={`exam-review-${i}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span className={correct ? 'pill pill--pass' : 'pill pill--accent'}>
                    {correct ? '✓ correct' : ans === null ? '— skipped' : '✗ wrong'}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--ink-3)', fontFamily: 'var(--mono)' }}>
                    Q{String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 16, color: 'var(--ink)', marginBottom: 6 }}>
                  {q.q}
                </div>
                {q.explanation && (
                  <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                    <strong style={{ color: 'var(--ink)' }}>Why:</strong> {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <a href="?reset=1" className="btn btn--primary">Retry exam</a>
        <span
          data-testid="exam-save-status"
          data-status={saveStatus}
          style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--mono)' }}
        >
          {signedIn === null
            ? ''
            : !signedIn
              ? '(not signed in — attempt not saved)'
              : saveStatus === 'saving'
                ? 'Saving attempt…'
                : saveStatus === 'saved'
                  ? '✓ Attempt saved to your account'
                  : saveStatus === 'error'
                    ? 'Could not save attempt'
                    : ''}
        </span>
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

  // Persist completed attempt once when result lands and auth state known.
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
      {state.status === 'summary' ? (
        <SummaryScreen state={state} result={result} signedIn={signedIn} saveStatus={saveStatus} />
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
