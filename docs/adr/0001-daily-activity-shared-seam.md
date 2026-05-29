# ADR 0001 — Shared daily-activity seam for streak and heatmap

**Status:** Accepted  
**Date:** 2026-05-29  
**Issue:** [#310](https://github.com/bykplx1/qa-learning-site/issues/310)

## Context

`src/lib/streak/streak.ts` and `src/lib/heatmap/heatmap.ts` each answered "what has this learner done over time" using their own local `DailyActivityRow` type and their own day-bucketing / epoch-day conversion.  Both converted timestamps to days in UTC (`Date.UTC` in streak; `getUTC*` in heatmap), so the same logic existed in two places and could drift.

Additionally, the UTC-only bucketing ignored the learner's actual calendar day (a learner in UTC+9 who completes a lesson at 11 pm local time would have it counted on the *previous* UTC day, breaking their streak).

## Decision

1. **Scope:** unify streak and heatmap only.  `src/lib/activity/` (event-level recent feed) and `src/lib/progress/` (per-lesson completion) are a different grain and remain untouched.

2. **Shared module:** `src/lib/daily-activity/index.ts` is the single source of truth for:
   - `DailyActivityRow` — the shared shape (`day`, `attemptsCount`, `lessonsCount`).
   - `toIsoDate(d, timeZone?)` — converts any timestamp to `"YYYY-MM-DD"` in the given IANA timezone via `Intl.DateTimeFormat / formatToParts`.
   - `toEpochDay(d, timeZone?)` — converts to an integer epoch-day for streak gap arithmetic.

3. **Day-boundary convention:** user-local timezone via an explicit `timeZone: string` parameter (IANA, e.g. `"America/New_York"`).  When no timezone is available at a call site, **default to `'UTC'`** so existing behaviour is preserved.

4. **Data-access layer:** the DB read for daily activity rows already lives in `src/db/queries.ts`.  `getStreak` and `getHeatmap` now accept an optional `timeZone` parameter (default `'UTC'`) and thread it through.

5. **`streak.ts` and `heatmap.ts`** re-export `DailyActivityRow` from the shared module and accept an optional `timeZone` third parameter.

## Current timezone sourcing

As of this ADR, **all server call sites pass `'UTC'`** (the default):

- `src/db/queries.ts` — `getStreak` / `getHeatmap` default to `'UTC'`.
- `src/lib/profile/load-profile.ts` — `loadProfile` accepts `options.timeZone` (default `'UTC'`) and threads it into `streakOf` / `heatmapOf`.

No per-user timezone preference is stored yet.  When a user tz column is added, callers should read it and pass the IANA string; the receiving functions require no further changes.

## Consequences

- Day-bucketing / epoch-day conversion exists in exactly one place.
- The refactor is **behaviour-preserving under UTC**: all existing unit tests pass unchanged.
- Enables correct local-day streaks and heatmaps once a user tz preference is plumbed through (a follow-up task).
- `toIsoDate` has a fast-path for plain `"YYYY-MM-DD"` strings (no tz conversion needed); `Date` objects always go through `Intl`.
