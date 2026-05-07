import { useEffect, useRef, useState } from 'react';
import { authClient } from '../lib/auth-client';

type Status = 'loading' | 'anonymous' | 'idle' | 'saving' | 'done' | 'error';

interface Props {
  slug: string;
}

export function MarkComplete({ slug }: Props) {
  const [status, setStatus] = useState<Status>('loading');
  const startedAt = useRef<number>(Date.now());

  useEffect(() => {
    let cancelled = false;
    authClient.getSession().then((res) => {
      if (cancelled) return;
      const data = (res && 'data' in res ? res.data : res) as { user?: { id?: string } } | null;
      setStatus(data?.user?.id ? 'idle' : 'anonymous');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === 'loading' || status === 'anonymous') return null;

  const onClick = async () => {
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
    status === 'saving' ? 'Saving…' : status === 'done' ? 'Completed ✓' : status === 'error' ? 'Retry' : 'Mark complete';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={status === 'saving' || status === 'done'}
      data-testid="mark-complete"
      className={status === 'done' ? 'btn btn--ghost' : 'btn btn--accent'}
    >
      {label}
    </button>
  );
}
