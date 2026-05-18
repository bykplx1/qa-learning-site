/**
 * Rubric registry — placeholder for #151.
 *
 * #151 will populate this record with real rubric definitions (per-row criteria,
 * weights, scoring bands). This file exists so the content-schema validation seam
 * is in place: `projectFrontmatterSchema` rejects any `rubric` id not present here.
 *
 * To add a rubric: export an entry under its id key with at minimum a `label` string.
 * The grading shape will be specified in #151.
 */

export interface RubricDefinition {
  label: string;
}

export const rubrics: Record<string, RubricDefinition> = {
  // Sentinel id — proves the validation wire works end-to-end before #151 lands.
  placeholder: { label: 'Placeholder rubric (replaced by #151)' },
};

export type RubricId = keyof typeof rubrics;
