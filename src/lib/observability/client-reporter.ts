/**
 * Browser-side error reporter — registers window.onerror + unhandledrejection
 * and POSTs compact error reports to /api/observability/client-error.
 * No PII beyond what's already in a JS error.
 */

const ENDPOINT = '/api/observability/client-error';

type Source = 'onerror' | 'unhandledrejection' | 'ErrorBoundary';

export interface ClientErrorReport {
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  source?: Source;
}

export function reportClientError(report: ClientErrorReport): void {
  const payload: ClientErrorReport = {
    ...report,
    url: report.url ?? window.location.href,
    userAgent: report.userAgent ?? navigator.userAgent.slice(0, 500),
  };

  // Best-effort fire-and-forget; do not throw on failure.
  fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // silently ignore — reporter must not cause further errors
  });
}

let registered = false;

export function registerGlobalErrorHandlers(): void {
  if (registered || typeof window === 'undefined') return;
  registered = true;

  window.addEventListener('error', (event) => {
    reportClientError({
      message: event.message ?? 'Unknown error',
      stack: event.error instanceof Error ? event.error.stack : undefined,
      source: 'onerror',
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const err = event.reason;
    reportClientError({
      message: err instanceof Error ? err.message : String(err ?? 'Unhandled promise rejection'),
      stack: err instanceof Error ? err.stack : undefined,
      source: 'unhandledrejection',
    });
  });
}
