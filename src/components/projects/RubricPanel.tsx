import type { RubricDefinition } from '../../lib/projects/rubric';
import { ErrorBoundary } from '../ErrorBoundary';

interface Props {
  rubric: RubricDefinition;
}

function RubricPanelInner({ rubric }: Props) {
  return (
    <section
      aria-label={`Grading rubric: ${rubric.label}`}
      data-testid="rubric-panel"
      className="card"
      style={{ marginTop: 32 }}
    >
      <header style={{ marginBottom: 18 }}>
        <span className="eyebrow">grading rubric</span>
        <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '8px 0 0', lineHeight: 1.55 }}>
          These criteria define what a strong submission looks like. Read them before you start building.
        </p>
      </header>

      <div
        role="list"
        aria-label="Rubric criteria"
        style={{ display: 'grid', gap: 0 }}
      >
        {rubric.rows.map((row, rowIndex) => (
          <div
            key={row.id}
            role="listitem"
            data-testid={`rubric-row-${row.id}`}
            style={{
              borderTop: rowIndex === 0 ? 'none' : '1px solid var(--rule)',
              paddingTop: rowIndex === 0 ? 0 : 18,
              paddingBottom: 18,
              marginTop: rowIndex === 0 ? 0 : 0,
            }}
          >
            <h3
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--ink)',
                margin: '0 0 10px',
                fontFamily: 'var(--sans)',
              }}
            >
              {row.criterion}
            </h3>
            <ol
              aria-label={`Scoring bands for ${row.criterion}`}
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 6,
              }}
            >
              {row.band.map((descriptor, bandIndex) => (
                <li
                  key={bandIndex}
                  style={{
                    display: 'grid',
                    gridTemplateRows: 'auto 1fr',
                    gap: 4,
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--rule)',
                    background: 'var(--paper-2)',
                  }}
                >
                  <span
                    aria-label={`Score ${bandIndex}`}
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 10,
                      color: 'var(--ink-3)',
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {bandIndex === 0
                      ? 'Not yet'
                      : bandIndex === row.band.length - 1
                        ? 'Excellent'
                        : `Level ${bandIndex}`}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: 'var(--ink-2)',
                      lineHeight: 1.5,
                    }}
                  >
                    {descriptor}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function RubricPanel(props: Props) {
  return <ErrorBoundary label="RubricPanel"><RubricPanelInner {...props} /></ErrorBoundary>;
}
