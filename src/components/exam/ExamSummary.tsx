import type { QuizQuestion } from '../../lib/quiz/schema.js';
import { isCorrect } from '../../lib/quiz/engine.js';
import { EXAM_PASS_THRESHOLD } from '../../lib/exam/config.js';
import { stripWikilinks } from '../../lib/wikilinks/resolver.js';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
export type ExamFinishReason = 'expired' | 'submitted';

interface Props {
  questions: QuizQuestion[];
  answers: Array<number | number[] | null>;
  score: number;
  total: number;
  durationSec: number;
  reason: ExamFinishReason;
  signedIn?: boolean | null;
  saveStatus?: SaveStatus;
  retryHref?: string;
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

function formatDuration(sec: number): string {
  const total = Math.max(0, Math.floor(sec));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function answerToText(q: QuizQuestion, ans: number | number[] | null): string {
  if (ans === null) return '— skipped';
  if (!q.options) return String(ans);
  if (Array.isArray(ans)) {
    if (ans.length === 0) return '— skipped';
    return ans
      .map((i) => q.options?.[i])
      .filter((v): v is string => typeof v === 'string')
      .join(', ');
  }
  return q.options[ans] ?? String(ans);
}

function correctAnswerText(q: QuizQuestion): string {
  return answerToText(q, q.answer as number | number[]);
}

export default function ExamSummary({
  questions,
  answers,
  score,
  total,
  durationSec,
  reason,
  signedIn,
  saveStatus,
  retryHref,
}: Props) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const passed = total > 0 && score / total >= EXAM_PASS_THRESHOLD;
  const thresholdPct = Math.round(EXAM_PASS_THRESHOLD * 100);

  return (
    <div data-testid="exam-summary">
      <span className="eyebrow">Exam complete · {reason === 'expired' ? 'time expired' : 'submitted'}</span>
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
        <span data-testid="exam-score">{score}</span>
        <span style={{ color: 'var(--ink-3)', fontSize: 40 }}>/{total}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginTop: 4 }}>
        <div
          className={passed ? 'pill pill--pass' : 'pill pill--accent'}
          data-testid="exam-pass-badge"
          data-passed={passed ? 'true' : 'false'}
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
          <span data-testid="exam-pct">
            {passed ? `Passed · ${pct}% (≥ ${thresholdPct}% threshold)` : `Below threshold · ${pct}% (need ≥ ${thresholdPct}%)`}
          </span>
        </div>
        <div
          data-testid="exam-time-taken"
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 13,
            color: 'var(--ink-2)',
            padding: '6px 12px',
            border: '1px solid var(--rule)',
            borderRadius: 8,
            background: 'var(--paper-2)',
          }}
        >
          time taken · {formatDuration(durationSec)}
        </div>
      </div>

      <div style={{ marginTop: 28 }}>
        <span className="eyebrow">review · per-question</span>
        <div style={{ display: 'grid', gap: 10, marginTop: 12 }} data-testid="exam-review-grid">
          {questions.map((q, i) => {
            const ans = answers[i];
            const correct = isCorrect(q, ans);
            const userText = answerToText(q, ans);
            const correctText = correctAnswerText(q);
            return (
              <div key={`${q.id}-${i}`} className="card" style={{ padding: '14px 18px' }} data-testid={`exam-review-${i}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span className={correct ? 'pill pill--pass' : 'pill pill--accent'}>
                    {correct ? '✓ correct' : ans === null ? '— skipped' : '✗ wrong'}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--ink-3)', fontFamily: 'var(--mono)' }}>
                    Q{String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 16, color: 'var(--ink)', marginBottom: 8 }}>
                  {q.q}
                </div>
                <div
                  style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55, display: 'grid', gap: 4 }}
                >
                  <div data-testid={`exam-review-${i}-your`}>
                    <strong style={{ color: 'var(--ink)' }}>Your answer:</strong>{' '}
                    <span style={{ color: correct ? 'var(--ink-2)' : 'var(--accent-strong)' }}>{userText}</span>
                  </div>
                  <div data-testid={`exam-review-${i}-correct`}>
                    <strong style={{ color: 'var(--ink)' }}>Correct answer:</strong> {correctText}
                  </div>
                  {q.explanation && (
                    <div data-testid={`exam-review-${i}-explanation`} style={{ marginTop: 4 }}>
                      <strong style={{ color: 'var(--ink)' }}>Why:</strong> {stripWikilinks(q.explanation)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {retryHref && (
          <a href={retryHref} className="btn btn--primary">Retry exam</a>
        )}
        {saveStatus !== undefined && (
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
        )}
      </div>
    </div>
  );
}
