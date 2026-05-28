import { useState, useCallback } from 'react';
import ReviewEmptyState from './ReviewEmptyState';
import { ErrorBoundary } from '../ErrorBoundary';

export interface InitialCard {
  id: string;
  question: string;
  sourceRef: string;
  cluster: string;
  answer?: string | null;
}

interface Props {
  initialCard: InitialCard | null;
}

type Phase = 'idle' | 'submitted' | 'grading' | 'done';

const RATING_LABELS: Record<number, string> = {
  1: 'Again',
  2: 'Hard',
  3: 'Good',
  4: 'Easy',
};

const RATING_DESCRIPTIONS: Record<number, string> = {
  1: 'Complete blank — reset',
  2: 'Recalled with effort',
  3: 'Recalled correctly',
  4: 'Instant recall',
};

function ReviewQueueInner({ initialCard }: Props) {
  const [card, setCard] = useState<InitialCard | null>(initialCard);
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleReveal = useCallback(() => {
    setPhase('submitted');
  }, []);

  const handleGrade = useCallback(
    async (rating: number) => {
      if (!card) return;
      setPhase('grading');
      setError(null);
      try {
        const res = await fetch('/api/review/grade', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ cardId: card.id, rating }),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `HTTP ${res.status}`);
        }
        const data = (await res.json()) as {
          nextCard: InitialCard | null;
        };
        if (data.nextCard) {
          setCard(data.nextCard);
          setPhase('idle');
        } else {
          setCard(null);
          setPhase('done');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setPhase('submitted');
      }
    },
    [card],
  );

  if (!card || phase === 'done') {
    return <ReviewEmptyState />;
  }

  return (
    <section style={{ maxWidth: 680, margin: '0 auto', padding: '36px 24px' }}>
      <div style={{ marginBottom: 12 }}>
        <span className="eyebrow">spaced repetition · {card.cluster}</span>
        <div
          style={{
            fontSize: 11,
            fontFamily: 'var(--mono)',
            color: 'var(--ink-3)',
            marginTop: 4,
          }}
        >
          {card.sourceRef}
        </div>
      </div>

      <div className="card" style={{ padding: 28, marginBottom: 24 }}>
        <div
          style={{
            fontFamily: 'var(--serif)',
            fontSize: 24,
            lineHeight: 1.3,
            letterSpacing: '-0.015em',
            color: 'var(--ink)',
            marginBottom: 20,
          }}
          data-testid="review-question"
        >
          {card.question}
        </div>

        {phase === 'idle' && (
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleReveal}
            data-testid="review-reveal"
          >
            Reveal answer
          </button>
        )}

        {(phase === 'submitted' || phase === 'grading') && (
          <div
            style={{
              marginTop: 16,
              padding: '14px 16px',
              background: 'var(--paper-3, var(--paper-2))',
              borderRadius: 8,
              color: card.answer ? 'var(--ink)' : 'var(--ink-3)',
              fontSize: 15,
              lineHeight: 1.55,
              fontStyle: card.answer ? 'normal' : 'italic',
            }}
            data-testid="review-answer"
          >
            {card.answer || 'No canonical answer — self-grade based on recall.'}
          </div>
        )}
      </div>

      {(phase === 'submitted' || phase === 'grading') && (
        <div>
          <div
            className="eyebrow"
            style={{ marginBottom: 12 }}
          >
            How well did you recall?
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 10,
            }}
          >
            {([1, 2, 3, 4] as const).map((r) => (
              <button
                key={r}
                type="button"
                className="btn btn--ghost"
                disabled={phase === 'grading'}
                onClick={() => handleGrade(r)}
                data-testid={`grade-${r}`}
                style={{ flexDirection: 'column', height: 'auto', padding: '10px 8px' }}
              >
                <span style={{ fontWeight: 600, fontSize: 14 }}>{RATING_LABELS[r]}</span>
                <span
                  style={{
                    fontSize: 10,
                    color: 'var(--ink-3)',
                    fontFamily: 'var(--mono)',
                    marginTop: 4,
                    lineHeight: 1.3,
                    whiteSpace: 'normal',
                  }}
                >
                  {RATING_DESCRIPTIONS[r]}
                </span>
              </button>
            ))}
          </div>

          {error && (
            <div
              style={{
                marginTop: 14,
                color: 'var(--accent-strong)',
                fontSize: 13,
                fontFamily: 'var(--mono)',
              }}
              role="alert"
            >
              {error}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default function ReviewQueue(props: Props) {
  return <ErrorBoundary label="ReviewQueue"><ReviewQueueInner {...props} /></ErrorBoundary>;
}
