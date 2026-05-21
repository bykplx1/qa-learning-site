import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { projectFrontmatterSchema } from './lib/projects/schema';
import { curriculumFrontmatterSchema } from './lib/curriculum/schema';

const projects = defineCollection({
  loader: glob({
    pattern: '**/*.mdx',
    base: './src/content/projects',
  }),
  schema: projectFrontmatterSchema,
});

const curriculum = defineCollection({
  loader: glob({
    pattern: '**/*.mdx',
    base: './content/curriculum',
  }),
  schema: curriculumFrontmatterSchema,
});

export const collections = { projects, curriculum };
