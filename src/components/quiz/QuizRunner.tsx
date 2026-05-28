import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { authClient } from '../../lib/auth-client';
import { ErrorBoundary } from '../ErrorBoundary';
import type { QuizQuestion } from '../../lib/quiz/schema.js';
import { stripWikilinks } from '../../lib/wikilinks/resolver.js';
import {
  createQuizState,
  persistQuizState,
  restoreQuizState,
  transition,
  isCorrect,
  getScore,
  type QuizState,
  type QuizAction,
} from '../../lib/quiz/engine.js';
import { selectAdapter, type QuizPersistenceAdapter } from '../../lib/quiz/persistence.js';
import { SAVE_PROMPT_DISMISSED_KEY, shouldShowSavePrompt } from '../../lib/quiz/save-prompt.js';

const COMPLETE_KEY = (slug: string) => `quiz_${slug}_complete`;

interface Props {
  questions: QuizQuestion[];
  quizSlug: string;
}

interface LoginBannerProps {
  signedIn: boolean | null;
}

function LoginBanner({ signedIn }: LoginBannerProps) {
  if (signedIn === null || signedIn) return null;
  const loginHref =
    typeof window !== 'undefined'
      ? `/login?next=${encodeURIComponent(window.location.pathname)}`
      : '/login';
  return (
    <div className="banner banner--info" style={{ marginBottom: 20 }}>
      You're playing anonymously.{' '}
      <a href={loginHref} style={{ color: 'var(--ink)', textDecoration: 'underline' }}>
        Sign in
      </a>{' '}
      to save this attempt to your profile.
    </div>
  );
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

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

interface QuestionScreenProps {
  state: QuizState;
  dispatch: (action: QuizAction) => void;
  signedIn: boolean | null;
}

function QuestionScreen({ state, dispatch, signedIn }: QuestionScreenProps) {
  const q = state.questions[state.currentIndex];
  const answer = state.answers[state.currentIndex];
  const correct = state.feedback ? isCorrect(q, answer) : null;
  const isLast = state.currentIndex + 1 === state.questions.length;
  const isMulti = q.type === 'multi';

  const [multiSelection, setMultiSelection] = useState<number[]>([]);

  useEffect(() => {
    setMultiSelection([]);
  }, [state.currentIndex]);

  const handleOptionClick = (i: number) => {
    if (state.feedback) return;
    if (isMulti) {
      setMultiSelection((prev) =>
        prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
      );
    } else {
      dispatch({ type: 'answer', value: i });
    }
  };

  const handleMultiSubmit = () => {
    if (multiSelection.length > 0) {
      dispatch({ type: 'answer', value: [...multiSelection].sort((a, b) => a - b) });
    }
  };

  return (
    <div>
      <LoginBanner signedIn={signedIn} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <span className="eyebrow">practice mode · sessionStorage</span>
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
            Practice quiz
          </h2>
        </div>
        <span className="pill" style={{ padding: '5px 12px', fontSize: 12 }}>
          Question {state.currentIndex + 1} / {state.questions.length}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 28 }}>
        {state.questions.map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background:
                i < state.currentIndex
                  ? 'var(--ink)'
                  : i === state.currentIndex
                    ? 'var(--accent)'
                    : 'var(--paper-3)',
            }}
          />
        ))}
      </div>

      <div className="card" style={{ padding: 28 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>
          Q{String(state.currentIndex + 1).padStart(2, '0')} · {isMulti ? 'multi-select' : 'single choice'}
        </div>
        <div
          style={{
            fontFamily: 'var(--serif)',
            fontSize: 24,
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
                ? state.feedback
                  ? Array.isArray(answer) && answer.includes(i)
                  : multiSelection.includes(i)
                : answer === i;
              const isExpected = Array.isArray(q.answer) ? q.answer.includes(i) : q.answer === i;

              let stateClass = 'qopt qopt--idle';
              if (!state.feedback) {
                if (isMulti && isSelected) stateClass = 'qopt qopt--selected';
              } else {
                if (isExpected) stateClass = 'qopt qopt--correct';
                else if (isSelected && !isExpected) stateClass = 'qopt qopt--wrong';
                else stateClass = 'qopt qopt--reveal';
              }

              return (
                <button
                  key={i}
                  type="button"
                  className={stateClass}
                  disabled={!!state.feedback}
                  onClick={() => handleOptionClick(i)}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {isMulti && !state.feedback && (
          <button
            type="button"
            className="btn btn--primary"
            style={{ marginTop: 18 }}
            disabled={multiSelection.length === 0}
            onClick={handleMultiSubmit}
          >
            Submit answer
          </button>
        )}

        {state.feedback && (
          <div
            style={{
              marginTop: 24,
              padding: 18,
              borderRadius: 10,
              background: correct ? 'var(--pass-soft)' : 'var(--accent-soft)',
              border: '1px solid transparent',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: correct ? 'var(--pass)' : 'var(--accent)',
                  color: 'white',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {correct ? <CheckIcon /> : <XIcon />}
              </span>
              <span style={{ fontWeight: 600, color: correct ? 'var(--pass-strong)' : 'var(--accent-strong)' }}>
                {correct ? '✓ Correct!' : '✗ Incorrect'}
              </span>
            </div>
            {q.hint && !correct && (
              <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55, marginBottom: 6 }}>
                <strong style={{ color: 'var(--ink)' }}>Hint:</strong> {stripWikilinks(q.hint)}
              </div>
            )}
            {q.explanation && (
              <div style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.55 }}>
                <strong style={{ color: 'var(--ink)' }}>Why:</strong> {stripWikilinks(q.explanation)}
              </div>
            )}
          </div>
        )}
      </div>

      {state.feedback && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button type="button" className="btn btn--primary" onClick={() => dispatch({ type: 'next' })}>
            {isLast ? 'See Results' : 'Next Question'} <ArrowIcon />
          </button>
        </div>
      )}
    </div>
  );
}

