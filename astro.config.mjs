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
import { ogImagesIntegration } from './src/integrations/ogImages.ts';
import { sitemapAliasIntegration } from './src/integrations/sitemapAlias.ts';
import { REMARK_PLUGINS, REHYPE_PLUGINS } from './src/lib/mdx-pipeline/index.ts';

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
      res.end('export const __devStub=true;\nexport async function search(){return{results:[]}}\nexport async function init(){}');
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
    ssr: {
      optimizeDeps: {
        include: ['react', 'react-dom'],
      },
    },
    build: {
      rollupOptions: {
        external: ['/pagefind/pagefind.js'],
      },
    },
  },

  integrations: [
    // MDX pipeline: all curriculum transforms in dependency order.
    // buildRemarkPlugins / REHYPE_PLUGINS are the single source of truth for plugin
    // ordering. extendMarkdownConfig:false isolates MDX from the base markdown config.
    mdx({
      extendMarkdownConfig: false,
      // Exclude mermaid from Shiki syntax highlighting so that ```mermaid
      // code fences reach rehypeMermaid as raw <code class="language-mermaid">
      // nodes, which the plugin converts to inline SVG at build time.
      syntaxHighlight: { type: 'shiki', excludeLangs: ['math', 'mermaid'] },
      remarkPlugins: [...REMARK_PLUGINS],
      rehypePlugins: [...REHYPE_PLUGINS],
    }),
    react(),
    sitemap({
      filter: (page) => {
        const url = new URL(page);
        const p = url.pathname;
        if (p.startsWith('/api/')) return false;
        if (p.startsWith('/dev/')) return false;
        if (p.startsWith('/fixtures/')) return false;
        if (p === '/profile' || p === '/profile/') return false;
        if (p.startsWith('/me/')) return false;
        if (p === '/review' || p === '/review/') return false;
        if (p.startsWith('/explain')) return false;
        return true;
      },
      customPages: [
        'https://qa-learning-site.vercel.app/projects/api-contract-suite/',
        'https://qa-learning-site.vercel.app/projects/e2e-capstone-saucedemo/',
        'https://qa-learning-site.vercel.app/projects/e2e-mid-restful-booker/',
        'https://qa-learning-site.vercel.app/projects/e2e-starter-the-internet/',
        'https://qa-learning-site.vercel.app/projects/flaky-test-hunter/',
        'https://qa-learning-site.vercel.app/projects/full-stack-qa-pipeline/',
        'https://qa-learning-site.vercel.app/projects/qa-foundations-field-report/',
      ],
    }),
    sitemapAliasIntegration(),
    wikilinksIntegration(),
    ogImagesIntegration(),
    pagefindIntegration,
  ],
});
