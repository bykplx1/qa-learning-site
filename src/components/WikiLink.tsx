import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

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

export default function WikiLink() {
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
        maxWidth: '18rem',
      }}
      className="p-3 rounded-lg shadow-xl border text-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
    >
      <p className="font-semibold mb-1 text-gray-900 dark:text-gray-100">{entry.title}</p>
      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{entry.excerpt}</p>
    </div>,
    document.body
  );
}
