import { findAndReplace } from 'mdast-util-find-and-replace';
import type { Root } from 'mdast';
import type { SlugEntry } from './resolver.js';

export function remarkWikilinks(slugMap: Map<string, SlugEntry>) {
  // Return a proper unified plugin factory (a function that returns the transform).
  // Passing the transform directly to remarkPlugins causes unified to call it as
  // the factory during freeze(), passing the processor instead of the AST tree,
  // which makes findAndReplace crash with "Cannot use 'in' operator … in undefined".
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return () => (tree: Root, file?: any) => {
    const sourcePath: string = file?.history?.[0] ?? file?.path ?? '<unknown>';

    // Fresh regex per file to avoid shared lastIndex state
    // Target group is optional to support anchor-only [[#section]] links.
    const re = /(\\?)\[\[([^\]#|\n]*?)(?:#([^\]|\n]*?))?(?:\|([^\]\n]*?))?\]\]/g;

    findAndReplace(tree, [
      [
        re,
        (
          fullMatch: string,
          escape: string,
          target: string,
          section: string | undefined,
          alias: string | undefined
        ) => {
          if (escape) {
            // Return literal [[...]] text — leave as plain text node
            return {
              type: 'text' as const,
              value: `[[${target}${section ? '#' + section : ''}${alias ? '|' + alias : ''}]]`,
            };
          }

          const key = target.trim();

          // Anchor-only link: [[#Section]] — resolves as a local in-page anchor
          if (!key && section) {
            const display = alias ? alias.trim() : section.trim();
            const href = `#${section.trim().toLowerCase().replace(/[^\w]+/g, '-')}`;
            return {
              type: 'link' as const,
              url: href,
              title: null,
              data: { hProperties: { class: 'wikilink' } },
              children: [{ type: 'text' as const, value: display }],
            };
          }

          const entry = slugMap.get(key);
          if (!entry) {
            throw new Error(`Unresolved wikilink [[${key}]] in ${sourcePath}`);
          }

          const display = alias ? alias.trim() : entry.title;
          const slug = entry.href.replace('/lessons/', '');
          const href = section
            ? `${entry.href}#${section.trim().toLowerCase().replace(/[^\w]+/g, '-')}`
            : entry.href;

          return {
            type: 'link' as const,
            url: href,
            title: null,
            data: {
              hProperties: {
                class: 'wikilink',
                'data-wikilink-slug': slug,
                'data-wikilink-display': display,
              },
            },
            children: [{ type: 'text' as const, value: display }],
          };
        },
      ],
    ]);
  };
}
