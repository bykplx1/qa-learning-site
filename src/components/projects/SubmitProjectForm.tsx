import { useState } from 'react';

interface Existing {
  repoUrl: string | null;
  reflection: string;
  isPublic: boolean;
  submittedAt: string;
}

interface Props {
  projectSlug: string;
  existing: Existing | null;
}

type Status = 'idle' | 'saving' | 'saved' | 'error';

export default function SubmitProjectForm({ projectSlug, existing }: Props) {
  const [repoUrl, setRepoUrl] = useState(existing?.repoUrl ?? '');
  const [reflection, setReflection] = useState(existing?.reflection ?? '');
  const [isPublic, setIsPublic] = useState(existing?.isPublic ?? false);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(existing?.submittedAt ?? null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectSlug)}/submit`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          repo_url: repoUrl.trim() || null,
          reflection: reflection.trim(),
          is_public: isPublic,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        setStatus('error');
        setErrorMsg(body || `Save failed (${res.status})`);
        return;
      }
      setStatus('saved');
      setLastSavedAt(new Date().toISOString());
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Network error');
    }
  }

  const reflectionTooShort = reflection.trim().length === 0;

  return (
    <section
      aria-label="Submit project"
      className="card"
      style={{ marginTop: 32 }}
    >
      <header style={{ marginBottom: 18 }}>
        <span className="eyebrow">submit your build</span>
        <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '8px 0 0', lineHeight: 1.55 }}>
          {existing
            ? `Last submitted ${new Date(existing.submittedAt).toLocaleDateString()}. Re-submitting overwrites your previous entry.`
            : 'Optional GitHub repo URL plus a short reflection on what you learned.'}
        </p>
      </header>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 16 }}>
        <div>
          <label htmlFor={`repo-${projectSlug}`} className="label">
            Repo URL <span className="label__hint">(optional)</span>
          </label>
          <input
            id={`repo-${projectSlug}`}
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/you/your-repo"
            className="input"
          />
        </div>

        <div>
          <label htmlFor={`reflection-${projectSlug}`} className="label">
            Reflection
          </label>
          <textarea
            id={`reflection-${projectSlug}`}
            required
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            rows={5}
            maxLength={4000}
            placeholder="What did you build, what was hard, what did you learn?"
            className="textarea"
          />
          <div className="field-help">{reflection.length} / 4000</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <input
            id={`public-${projectSlug}`}
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            style={{
              marginTop: 3,
              width: 16,
              height: 16,
              cursor: 'pointer',
              accentColor: 'var(--accent)',
            }}
          />
          <label htmlFor={`public-${projectSlug}`} style={{ fontSize: 13, color: 'var(--ink-2)', cursor: 'pointer', lineHeight: 1.5 }}>
            Make this submission visible on my public profile
            <span style={{ display: 'block', fontSize: 11, color: 'var(--ink-3)', marginTop: 2, fontFamily: 'var(--mono)' }}>
              Off by default. Only opted-in items are visible to others.
            </span>
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="submit"
            disabled={status === 'saving' || reflectionTooShort}
            className="btn btn--primary"
          >
            {status === 'saving' ? 'Saving…' : existing ? 'Update submission' : 'Submit'}
          </button>
          <span style={{ fontSize: 12, fontFamily: 'var(--mono)' }} aria-live="polite">
            {status === 'saved' && lastSavedAt && (
              <span style={{ color: 'var(--pass-strong)' }}>
                ✓ Saved {new Date(lastSavedAt).toLocaleTimeString()}
              </span>
            )}
            {status === 'error' && (
              <span style={{ color: 'var(--error)' }}>{errorMsg ?? 'Error'}</span>
            )}
          </span>
        </div>
      </form>
    </section>
  );
}
