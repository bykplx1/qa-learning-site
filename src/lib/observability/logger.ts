/**
 * Structured JSON logger — output captured by Vercel as structured logs.
 * This is the seam where an SDK (e.g. Sentry) would plug in later.
 * Source-map upload is intentionally deferred (no Sentry account).
 */

export type LogLevel = 'info' | 'warn' | 'error';

export interface LogPayload {
  level: LogLevel;
  message: string;
  [key: string]: unknown;
}

function emit(payload: LogPayload): void {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...payload });
  if (payload.level === 'error') {
    console.error(line);
  } else if (payload.level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export function logInfo(message: string, context?: Record<string, unknown>): void {
  emit({ level: 'info', message, ...context });
}

export function logWarn(message: string, context?: Record<string, unknown>): void {
  emit({ level: 'warn', message, ...context });
}

export function logError(message: string, err?: unknown, context?: Record<string, unknown>): void {
  const errFields =
    err instanceof Error
      ? { error: err.message, stack: err.stack }
      : err !== undefined
        ? { error: String(err) }
        : {};
  emit({ level: 'error', message, ...errFields, ...context });
}
