import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import type { AstroIntegration } from 'astro';
import { readLessonsMetaFromVault, seedLessonsMeta } from '../lib/lessons/seedMeta.js';

export function seedLessonsMetaIntegration(): AstroIntegration {
  let vaultPath = '';
  return {
    name: 'qa-seed-lessons-meta',
    hooks: {
      'astro:config:setup': ({ config }) => {
        vaultPath = fileURLToPath(new URL('content/qa-vault/', config.root));
      },
      'astro:build:start': async ({ logger }) => {
        const url = process.env.DATABASE_URL;
        if (!url) {
          logger.warn('DATABASE_URL not set; skipping lessons_meta seed');
          return;
        }
        const rows = readLessonsMetaFromVault(vaultPath);
        const client = postgres(url, { max: 1, prepare: false });
        try {
          const db = drizzle(client);
          const { inserted } = await seedLessonsMeta(db, rows);
          logger.info(`lessons_meta seeded: ${inserted} rows`);
        } finally {
          await client.end();
        }
      },
    },
  };
}
