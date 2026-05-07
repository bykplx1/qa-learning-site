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
      className="mt-8 p-5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950"
    >
      <header className="mb-3">
        <h2 className="text-lg font-semibold m-0">Submit your build</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 m-0 mt-1">
          {existing
            ? `Last submitted ${new Date(existing.submittedAt).toLocaleDateString()}. Re-submitting updates your submission.`
            : 'Optional GitHub repo URL plus a short reflection on what you learned.'}
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor={`repo-${projectSlug}`} className="block text-sm font-medium mb-1">
            Repo URL <span className="text-gray-500 font-normal">(optional)</span>
          </label>
          <input
            id={`repo-${projectSlug}`}
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/you/your-repo"
            className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
          />
        </div>

        <div>
          <label htmlFor={`reflection-${projectSlug}`} className="block text-sm font-medium mb-1">
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
            className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
          />
          <div className="text-xs text-gray-500 mt-1">{reflection.length} / 4000</div>
        </div>

        <div className="flex items-start gap-3">
          <input
            id={`public-${projectSlug}`}
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="mt-1 h-4 w-4 cursor-pointer accent-blue-600"
          />
          <label htmlFor={`public-${projectSlug}`} className="text-sm cursor-pointer">
            Make this submission visible on my public profile
            <span className="block text-xs text-gray-500 dark:text-gray-400">
              Off by default. Only the items you opt in are visible to anyone else.
            </span>
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={status === 'saving' || reflectionTooShort}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'saving' ? 'Saving…' : existing ? 'Update submission' : 'Submit'}
          </button>
          <span className="text-sm" aria-live="polite">
            {status === 'saved' && lastSavedAt && (
              <span className="text-green-700 dark:text-green-400">
                Saved {new Date(lastSavedAt).toLocaleTimeString()}
              </span>
            )}
            {status === 'error' && (
              <span className="text-red-700 dark:text-red-400">{errorMsg ?? 'Error'}</span>
            )}
          </span>
        </div>
      </form>
    </section>
  );
}