interface SummaryScreenProps {
  state: QuizState;
  markedComplete: boolean;
  signedIn: boolean | null;
  saveStatus: SaveStatus;
  promptDismissed: boolean;
  onDismissPrompt: () => void;
  onMarkComplete: () => void;
  onRestart: () => void;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

function SavePrompt({ onDismiss }: { onDismiss: () => void }) {
  const handleSignIn = (provider: 'github' | 'google') => {
    authClient.signIn.social({ provider, callbackURL: window.location.href });
  };
  return (
    <div
      role="region"
      aria-label="Save your score"
      data-testid="quiz-save-prompt"
      className="card"
      style={{
        marginTop: 28,
        padding: 22,
        borderColor: 'var(--rule)',
        background: 'var(--paper-2)',
        display: 'flex',
        gap: 16,
        alignItems: 'flex-start',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ flex: '1 1 260px' }}>
        <div className="eyebrow" style={{ marginBottom: 6 }}>save progress</div>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 19, color: 'var(--ink)', letterSpacing: '-0.01em', marginBottom: 4 }}>
          Log in to save your score.
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>
          Sign in and this attempt will be added to your profile automatically.
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" className="btn btn--primary btn--sm" onClick={() => handleSignIn('github')}>
          Sign in with GitHub
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => handleSignIn('google')}>
          Sign in with Google
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={onDismiss}
          data-testid="quiz-save-prompt-dismiss"
          aria-label="Dismiss"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

