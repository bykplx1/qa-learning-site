import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ErrorBoundary } from './ErrorBoundary';

interface SlugEntry {
  title: string;
  href: string;
  excerpt: string;
}

interface PopoverState {
  entry: SlugEntry;
  rect: DOMRect;
}

let slugsPromise: Promise<Record<string, SlugEntry>> | null = null;

function fetchSlugs(): Promise<Record<string, SlugEntry>> {
  if (!slugsPromise) {
    slugsPromise = fetch('/slugs.json').then((r) => r.json());
  }
  return slugsPromise;
}

function WikiLinkInner() {
  const [popover, setPopover] = useState<PopoverState | null>(null);

  useEffect(() => {
    const links = Array.from(
      document.querySelectorAll<HTMLAnchorElement>('a[data-wikilink-slug]')
    );

    const cleanup: Array<() => void> = [];

    for (const link of links) {
      const slug = link.dataset.wikilinkSlug!;

      const enter = async () => {
        const slugs = await fetchSlugs();
        const entry = slugs[slug];
        if (entry) setPopover({ entry, rect: link.getBoundingClientRect() });
      };

      const leave = () => setPopover(null);

      link.addEventListener('mouseenter', enter);
      link.addEventListener('mouseleave', leave);
      cleanup.push(() => {
        link.removeEventListener('mouseenter', enter);
        link.removeEventListener('mouseleave', leave);
      });
    }

    return () => cleanup.forEach((fn) => fn());
  }, []);

  if (!popover) return null;

  const { entry, rect } = popover;

  return createPortal(
    <div
      role="tooltip"
      style={{
        position: 'fixed',
        top: rect.top - 8,
        left: rect.left,
        transform: 'translateY(-100%)',
        zIndex: 50,
        maxWidth: '20rem',
        padding: 14,
        background: 'var(--paper)',
        border: '1px solid var(--rule-2)',
        borderRadius: 10,
        boxShadow: '0 12px 40px -12px rgba(0,0,0,0.18)',
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--serif)',
          fontSize: 15,
          fontWeight: 500,
          letterSpacing: '-0.01em',
          color: 'var(--ink)',
        }}
      >
        {entry.title}
      </p>
      <p
        style={{
          margin: '6px 0 0',
          fontSize: 12,
          lineHeight: 1.55,
          color: 'var(--ink-2)',
        }}
      >
        {entry.excerpt}
      </p>
    </div>,
    document.body
  );
}

export default function WikiLink() {
  return <ErrorBoundary label="WikiLink"><WikiLinkInner /></ErrorBoundary>;
}
