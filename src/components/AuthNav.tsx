import { useEffect, useState } from 'react';
import { authClient } from '../lib/auth-client';
import { ErrorBoundary } from './ErrorBoundary';

type SessionUser = { name?: string | null; email?: string | null; image?: string | null } | null;

function initials(name?: string | null, email?: string | null): string {
  const src = (name ?? email ?? '').trim();
  if (!src) return '·';
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

function AuthNavInner() {
  const [user, setUser] = useState<SessionUser>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    authClient.getSession().then((res) => {
      if (cancelled) return;
      const data = (res && 'data' in res ? res.data : res) as { user?: SessionUser } | null;
      setUser(data?.user ?? null);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return null;

  if (!user) {
    return (
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={() =>
            authClient.signIn.social({ provider: 'github', callbackURL: window.location.href })
          }
          className="btn btn--ghost btn--sm"
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        className="avatar"
        aria-label="Account menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        data-testid="auth-user-name-trigger"
      >
        {initials(user.name, user.email)}
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            minWidth: 200,
            background: 'var(--paper)',
            border: '1px solid var(--rule)',
            borderRadius: 10,
            boxShadow: '0 12px 30px -10px rgba(0,0,0,0.18)',
            padding: 14,
            zIndex: 10,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }} data-testid="auth-user-name">
            {user.name ?? user.email}
          </div>
          {user.name && user.email && (
            <div style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--mono)', marginTop: 2 }}>
              {user.email}
            </div>
          )}
          <hr style={{ border: 0, borderTop: '1px solid var(--rule)', margin: '12px 0' }} />
          <a href="/profile" className="btn btn--ghost btn--sm" style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
            Profile
          </a>
          <button
            type="button"
            onClick={() => authClient.signOut().then(() => window.location.reload())}
            className="btn btn--ghost btn--sm"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function AuthNav() {
  return <ErrorBoundary label="AuthNav"><AuthNavInner /></ErrorBoundary>;
}
