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
      <p className="text-sm text-gray-600 dark:text-gray-400 m-0">
        You have not submitted any project builds yet. Pick one from the{' '}
        <a className="underline" href="/projects">
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
    <ul className="space-y-3 list-none p-0 m-0">
      {items.map((s) => (
        <li
          key={s.projectSlug}
          className="p-4 rounded-lg border border-gray-200 dark:border-gray-800"
        >
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <a className="font-medium underline" href={`/projects/${s.projectSlug}`}>
              {s.projectSlug}
            </a>
            <span className="text-xs text-gray-500">
              Submitted {new Date(s.submittedAt).toLocaleDateString()}
            </span>
          </div>
          {s.repoUrl && (
            <a
              href={s.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-700 dark:text-blue-400 underline break-all"
            >
              {s.repoUrl}
            </a>
          )}
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 mb-3 whitespace-pre-wrap">
            {s.reflection}
          </p>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={s.isPublic}
              disabled={pending === s.projectSlug}
              onChange={(e) => togglePublic(s.projectSlug, e.target.checked)}
              className="h-4 w-4 cursor-pointer accent-blue-600"
            />
            <span>Visible on my public profile</span>
            {errorSlug === s.projectSlug && (
              <span className="text-red-700 dark:text-red-400 text-xs">save failed</span>
            )}
          </label>
        </li>
      ))}
    </ul>
  );
}
