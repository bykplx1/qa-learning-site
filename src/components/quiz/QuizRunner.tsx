import { useState, useEffect, useCallback } from 'react';
import type { QuizQuestion } from '../../lib/quiz/schema.js';
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

const STORAGE_KEY = (slug: string) => `quiz_${slug}`;
const COMPLETE_KEY = (slug: string) => `quiz_${slug}_complete`;

interface Props {
  questions: QuizQuestion[];
  quizSlug: string;
}

function LoginBanner() {
  return (
    <div className="mb-5 px-4 py-2.5 rounded-lg text-sm bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
      Log in (coming soon) to save your score
    </div>
  );
}

interface QuestionScreenProps {
  state: QuizState;
  dispatch: (action: QuizAction) => void;
}

function QuestionScreen({ state, dispatch }: QuestionScreenProps) {
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
      <LoginBanner />

      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Question {state.currentIndex + 1} / {state.questions.length}
        </p>
        {isMulti && !state.feedback && (
          <p className="text-xs text-gray-400 dark:text-gray-500">Select all that apply</p>
        )}
      </div>

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mb-6">
        <div
          className="bg-blue-500 h-1 rounded-full transition-all duration-300"
          style={{
            width: `${((state.currentIndex + (state.feedback ? 1 : 0)) / state.questions.length) * 100}%`,
          }}
        />
      </div>

      <h3 className="text-base font-semibold mb-5 text-gray-900 dark:text-gray-100 leading-snug">
        {q.q}
      </h3>

      {q.options && (
        <div className="space-y-2 mb-5">
          {q.options.map((opt, i) => {
            const isSelected = isMulti
              ? state.feedback
                ? Array.isArray(answer) && answer.includes(i)
                : multiSelection.includes(i)
              : answer === i;
            const isExpected = Array.isArray(q.answer) ? q.answer.includes(i) : q.answer === i;

            let cls =
              'w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ';

            if (!state.feedback) {
              if (isMulti && isSelected) {
                cls +=
                  'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200 cursor-pointer';
              } else {
                cls +=
                  'border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 text-gray-800 dark:text-gray-200 cursor-pointer';
              }
            } else {
              if (isExpected) {
                cls +=
                  'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200';
              } else if (isSelected && !isExpected) {
                cls +=
                  'border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200';
              } else {
                cls +=
                  'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500';
              }
            }

            return (
              <button
                key={i}
                className={cls}
                disabled={state.feedback}
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
          className="mb-5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
          disabled={multiSelection.length === 0}
          onClick={handleMultiSubmit}
        >
          Submit
        </button>
      )}

      {state.feedback && (
        <div
          className={`p-4 rounded-lg mb-5 border ${
            correct
              ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
          }`}
        >
          <p
            className={`font-semibold mb-2 ${correct ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}
          >
            {correct ? '✓ Correct!' : '✗ Incorrect'}
          </p>
          {q.hint && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span className="font-medium">Hint:</span> {q.hint}
            </p>
          )}
          {q.explanation && (
            <p className="text-sm text-gray-700 dark:text-gray-300">{q.explanation}</p>
          )}
        </div>
      )}

      {state.feedback && (
        <button
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          onClick={() => dispatch({ type: 'next' })}
        >
          {isLast ? 'See Results' : 'Next Question →'}
        </button>
      )}
    </div>
  );
}

interface SummaryScreenProps {
  state: QuizState;
  markedComplete: boolean;
  onMarkComplete: () => void;
  onRestart: () => void;
}

function SummaryScreen({ state, markedComplete, onMarkComplete, onRestart }: SummaryScreenProps) {
  const { correct, total } = getScore(state);
  const missed = state.questions.filter((q, i) => !isCorrect(q, state.answers[i]));

  return (
    <div>
      <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">Quiz Complete</h3>
      <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-1">
        {correct} / {total}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-7">
        {correct === total ? 'Perfect score!' : `${total - correct} question${total - correct !== 1 ? 's' : ''} missed`}
      </p>

      {missed.length > 0 && (
        <div className="mb-7">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Missed Questions</h4>
          <div className="space-y-3">
            {missed.map((q) => (
              <div
                key={q.id}
                className="p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950"
              >
                <p className="font-medium text-gray-900 dark:text-gray-100 mb-2 text-sm">{q.q}</p>
                {q.explanation && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{q.explanation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          onClick={onRestart}
        >
          Retry Quiz
        </button>

        {!markedComplete ? (
          <button
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            onClick={onMarkComplete}
          >
            Mark complete
          </button>
        ) : (
          <span className="text-sm text-green-600 dark:text-green-400">
            ✓ Marked complete
          </span>
        )}

        <span className="text-xs text-gray-400 dark:text-gray-500">
          (practice only — not saved to account)
        </span>
      </div>
    </div>
  );
}

export default function QuizRunner({ questions, quizSlug }: Props) {
  const [state, setState] = useState<QuizState>(() => createQuizState(questions, 'practice'));
  const [markedComplete, setMarkedComplete] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY(quizSlug));
      if (raw) {
        setState(restoreQuizState(questions, 'practice', JSON.parse(raw)));
      }
      setMarkedComplete(sessionStorage.getItem(COMPLETE_KEY(quizSlug)) === 'true');
    } catch {
      // sessionStorage unavailable or corrupted — start fresh
    }
  }, [quizSlug]);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY(quizSlug), JSON.stringify(persistQuizState(state)));
    } catch {}
  }, [state, quizSlug]);

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
  }, [questions, quizSlug]);

  return (
    <div className="mt-10 p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Practice Quiz
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">·</span>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {questions.length} question{questions.length !== 1 ? 's' : ''}
        </span>
      </div>

      {state.status === 'summary' ? (
        <SummaryScreen
          state={state}
          markedComplete={markedComplete}
          onMarkComplete={handleMarkComplete}
          onRestart={handleRestart}
        />
      ) : (
        <QuestionScreen state={state} dispatch={dispatch} />
      )}
    </div>
  );
}
