import { useEffect, useRef, useState } from 'react';
import { authClient } from '../lib/auth-client';

type Status = 'loading' | 'idle' | 'saving' | 'done' | 'done-local' | 'error';

interface Props {
  slug: string;
}

export const LESSON_COMPLETE_KEY = (slug: string) => `lesson_complete_${slug}`;

export function MarkComplete({ slug }: Props) {
  const [status, setStatus] = useState<Status>('loading');
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const startedAt = useRef<number>(Date.now());

  useEffect(() => {
    let cancelled = false;
    authClient.getSession().then((res) => {
      if (cancelled) return;
      const data = (res && 'data' in res ? res.data : res) as { user?: { id?: string } } | null;
      const isAuthed = !!data?.user?.id;
      setSignedIn(isAuthed);
      if (!isAuthed) {
        try {
          const marked = sessionStorage.getItem(LESSON_COMPLETE_KEY(slug)) === '1';
          setStatus(marked ? 'done-local' : 'idle');
        } catch {
          setStatus('idle');
        }
      } else {
        setStatus('idle');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (status === 'loading') return null;

  const onClick = async () => {
    if (signedIn === false) {
      try {
        sessionStorage.setItem(LESSON_COMPLETE_KEY(slug), '1');
        setStatus('done-local');
      } catch {
        setStatus('error');
      }
      return;
    }
    setStatus('saving');
    const timeSpent = Math.floor((Date.now() - startedAt.current) / 1000);
    try {
      const res = await fetch(`/api/lessons/${encodeURIComponent(slug)}/complete`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ time_spent_sec: timeSpent }),
      });
      setStatus(res.ok ? 'done' : 'error');
    } catch {
      setStatus('error');
    }
  };

  const label =
    status === 'saving'
      ? 'Saving…'
      : status === 'done'
        ? 'Completed ✓'
        : status === 'done-local'
          ? 'Marked locally — sign in to save'
          : status === 'error'
            ? 'Retry'
            : 'Mark complete';

  const isDone = status === 'done' || status === 'done-local';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={status === 'saving' || isDone}
      data-testid="mark-complete"
      className={isDone ? 'btn btn--ghost' : 'btn btn--accent'}
    >
      {label}
    </button>
  );
}
