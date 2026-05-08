import { z } from 'zod';

export const lessonFrontmatterSchema = z
  .object({
    slug: z.string().min(1),
    title: z.string().min(1),
    category: z.string().min(1),
    est_minutes: z.number().int().positive(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    tags: z.array(z.string().min(1)).min(1),
    published_at: z.coerce.date().optional(),
  })
  .strict();

export type LessonFrontmatter = z.infer<typeof lessonFrontmatterSchema>;
