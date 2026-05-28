import { Component, type ErrorInfo, type ReactNode } from 'react';
import { reportClientError } from '../lib/observability/client-reporter';

interface Props {
  children: ReactNode;
  /** Optional label included in the error report to identify which island threw. */
  label?: string;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    reportClientError({
      message: error.message,
      stack: `${error.stack ?? ''}\n\nComponent stack:${info.componentStack ?? ''}`,
      source: 'ErrorBoundary',
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            padding: '24px',
            border: '1px solid var(--rule)',
            borderRadius: '8px',
            background: 'var(--paper-2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--sans)',
              fontSize: '14px',
              color: 'var(--error)',
              fontWeight: 500,
            }}
          >
            Something went wrong.
          </p>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
