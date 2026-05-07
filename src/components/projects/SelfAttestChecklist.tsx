import { useEffect, useState } from 'react';

interface Props {
  projectSlug: string;
  criteria: string[];
}

const STORAGE_PREFIX = 'project-attest:';

function storageKey(slug: string): string {
  return `${STORAGE_PREFIX}${slug}`;
}

function readState(slug: string, count: number): boolean[] {
  if (typeof window === 'undefined') return new Array(count).fill(false);
  try {
    const raw = window.sessionStorage.getItem(storageKey(slug));
    if (!raw) return new Array(count).fill(false);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length !== count) {
      return new Array(count).fill(false);
    }
    return parsed.map((v) => Boolean(v));
  } catch {
    return new Array(count).fill(false);
  }
}

function writeState(slug: string, state: boolean[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(storageKey(slug), JSON.stringify(state));
  } catch {
    // sessionStorage unavailable (private mode, quota) — silently degrade.
  }
}

export default function SelfAttestChecklist({ projectSlug, criteria }: Props) {
  const [checked, setChecked] = useState<boolean[]>(() => new Array(criteria.length).fill(false));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setChecked(readState(projectSlug, criteria.length));
    setHydrated(true);
  }, [projectSlug, criteria.length]);

  function toggle(index: number): void {
    setChecked((prev) => {
      const next = prev.map((v, i) => (i === index ? !v : v));
      writeState(projectSlug, next);
      return next;
    });
  }

  function reset(): void {
    const next = new Array(criteria.length).fill(false);
    setChecked(next);
    writeState(projectSlug, next);
  }

  const allDone = checked.length > 0 && checked.every(Boolean);
  const doneCount = checked.filter(Boolean).length;

  return (
    <section
      aria-label="Self-attest checklist"
      className="mt-8 p-5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900"
    >
      <header className="flex items-baseline justify-between gap-3 mb-3">
        <h2 className="text-lg font-semibold m-0">Self-attest checklist</h2>
        <span className="text-sm text-gray-600 dark:text-gray-400" aria-live="polite">
          {doneCount} / {criteria.length}
        </span>
      </header>
      <ul className="space-y-2 list-none p-0 m-0">
        {criteria.map((c, i) => (
          <li key={i} className="flex items-start gap-3">
            <input
              id={`attest-${projectSlug}-${i}`}
              type="checkbox"
              checked={checked[i] ?? false}
              onChange={() => toggle(i)}
              disabled={!hydrated}
              className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-blue-600"
            />
            <label
              htmlFor={`attest-${projectSlug}-${i}`}
              className={`cursor-pointer ${checked[i] ? 'line-through text-gray-500 dark:text-gray-500' : ''}`}
            >
              {c}
            </label>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-sm text-gray-600 dark:text-gray-400 m-0" aria-live="polite">
          {allDone
            ? 'All criteria checked. Saving submissions across devices arrives in a later release.'
            : 'Progress is kept locally for this browser session.'}
        </p>
        <button
          type="button"
          onClick={reset}
          disabled={!hydrated || doneCount === 0}
          className="text-sm px-3 py-1 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reset
        </button>
      </div>
    </section>
  );
}
