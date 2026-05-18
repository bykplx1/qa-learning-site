import { useState, useEffect, useRef, useCallback } from 'react';

// 25 minutes in milliseconds default. Overridable via window.__REVIEW_SESSION_CAP_MS__ for tests.
// Read inside component mount (not at module scope) so addInitScript overrides are visible.
function getCapMs(): number {
  if (
    typeof window !== 'undefined' &&
    typeof (window as unknown as Record<string, unknown>).__REVIEW_SESSION_CAP_MS__ === 'number'
  ) {
    return (window as unknown as Record<string, number>).__REVIEW_SESSION_CAP_MS__;
  }
  return 25 * 60 * 1000;
}

// Idle reset threshold — if the user is inactive for this long the cap timer restarts.
const IDLE_RESET_MS = 3 * 60 * 1000;

interface Props {
  /** Called after the overlay is dismissed. */
  onDismiss?: () => void;
}

export default function SessionCapOverlay({ onDismiss }: Props) {
  const [visible, setVisible] = useState(false);
  const capTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissBtnRef = useRef<HTMLButtonElement | null>(null);

  const startCapTimer = useCallback(() => {
    if (capTimer.current) clearTimeout(capTimer.current);
    capTimer.current = setTimeout(() => {
      setVisible(true);
    }, getCapMs());
  }, []);

  const resetIdleTimer = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      // User has been idle — restart the cap timer fresh.
      startCapTimer();
    }, IDLE_RESET_MS);
  }, [startCapTimer]);

  useEffect(() => {
    startCapTimer();
    resetIdleTimer();

    const EVENTS = ['mousemove', 'keydown', 'pointerdown', 'scroll', 'touchstart'] as const;
    const handleActivity = () => resetIdleTimer();

    for (const ev of EVENTS) {
      window.addEventListener(ev, handleActivity, { passive: true });
    }

    return () => {
      if (capTimer.current) clearTimeout(capTimer.current);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      for (const ev of EVENTS) {
        window.removeEventListener(ev, handleActivity);
      }
    };
  }, [startCapTimer, resetIdleTimer]);

  // Focus the dismiss button when the overlay becomes visible.
  useEffect(() => {
    if (visible) {
      requestAnimationFrame(() => dismissBtnRef.current?.focus());
    }
  }, [visible]);

  const dismiss = useCallback(() => {
    setVisible(false);
    // Restart cap timer so if user keeps reviewing another 25 min they see it again.
    startCapTimer();
    onDismiss?.();
  }, [startCapTimer, onDismiss]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape') {
        dismiss();
      } else if (e.key === 'Tab') {
        // Focus trap: only the dismiss button is interactive.
        e.preventDefault();
        dismissBtnRef.current?.focus();
      }
    },
    [dismiss],
  );

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-cap-title"
      aria-describedby="session-cap-desc"
      onKeyDown={handleKeyDown}
      data-testid="session-cap-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: 16,
        paddingRight: 16,
        background: 'rgba(20, 18, 16, 0.55)',
        backdropFilter: 'blur(3px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <div
        style={{
          background: 'var(--paper)',
          border: '1px solid var(--rule)',
          borderRadius: 16,
          padding: '36px 32px',
          maxWidth: 480,
          width: '100%',
          boxShadow: '0 24px 64px -16px rgba(0,0,0,0.35)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          textAlign: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Walking figure icon */}
        <div aria-hidden="true" style={{ fontSize: 40, lineHeight: 1 }}>
          🚶
        </div>

        <h2
          id="session-cap-title"
          style={{
            fontFamily: 'var(--serif)',
            fontSize: 26,
            fontWeight: 400,
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            color: 'var(--ink)',
            margin: 0,
          }}
        >
          Time for a short break
        </h2>

        <p
          id="session-cap-desc"
          style={{
            fontFamily: 'var(--sans)',
            fontSize: 15,
            lineHeight: 1.65,
            color: 'var(--ink-2)',
            margin: 0,
          }}
        >
          You've been reviewing for about 25 minutes. A 5-minute walk right now
          helps your brain consolidate what you just practiced — the spacing effect
          works <em>between</em> sessions, not only during them.
        </p>

        <button
          ref={dismissBtnRef}
          type="button"
          className="btn btn--primary"
          onClick={dismiss}
          data-testid="session-cap-dismiss"
          style={{ marginTop: 8 }}
        >
          Got it — keep reviewing
        </button>
      </div>
    </div>
  );
}
