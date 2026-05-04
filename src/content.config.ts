import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { lessonFrontmatterSchema } from './lib/lessons/schema';

const lessons = defineCollection({
  loader: glob({
    pattern: '01-Fundamentals/Testing-Principles.md',
    base: './content/qa-vault',
  }),
  schema: lessonFrontmatterSchema,
});

export const collections = { lessons };
