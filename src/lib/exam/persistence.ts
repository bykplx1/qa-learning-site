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

// ── Server-side exam session sync (authenticated users only) ─────────────────
// These functions call the /api/exam/session endpoint so the browser island
// never touches the DB directly.

export async function loadServerExamState(): Promise<PersistedExamState | null> {
  try {
    const res = await fetch('/api/exam/session', { credentials: 'same-origin' });
    if (!res.ok) return null;
    const data = (await res.json()) as PersistedExamState | null;
    return data;
  } catch {
    return null;
  }
}

export async function saveServerExamState(state: PersistedExamState): Promise<void> {
  try {
    await fetch('/api/exam/session', {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(state),
    });
  } catch {
    // network error — sessionStorage still serves as fallback
  }
}

export async function clearServerExamState(): Promise<void> {
  try {
    await fetch('/api/exam/session', {
      method: 'DELETE',
      credentials: 'same-origin',
    });
  } catch {
    // ignore
  }
}
