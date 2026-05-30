import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { buildRssXml, type RssItem } from '../lib/rss/buildRss';
import { gitFirstCommittedAt } from '../lib/rss/publishedAt';
import { clusterDisplay } from '../lib/curriculum/order';

const REPO_CWD = process.cwd();
const FEED_LIMIT = 50;

export const GET: APIRoute = async ({ site }) => {
  const topics = await getCollection('curriculum');
  const fallback = new Date();

  const items: RssItem[] = topics.map((topic) => {
    let publishedAt: Date;
    const filePath = topic.filePath;
    if (filePath) {
      // curriculum files live at content/curriculum/<cluster>/<slug>.mdx relative to repo root
      const relPath = filePath.replace(/\\/g, '/').replace(/^.*content\/curriculum\//, 'content/curriculum/');
      const gitDate = gitFirstCommittedAt(relPath, REPO_CWD);
      publishedAt = gitDate ?? fallback;
    } else {
      publishedAt = fallback;
    }
    return {
      title: topic.data.title,
      slug: `${topic.data.cluster}/${topic.data.slug}`,
      publishedAt,
      description: clusterDisplay(topic.data.cluster),
    };
  });

  items.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  const top = items.slice(0, FEED_LIMIT);

  const siteUrl = site?.toString() ?? 'https://qa-learning-site.vercel.app/';
  const xml = buildRssXml(top, {
    siteUrl,
    feedTitle: 'QA Learning — Lessons',
    feedDescription: 'New and updated topics from the QA Learning site.',
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
