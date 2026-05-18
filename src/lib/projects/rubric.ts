/**
 * Rubric registry — populated by #151.
 *
 * Each rubric has 3–6 rows. Each row has a criterion description and a scoring
 * band (array of descriptors ordered from weakest to strongest, index = score).
 * The scoring band is intentionally open-ended so #153 can map its scoring
 * logic against `band.length - 1` as the max score.
 *
 * `rubricScores` shape that #153 must write to `projectSubmissions.rubricScores`:
 *   Record<string, number>  — key = row id, value = 0-based band index chosen.
 * Example: { "root_cause": 2, "fix_proposal": 1, "verification": 2, "write_up": 3 }
 */

export interface RubricRow {
  id: string;
  criterion: string;
  band: [string, string, string, ...string[]]; // min 3 descriptors (0 = lowest)
}

export interface RubricDefinition {
  id: string;
  label: string;
  rows: RubricRow[];
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const rubrics = {
  /** Cluster-1 (Functional Execution) — Flaky Test Hunter rubric */
  'flaky-test-hunter': {
    id: 'flaky-test-hunter',
    label: 'Flaky Test Hunter',
    rows: [
      {
        id: 'root_cause',
        criterion: 'Root-cause identification',
        band: [
          'No credible hypothesis — describes symptom only.',
          'Vague hypothesis; names a category (e.g. "timing") without evidence.',
          'Plausible hypothesis with supporting evidence from the test or CI log.',
          'Precise hypothesis with a reproducible minimal scenario described.',
        ],
      },
      {
        id: 'fix_proposal',
        criterion: 'Fix proposal',
        band: [
          'No fix proposed, or proposal is unrelated to the hypothesis.',
          'Fix addresses the symptom (e.g. add retry) rather than the root cause.',
          'Fix targets the root cause with a concrete code or config change described.',
          'Fix targets root cause and accounts for edge cases or concurrent scenarios.',
        ],
      },
      {
        id: 'verification',
        criterion: 'Verification plan',
        band: [
          'No verification plan.',
          'Plan is "run the tests again" with no criteria for success.',
          'Plan specifies what a passing run looks like and which signals confirm the fix.',
          'Plan includes deterministic reproduction steps plus a stability bar (e.g. 50 green runs).',
        ],
      },
      {
        id: 'write_up',
        criterion: 'Write-up clarity',
        band: [
          'Unreadable or missing artifact.',
          'Readable but missing key context — another engineer could not act on it.',
          'Clear enough that another engineer could reproduce the investigation.',
          'Concise, well-structured postmortem another engineer could ship as an incident report.',
        ],
      },
    ],
  },

  /** Test Design — API Contract Suite rubric */
  'api-contract-suite': {
    id: 'api-contract-suite',
    label: 'API Contract Test Suite',
    rows: [
      {
        id: 'schema_coverage',
        criterion: 'Schema coverage',
        band: [
          'No schema assertions — tests only check status codes.',
          'Partial schema (fields spot-checked, not exhaustive).',
          'Full response schema validated; required vs optional fields distinguished.',
          'Full schema plus discriminated unions / variant shapes documented and tested.',
        ],
      },
      {
        id: 'negative_cases',
        criterion: 'Negative-case coverage',
        band: [
          'No negative tests.',
          'One negative test (e.g. 404 only) without schema assertion.',
          'At least one negative test per endpoint with status + error-body schema.',
          'Happy + sad paths per endpoint including auth failure, malformed input, and boundary values.',
        ],
      },
      {
        id: 'runability',
        criterion: 'Single-command runability',
        band: [
          'Cannot be run — missing deps, config, or entry point.',
          'Runs with manual steps; README has gaps.',
          'Runs with one command; README accurate.',
          'Runs with one command, emits JUnit XML or equivalent, and is CI-ready.',
        ],
      },
      {
        id: 'breaking_change',
        criterion: 'Breaking-change writeup',
        band: [
          'No breaking-change analysis.',
          'Mentions that a rename would break tests without identifying which assertion.',
          'Identifies the exact assertion that fires for a specific field rename.',
          'Identifies the assertion and explains why contract tests catch it earlier than ad-hoc smoke tests.',
        ],
      },
    ],
  },

  /** Placeholder sentinel — kept for validation smoke tests in schema.test.ts */
  placeholder: {
    id: 'placeholder',
    label: 'Placeholder rubric (sentinel — do not use in production projects)',
    rows: [
      {
        id: 'placeholder_row',
        criterion: 'Placeholder criterion',
        band: ['Not met', 'Partially met', 'Met'],
      },
    ],
  },
} as const satisfies Record<string, RubricDefinition>;

export type RubricId = keyof typeof rubrics;

/** Typed shape for projectSubmissions.rubricScores written by #153.
 *  Key = row id from the matching RubricDefinition.rows[n].id
 *  Value = 0-based band index (0 = lowest descriptor, band.length-1 = highest).
 */
export type RubricScores = Record<string, number>;
