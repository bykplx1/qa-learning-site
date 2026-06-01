import { useState, type ReactNode } from 'react';
import { ErrorBoundary } from '../ErrorBoundary';

interface Props {
  id: string;
  children: ReactNode;
}

function PracticeTaskIslandInner({ id, children }: Props) {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div
      className="mdx-task"
      data-task-id={id}
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
            I&apos;ve completed this task
          </button>
        </div>
      )}

      {submitted && (
        <div
          style={{ marginTop: 20, borderTop: '1px solid var(--rule)', paddingTop: 14 }}
          data-testid={`practice-task-complete-${id}`}
        >
          <p style={{ fontSize: 13, color: 'var(--pass-strong)', fontFamily: 'var(--mono)', margin: 0 }}>
            Task marked complete — self-assess against the criteria described in the task above.
          </p>
        </div>
      )}
    </div>
  );
}

export default function PracticeTaskIsland(props: Props) {
  return <ErrorBoundary label="PracticeTaskIsland"><PracticeTaskIslandInner {...props} /></ErrorBoundary>;
}
