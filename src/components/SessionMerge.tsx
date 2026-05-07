import { useEffect, useState } from 'react';
import { authClient } from '../lib/auth-client';
import { runSessionMerge, type MergeStorage } from '../lib/session-merge/merge';

const ATTEMPTED_KEY = 'session_merge_attempted';

function browserStorage(): MergeStorage {
  return {
    keys: () => {
      try {
        return Object.keys(sessionStorage);
      } catch {
        return [];
      }
    },
    getItem: (k) => {
      try {
        return sessionStorage.getItem(k);
      } catch {
        return null;
      }
    },
    removeItem: (k) => {
      try {
        sessionStorage.removeItem(k);
      } catch {}
    },
  };
}

export function SessionMerge() {
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    setError(false);
    try {
      const result = await runSessionMerge({ storage: browserStorage() });
      if (result.failedKeys.length > 0) {
        setError(true);
      } else {
        try {
          sessionStorage.setItem(ATTEMPTED_KEY, '1');
        } catch {}
      }
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    try {
      if (sessionStorage.getItem(ATTEMPTED_KEY)) return;
    } catch {
      return;
    }
    authClient.getSession().then((res) => {
      if (cancelled) return;
      const data = (res && 'data' in res ? res.data : res) as { user?: { id?: string } } | null;
      if (!data?.user?.id) return;
      void run();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!error) return null;
  return (
    <div
      role="alert"
      data-testid="session-merge-error"
      className="banner banner--accent"
      style={{ margin: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}
    >
      <span>Could not upload your offline progress. Your work is still saved locally.</span>
      <button
        type="button"
        className="btn btn--ghost btn--sm"
        disabled={busy}
        onClick={() => void run()}
      >
        {busy ? 'Retrying…' : 'Retry'}
      </button>
    </div>
  );
}
