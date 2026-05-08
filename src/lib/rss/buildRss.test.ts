import { describe, expect, it } from 'vitest';
import sax from 'sax';
import { buildRssXml, escapeXml, type RssItem } from './buildRss';

const baseOpts = {
  siteUrl: 'https://example.com/',
  feedTitle: 'Test Feed',
  feedDescription: 'Test description',
  feedPath: '/rss.xml',
  lastBuildDate: new Date('2026-05-01T00:00:00Z'),
};

function makeItem(over: Partial<RssItem>): RssItem {
  return {
    title: 'Sample',
    slug: 'sample',
    publishedAt: new Date('2026-01-01T00:00:00Z'),
    description: 'desc',
    ...over,
  };
}

interface ParsedFeed {
  channel: {
    title?: string;
    link?: string;
    description?: string;
    items: Array<{ title?: string; link?: string; guid?: string; pubDate?: string }>;
  };
  rssVersion?: string;
  errors: Error[];
}

function parseFeed(xml: string): ParsedFeed {
  const parser = sax.parser(true, { trim: false });
  const result: ParsedFeed = { channel: { items: [] }, errors: [] };
  const stack: string[] = [];
  let currentItem: ParsedFeed['channel']['items'][number] | null = null;
  let textBuf = '';

  parser.onerror = (err) => {
    result.errors.push(err);
    (parser as unknown as { error: Error | null }).error = null;
  };
  parser.onopentag = (node) => {
    stack.push(node.name);
    textBuf = '';
    if (node.name === 'rss') {
      result.rssVersion = String(node.attributes.version ?? '');
    } else if (node.name === 'item') {
      currentItem = {};
      result.channel.items.push(currentItem);
    } else if (node.name === 'guid' && currentItem) {
      // attribute test: isPermaLink should be present
    }
  };
  parser.ontext = (t) => {
    textBuf += t;
  };
  parser.oncdata = (t) => {
    textBuf += t;
  };
  parser.onclosetag = (name) => {
    const text = textBuf;
    textBuf = '';
    stack.pop();
    if (currentItem) {
      if (name === 'title') currentItem.title = text;
      else if (name === 'link') currentItem.link = text;
      else if (name === 'guid') currentItem.guid = text;
      else if (name === 'pubDate') currentItem.pubDate = text;
      else if (name === 'item') currentItem = null;
      return;
    }
    if (stack[stack.length - 1] === 'channel') {
      if (name === 'title') result.channel.title = text;
      else if (name === 'link') result.channel.link = text;
      else if (name === 'description') result.channel.description = text;
    }
  };
  parser.write(xml).close();
  return result;
}

describe('buildRssXml', () => {
  it('produces well-formed RSS 2.0 with required channel fields', () => {
    const xml = buildRssXml([makeItem({})], baseOpts);
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    const parsed = parseFeed(xml);
    expect(parsed.errors).toEqual([]);
    expect(parsed.rssVersion).toBe('2.0');
    expect(parsed.channel.title).toBe('Test Feed');
    expect(parsed.channel.link).toBe('https://example.com');
    expect(parsed.channel.description).toBe('Test description');
    expect(parsed.channel.items).toHaveLength(1);
    const item = parsed.channel.items[0];
    expect(item.title).toBe('Sample');
    expect(item.link).toBe('https://example.com/lessons/sample/');
    expect(item.guid).toBe('https://example.com/lessons/sample/');
    expect(item.pubDate).toBe('Thu, 01 Jan 2026 00:00:00 GMT');
  });

  it('orders items by publishedAt desc', () => {
    const items: RssItem[] = [
      makeItem({ slug: 'a', title: 'Old', publishedAt: new Date('2026-01-01T00:00:00Z') }),
      makeItem({ slug: 'b', title: 'New', publishedAt: new Date('2026-04-01T00:00:00Z') }),
      makeItem({ slug: 'c', title: 'Mid', publishedAt: new Date('2026-02-15T00:00:00Z') }),
    ];
    items.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
    const xml = buildRssXml(items, baseOpts);
    const parsed = parseFeed(xml);
    expect(parsed.errors).toEqual([]);
    expect(parsed.channel.items.map((i) => i.title)).toEqual(['New', 'Mid', 'Old']);
  });

  it('entity-encodes &, <, > in titles and descriptions', () => {
    const xml = buildRssXml(
      [makeItem({ title: 'A & B <c> "d"', description: 'x < y & z' })],
      baseOpts,
    );
    expect(xml).toContain('A &amp; B &lt;c&gt; &quot;d&quot;');
    expect(xml).toContain('x &lt; y &amp; z');
    expect(xml).not.toMatch(/<title>[^<]*<c>/);
    const parsed = parseFeed(xml);
    expect(parsed.errors).toEqual([]);
    expect(parsed.channel.items[0].title).toBe('A & B <c> "d"');
  });

  it('preserves emoji in titles', () => {
    const xml = buildRssXml([makeItem({ title: 'Fire 🔥 lesson 🚀' })], baseOpts);
    expect(xml).toContain('Fire 🔥 lesson 🚀');
    const parsed = parseFeed(xml);
    expect(parsed.errors).toEqual([]);
    expect(parsed.channel.items[0].title).toBe('Fire 🔥 lesson 🚀');
  });

  it('escapes apostrophe and ampersand in slugs via URL-encode + xml-escape', () => {
    const xml = buildRssXml(
      [makeItem({ slug: "with'apos&amp", title: 'Edge' })],
      baseOpts,
    );
    const parsed = parseFeed(xml);
    expect(parsed.errors).toEqual([]);
    expect(parsed.channel.items[0].link).toBe(
      "https://example.com/lessons/with'apos%26amp/",
    );
  });
});

describe('escapeXml', () => {
  it('escapes the five XML metacharacters', () => {
    expect(escapeXml(`& < > " '`)).toBe('&amp; &lt; &gt; &quot; &apos;');
  });

  it('leaves non-metacharacters alone', () => {
    expect(escapeXml('hello world 🚀')).toBe('hello world 🚀');
  });
});