function SummaryScreen({ state, markedComplete, signedIn, saveStatus, promptDismissed, onDismissPrompt, onMarkComplete, onRestart }: SummaryScreenProps) {
  const { correct, total } = getScore(state);
  const missed = state.questions.filter((q, i) => !isCorrect(q, state.answers[i]));
  const passed = correct / total >= 0.65;

  const showSavePrompt = shouldShowSavePrompt({
    status: state.status,
    signedIn,
    dismissed: promptDismissed,
  });

  const savedNote = signedIn
    ? saveStatus === 'saving'
      ? 'Saving attempt…'
      : saveStatus === 'saved'
        ? '✓ Attempt saved to your account'
        : saveStatus === 'error'
          ? 'Could not save attempt'
          : ''
    : promptDismissed
      ? '(practice only — not saved to account)'
      : '';

  return (
    <div>
      <span className="eyebrow">Quiz Complete · practice</span>
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
        {correct}
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
        {passed
          ? `Passed · ${Math.round((correct / total) * 100)}%`
          : `${total - correct} missed · ${Math.round((correct / total) * 100)}%`}
      </div>

      {missed.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <span className="eyebrow">review · {missed.length} missed</span>
          <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
            {missed.map((q) => (
              <div key={q.id} className="card" style={{ padding: '18px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <span className="pill pill--accent">incorrect</span>
                </div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 18, letterSpacing: '-0.01em', marginBottom: 10, color: 'var(--ink)' }}>
                  {q.q}
                </div>
                {q.explanation && (
                  <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55 }}>
                    <strong style={{ color: 'var(--ink)' }}>Why:</strong> {stripWikilinks(q.explanation)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showSavePrompt && <SavePrompt onDismiss={onDismissPrompt} />}

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 28 }}>
        <button type="button" className="btn btn--primary" onClick={onRestart}>
          Retry Quiz
        </button>
        {!markedComplete ? (
          <button type="button" className="btn btn--ghost" onClick={onMarkComplete}>
            Mark complete
          </button>
        ) : (
          <span className="pill pill--pass">
            <CheckIcon /> Marked complete
          </span>
        )}
        {savedNote && (
          <span
            style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--mono)' }}
            data-testid="quiz-save-status"
            data-status={saveStatus}
          >
            {savedNote}
          </span>
        )}
      </div>
    </div>
  );
}

function QuizRunnerInner({ questions, quizSlug }: Props) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [state, setState] = useState<QuizState>(() => createQuizState(questions, 'practice'));
  const [markedComplete, setMarkedComplete] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [promptDismissed, setPromptDismissed] = useState(false);

  const startedAtRef = useRef<number>(Date.now());
  const submittedRef = useRef<boolean>(false);
  const attemptIdRef = useRef<string>(crypto.randomUUID());

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
    const restored = adapter.loadProgress(quizSlug);
    if (restored) setState(restoreQuizState(questions, 'practice', restored));
    try {
      setMarkedComplete(sessionStorage.getItem(COMPLETE_KEY(quizSlug)) === 'true');
      setPromptDismissed(sessionStorage.getItem(SAVE_PROMPT_DISMISSED_KEY) === 'true');
    } catch {}
  }, [adapter, quizSlug, questions]);

  const handleDismissPrompt = useCallback(() => {
    try {
      sessionStorage.setItem(SAVE_PROMPT_DISMISSED_KEY, 'true');
    } catch {}
    setPromptDismissed(true);
  }, []);

  useEffect(() => {
    adapter.saveProgress(quizSlug, persistQuizState(state));
  }, [adapter, quizSlug, state]);

  useEffect(() => {
    if (state.status !== 'summary') return;
    if (submittedRef.current) return;
    if (signedIn === null) return;
    submittedRef.current = true;
    adapter.clearProgress(quizSlug);
    const { correct, total } = getScore(state);
    const durationSec = Math.floor((Date.now() - startedAtRef.current) / 1000);
    if (signedIn) setSaveStatus('saving');
    adapter
      .recordAttempt({
        attemptId: attemptIdRef.current,
        quizSlug,
        mode: 'practice',
        score: correct,
        total,
        answers: state.answers,
        durationSec,
      })
      .then(({ id }) => {
        if (signedIn) setSaveStatus(id ? 'saved' : 'error');
      })
      .catch(() => {
        if (signedIn) setSaveStatus('error');
      });
  }, [adapter, quizSlug, signedIn, state]);

  const dispatch = useCallback((action: QuizAction) => {
    setState((prev) => transition(prev, action));
  }, []);

  const handleMarkComplete = useCallback(() => {
    try {
      sessionStorage.setItem(COMPLETE_KEY(quizSlug), 'true');
    } catch {}
    setMarkedComplete(true);
  }, [quizSlug]);

  const handleRestart = useCallback(() => {
    setState(createQuizState(questions, 'practice'));
    try {
      sessionStorage.removeItem(COMPLETE_KEY(quizSlug));
    } catch {}
    setMarkedComplete(false);
    setSaveStatus('idle');
    submittedRef.current = false;
    startedAtRef.current = Date.now();
    attemptIdRef.current = crypto.randomUUID();
  }, [questions, quizSlug]);

  return (
    <section style={{ marginTop: 56, paddingTop: 40, borderTop: '1px solid var(--rule)' }}>
      {state.status === 'summary' ? (
        <SummaryScreen
          state={state}
          markedComplete={markedComplete}
          signedIn={signedIn}
          saveStatus={saveStatus}
          promptDismissed={promptDismissed}
          onDismissPrompt={handleDismissPrompt}
          onMarkComplete={handleMarkComplete}
          onRestart={handleRestart}
        />
      ) : (
        <QuestionScreen state={state} dispatch={dispatch} signedIn={signedIn} />
      )}
    </section>
  );
}

export default function QuizRunner({ questions, quizSlug }: Props) {
  return (
    <ErrorBoundary label="QuizRunner">
      <QuizRunnerInner questions={questions} quizSlug={quizSlug} />
    </ErrorBoundary>
  );
}
