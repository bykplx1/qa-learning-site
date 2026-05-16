import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { lessonFrontmatterSchema } from './lib/lessons/schema';
import { projectFrontmatterSchema } from './lib/projects/schema';
import { curriculumFrontmatterSchema } from './lib/curriculum/schema';

const lessons = defineCollection({
  loader: glob({
    // Load all .md files under numbered category folders; excludes INDEX/PLAN at root.
    pattern: '[0-9][0-9]-*/**/*.md',
    base: './content/qa-vault',
  }),
  schema: lessonFrontmatterSchema,
});

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

export const collections = { lessons, projects, curriculum };
