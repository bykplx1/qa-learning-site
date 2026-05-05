import { findAndReplace } from 'mdast-util-find-and-replace';
import type { Root } from 'mdast';
import type { SlugEntry } from './resolver.js';

export function remarkWikilinks(slugMap: Map<string, SlugEntry>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (tree: Root, file?: any) => {
    const sourcePath: string = file?.history?.[0] ?? file?.path ?? '<unknown>';

    // Fresh regex per file to avoid shared lastIndex state
    const re = /(\\?)\[\[([^\]#|\n]+?)(?:#([^\]|\n]*?))?(?:\|([^\]\n]*?))?\]\]/g;

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
