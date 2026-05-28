import { useState, useEffect } from 'react';
import { ErrorBoundary } from '../ErrorBoundary';

const LS_KEY = 'review:seen-disclaimer';

interface Props {
  /**
   * When true the user has already seen the disclaimer (server-side record).
   * When false the disclaimer is shown and then marked as seen server-side.
   * When null the user is anonymous — localStorage fallback is used.
   */
  seenOnServer: boolean | null;
}

function FirstTimeDisclaimerInner({ seenOnServer }: Props) {
  const [dismissed, setDismissed] = useState(true); // start hidden; flip after hydration

  useEffect(() => {
    if (seenOnServer === true) {
      // Already acknowledged — never show.
      setDismissed(true);
      return;
    }

    if (seenOnServer === false) {
      // Authenticated, not yet seen.
      setDismissed(false);
      return;
    }

    // seenOnServer === null means anonymous user — use localStorage.
    const seen = localStorage.getItem(LS_KEY);
    setDismissed(seen === '1');
  }, [seenOnServer]);

  const handleDismiss = () => {
    setDismissed(true);

    if (seenOnServer === false) {
      // Mark seen server-side.
      fetch('/api/review/nudges', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ seenReviewDisclaimer: true }),
      }).catch(() => {/* non-critical */});
    } else if (seenOnServer === null) {
      // Anonymous — persist to localStorage only.
      localStorage.setItem(LS_KEY, '1');
    }
  };

  if (dismissed) return null;

  return (
    <aside
      role="note"
      aria-label="How mixed practice works"
      data-testid="first-time-disclaimer"
      style={{
        padding: '16px 20px',
        background: 'var(--pass-soft)',
        border: '1px solid var(--rule)',
        borderRadius: 10,
        marginBottom: 24,
        fontFamily: 'var(--sans)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--pass-strong)',
              marginBottom: 6,
            }}
          >
            how this works
          </div>
          <p
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 18,
              fontWeight: 450,
              letterSpacing: '-0.01em',
              lineHeight: 1.35,
              color: 'var(--ink)',
              margin: '0 0 8px',
            }}
          >
            Mixed practice feels worse and works better.
          </p>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.6,
              color: 'var(--ink-2)',
              margin: 0,
            }}
          >
            Cards from different topics appear in an interleaved order. This feels harder
            than blocked practice — that difficulty <em>is</em> the learning. If it feels
            uncomfortable, you're doing it right.
          </p>
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={handleDismiss}
          data-testid="first-time-disclaimer-dismiss"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--ink-3)',
            padding: '0 2px',
            fontSize: 20,
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>

      <button
        type="button"
        className="btn btn--ghost btn--sm"
        onClick={handleDismiss}
        data-testid="first-time-disclaimer-got-it"
        style={{ marginTop: 12 }}
      >
        Got it
      </button>
    </aside>
  );
}

export default function FirstTimeDisclaimer(props: Props) {
  return <ErrorBoundary label="FirstTimeDisclaimer"><FirstTimeDisclaimerInner {...props} /></ErrorBoundary>;
}
