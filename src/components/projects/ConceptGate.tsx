/**
 * ConceptGate — React island
 *
 * Renders a per-concept stability bar above the project intro.
 * When any required concept is below threshold:
 *   - dims the project intro (via data attribute on a wrapper div)
 *   - surfaces a deep-link to /review?cluster=<cluster> with card count + time estimate
 *   - provides "Start anyway" override
 *   - provides "Explain it first" CTA per failing concept
 *
 * Override-state seam for #153:
 *   The override decision is stored in a hidden <input name="below_threshold_override">
 *   inside a <form data-testid="concept-gate-form"> that wraps the gate.  When the user
 *   clicks "Start anyway", the input value is set to "1".
 *   The #153 submit handler should read:
 *     const form = document.querySelector('[data-testid="concept-gate-form"]');
 *     const belowThreshold = form?.elements['below_threshold_override']?.value === '1';
 *   and include `{ below_threshold: belowThreshold }` in the POST body.
 *   The submit endpoint should write that flag to projectSubmissions (see #153 spec).
 *
 * All DB / auth work happens server-side in the .astro page; this component
 * receives plain serialisable props only.
 */
import { useState } from 'react';

// Must match STABILITY_THRESHOLD in src/lib/projects/concept-gate.ts
const STABILITY_THRESHOLD = 1.0;

export interface ConceptStabilityProp {
  concept: string;
  cluster: string | null;
  stability: number;
  totalCards: number;
  dueCards: number;
  belowThreshold: boolean;
}

export interface GateStatusProp {
  allMet: boolean;
  concepts: ConceptStabilityProp[];
  primaryCluster: string | null;
  dueCardCount: number;
  estimatedMinutes: number;
}

interface Props {
  projectSlug: string;
  gate: GateStatusProp;
}

function StabilityBar({ stability }: { stability: number }) {
  // Bar fills proportionally up to 2× threshold for visual headroom.
  const maxDisplay = STABILITY_THRESHOLD * 2;
  const pct = Math.min(100, (stability / maxDisplay) * 100);
  const met = stability >= STABILITY_THRESHOLD;

  return (
    <div
      style={{
        height: 6,
        borderRadius: 3,
        background: 'var(--rule)',
        position: 'relative',
        overflow: 'visible',
      }}
      role="progressbar"
      aria-valuenow={Math.round(stability * 100) / 100}
      aria-valuemin={0}
      aria-valuemax={maxDisplay}
      aria-label={`Stability ${Math.round(stability * 10) / 10} of ${STABILITY_THRESHOLD} required`}
    >
      {/* Fill */}
      <div
        style={{
          height: '100%',
          width: `${pct}%`,
          borderRadius: 3,
          background: met ? 'var(--pass)' : 'var(--warn)',
          transition: 'width 0.3s ease',
        }}
      />
      {/* Threshold line */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: -3,
          bottom: -3,
          left: `${(STABILITY_THRESHOLD / maxDisplay) * 100}%`,
          width: 2,
          background: 'var(--ink-3)',
          borderRadius: 1,
        }}
      />
    </div>
  );
}

export default function ConceptGate({ projectSlug, gate }: Props) {
  const [overridden, setOverridden] = useState(false);

  const showGate = !gate.allMet && !overridden;

  return (
    <form data-testid="concept-gate-form" style={{ margin: 0 }}>
      {/* Hidden input — #153 reads this to tag submission as below-threshold */}
      <input
        type="hidden"
        name="below_threshold_override"
        value={overridden ? '1' : '0'}
        data-testid="below-threshold-override-input"
      />

      {/* Per-concept stability section */}
      <section
        aria-label="Required concept readiness"
        className="card"
        style={{ marginBottom: 24 }}
        data-testid="concept-gate"
      >
        <header style={{ marginBottom: 14 }}>
          <span className="eyebrow">concept readiness</span>
          {gate.allMet ? (
            <p style={{ fontSize: 13, color: 'var(--pass-strong)', margin: '6px 0 0', fontFamily: 'var(--mono)' }}>
              All required concepts are retained. You are good to go.
            </p>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '6px 0 0', lineHeight: 1.5 }}>
              Some required concepts are below the retention threshold.
            </p>
          )}
        </header>

        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 14 }}>
          {gate.concepts.map((c) => (
            <li key={c.concept}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    color: c.belowThreshold ? 'var(--ink-2)' : 'var(--ink)',
                    fontFamily: 'var(--mono)',
                  }}
                >
                  {c.concept}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: 'var(--mono)',
                    color: c.belowThreshold ? 'var(--warn)' : 'var(--pass)',
                    flexShrink: 0,
                  }}
                  aria-label={`Stability ${Math.round(c.stability * 10) / 10}, ${c.belowThreshold ? 'below threshold' : 'above threshold'}`}
                >
                  {Math.round(c.stability * 10) / 10} / {STABILITY_THRESHOLD}
                  {c.belowThreshold ? ' ✗' : ' ✓'}
                </span>
              </div>
              <StabilityBar stability={c.stability} />
              {c.belowThreshold && c.cluster && (
                <div style={{ marginTop: 6, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <a
                    href={`/explain/${encodeURIComponent(c.concept)}`}
                    style={{
                      fontSize: 11,
                      fontFamily: 'var(--mono)',
                      color: 'var(--accent)',
                      textDecoration: 'underline',
                    }}
                  >
                    Explain it first
                  </a>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Below-threshold warning + deep-link */}
      {showGate && gate.primaryCluster && (
        <div
          className="card"
          data-testid="gate-below-threshold"
          role="alert"
          style={{
            marginBottom: 24,
            borderColor: 'var(--warn)',
            background: 'var(--accent-soft)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <span className="eyebrow" style={{ color: 'var(--accent-strong)' }}>
                retention gap detected
              </span>
              <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: '8px 0 0', lineHeight: 1.55 }}>
                {gate.dueCardCount > 0 ? (
                  <>
                    You have{' '}
                    <strong data-testid="gate-card-count">{gate.dueCardCount}</strong>{' '}
                    due card{gate.dueCardCount === 1 ? '' : 's'} (~{gate.estimatedMinutes}&nbsp;min) in this cluster.
                    Reviewing now will make this project stick.
                  </>
                ) : (
                  <>
                    Some required concepts have not been reviewed enough.
                    Seed your review queue and review before attempting this project.
                  </>
                )}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
              <a
                href={`/review?cluster=${encodeURIComponent(gate.primaryCluster)}`}
                className="btn btn--primary"
                data-testid="gate-review-link"
              >
                Review now
                {gate.dueCardCount > 0 && (
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, opacity: 0.8, marginLeft: 6 }}>
                    ({gate.dueCardCount})
                  </span>
                )}
              </a>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                data-testid="gate-override"
                onClick={() => setOverridden(true)}
              >
                Start anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project intro dim wrapper — dims when gate is active */}
      {showGate && (
        <div
          data-testid="project-intro-dimmed"
          aria-hidden="true"
          style={{
            opacity: 0.4,
            pointerEvents: 'none',
            userSelect: 'none',
            transition: 'opacity 0.3s ease',
          }}
        />
      )}
    </form>
  );
}
