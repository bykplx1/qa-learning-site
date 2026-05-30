import { describe, expect, it, vi } from 'vitest';
import { createExamTimer, type Clock } from './timer.js';

interface FakeClock {
  clock: Clock;
  advance: (ms: number) => void;
  jump: (ms: number) => void;
  pendingCount: () => number;
}

function makeFakeClock(): FakeClock {
  let now = 0;
  let nextId = 1;
  type Task = { id: number; at: number; cb: () => void };
  let tasks: Task[] = [];

  const clock: Clock = {
    now: () => now,
    setTimeout: (cb, ms) => {
      const id = nextId++;
      tasks.push({ id, at: now + ms, cb });
      return id;
    },
    clearTimeout: (h) => {
      tasks = tasks.filter((t) => t.id !== h);
    },
  };

  const advance = (ms: number) => {
    const target = now + ms;
    while (true) {
      const due = tasks
        .filter((t) => t.at <= target)
        .sort((a, b) => a.at - b.at);
      if (due.length === 0) break;
      const next = due[0];
      tasks = tasks.filter((t) => t.id !== next.id);
      now = next.at;
      next.cb();
    }
    now = target;
  };

  const jump = (ms: number) => {
    now += ms;
  };

  return { clock, advance, jump, pendingCount: () => tasks.length };
}

describe('createExamTimer — validation', () => {
  it('rejects negative duration', () => {
    expect(() => createExamTimer({ durationMs: -1 })).toThrow();
  });
  it('rejects non-finite duration', () => {
    expect(() => createExamTimer({ durationMs: Number.POSITIVE_INFINITY })).toThrow();
  });
  it('rejects non-positive tickIntervalMs', () => {
    expect(() => createExamTimer({ durationMs: 1000, tickIntervalMs: 0 })).toThrow();
  });
});

describe('createExamTimer — basic spec', () => {
  it('getRemaining returns full duration before start', () => {
    const { clock } = makeFakeClock();
    const t = createExamTimer({ durationMs: 60_000, clock });
    expect(t.getRemaining()).toBe(60_000);
  });

  it('start records start time; getRemaining decreases as clock advances', () => {
    const { clock, advance } = makeFakeClock();
    const t = createExamTimer({ durationMs: 60_000, clock, tickIntervalMs: 1000 });
    t.start();
    expect(t.getRemaining()).toBe(60_000);
    advance(15_000);
    expect(t.getRemaining()).toBe(45_000);
  });

  it('onTick fires at each interval with remainingMs', () => {
    const { clock, advance } = makeFakeClock();
    const onTick = vi.fn();
    const t = createExamTimer({ durationMs: 5_000, onTick, clock, tickIntervalMs: 1000 });
    t.start();
    advance(3_500);
    expect(onTick).toHaveBeenCalledTimes(3);
    expect(onTick.mock.calls[0][0]).toBe(4_000);
    expect(onTick.mock.calls[1][0]).toBe(3_000);
    expect(onTick.mock.calls[2][0]).toBe(2_000);
    t.stop();
  });

  it('stop before expiry: onExpire never fires; pending timers cleared', () => {
    const { clock, advance, pendingCount } = makeFakeClock();
    const onExpire = vi.fn();
    const t = createExamTimer({ durationMs: 10_000, onExpire, clock });
    t.start();
    advance(2_000);
    t.stop();
    expect(pendingCount()).toBe(0);
    advance(20_000);
    expect(onExpire).not.toHaveBeenCalled();
  });

  it('start is idempotent — second start does not reset', () => {
    const { clock, advance } = makeFakeClock();
    const t = createExamTimer({ durationMs: 10_000, clock });
    t.start();
    advance(3_000);
    t.start();
    expect(t.getRemaining()).toBe(7_000);
  });

  it('stop is idempotent', () => {
    const { clock } = makeFakeClock();
    const t = createExamTimer({ durationMs: 10_000, clock });
    t.start();
    t.stop();
    expect(() => t.stop()).not.toThrow();
  });

  it('start after stop is a no-op', () => {
    const { clock, advance } = makeFakeClock();
    const onExpire = vi.fn();
    const t = createExamTimer({ durationMs: 1_000, onExpire, clock });
    t.stop();
    t.start();
    advance(5_000);
    expect(onExpire).not.toHaveBeenCalled();
  });
});

