import { useState } from 'react';

interface Submission {
  projectSlug: string;
  repoUrl: string | null;
  reflection: string;
  isPublic: boolean;
  submittedAt: string;
}

interface Props {
  submissions: Submission[];
}

export default function SubmissionsList({ submissions: initial }: Props) {
  const [items, setItems] = useState<Submission[]>(initial);
  const [pending, setPending] = useState<string | null>(null);
  const [errorSlug, setErrorSlug] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
        No project builds submitted yet. Pick one from the{' '}
        <a className="underline" href="/projects" style={{ color: 'var(--ink)', textDecoration: 'underline' }}>
          Build
        </a>{' '}
        section.
      </p>
    );
  }

  async function togglePublic(slug: string, next: boolean) {
    setPending(slug);
    setErrorSlug(null);
    const prev = items;
    setItems((rows) => rows.map((r) => (r.projectSlug === slug ? { ...r, isPublic: next } : r)));
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(slug)}/submit`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ is_public: next }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
    } catch {
      setItems(prev);
      setErrorSlug(slug);
    } finally {
      setPending(null);
    }
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
      {items.map((s) => (
        <li
          key={s.projectSlug}
          style={{
            padding: 14,
            border: '1px solid var(--rule)',
            borderRadius: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <a
              href={`/projects/${s.projectSlug}`}
              style={{ fontWeight: 500, fontSize: 13, color: 'var(--ink)', textDecoration: 'underline' }}
            >
              {s.projectSlug}
            </a>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>
              {new Date(s.submittedAt).toLocaleDateString()}
            </span>
          </div>
          {s.repoUrl && (
            <a
              href={s.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                fontSize: 12,
                color: 'var(--accent)',
                textDecoration: 'underline',
                wordBreak: 'break-all',
                marginTop: 4,
                fontFamily: 'var(--mono)',
              }}
            >
              {s.repoUrl}
            </a>
          )}
          <p
            style={{
              fontSize: 13,
              color: 'var(--ink-2)',
              marginTop: 8,
              marginBottom: 12,
              lineHeight: 1.55,
              whiteSpace: 'pre-wrap',
            }}
          >
            {s.reflection}
          </p>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--ink-2)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={s.isPublic}
              disabled={pending === s.projectSlug}
              onChange={(e) => togglePublic(s.projectSlug, e.target.checked)}
              style={{ width: 14, height: 14, cursor: 'pointer', accentColor: 'var(--accent)' }}
            />
            <span>Visible on public profile</span>
            {errorSlug === s.projectSlug && (
              <span style={{ color: 'var(--error)', fontSize: 11 }}>save failed</span>
            )}
          </label>
        </li>
      ))}
    </ul>
  );
}
