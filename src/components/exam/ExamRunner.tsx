import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { authClient } from '../../lib/auth-client';
import { ErrorBoundary } from '../ErrorBoundary';
import type { QuizQuestion } from '../../lib/quiz/schema.js';
import {
  createExamRunner,
  type ExamResult,
  type ExamRunnerHandle,
  type ExamState,
} from '../../lib/exam-mode/runner.js';
import { selectAdapter, type QuizPersistenceAdapter } from '../../lib/quiz/persistence.js';
import ExamSummary, { type SaveStatus } from './ExamSummary';
import {
  loadExamState,
  saveExamState,
  clearExamState,
  loadServerExamState,
  saveServerExamState,
  clearServerExamState,
} from '../../lib/exam/persistence.js';

// Thresholds (ms) at which the polite timer announcer fires (descending).
const TIMER_ANNOUNCE_THRESHOLDS_MS = [10 * 60_000, 5 * 60_000, 60_000, 30_000] as const;

function thresholdLabel(ms: number): string {
  if (ms >= 10 * 60_000) return '10 minutes remaining';
  if (ms >= 5 * 60_000) return '5 minutes remaining';
  if (ms >= 60_000) return '1 minute remaining';
  return '30 seconds remaining';
}

interface Props {
  questions: QuizQuestion[];
  examSlug: string;
  durationMs?: number;
}

const DEFAULT_DURATION_MS = 60 * 60 * 1000;
// Minimum interval between per-tick server PUTs (sessionStorage still saves
// every tick). State changes (answer/navigation) bypass this throttle so user
// intent is persisted promptly.
const SERVER_SAVE_THROTTLE_MS = 10_000;

type Phase = 'idle' | 'active' | 'summary';

