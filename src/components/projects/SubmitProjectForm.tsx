import { useState } from 'react';
import type { RubricDefinition } from '../../lib/projects/rubric';

interface Existing {
  repoUrl: string | null;
  reflection: string;
  isPublic: boolean;
  submittedAt: string;
}

interface Props {
  projectSlug: string;
  existing: Existing | null;
  rubric?: RubricDefinition | null;
}

type Status = 'idle' | 'saving' | 'saved' | 'error';

export default function SubmitProjectForm({ projectSlug, existing, rubric }: Props) {
  const [repoUrl, setRepoUrl] = useState(existing?.repoUrl ?? '');
  const [reflection, setReflection] = useState(existing?.reflection ?? '');
  const [isPublic, setIsPublic] = useState(existing?.isPublic ?? false);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(existing?.submittedAt ?? null);

  // Rubric self-scores: key = row id, value = band index (0-based).
  const [rubricScores, setRubricScores] = useState<Record<string, number>>(() => {
    if (!rubric) return {};
    return Object.fromEntries(rubric.rows.map((r) => [r.id, 0]));
  });

  function setScore(rowId: string, bandIndex: number) {
    setRubricScores((prev) => ({ ...prev, [rowId]: bandIndex }));
  }

  function readBelowThresholdOverride(): boolean {
    if (typeof document === 'undefined') return false;
    const form = document.querySelector('[data-testid="concept-gate-form"]');
    const input = (form as HTMLFormElement | null)?.elements?.namedItem(
      'below_threshold_override',
    ) as HTMLInputElement | null;
    return input?.value === '1';
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    setErrorMsg(null);
    const belowThreshold = readBelowThresholdOverride();
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectSlug)}/submit`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          repo_url: repoUrl.trim() || null,
          reflection: reflection.trim(),
          is_public: isPublic,
          rubric_scores: rubric ? rubricScores : undefined,
          below_threshold: belowThreshold,
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

        {rubric && (
          <section aria-label="Self-score rubric" data-testid="rubric-self-score">
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--ink)',
                marginBottom: 12,
                fontFamily: 'var(--sans)',
              }}
            >
              Rate your submission against each criterion
            </div>
            <div style={{ display: 'grid', gap: 16 }}>
              {rubric.rows.map((row) => (
                <div key={row.id} data-testid={`score-row-${row.id}`}>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--ink-2)',
                      marginBottom: 6,
                      fontFamily: 'var(--sans)',
                    }}
                  >
                    {row.criterion}
                  </div>
                  <div
                    role="group"
                    aria-label={`Score for ${row.criterion}`}
                    style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}
                  >
                    {row.band.map((descriptor, bandIndex) => {
                      const selected = rubricScores[row.id] === bandIndex;
                      const labelId = `score-${projectSlug}-${row.id}-${bandIndex}`;
                      return (
                        <label
                          key={bandIndex}
                          htmlFor={labelId}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 10px',
                            borderRadius: 6,
                            border: `1px solid ${selected ? 'var(--accent)' : 'var(--rule)'}`,
                            background: selected ? 'var(--accent-soft)' : 'var(--paper-2)',
                            cursor: 'pointer',
                            fontSize: 12,
                            color: 'var(--ink-2)',
                            transition: 'border-color 0.15s, background 0.15s',
                          }}
                          title={descriptor}
                        >
                          <input
                            id={labelId}
                            type="radio"
                            name={`rubric-${projectSlug}-${row.id}`}
                            value={bandIndex}
                            checked={selected}
                            onChange={() => setScore(row.id, bandIndex)}
                            style={{ margin: 0, accentColor: 'var(--accent)' }}
                          />
                          <span>
                            {bandIndex === 0
                              ? 'Not yet'
                              : bandIndex === row.band.length - 1
                                ? 'Excellent'
                                : `Level ${bandIndex}`}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

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
