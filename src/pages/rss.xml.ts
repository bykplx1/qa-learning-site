import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { join } from 'node:path';
import { buildRssXml, type RssItem } from '../lib/rss/buildRss';
import { gitFirstCommittedAt } from '../lib/rss/publishedAt';

const VAULT_CWD = join(process.cwd(), 'content', 'qa-vault');
const FEED_LIMIT = 50;

export const GET: APIRoute = async ({ site }) => {
  const lessons = await getCollection('lessons');
  const fallback = new Date();

  const items: RssItem[] = lessons.map((lesson) => {
    let publishedAt = lesson.data.published_at;
    if (!publishedAt) {
      const filePath = lesson.filePath;
      if (filePath) {
        const relPath = filePath.replace(/\\/g, '/').replace(/^.*content\/qa-vault\//, '');
        const gitDate = gitFirstCommittedAt(relPath, VAULT_CWD);
        publishedAt = gitDate ?? fallback;
      } else {
        publishedAt = fallback;
      }
    }
    return {
      title: lesson.data.title,
      slug: lesson.data.slug,
      publishedAt,
      description: lesson.data.category,
    };
  });

  items.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  const top = items.slice(0, FEED_LIMIT);

  const siteUrl = site?.toString() ?? 'https://qa-learning-site.vercel.app/';
  const xml = buildRssXml(top, {
    siteUrl,
    feedTitle: 'QA Learning — Lessons',
    feedDescription: 'New and updated lessons from the QA Learning site.',
    feedPath: '/rss.xml',
  });

  return new Response(xml, {
    status: 200,
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
};
