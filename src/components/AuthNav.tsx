import { useEffect, useState } from 'react';
import { authClient } from '../lib/auth-client';

type SessionUser = { name?: string | null; email?: string | null; image?: string | null } | null;

export function AuthNav() {
  const [user, setUser] = useState<SessionUser>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    authClient.getSession().then((res) => {
      if (cancelled) return;
      const data = (res && 'data' in res ? res.data : res) as { user?: SessionUser } | null;
      setUser(data?.user ?? null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return null;

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => authClient.signIn.social({ provider: 'github', callbackURL: window.location.href })}
        className="text-sm px-3 py-1 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        Sign in with GitHub
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm" data-testid="auth-user-name">{user.name ?? user.email}</span>
      <button
        type="button"
        onClick={() => authClient.signOut().then(() => window.location.reload())}
        className="text-sm px-2 py-1 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        Sign out
      </button>
    </div>
  );
}