function formatClock(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── Confirm modal ────────────────────────────────────────────────────────────

interface ConfirmModalProps {
  answeredCount: number;
  totalCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  returnFocusRef: React.RefObject<HTMLButtonElement | null>;
}

function ConfirmModal({ answeredCount, totalCount, onConfirm, onCancel, returnFocusRef }: ConfirmModalProps) {
  const skipped = totalCount - answeredCount;
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelBtnRef.current?.focus();
  }, []);

  useEffect(() => {
    return () => {
      returnFocusRef.current?.focus();
    };
  }, [returnFocusRef]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      onCancel();
      return;
    }
    if (e.key === 'Tab') {
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <div
      className="px-4"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(20, 20, 18, 0.45)',
        backdropFilter: 'blur(2px)',
      }}
      onClick={onCancel}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-body"
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 440,
          maxWidth: '95%',
          background: 'var(--paper)',
          border: '1px solid var(--rule)',
          borderRadius: 14,
          boxShadow: '0 30px 80px -20px rgba(0,0,0,0.4)',
          padding: 28,
        }}
      >
        <h2
          id="confirm-modal-title"
          className="mb-3"
          style={{
            fontFamily: 'var(--serif)',
            fontSize: 22,
            fontWeight: 400,
            letterSpacing: '-0.02em',
            margin: 0,
            color: 'var(--ink)',
          }}
        >
          Submit exam?
        </h2>
        <p
          id="confirm-modal-body"
          className="mb-6"
          style={{
            fontFamily: 'var(--sans)',
            fontSize: 15,
            color: 'var(--ink-2)',
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {answeredCount} of {totalCount} answered, {skipped} skipped — submit anyway?
        </p>
        <div className="flex gap-3 justify-end">
          <button
            ref={cancelBtnRef}
            type="button"
            className="btn btn--ghost"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={onConfirm}
            data-testid="exam-confirm-submit"
          >
            Submit exam
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Start gate ───────────────────────────────────────────────────────────────

type TimingOption = 'standard' | 'x1.5' | 'x2' | 'untimed';

const TIMING_OPTIONS: { value: TimingOption; label: string; description: string }[] = [
  { value: 'standard', label: 'Standard (60 min)', description: 'Default timed exam.' },
  { value: 'x1.5', label: 'Extended (90 min ×1.5)', description: '50% extra time.' },
  { value: 'x2', label: 'Extended (120 min ×2)', description: 'Double time.' },
  { value: 'untimed', label: 'Untimed practice', description: 'No time limit — submit when ready.' },
];

function effectiveDuration(base: number, option: TimingOption): number {
  if (option === 'untimed') return 0; // signals no limit to callers
  if (option === 'x1.5') return Math.round(base * 1.5);
  if (option === 'x2') return base * 2;
  return base;
}

interface StartGateProps {
  questionCount: number;
  durationMs: number;
  onStart: (resolvedDurationMs: number) => void;
}

function StartGate({ questionCount, durationMs, onStart }: StartGateProps) {
  const [timing, setTiming] = useState<TimingOption>('standard');
  const durationMin = Math.round(durationMs / 60_000);

  const handleStart = () => {
    const eff = effectiveDuration(durationMs, timing);
    // untimed: pass a very large number (24 h) so timer never fires
    onStart(timing === 'untimed' ? 24 * 60 * 60_000 : eff);
  };

  return (
    <div className="card my-12 mx-auto" style={{ maxWidth: 540, padding: 36 }} data-testid="exam-start-gate">
      <span className="eyebrow">mock exam</span>
      <h2
        className="mt-3 mb-4"
        style={{
          fontFamily: 'var(--serif)',
          fontSize: 30,
          fontWeight: 400,
          letterSpacing: '-0.02em',
          margin: 0,
          color: 'var(--ink)',
          lineHeight: 1.15,
        }}
      >
        Start exam
      </h2>
      <p
        className="mb-7"
        style={{
          fontFamily: 'var(--sans)',
          fontSize: 15,
          color: 'var(--ink-2)',
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        {questionCount} questions · {durationMin}-minute time limit · navigate freely between questions · no feedback until you submit.
      </p>

      <fieldset
        style={{ border: 'none', padding: 0, margin: '0 0 24px' }}
        aria-label="Time limit options"
      >
        <legend
          style={{
            fontFamily: 'var(--sans)',
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--ink-3)',
            marginBottom: 10,
            padding: 0,
          }}
        >
          Time limit
        </legend>
        <div className="grid gap-2" role="radiogroup" aria-label="Time limit options">
          {TIMING_OPTIONS.map((opt) => {
            const isSelected = timing === opt.value;
            return (
              <label
                key={opt.value}
                data-testid={`exam-timing-${opt.value}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: isSelected ? '2px solid var(--accent)' : '1px solid var(--rule)',
                  background: isSelected ? 'var(--accent-soft)' : 'var(--paper)',
                  cursor: 'pointer',
                  fontFamily: 'var(--sans)',
                  fontSize: 14,
                  color: 'var(--ink)',
                  userSelect: 'none',
                }}
              >
                <input
                  type="radio"
                  name="exam-timing"
                  value={opt.value}
                  checked={isSelected}
                  onChange={() => setTiming(opt.value)}
                  style={{ accentColor: 'var(--accent)', flexShrink: 0 }}
                />
                <span>
                  <strong style={{ fontWeight: 600 }}>{opt.label}</strong>
                  {' — '}
                  <span style={{ color: 'var(--ink-2)' }}>{opt.description}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <button
        type="button"
        className="btn btn--primary btn--lg"
        onClick={handleStart}
        data-testid="exam-start-btn"
      >
        Start exam
      </button>
    </div>
  );
}

// ── Question screen ──────────────────────────────────────────────────────────

interface QuestionScreenProps {
  state: ExamState;
  remainingMs: number;
  politeAnnouncement: string;
  assertiveAnnouncement: string;
  onAnswer: (value: number | number[] | null) => void;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onGoto: (i: number) => void;
  submitBtnRef: React.RefObject<HTMLButtonElement | null>;
}

function QuestionScreen({ state, remainingMs, politeAnnouncement, assertiveAnnouncement, onAnswer, onPrev, onNext, onSubmit, onGoto, submitBtnRef }: QuestionScreenProps) {
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
      {/* Hidden live regions for SR announcements — must be mounted early so SR registers them */}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}
      >
        {politeAnnouncement}
      </div>
      <div
        aria-live="assertive"
        aria-atomic="true"
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}
      >
        {assertiveAnnouncement}
      </div>

      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <span className="eyebrow">exam mode · 60-minute</span>
          <h2
            className="mt-2"
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 30,
              fontWeight: 400,
              letterSpacing: '-0.02em',
              margin: 0,
              color: 'var(--ink)',
              lineHeight: 1.15,
            }}
          >
            Mock exam
          </h2>
        </div>
        <div
          data-testid="exam-timer"
          role="timer"
          aria-live="off"
          aria-label={`Time remaining: ${formatClock(remainingMs)}`}
          className="py-2.5 px-4"
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 22,
            borderRadius: 10,
            border: '1px solid var(--rule)',
            // dynamic: background and color driven by lowTime state
            background: lowTime ? 'var(--accent-soft)' : 'var(--paper-2)',
            color: lowTime ? 'var(--accent-strong)' : 'var(--ink)',
            fontVariantNumeric: 'tabular-nums',
            fontWeight: 600,
          }}
        >
          {formatClock(remainingMs)}
        </div>
      </div>

      <div className="flex justify-between items-center mb-3.5" style={{ fontSize: 12, color: 'var(--ink-3)', fontFamily: 'var(--mono)' }}>
        <span>Q {state.currentIndex + 1} / {state.questions.length}</span>
        <span data-testid="exam-answered-count">{answeredCount} answered</span>
      </div>

      <div className="flex gap-1 mb-7 flex-wrap">
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
                // dynamic: border/background/color driven by isCurrent and answered states
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
        <div className="eyebrow mb-3">
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
            className="grid gap-2.5"
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

      <div className="flex justify-between mt-5 gap-3 flex-wrap">
        <button type="button" className="btn btn--ghost" onClick={onPrev} disabled={isFirst} data-testid="exam-prev">
          ← Previous
        </button>
        <div className="flex gap-3">
          <button
            ref={submitBtnRef}
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

// ── Root component ───────────────────────────────────────────────────────────

function ExamRunnerInner({ questions, examSlug, durationMs = DEFAULT_DURATION_MS }: Props) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [state, setState] = useState<ExamState>(() => ({
    questions,
    currentIndex: 0,
    answers: new Array(questions.length).fill(null),
    status: 'active',
  }));
  const [remainingMs, setRemainingMs] = useState<number>(durationMs);
  // The effective duration for the current attempt (may differ from prop via user timing choice).
  const [effectiveDurationMs, setEffectiveDurationMs] = useState<number>(durationMs);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [showConfirm, setShowConfirm] = useState(false);
  // SR announcements: polite fires at time thresholds; assertive fires on auto-submit.
  const [politeAnnouncement, setPoliteAnnouncement] = useState('');
  const [assertiveAnnouncement, setAssertiveAnnouncement] = useState('');
  // Tracks which threshold buckets have already been announced this attempt.
  const announcedThresholdsRef = useRef<Set<number>>(new Set());

  const runnerRef = useRef<ExamRunnerHandle | null>(null);
  const submittedRef = useRef<boolean>(false);
  const submitBtnRef = useRef<HTMLButtonElement | null>(null);
  // Captures the wall-clock start time for sessionStorage persistence
  const startedAtRef = useRef<number>(0);
  const attemptIdRef = useRef<string>(crypto.randomUUID());
  // Mirror of signedIn for use inside runner callbacks (which close over stale state).
  const signedInRef = useRef<boolean | null>(null);
  // Throttle the per-tick server PUT — sessionStorage still writes every tick.
  // A 60-minute exam at 1s ticks would otherwise issue 3,600 DB writes.
  const lastServerSaveAtRef = useRef<number>(0);

  const adapter: QuizPersistenceAdapter = useMemo(
    () => selectAdapter(signedIn === true),
    [signedIn],
  );

  // Tracks whether the initial state-load (local + server) has been attempted.
  const mountLoadedRef = useRef(false);

  const applyRestoredState = useCallback(
    (saved: { startedAt: number; durationMs: number; currentIndex: number; answers: Array<number | number[] | null> }) => {
      const elapsed = Date.now() - saved.startedAt;
      const remaining = saved.durationMs - elapsed;
      if (remaining <= 0) return false;
      startedAtRef.current = saved.startedAt;
      setState({
        questions,
        currentIndex: saved.currentIndex,
        answers: saved.answers,
        status: 'active',
      });
      setEffectiveDurationMs(saved.durationMs);
      setRemainingMs(remaining);
      setPhase('active');
      return true;
    },
    [questions],
  );

  useEffect(() => {
    let cancelled = false;
    authClient.getSession().then(async (res) => {
      if (cancelled) return;
      const data = (res && 'data' in res ? res.data : res) as { user?: { id?: string } } | null;
      const isSignedIn = !!data?.user?.id;
      signedInRef.current = isSignedIn;
      setSignedIn(isSignedIn);

      // Only attempt mount-load once.
      if (mountLoadedRef.current) return;
      mountLoadedRef.current = true;

      // For signed-in users, prefer server state (supports cross-device resume).
      if (isSignedIn) {
        const serverSaved = await loadServerExamState();
        if (cancelled) return;
        if (serverSaved && serverSaved.examSlug === examSlug) {
          const restored = applyRestoredState(serverSaved);
          if (restored) {
            // Mirror to sessionStorage so the runner tick path can write locally too.
            saveExamState(serverSaved);
            return;
          }
          // Expired on server — clean up both.
          void clearServerExamState();
          clearExamState();
          return;
        }
      }

      // Fall back to sessionStorage (anonymous or no server session).
      const local = loadExamState(examSlug);
      if (!local) return;
      const elapsed = Date.now() - local.startedAt;
      if (elapsed >= local.durationMs) {
        clearExamState();
        return;
      }
      applyRestoredState(local);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examSlug]);

  // Create and start the runner whenever we enter the active phase
  useEffect(() => {
    if (phase !== 'active') return;

    const elapsed = startedAtRef.current > 0 ? Date.now() - startedAtRef.current : 0;
    const activeDurationMs = effectiveDurationMs;
    const runnerDuration = Math.max(1, activeDurationMs - elapsed);

    // Clear announced thresholds for a fresh attempt
    announcedThresholdsRef.current = new Set();
    setPoliteAnnouncement('');
    setAssertiveAnnouncement('');

    const runner = createExamRunner({
      questions,
      durationMs: runnerDuration,
      originalStartedAt: startedAtRef.current > 0 ? startedAtRef.current : undefined,
      onTick: (ms) => {
        setRemainingMs(ms);

        // Threshold announcements — fire once per threshold per attempt.
        for (const threshold of TIMER_ANNOUNCE_THRESHOLDS_MS) {
          if (ms <= threshold && !announcedThresholdsRef.current.has(threshold)) {
            announcedThresholdsRef.current.add(threshold);
            const label = thresholdLabel(threshold);
            // Toggle via a sentinel suffix so React re-renders even if same label
            setPoliteAnnouncement((prev) => (prev === label ? label + '​' : label));
            break;
          }
        }

        // sessionStorage every tick (cheap, local). Server PUT throttled
        // so a 60-min exam doesn't generate ~3,600 DB writes.
        if (startedAtRef.current > 0) {
          const currentState = runner.getState();
          const toSave = {
            examSlug,
            startedAt: startedAtRef.current,
            durationMs: activeDurationMs,
            currentIndex: currentState.currentIndex,
            answers: currentState.answers,
          };
          saveExamState(toSave);
          if (
            signedInRef.current &&
            Date.now() - lastServerSaveAtRef.current >= SERVER_SAVE_THROTTLE_MS
          ) {
            lastServerSaveAtRef.current = Date.now();
            void saveServerExamState(toSave);
          }
        }
      },
      onStateChange: (s) => {
        setState(s);
        // State changes (navigation, answers) are infrequent and high-value,
        // so write the server immediately and reset the tick throttle.
        if (startedAtRef.current > 0) {
          const toSave = {
            examSlug,
            startedAt: startedAtRef.current,
            durationMs: activeDurationMs,
            currentIndex: s.currentIndex,
            answers: s.answers,
          };
          saveExamState(toSave);
          if (signedInRef.current) {
            lastServerSaveAtRef.current = Date.now();
            void saveServerExamState(toSave);
          }
        }
      },
      onFinalize: (r) => {
        clearExamState();
        if (signedInRef.current) void clearServerExamState();
        setRemainingMs(0);
        // Assertive announcement only when timer expired (not manual submit)
        if (r.reason === 'expired') {
          setAssertiveAnnouncement('Time is up. Your exam has been automatically submitted.');
        }
        setResult(r);
        setPhase('summary');
      },
    });

    // Restore answers from current state into the runner via dispatches
    // (runner starts fresh, so we replay the saved answer state)
    const currentState = state;
    runnerRef.current = runner;
    runner.start();
    setRemainingMs(runner.getRemaining());

    // Replay saved answers so the runner's internal state matches
    currentState.answers.forEach((ans, idx) => {
      if (ans !== null) {
        runner.dispatch({ type: 'goto', index: idx });
        runner.dispatch({ type: 'answer', value: ans });
      }
    });
    // Restore navigation position
    runner.dispatch({ type: 'goto', index: currentState.currentIndex });

    return () => {
      runner.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (!result) return;
    if (signedIn === null) return;
    if (submittedRef.current) return;
    submittedRef.current = true;
    if (signedIn) setSaveStatus('saving');
    adapter
      .recordAttempt({
        attemptId: attemptIdRef.current,
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

  const handleStart = useCallback((resolvedDurationMs: number) => {
    startedAtRef.current = Date.now();
    submittedRef.current = false;
    attemptIdRef.current = crypto.randomUUID();
    lastServerSaveAtRef.current = 0;
    // Reset state for a fresh exam
    setState({
      questions,
      currentIndex: 0,
      answers: new Array(questions.length).fill(null),
      status: 'active',
    });
    setEffectiveDurationMs(resolvedDurationMs);
    setRemainingMs(resolvedDurationMs);
    setPhase('active');
  }, [questions]);

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
    setShowConfirm(true);
  }, []);
  const handleConfirmSubmit = useCallback(() => {
    setShowConfirm(false);
    runnerRef.current?.dispatch({ type: 'submit' });
  }, []);
  const handleCancelSubmit = useCallback(() => {
    setShowConfirm(false);
  }, []);
  const handleGoto = useCallback((i: number) => {
    runnerRef.current?.dispatch({ type: 'goto', index: i });
  }, []);

  const answeredCount = state.answers.filter((a) => a !== null).length;

  return (
    <section className="mt-6" data-testid="exam-runner">
      {phase === 'idle' && (
        <StartGate
          questionCount={questions.length}
          durationMs={durationMs}
          onStart={handleStart}
        />
      )}
      {phase === 'active' && (
        <>
          <QuestionScreen
            state={state}
            remainingMs={remainingMs}
            politeAnnouncement={politeAnnouncement}
            assertiveAnnouncement={assertiveAnnouncement}
            onAnswer={handleAnswer}
            onPrev={handlePrev}
            onNext={handleNext}
            onSubmit={handleSubmit}
            onGoto={handleGoto}
            submitBtnRef={submitBtnRef}
          />
          {showConfirm && (
            <ConfirmModal
              answeredCount={answeredCount}
              totalCount={state.questions.length}
              onConfirm={handleConfirmSubmit}
              onCancel={handleCancelSubmit}
              returnFocusRef={submitBtnRef}
            />
          )}
        </>
      )}
      {phase === 'summary' && result && (
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
      )}
    </section>
  );
}

export default function ExamRunner({ questions, examSlug, durationMs }: Props) {
  return (
    <ErrorBoundary label="ExamRunner">
      <ExamRunnerInner questions={questions} examSlug={examSlug} durationMs={durationMs} />
    </ErrorBoundary>
  );
}
