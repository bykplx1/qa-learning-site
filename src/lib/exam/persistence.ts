const STORAGE_KEY = 'qa-exam-runner-state-v1';

export interface PersistedExamState {
  examSlug: string;
  startedAt: number;
  durationMs: number;
  currentIndex: number;
  answers: Array<number | number[] | null>;
}

export function loadExamState(examSlug: string): PersistedExamState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: PersistedExamState = JSON.parse(raw);
    if (parsed.examSlug !== examSlug) return null;
    const elapsed = Date.now() - parsed.startedAt;
    if (elapsed >= parsed.durationMs) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveExamState(state: PersistedExamState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // quota exceeded or private browsing — silently ignore
  }
}

export function clearExamState(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
