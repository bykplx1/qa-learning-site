// @ts-check
import 'dotenv/config';
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import { wikilinksIntegration } from './src/integrations/wikilinks.ts';
import { quizExtractorIntegration } from './src/integrations/quizExtractor.ts';
import { seedLessonsMetaIntegration } from './src/integrations/seedLessonsMeta.ts';
import { ogImagesIntegration } from './src/integrations/ogImages.ts';
import { sitemapAliasIntegration } from './src/integrations/sitemapAlias.ts';
import { remarkDemoteH1 } from './src/lib/lessons/remarkDemoteH1.ts';

/** @type {import('astro').AstroIntegration} */
const demoteH1Integration = {
  name: 'demote-h1',
  hooks: {
    'astro:config:setup': ({ updateConfig }) => {
      updateConfig({ markdown: { remarkPlugins: [remarkDemoteH1] } });
    },
  },
};

/** @type {import('astro').AstroIntegration} */
const pagefindIntegration = {
  name: 'pagefind',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      const siteDir = fileURLToPath(dir);
      console.log('[pagefind] Indexing', siteDir);
      execFileSync(process.execPath, ['node_modules/pagefind/lib/runner/bin.cjs', '--site', siteDir], {
        stdio: 'inherit',
        cwd: process.cwd(),
      });
    },
  },
};

/** @type {import('vite').Plugin} */
const pagefindDevStub = {
  name: 'pagefind-dev-stub',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use('/pagefind/pagefind.js', (_req, res) => {
      res.setHeader('Content-Type', 'application/javascript');
      res.end('export async function search(){return{results:[]}}\nexport async function init(){}');
    });
  },
};

// https://astro.build/config
export default defineConfig({
  output: 'static',
  adapter: vercel(),
  site: 'https://qa-learning-site.vercel.app',
  // Astro 6 dev toolbar injects extra <h1> elements into light DOM
  // (Audit / Settings / Inspect panels), which collide with strict-mode
  // locator('h1') in Playwright tests against the dev server.
  devToolbar: { enabled: false },
  vite: {
    plugins: [tailwindcss(), pagefindDevStub],
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    build: {
      rollupOptions: {
        external: ['/pagefind/pagefind.js'],
      },
    },
  },

  integrations: [mdx({ extendMarkdownConfig: false }), react(), sitemap(), sitemapAliasIntegration(), quizExtractorIntegration(), wikilinksIntegration(), seedLessonsMetaIntegration(), ogImagesIntegration(), pagefindIntegration, demoteH1Integration]
});