export type SlugEntry = { title: string; href: string; excerpt: string };

// Matches [[X]], [[X#section]], [[X|alias]], [[X#section|alias]], [[#section]], and escaped \[[X]]
// Target group is now optional to support anchor-only [[#section]] links.
const WIKILINK_RE = /(\\?)\[\[([^\]#|\n]*?)(?:#([^\]|\n]*?))?(?:\|([^\]\n]*?))?\]\]/g;
// Splits markdown into code/non-code segments (fenced + inline)
const CODE_SPLIT_RE = /(```[\s\S]*?```|`[^`\n]+`)/g;

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function slugifySection(section: string): string {
  return section.trim().toLowerCase().replace(/[^\w]+/g, '-');
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

      // Anchor-only link: [[#Section]] — no cross-page target
      if (!key && section) {
        const display = alias ? alias.trim() : section.trim();
        const href = `#${slugifySection(section)}`;
        return `<a class="wikilink" href="${esc(href)}">${esc(display)}</a>`;
      }

      const entry = slugMap.get(key);
      if (!entry) throw new Error(`Unresolved wikilink [[${key}]] in ${sourcePath}`);

      const display = alias ? alias.trim() : entry.title;
      const slug = entry.href.replace('/lessons/', '');
      const href = section
        ? `${entry.href}#${slugifySection(section)}`
        : entry.href;

      return `<a class="wikilink" href="${esc(href)}" data-wikilink-slug="${esc(slug)}" data-wikilink-display="${esc(display)}">${esc(display)}</a>`;
    });
  }).join('');
}

/**
 * Strips wikilink syntax from a plain-text string, returning the display text.
 * Used for contexts where HTML cannot be rendered (e.g. exam explanation plain text).
 *
 * [[Target]] → title from slugMap or Target
 * [[Target|alias]] → alias
 * [[#Section]] → Section
 * [[Target#Section|alias]] → alias
 */
export function stripWikilinks(
  text: string,
  slugMap?: Map<string, SlugEntry>
): string {
  const re = /(\\?)\[\[([^\]#|\n]*?)(?:#([^\]|\n]*?))?(?:\|([^\]\n]*?))?\]\]/g;
  return text.replace(re, (_fullMatch, escape, target, section, alias) => {
    if (escape) return `[[${target}${section ? '#' + section : ''}${alias ? '|' + alias : ''}]]`;
    if (alias) return alias.trim();
    const key = target.trim();
    if (!key && section) return section.trim();
    if (slugMap) {
      const entry = slugMap.get(key);
      if (entry) return entry.title;
    }
    return key || (section ? section.trim() : '');
  });
}
