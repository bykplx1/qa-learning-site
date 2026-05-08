export interface RssItem {
  title: string;
  slug: string;
  publishedAt: Date;
  description?: string;
}

export interface RssOptions {
  siteUrl: string;
  feedTitle: string;
  feedDescription: string;
  feedPath?: string;
  lastBuildDate?: Date;
}

const XML_ESCAPE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

export function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => XML_ESCAPE[c]);
}

function trimSlash(s: string): string {
  return s.replace(/\/+$/, '');
}

function lessonUrl(siteUrl: string, slug: string): string {
  return `${trimSlash(siteUrl)}/lessons/${encodeURIComponent(slug)}/`;
}

export function buildRssXml(items: RssItem[], opts: RssOptions): string {
  const site = trimSlash(opts.siteUrl);
  const selfUrl = `${site}${opts.feedPath ?? '/rss.xml'}`;
  const lastBuild = (opts.lastBuildDate ?? new Date()).toUTCString();

  const itemXml = items
    .map((item) => {
      const link = lessonUrl(site, item.slug);
      const pubDate = item.publishedAt.toUTCString();
      const desc = item.description
        ? `\n      <description>${escapeXml(item.description)}</description>`
        : '';
      return `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${pubDate}</pubDate>${desc}
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(opts.feedTitle)}</title>
    <link>${escapeXml(site)}</link>
    <description>${escapeXml(opts.feedDescription)}</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${escapeXml(selfUrl)}" rel="self" type="application/rss+xml" />
${itemXml}
  </channel>
</rss>
`;
}
