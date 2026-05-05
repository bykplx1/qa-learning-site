export type SlugEntry = { title: string; href: string; excerpt: string };

// Matches [[X]], [[X#section]], [[X|alias]], [[X#section|alias]], and escaped \[[X]]
const WIKILINK_RE = /(\\?)\[\[([^\]#|\n]+?)(?:#([^\]|\n]*?))?(?:\|([^\]\n]*?))?\]\]/g;
// Splits markdown into code/non-code segments (fenced + inline)
const CODE_SPLIT_RE = /(```[\s\S]*?```|`[^`\n]+`)/g;

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function resolveWikilinks(
  markdown: string,
  slugMap: Map<string, SlugEntry>,
  sourcePath: string
): string {
  return markdown.split(CODE_SPLIT_RE).map((seg, i) => {
    if (i % 2 === 1) return seg; // code segment — skip

    WIKILINK_RE.lastIndex = 0;
    return seg.replace(WIKILINK_RE, (fullMatch, escape, target, section, alias) => {
      if (escape) return fullMatch.slice(1); // strip \ → leave [[...]] as literal

      const key = target.trim();
      const entry = slugMap.get(key);
      if (!entry) throw new Error(`Unresolved wikilink [[${key}]] in ${sourcePath}`);

      const display = alias ? alias.trim() : entry.title;
      const slug = entry.href.replace('/lessons/', '');
      const href = section
        ? `${entry.href}#${section.trim().toLowerCase().replace(/[^\w]+/g, '-')}`
        : entry.href;

      return `<a class="wikilink" href="${esc(href)}" data-wikilink-slug="${esc(slug)}" data-wikilink-display="${esc(display)}">${esc(display)}</a>`;
    });
  }).join('');
}
