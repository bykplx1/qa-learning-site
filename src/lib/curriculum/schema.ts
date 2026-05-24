import { z } from 'zod';

export const CURRICULUM_CLUSTERS = [
  'foundations',
  'test-design',
  'functional-execution',
  'automation-cicd',
  'non-functional',
  'ai-llm-qa',
] as const;
export type CurriculumCluster = (typeof CURRICULUM_CLUSTERS)[number];

export const CURRICULUM_LAYERS = ['facts', 'patterns', 'systems'] as const;
export type CurriculumLayer = (typeof CURRICULUM_LAYERS)[number];

const verifiedBlockSchema = z.object({
  tool: z.string().min(1),
  versions: z.record(z.string(), z.string()),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be ISO format YYYY-MM-DD'),
});

export type VerifiedBlock = z.infer<typeof verifiedBlockSchema>;

const baseFrontmatterSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  cluster: z.enum(CURRICULUM_CLUSTERS),
  layer: z.enum(CURRICULUM_LAYERS),
  prerequisites: z.array(z.string().min(1)).default([]),
  related: z.array(z.string().min(1)).default([]),
  tags: z.array(z.string().min(1)).min(1),
  estimatedEncodingMinutes: z.number().int().positive(),
  kind: z.literal('tool').optional(),
  verified: verifiedBlockSchema.optional(),
});

export const curriculumFrontmatterSchema = baseFrontmatterSchema
  .superRefine((data, ctx) => {
    if (data.kind === 'tool' && !data.verified) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'verified block is required when kind is "tool"',
        path: ['verified'],
      });
    }
  });

export type CurriculumFrontmatter = z.infer<typeof curriculumFrontmatterSchema>;
