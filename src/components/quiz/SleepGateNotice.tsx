import { useState, useEffect } from 'react';

interface Props {
  /**
   * IANA timezone string from the server (persisted in user_settings.timezone).
   * If null, the component sniffs the client timezone on mount and reports it
   * to the server via POST /api/review/nudges so future visits are server-authoritative.
   */
  persistedTimezone: string | null;
}

function isAfterMidnight(tz: string): boolean {
  // Test hook: window.__REVIEW_AFTER_MIDNIGHT__ overrides the clock check.
  if (
    typeof window !== 'undefined' &&
    typeof (window as unknown as Record<string, unknown>).__REVIEW_AFTER_MIDNIGHT__ === 'boolean'
  ) {
    return (window as unknown as Record<string, boolean>).__REVIEW_AFTER_MIDNIGHT__;
  }
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      hour12: false,
    }).formatToParts(new Date());
    const hourPart = parts.find((p) => p.type === 'hour');
    const hour = hourPart ? parseInt(hourPart.value, 10) : -1;
    // "After midnight" means 00:00 – 04:59 local time (late night / early morning).
    return hour >= 0 && hour < 5;
  } catch {
    return false;
  }
}

export default function SleepGateNotice({ persistedTimezone }: Props) {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const tz = persistedTimezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Persist sniffed timezone to the server if not already stored.
    if (!persistedTimezone && tz) {
      fetch('/api/review/nudges', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ timezone: tz }),
      }).catch(() => {/* non-critical */});
    }

    setShow(isAfterMidnight(tz));
  }, [persistedTimezone]);

  if (!show || dismissed) return null;

  return (
    <aside
      role="note"
      aria-label="Late-night review notice"
      data-testid="sleep-gate-notice"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '12px 16px',
        background: 'var(--accent-soft)',
        border: '1px solid var(--rule)',
        borderRadius: 10,
        marginBottom: 20,
        fontSize: 14,
        lineHeight: 1.55,
        color: 'var(--ink-2)',
        fontFamily: 'var(--sans)',
      }}
    >
      <span aria-hidden="true" style={{ fontSize: 18, lineHeight: 1.3, flexShrink: 0 }}>
        🌙
      </span>
      <span style={{ flex: 1 }}>
        <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>Reviewing after midnight?</strong>
        {' '}Sleep is when memory consolidates. A tired brain makes retrieval feel harder than it is — consider scheduling this for tomorrow morning.
      </span>
      <button
        type="button"
        aria-label="Dismiss late-night notice"
        onClick={() => setDismissed(true)}
        data-testid="sleep-gate-dismiss"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--ink-3)',
          padding: '0 2px',
          fontSize: 18,
          lineHeight: 1,
          flexShrink: 0,
          alignSelf: 'flex-start',
        }}
      >
        ×
      </button>
    </aside>
  );
}
