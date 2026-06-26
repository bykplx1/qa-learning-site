import { useEffect } from 'react';
import { ErrorBoundary } from '../ErrorBoundary';

/**
 * Client-only marker: reveals the "✓ submitted" badge on project cards the
 * signed-in user has already submitted. Keeps the /projects catalogue page
 * statically prerendered (good for SEO/caching) while still surfacing per-user
 * state. Cards render the badge hidden; this island unhides matching ones.
 */
function ProjectSubmittedMarkersInner() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/profile/me');
        if (!res.ok || cancelled) return; // 401 when signed out — nothing to mark.
        const data = (await res.json()) as { submissions?: { projectSlug: string }[] };
        const slugs = data.submissions?.map((s) => s.projectSlug) ?? [];
        for (const slug of slugs) {
          const card = document.querySelector(`[data-project-slug="${CSS.escape(slug)}"]`);
          const badge = card?.querySelector<HTMLElement>('.brief-card__submitted');
          if (badge) badge.hidden = false;
        }
      } catch {
        // Network/parse error — leave badges hidden (non-critical enhancement).
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

export default function ProjectSubmittedMarkers() {
  return (
    <ErrorBoundary label="ProjectSubmittedMarkers">
      <ProjectSubmittedMarkersInner />
    </ErrorBoundary>
  );
}
