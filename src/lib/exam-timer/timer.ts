export type TimerHandle = unknown;

export interface Clock {
  now: () => number;
  setTimeout: (cb: () => void, ms: number) => TimerHandle;
  clearTimeout: (handle: TimerHandle) => void;
}

export interface ExamTimerOptions {
  durationMs: number;
  onTick?: (remainingMs: number) => void;
  onExpire?: () => void;
  clock?: Clock;
  tickIntervalMs?: number;
}

export interface ExamTimer {
  start: () => void;
  stop: () => void;
  getRemaining: () => number;
}

const defaultClock: Clock = {
  now: () => Date.now(),
  setTimeout: (cb, ms) => globalThis.setTimeout(cb, ms),
  clearTimeout: (h) => globalThis.clearTimeout(h as ReturnType<typeof globalThis.setTimeout>),
};

export function createExamTimer(options: ExamTimerOptions): ExamTimer {
  const {
    durationMs,
    onTick,
    onExpire,
    clock = defaultClock,
    tickIntervalMs = 1000,
  } = options;

  if (!Number.isFinite(durationMs) || durationMs < 0) {
    throw new Error('durationMs must be a non-negative finite number');
  }
  if (!Number.isFinite(tickIntervalMs) || tickIntervalMs <= 0) {
    throw new Error('tickIntervalMs must be a positive finite number');
  }

  let startedAt: number | null = null;
  let handle: TimerHandle = null;
  let expired = false;
  let stopped = false;

  const computeRemaining = (): number => {
    if (startedAt === null) return durationMs;
    const elapsed = clock.now() - startedAt;
    return Math.max(0, durationMs - elapsed);
  };

  const cancelPending = () => {
    if (handle !== null) {
      clock.clearTimeout(handle);
      handle = null;
    }
  };

  const fireExpire = () => {
    if (expired || stopped) return;
    expired = true;
    stopped = true;
    cancelPending();
    onExpire?.();
  };

  const scheduleNext = () => {
    if (stopped || expired) return;
    const remaining = computeRemaining();
    if (remaining <= 0) {
      fireExpire();
      return;
    }
    const delay = Math.min(tickIntervalMs, remaining);
    handle = clock.setTimeout(onTimeout, delay);
  };

  const onTimeout = () => {
    handle = null;
    if (stopped || expired) return;
    const remaining = computeRemaining();
    if (remaining <= 0) {
      fireExpire();
      return;
    }
    onTick?.(remaining);
    scheduleNext();
  };

  return {
    start() {
      if (startedAt !== null || stopped) return;
      startedAt = clock.now();
      if (durationMs === 0) {
        fireExpire();
        return;
      }
      scheduleNext();
    },
    stop() {
      if (stopped) return;
      stopped = true;
      cancelPending();
    },
    getRemaining() {
      return computeRemaining();
    },
  };
}
