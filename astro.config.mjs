// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import { wikilinksIntegration } from './src/integrations/wikilinks.ts';
import { quizExtractorIntegration } from './src/integrations/quizExtractor.ts';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [mdx(), react(), quizExtractorIntegration(), wikilinksIntegration()]
});