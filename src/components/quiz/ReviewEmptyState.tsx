function CheckCircleIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
      style={{ color: 'var(--pass-strong)' }}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M7 12l3.5 3.5 6.5-7" />
    </svg>
  );
}

export default function ReviewEmptyState() {
  return (
    <div
      data-testid="review-empty"
      style={{
        maxWidth: 520,
        margin: '0 auto',
        padding: '64px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <CheckCircleIcon />

      <h2
        style={{
          fontFamily: 'var(--serif)',
          fontSize: 32,
          fontWeight: 400,
          letterSpacing: '-0.025em',
          lineHeight: 1.15,
          color: 'var(--ink)',
          margin: 0,
        }}
      >
        You're done for now
      </h2>

      <p
        style={{
          fontFamily: 'var(--sans)',
          fontSize: 15,
          lineHeight: 1.6,
          color: 'var(--ink-2)',
          margin: 0,
          maxWidth: 400,
        }}
      >
        Reviewing more right now would break the spacing — your brain consolidates during the gaps between sessions, not during them.
      </p>

      {/* Intentionally no `review more` CTA — see revamp-plan §14. */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          width: '100%',
          maxWidth: 320,
          marginTop: 8,
        }}
      >
        <a
          href="/explain"
          className="btn btn--primary btn--lg"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          Explain it back
        </a>
        <a
          href="/projects"
          className="btn btn--ghost btn--lg"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          Start a project
        </a>
      </div>
    </div>
  );
}
