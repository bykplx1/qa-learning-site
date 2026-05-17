import { z } from 'zod';

export const PROJECT_TIERS = ['starter', 'mid', 'capstone'] as const;
export type ProjectTier = (typeof PROJECT_TIERS)[number];

export const projectFrontmatterSchema = z
  .object({
    slug: z.string().min(1),
    title: z.string().min(1),
    tier: z.enum(PROJECT_TIERS),
    estimate: z.string().min(1),
    acceptanceCriteria: z.array(z.string().min(1)).min(1),
    cluster: z.string().optional(),
  })
  .strict();

export type ProjectFrontmatter = z.infer<typeof projectFrontmatterSchema>;

export const CLUSTER_LABELS: Record<string, string> = {
  foundations: 'Foundations',
  'test-design': 'Test Design',
  'functional-execution': 'Functional Execution',
  'automation-cicd': 'Automation & CI/CD',
  'non-functional': 'Non-Functional',
  'ai-llm-qa': 'AI / LLM QA',
};

export const TIER_LABELS: Record<ProjectTier, string> = {
  starter: 'Starter',
  mid: 'Mid',
  capstone: 'Capstone',
};

export const TIER_ORDER: Record<ProjectTier, number> = {
  starter: 0,
  mid: 1,
  capstone: 2,
};
