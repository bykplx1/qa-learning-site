import { useState, useEffect } from 'react';
import { authClient } from '../../lib/auth-client';
import type { ProfilePayload } from '../../lib/profile/load-profile';
import type { HeatmapCell } from '../../lib/heatmap/heatmap';

// ─── helpers ────────────────────────────────────────────────────────────────

function initials(name: string | null | undefined, email: string | null | undefined): string {
  const src = (name ?? email ?? '').trim();
  if (!src) return '·';
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

function formatCategory(cat: string): string {
  return cat.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function relativeTime(d: Date): string {
  const diffMs = Date.now() - d.getTime();
  const m = Math.round(diffMs / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.round(months / 12)}y ago`;
}

// ─── Heatmap (React version) ─────────────────────────────────────────────────

const CELL = 12;
const GAP = 3;
const STEP = CELL + GAP;
const ROWS = 7;
const TOP_PAD = 18;
const LEFT_PAD = 26;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function HeatmapSection({ cells, year }: { cells: HeatmapCell[]; year: number }) {
  const [tooltip, setTooltip] = useState('');

  const cols = cells.length === 0 ? 0 : Math.max(...cells.map((c) => c.col)) + 1;
  const width = LEFT_PAD + cols * STEP;
  const height = TOP_PAD + ROWS * STEP + 4;

  const monthLabels: { col: number; label: string }[] = [];
  const seenMonth = new Set<number>();
  for (const c of cells) {
    if (c.row !== 0 || c.date === null) continue;
    const m = Number(c.date.slice(5, 7)) - 1;
    if (seenMonth.has(m)) continue;
    seenMonth.add(m);
    monthLabels.push({ col: c.col, label: MONTHS[m] });
  }

  const totalCount = cells.reduce((s, c) => s + c.count, 0);
  const activeDays = cells.filter((c) => c.count > 0).length;

  return (
    <section className="card heatmap" data-testid="heatmap-section" aria-label={`Activity heatmap for ${year}`}>
      <div className="heatmap__header">
        <span className="eyebrow">activity · {year}</span>
        <span className="heatmap__summary">
          <span data-testid="heatmap-total">{totalCount}</span> events across{' '}
          <span data-testid="heatmap-active-days">{activeDays}</span> days
        </span>
      </div>
      <div className="heatmap__scroll">
        <svg
          className="heatmap__svg"
          width={width}
          height={height}
          role="img"
          aria-label={`Activity heatmap for ${year}: ${totalCount} events across ${activeDays} active days`}
          data-testid="heatmap-svg"
        >
          {monthLabels.map((m) => (
            <text key={m.label} x={LEFT_PAD + m.col * STEP} y={TOP_PAD - 6} className="heatmap__month-label">
              {m.label}
            </text>
          ))}
          {(['Mon', 'Wed', 'Fri'] as const).map((label, i) => {
            const row = i * 2 + 1;
            return (
              <text
                key={label}
                x={LEFT_PAD - 6}
                y={TOP_PAD + row * STEP + CELL - 2}
                className="heatmap__dow-label"
                textAnchor="end"
              >
                {label}
              </text>
            );
          })}
          {cells.map((c) => {
            if (c.date === null) return null;
            const x = LEFT_PAD + c.col * STEP;
            const y = TOP_PAD + c.row * STEP;
            const dateLabel = new Date(`${c.date}T00:00:00Z`).toLocaleDateString(undefined, {
              weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
            });
            const ariaLbl =
              c.count === 0
                ? `${dateLabel}: no activity`
                : `${dateLabel}: ${c.count} ${c.count === 1 ? 'event' : 'events'}`;
            return (
              <rect
                key={c.date}
                x={x}
                y={y}
                width={CELL}
                height={CELL}
                rx={2}
                className={`heatmap__cell heatmap__cell--l${c.level}`}
                tabIndex={0}
                role="gridcell"
                aria-label={ariaLbl}
                data-date={c.date}
                data-count={c.count}
                onMouseEnter={() => setTooltip(ariaLbl)}
                onFocus={() => setTooltip(ariaLbl)}
                onMouseLeave={() => setTooltip('')}
                onBlur={() => setTooltip('')}
              >
                <title>{ariaLbl}</title>
              </rect>
            );
          })}
        </svg>
      </div>
      <div className="heatmap__footer">
        <div className="heatmap__tooltip" role="status" aria-live="polite" data-testid="heatmap-tooltip">
          {tooltip}
        </div>
        <div className="heatmap__legend" aria-hidden="true">
          <span>Less</span>
          {([0, 1, 2, 3, 4] as const).map((l) => (
            <span key={l} className={`heatmap__cell heatmap__cell--l${l} heatmap__legend-cell`} />
          ))}
          <span>More</span>
        </div>
      </div>
    </section>
  );
}

// ─── RecentActivity (React version) ──────────────────────────────────────────

interface ActivityItem {
  kind: 'lesson' | 'quiz' | 'project';
  slug: string;
  title: string;
  timestamp: string;
  href: string;
  score?: number;
  total?: number;
  mode?: string;
}

function RecentActivitySection({ items }: { items: ActivityItem[] }) {
  const KIND_LABEL = { lesson: 'lesson', quiz: 'quiz', project: 'project' };
  return (
    <div className="card" data-testid="recent-activity-section" aria-label="Recent activity">
      <span className="eyebrow">recent activity</span>
      {items.length === 0 ? (
        <p data-testid="recent-activity-empty" style={{ color: 'var(--ink-3)', fontSize: 14, marginTop: 12 }}>
          Nothing here yet — finish a lesson, take a quiz, or ship a project to see it land in the feed.
        </p>
      ) : (
        <ul className="recent-activity" data-testid="recent-activity-list">
          {items.map((item) => {
            const ts = new Date(item.timestamp);
            const iso = ts.toISOString();
            const human = ts.toLocaleString(undefined, {
              year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
            });
            return (
              <li
                key={`${item.kind}-${item.slug}-${item.timestamp}`}
                className="recent-activity__row"
                data-testid={`activity-row-${item.kind}-${item.slug}`}
              >
                <span className={`pill pill--${item.kind}`} data-testid={`activity-kind-${item.kind}`}>
                  {KIND_LABEL[item.kind]}
                </span>
                <a href={item.href} className="recent-activity__title">{item.title}</a>
                {item.kind === 'quiz' && item.score != null && item.total != null && (
                  <span className="recent-activity__meta">
                    {item.score}/{item.total}
                    {item.mode && item.mode !== 'practice' ? ` · ${item.mode}` : ''}
                  </span>
                )}
                <time dateTime={iso} title={human} className="recent-activity__time">
                  {relativeTime(ts)}
                </time>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─── ProfileShell ─────────────────────────────────────────────────────────────

type ProfileData = Omit<ProfilePayload, 'recentActivity'> & { recentActivity: ActivityItem[] };

export default function ProfileShell() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; name?: string | null; email: string } | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const session = await authClient.getSession();
      if (cancelled) return;
      const sessionUser = session?.data?.user ?? null;
      if (!sessionUser) {
        setLoading(false);
        return;
      }
      setUser(sessionUser as { id: string; name?: string | null; email: string });
      try {
        const res = await fetch('/api/profile/me');
        if (!cancelled && res.ok) {
          const data = await res.json();
          setProfile(data as ProfileData);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '64px 0', color: 'var(--ink-3)', fontSize: 14 }} aria-busy="true">
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <section className="signed-out">
        <span className="eyebrow">profile</span>
        <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 48, letterSpacing: '-0.03em', margin: '8px 0 14px', color: 'var(--ink)' }}>
          Sign in to <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>track progress.</em>
        </h1>
        <p style={{ fontSize: 16, color: 'var(--ink-2)', maxWidth: '52ch', lineHeight: 1.55 }}>
          Lessons completed, quiz accuracy by topic, project submissions, and streaks — all kept against your account.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
          <a href="/login?next=/profile" className="btn btn--primary btn--lg">Sign in</a>
        </div>
      </section>
    );
  }

  const completedCount = profile?.completedCount ?? 0;
  const attemptCount = profile?.attemptCount ?? 0;
  const streak = profile?.streak ?? { current: 0, longest: 0 };
  const categoryProgress = profile?.categoryProgress ?? [];
  const quizAccuracy = profile?.accuracyByTopic ?? [];
  const heatmapYear = profile?.heatmap.year ?? new Date().getUTCFullYear();
  const heatmapCells = profile?.heatmap.cells ?? [];
  const recentActivity = profile?.recentActivity ?? [];
  const submissionsProp = profile?.submissions ?? [];

  const totalCorrect = quizAccuracy.reduce((s, t) => s + t.correct, 0);
  const totalQ = quizAccuracy.reduce((s, t) => s + t.total, 0);
  const overallAccuracy = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0;
  const totalLessons = categoryProgress.reduce((s, c) => s + c.total, 0);

  return (
    <>
      <section className="identity">
        <div className="identity__left">
          <div className="avatar avatar--lg">{initials(user.name, user.email)}</div>
          <div>
            <span className="eyebrow">profile · private</span>
            <div className="identity__name">{user.name ?? user.email}</div>
            <div className="identity__email">{user.email}</div>
          </div>
        </div>
        <div className="identity__stats">
          <div className="istat">
            <div className="istat__num">
              {streak.current}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--accent)', marginLeft: 6 }}>
                <path d="M12 2s4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 1-3s-3 2-3 6a6 6 0 0 0 12 0c0-6-6-11-6-11z" />
              </svg>
            </div>
            <div className="eyebrow" data-testid="streak-current">day streak · {streak.longest} longest</div>
          </div>
          <div className="istat">
            <div className="istat__num" data-testid="completed-count">
              {completedCount}<span className="istat__num-sub">/{totalLessons || '—'}</span>
            </div>
            <div className="eyebrow">lessons done</div>
          </div>
          <div className="istat">
            <div className="istat__num" data-testid="accuracy-percent">
              {overallAccuracy}<span className="istat__num-sub">%</span>
            </div>
            <div className="eyebrow">
              quiz accuracy · <span data-testid="attempt-count">{attemptCount}</span> attempts
            </div>
          </div>
        </div>
      </section>

      <section className="profile-grid">
        <div className="profile-grid__wide">
          <HeatmapSection cells={heatmapCells} year={heatmapYear} />
        </div>

        <div className="profile-grid__wide">
          <RecentActivitySection items={recentActivity} />
        </div>

        <div className="card profile-grid__wide" data-testid="category-progress-section" aria-label="Category progress">
          <span className="eyebrow">progress by track</span>
          {categoryProgress.length === 0 ? (
            <p style={{ color: 'var(--ink-3)', fontSize: 14, marginTop: 12 }}>No lessons yet. Pick one from the home page.</p>
          ) : (
            <div style={{ display: 'grid', gap: 14, marginTop: 16 }}>
              {categoryProgress.map((cp) => (
                <div
                  key={cp.category}
                  style={{ display: 'grid', gridTemplateColumns: '180px 1fr 60px', alignItems: 'center', gap: 16 }}
                  data-testid={`category-progress-${cp.category}`}
                >
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
                    {formatCategory(cp.category)}
                  </div>
                  <div
                    style={{ height: 8, background: 'var(--paper-3)', borderRadius: 4, overflow: 'hidden' }}
                    role="progressbar"
                    aria-valuenow={cp.percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${cp.category} ${cp.percent}% complete`}
                  >
                    <div style={{ width: `${cp.percent}%`, height: '100%', background: cp.percent > 50 ? 'var(--accent)' : cp.percent > 0 ? 'oklch(75% 0.13 35)' : 'transparent' }} />
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', textAlign: 'right' }}>
                    {cp.completed}/{cp.total}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card" data-testid="submissions-section" aria-label="Project submissions">
          <span className="eyebrow">portfolio · projects shipped</span>
          <div style={{ marginTop: 14 }}>
            <SubmissionsListInline submissions={submissionsProp} />
          </div>
        </div>

        <div className="card profile-grid__wide" data-testid="quiz-accuracy-section" aria-label="Quiz accuracy by topic">
          <span className="eyebrow">quiz accuracy · weakest first</span>
          {quizAccuracy.length === 0 ? (
            <p style={{ color: 'var(--ink-3)', fontSize: 14, marginTop: 12 }}>No quiz attempts yet.</p>
          ) : (
            <>
              <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
                {quizAccuracy.map((t) => (
                  <div
                    key={t.category}
                    style={{ display: 'grid', gridTemplateColumns: '200px 50px 1fr 80px', alignItems: 'center', gap: 14, fontSize: 13 }}
                    data-testid={`quiz-accuracy-${t.category}`}
                  >
                    <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{formatCategory(t.category)}</span>
                    <span style={{ fontFamily: 'var(--mono)', color: t.accuracy < 70 ? 'var(--accent)' : 'var(--ink-2)' }}>
                      {t.accuracy}%
                    </span>
                    <div style={{ height: 6, background: 'var(--paper-3)', borderRadius: 3, position: 'relative' }}>
                      <div style={{ width: `${t.accuracy}%`, height: '100%', background: t.accuracy < 70 ? 'var(--accent)' : 'var(--pass)', borderRadius: 3 }} />
                      <div style={{ position: 'absolute', left: '65%', top: -3, height: 12, width: 1, background: 'var(--ink-3)' }} />
                    </div>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', textAlign: 'right' }}>
                      {t.correct}/{t.total}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--ink-3)' }}>
                ↳ vertical line: ISTQB pass threshold · 65%
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}

// ─── Inline SubmissionsList (avoids double-island nesting) ────────────────────

interface Submission {
  projectSlug: string;
  repoUrl: string | null;
  reflection: string;
  isPublic: boolean;
  submittedAt: string;
}

function SubmissionsListInline({ submissions: initial }: { submissions: Submission[] }) {
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
        <li key={s.projectSlug} style={{ padding: 14, border: '1px solid var(--rule)', borderRadius: 8 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <a href={`/projects/${s.projectSlug}`} style={{ fontWeight: 500, fontSize: 13, color: 'var(--ink)', textDecoration: 'underline' }}>
              {s.projectSlug}
            </a>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>
              {new Date(s.submittedAt).toLocaleDateString()}
            </span>
          </div>
          {s.repoUrl && (
            <a href={s.repoUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', fontSize: 12, color: 'var(--accent)', textDecoration: 'underline', wordBreak: 'break-all', marginTop: 4, fontFamily: 'var(--mono)' }}>
              {s.repoUrl}
            </a>
          )}
          <p style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 8, marginBottom: 12, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
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
