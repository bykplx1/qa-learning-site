import { useEffect, useState } from 'react';
import { ErrorBoundary } from '../ErrorBoundary';

interface ProfileResponse {
  completedSlugs?: string[];
}

function LessonCompletionMarkersInner() {
  const [completedSlugs, setCompletedSlugs] = useState<Set<string> | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/profile/me', { credentials: 'same-origin' })
      .then((res) => {
        if (!res.ok) return null;
        return res.json() as Promise<ProfileResponse>;
      })
      .then((data) => {
        if (cancelled || !data?.completedSlugs) return;
        setCompletedSlugs(new Set(data.completedSlugs));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!completedSlugs) return;

    // Mark individual lesson rows as complete.
    const rows = document.querySelectorAll<HTMLAnchorElement>('a.lrow[href]');
    for (const row of rows) {
      const href = row.getAttribute('href') ?? '';
      const slug = href.split('/').pop() ?? '';
      if (!slug || !completedSlugs.has(slug)) continue;
      if (row.querySelector('.lrow__done')) continue;

      const marker = document.createElement('span');
      marker.className = 'lrow__done';
      marker.setAttribute('aria-label', 'Completed');
      marker.setAttribute('title', 'Completed');
      row.appendChild(marker);
    }

    // Update track-card progress bars.
    const cards = document.querySelectorAll<HTMLElement>('a.cat[data-cluster-slugs]');
    for (const card of cards) {
      const slugList = (card.getAttribute('data-cluster-slugs') ?? '').split(',').filter(Boolean);
      if (slugList.length === 0) continue;
      const total = slugList.length;
      const completed = slugList.filter((s) => completedSlugs.has(s)).length;
      const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

      const bar = card.querySelector<HTMLElement>('[role="progressbar"]');
      if (!bar) continue;
      bar.style.width = `${pct}%`;
      bar.setAttribute('aria-valuenow', String(completed));
    }
  }, [completedSlugs]);

  return null;
}

export function LessonCompletionMarkers() {
  return (
    <ErrorBoundary label="LessonCompletionMarkers">
      <LessonCompletionMarkersInner />
    </ErrorBoundary>
  );
}
