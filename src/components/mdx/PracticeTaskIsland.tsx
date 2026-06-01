import { useState, type ReactNode } from 'react';
import { rubrics, type RubricDefinition } from '../../lib/projects/rubric';
import { ErrorBoundary } from '../ErrorBoundary';

interface Props {
  id: string;
  rubricId: string;
  children: ReactNode;
}

function PracticeTaskIslandInner({ id, rubricId, children }: Props) {
  const [submitted, setSubmitted] = useState(false);

  const rubricDef: RubricDefinition | null =
    (rubrics as Record<string, RubricDefinition>)[rubricId] ?? null;

  return (
    <div
      className="mdx-task"
      data-task-id={id}
      data-rubric={rubricId}
      data-testid={`practice-task-${id}`}
    >
      <p className="eyebrow mdx-task__label">
        practice task · <span style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{id}</span>
      </p>

      <div className="mdx-task__body">{children}</div>

      {!submitted && (
        <div style={{ marginTop: 16 }}>
          <button
            type="button"
            className="btn btn--primary btn--sm"
            data-testid={`practice-task-submit-${id}`}
            onClick={() => setSubmitted(true)}
          >
            I&apos;ve completed this task — reveal rubric
          </button>
        </div>
      )}

      {submitted && rubricDef && (
        <div
          className="mdx-task__rubric"
          data-testid={`practice-task-rubric-${id}`}
          aria-label={`Rubric for ${rubricDef.label}`}
          style={{ marginTop: 20, borderTop: '1px solid var(--rule)', paddingTop: 16 }}
        >
          <p
            style={{
              fontSize: 12,
              fontFamily: 'var(--mono)',
              color: 'var(--ink-3)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              margin: '0 0 14px',
            }}
          >
            rubric · {rubricDef.label}
          </p>
          <div style={{ display: 'grid', gap: 0 }}>
            {rubricDef.rows.map((row, rowIndex) => (
              <div
                key={row.id}
                data-testid={`practice-rubric-row-${row.id}`}
                style={{
                  borderTop: rowIndex === 0 ? 'none' : '1px solid var(--rule)',
                  paddingTop: rowIndex === 0 ? 0 : 14,
                  paddingBottom: 14,
                }}
              >
                <h4
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--ink)',
                    margin: '0 0 8px',
                    fontFamily: 'var(--sans)',
                  }}
                >
                  {row.criterion}
                </h4>
                <ol
                  aria-label={`Scoring bands for ${row.criterion}`}
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: 5,
                  }}
                >
                  {row.band.map((descriptor, bandIndex) => (
                    <li
                      key={bandIndex}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 6,
                        border: '1px solid var(--rule)',
                        background: 'var(--paper-2)',
                      }}
                    >
                      <span
                        style={{
                          display: 'block',
                          fontFamily: 'var(--mono)',
                          fontSize: 10,
                          color: 'var(--ink-3)',
                          fontWeight: 600,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          marginBottom: 4,
                        }}
                      >
                        {bandIndex === 0
                          ? 'Not yet'
                          : bandIndex === row.band.length - 1
                            ? 'Excellent'
                            : `Level ${bandIndex}`}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                        {descriptor}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      )}

      {submitted && !rubricDef && (
        <div
          style={{ marginTop: 20, borderTop: '1px solid var(--rule)', paddingTop: 14 }}
          data-testid={`practice-task-complete-${id}`}
        >
          <p style={{ fontSize: 13, color: 'var(--pass-strong)', fontFamily: 'var(--mono)', margin: 0 }}>
            Task marked complete — evaluate yourself against the rubric above.
          </p>
        </div>
      )}
    </div>
  );
}

export default function PracticeTaskIsland(props: Props) {
  return <ErrorBoundary label="PracticeTaskIsland"><PracticeTaskIslandInner {...props} /></ErrorBoundary>;
}
