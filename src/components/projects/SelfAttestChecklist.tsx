import { useEffect, useState } from 'react';
import { ErrorBoundary } from '../ErrorBoundary';

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

function SelfAttestChecklistInner({ projectSlug, criteria }: Props) {
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
      className="card"
      style={{ marginTop: 32 }}
    >
      <header style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <span className="eyebrow">self-attest checklist</span>
        <span
          style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-3)' }}
          aria-live="polite"
        >
          {doneCount} / {criteria.length}
        </span>
      </header>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
        {criteria.map((c, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <input
              id={`attest-${projectSlug}-${i}`}
              type="checkbox"
              checked={checked[i] ?? false}
              onChange={() => toggle(i)}
              disabled={!hydrated}
              style={{
                marginTop: 4,
                width: 16,
                height: 16,
                flexShrink: 0,
                cursor: 'pointer',
                accentColor: 'var(--accent)',
              }}
            />
            <label
              htmlFor={`attest-${projectSlug}-${i}`}
              style={{
                cursor: 'pointer',
                fontSize: 14,
                lineHeight: 1.55,
                color: checked[i] ? 'var(--ink-3)' : 'var(--ink-2)',
                textDecoration: checked[i] ? 'line-through' : 'none',
              }}
            >
              {c}
            </label>
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: 0, fontFamily: 'var(--mono)' }} aria-live="polite">
          {allDone
            ? 'All criteria checked. Submit below to record your build.'
            : 'Progress kept locally for this browser session.'}
        </p>
        <button
          type="button"
          onClick={reset}
          disabled={!hydrated || doneCount === 0}
          className="btn btn--ghost btn--sm"
        >
          Reset
        </button>
      </div>
    </section>
  );
}

export default function SelfAttestChecklist(props: Props) {
  return <ErrorBoundary label="SelfAttestChecklist"><SelfAttestChecklistInner {...props} /></ErrorBoundary>;
}
