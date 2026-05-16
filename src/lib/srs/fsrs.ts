import { fsrs as createFSRS, createEmptyCard, Rating, State } from 'ts-fsrs';
import type { Card } from 'ts-fsrs';

export { Rating, State };

// Mirrors the FSRS-state columns in reviewCards (stability, difficulty, dueAt,
// lastReviewedAt, reps, lapses, state). state is a smallint 0-3 matching ts-fsrs State enum.
export interface CardState {
  stability: number;
  difficulty: number;
  dueAt: Date;
  lastReviewedAt: Date | null;
  reps: number;
  lapses: number;
  state: number; // 0=New 1=Learning 2=Review 3=Relearning
}

const f = createFSRS({ enable_fuzz: false });

function toFsrsCard(card: CardState): Card {
  return {
    due: card.dueAt,
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: 0,
    scheduled_days: 0,
    learning_steps: 0,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state as State,
    last_review: card.lastReviewedAt ?? undefined,
  };
}

function fromFsrsCard(card: Card): CardState {
  return {
    stability: card.stability,
    difficulty: card.difficulty,
    dueAt: card.due,
    lastReviewedAt: card.last_review ?? null,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state as number,
  };
}

export function createNewCard(now: Date): CardState {
  const empty = createEmptyCard(now);
  return fromFsrsCard(empty);
}

export function grade(
  card: CardState,
  rating: Rating,
  now: Date,
): { card: CardState; elapsedDays: number } {
  const fsrsCard = toFsrsCard(card);
  const result = f.next(fsrsCard, now, rating as Exclude<Rating, Rating.Manual>);
  return {
    card: fromFsrsCard(result.card),
    elapsedDays: result.log.elapsed_days,
  };
}