describe('createExamTimer — onExpire fires exactly once', () => {
  it('fires once on natural expiry', () => {
    const { clock, advance } = makeFakeClock();
    const onExpire = vi.fn();
    const t = createExamTimer({ durationMs: 5_000, onExpire, clock });
    t.start();
    advance(10_000);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('does not fire again when stop called after expiry', () => {
    const { clock, advance } = makeFakeClock();
    const onExpire = vi.fn();
    const t = createExamTimer({ durationMs: 5_000, onExpire, clock });
    t.start();
    advance(10_000);
    t.stop();
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('does not fire when stop wins the race vs expiry tick', () => {
    // Stop called *exactly when* the expiry timer is about to fire.
    // Concretely: clock has advanced past duration, but the scheduled
    // setTimeout callback has not been invoked yet. stop() must cancel it.
    const { clock, jump, advance } = makeFakeClock();
    const onExpire = vi.fn();
    const t = createExamTimer({ durationMs: 5_000, onExpire, clock, tickIntervalMs: 10_000 });
    t.start();
    jump(6_000); // clock past duration but pending callback not run
    t.stop();
    advance(10_000); // run any pending tasks
    expect(onExpire).not.toHaveBeenCalled();
  });

  it('zero duration fires onExpire once on start', () => {
    const { clock } = makeFakeClock();
    const onExpire = vi.fn();
    const t = createExamTimer({ durationMs: 0, onExpire, clock });
    t.start();
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('calling stop inside onExpire callback does not refire', () => {
    const { clock, advance } = makeFakeClock();
    const onExpire = vi.fn();
    // eslint-disable-next-line prefer-const -- forward reference: onExpire closes over timer before assignment
    let timer: ReturnType<typeof createExamTimer>;
    onExpire.mockImplementation(() => timer.stop());
    timer = createExamTimer({ durationMs: 1_000, onExpire, clock });
    timer.start();
    advance(2_000);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });
});

describe('createExamTimer — getRemaining never negative', () => {
  it('clamps to 0 when clock advances past duration', () => {
    const { clock, jump } = makeFakeClock();
    const t = createExamTimer({ durationMs: 5_000, clock });
    t.start();
    jump(1_000_000);
    expect(t.getRemaining()).toBe(0);
  });

  it('clamps to 0 after expiry fired', () => {
    const { clock, advance } = makeFakeClock();
    const t = createExamTimer({ durationMs: 5_000, clock });
    t.start();
    advance(60_000);
    expect(t.getRemaining()).toBe(0);
  });
});

describe('createExamTimer — survives long-suspended browser tabs', () => {
  it('uses injected clock, not tick count: jumping clock past duration triggers expiry on next tick', () => {
    // Simulates a browser tab that was suspended: setTimeout callbacks
    // queued during the freeze fire late, but the wall clock advanced.
    // The timer must compute remaining from clock.now(), not from a
    // running counter, and must fire onExpire exactly once when the
    // delayed tick eventually runs.
    const { clock, jump, advance } = makeFakeClock();
    const onTick = vi.fn();
    const onExpire = vi.fn();
    const t = createExamTimer({
      durationMs: 60_000,
      onTick,
      onExpire,
      clock,
      tickIntervalMs: 1000,
    });
    t.start();
    // Tab suspends for 5 minutes: clock jumps forward without running queued timeouts.
    jump(5 * 60_000);
    // Tab wakes, queued timeouts now run.
    advance(0);
    expect(onExpire).toHaveBeenCalledTimes(1);
    expect(t.getRemaining()).toBe(0);
  });

  it('getRemaining reflects real elapsed time during suspend, even before any tick fires', () => {
    const { clock, jump } = makeFakeClock();
    const t = createExamTimer({ durationMs: 60_000, clock });
    t.start();
    jump(30_000);
    expect(t.getRemaining()).toBe(30_000);
  });
});

describe('createExamTimer — final tick scheduling', () => {
  it('does not call onTick with 0 (expiry path takes over)', () => {
    const { clock, advance } = makeFakeClock();
    const onTick = vi.fn();
    const onExpire = vi.fn();
    const t = createExamTimer({
      durationMs: 3_000,
      onTick,
      onExpire,
      clock,
      tickIntervalMs: 1000,
    });
    t.start();
    advance(3_000);
    expect(onExpire).toHaveBeenCalledTimes(1);
    for (const call of onTick.mock.calls) {
      expect(call[0]).toBeGreaterThan(0);
    }
  });
});
