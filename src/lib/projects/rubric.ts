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

  /** Cluster-1 (Foundations) — QA Foundations Field Report rubric */
  'foundations-field-report': {
    id: 'foundations-field-report',
    label: 'QA Foundations Field Report',
    rows: [
      {
        id: 'oracles',
        criterion: 'Oracle clarity',
        band: [
          'No oracles named — observations stated without reference to expected behavior.',
          'One implicit oracle (e.g. "it should work") without naming the heuristic used.',
          'At least two distinct oracles named (e.g. consistency-with-claims, consistency-with-comparable-product) and applied to specific observations.',
          'Multiple oracles named, applied per observation, and contrasted — calls out where two oracles disagreed and how the conflict was resolved.',
        ],
      },
      {
        id: 'quality_dimensions',
        criterion: 'Quality dimensions covered',
        band: [
          'Functional defects only (does the feature work yes/no).',
          'Functional plus one experiential note tacked on at the end.',
          'Functional and experiential quality both audited with distinct findings under each.',
          'Functional, experiential, and at least one non-functional concern (perf, accessibility, security smell) — each labeled and tied to a specific user impact.',
        ],
      },
      {
        id: 'risk_prioritization',
        criterion: 'Risk-driven prioritization',
        band: [
          'Findings listed without ranking.',
          'Findings ranked by severity with no rationale.',
          'Findings ranked by likelihood × impact with a one-line rationale per rank.',
          'Findings ranked with explicit likelihood × impact, called out which test would have caught each, and which findings the author deprioritized and why.',
        ],
      },
      {
        id: 'actionability',
        criterion: 'Write-up actionability',
        band: [
          'Unreadable, or stream-of-consciousness with no structure.',
          'Readable but a PM could not act on it — no repro steps or expected vs actual.',
          'Structured: each finding has repro steps, expected behavior, actual behavior, and proposed next step.',
          'PM-ready: structured findings plus a one-paragraph executive summary that a non-engineer can act on without reading the body.',
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // e2e track rubrics (starter / mid / capstone)
  // ---------------------------------------------------------------------------

  /** e2e track — Starter: first Playwright suite against the-internet */
  'e2e-starter': {
    id: 'e2e-starter',
    label: 'E2E Starter: First Playwright Suite',
    rows: [
      {
        id: 'selectors',
        criterion: 'Selector quality',
        band: [
          'XPath or positional CSS only — brittle and unreadable.',
          'Attribute-based CSS selectors but no accessible-role queries.',
          'Mix of `getByRole` / `getByLabel` and scoped CSS; no positional selectors.',
          'Exclusively accessibility-first locators (`getByRole`, `getByLabel`, `getByTestId`); a comment explains any exception.',
        ],
      },
      {
        id: 'assertions',
        criterion: 'Assertion depth',
        band: [
          'Only `page.goto` + no assertions — suite "passes" vacuously.',
          'Status-only assertions (page title or URL); no behavior checked.',
          'At least one assertion per test verifying visible state (text, attribute, visibility).',
          'Each test asserts the meaningful outcome of the interaction, not just a side-effect.',
        ],
      },
      {
        id: 'runability',
        criterion: 'Single-command runability',
        band: [
          'Cannot run — missing install step or entry-point.',
          'Runs after undocumented manual setup.',
          'Runs with `npx playwright test`; README lists prerequisites.',
          'Runs with one command from a clean clone; README includes expected output.',
        ],
      },
      {
        id: 'structure',
        criterion: 'Suite structure',
        band: [
          'All tests in one file with duplicated setup.',
          'Tests separated by file but no shared fixtures.',
          'Shared fixtures or page-object module extracted; no copy-paste setup.',
          'Shared fixtures + at least one page-object; test files read as specifications, not scripts.',
        ],
      },
    ],
  },

  /** e2e track — Mid: page-object suite against restful-booker (UI layer) */
  'e2e-mid': {
    id: 'e2e-mid',
    label: 'E2E Mid: Page-Object Suite with CI',
    rows: [
      {
        id: 'page_objects',
        criterion: 'Page-object completeness',
        band: [
          'No page objects — raw `page.*` calls in every test.',
          'One page object but tests still call `page.*` directly for some interactions.',
          'Each distinct page/component has its own object; tests never call `page.*` directly.',
          'Page objects encapsulate both navigation and assertions; swapping a selector requires touching only the object.',
        ],
      },
      {
        id: 'coverage',
        criterion: 'Scenario coverage',
        band: [
          'Single happy-path test.',
          'Happy path plus one negative (e.g. invalid login).',
          'Happy path + at least two negatives covering different failure modes.',
          'Happy path + negatives + at least one edge case (empty state, boundary value, or concurrent action).',
        ],
      },
      {
        id: 'ci_integration',
        criterion: 'CI integration',
        band: [
          'No CI configuration.',
          'CI runs tests but fails non-deterministically or always green regardless of test outcome.',
          'CI runs `npx playwright test` and fails the job on test failure.',
          'CI runs tests + uploads the Playwright HTML report as an artifact; job badge visible in README.',
        ],
      },
      {
        id: 'repo_url',
        criterion: 'Public repo as artifact',
        band: [
          'No public repo submitted.',
          'Repo exists but README is missing or empty.',
          'Repo with README explaining how to run locally and what the tests cover.',
          'Repo with README + green CI badge + commit history showing iterative development.',
        ],
      },
    ],
  },

  /** e2e track — Capstone: resilient cross-browser suite with visual + a11y */
  'e2e-capstone': {
    id: 'e2e-capstone',
    label: 'E2E Capstone: Resilient Cross-Browser Suite',
    rows: [
      {
        id: 'cross_browser',
        criterion: 'Cross-browser coverage',
        band: [
          'Chromium only.',
          'Chromium + one other engine; tests pass on all.',
          'Chromium + Firefox + WebKit; CI runs all three in parallel.',
          'Three engines with explicit rationale for any test skipped on a specific engine.',
        ],
      },
      {
        id: 'resilience',
        criterion: 'Flake resilience',
        band: [
          'No retry config; suite is visibly flaky.',
          'Global retry set but root cause of flakiness not addressed.',
          'Root cause of at least one flake identified and fixed; retry kept as safety net only.',
          'Flake-prevention strategy documented (network interception, explicit waits, stable selectors); retry at most 1.',
        ],
      },
      {
        id: 'a11y_or_visual',
        criterion: 'A11y or visual regression layer',
        band: [
          'Neither a11y nor visual tests present.',
          'One a11y assertion (`checkA11y`) or one snapshot present but not both.',
          'Both an axe a11y scan and at least one visual snapshot included.',
          'A11y scan + visual snapshots + documented rationale for which pages are covered and why.',
        ],
      },
      {
        id: 'ci_green',
        criterion: 'Green CI on submitted repo',
        band: [
          'No CI or CI is red.',
          'CI exists but green status not verifiable (private repo or broken badge).',
          'Public repo with green CI badge confirmed at submission time.',
          'Public repo + green CI badge + pipeline runs all three browsers + uploads report artifact.',
        ],
      },
      {
        id: 'postmortem',
        criterion: 'Engineering writeup',
        band: [
          'No writeup.',
          'README describes how to run tests but not design decisions.',
          'README covers setup + one design decision (e.g. why page objects, why this coverage boundary).',
          'README covers setup + design decisions + at least one bug the suite caught or would catch, and which layer would catch it first.',
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // cicd track rubrics (starter / mid / capstone) — added for #338
  // ---------------------------------------------------------------------------

  /** cicd track — Starter: first GitHub Actions pipeline */
  'cicd-starter': {
    id: 'cicd-starter',
    label: 'CI/CD Starter: First GitHub Actions Pipeline',
    rows: [
      {
        id: 'trigger_config',
        criterion: 'Workflow trigger configuration',
        band: [
          'Workflow triggers on no events or uses `workflow_dispatch` only.',
          'Triggers on push but not on pull requests — misses the PR gate use-case.',
          'Triggers on push and pull_request for the main branch.',
          'Triggers on push and pull_request with branch filters; actions are pinned to major version tags (not `@latest`).',
        ],
      },
      {
        id: 'failure_signal',
        criterion: 'Failure signal fidelity',
        band: [
          'Workflow always reports green regardless of test outcome.',
          'Workflow runs tests but swallows non-zero exit codes (`|| true` or equivalent).',
          'A failing test causes the job to fail and the commit check to go red.',
          'Failing test causes red check; passing test causes green check; both states are demonstrated (commit history or README screenshots).',
        ],
      },
      {
        id: 'step_quality',
        criterion: 'Step hygiene',
        band: [
          'Missing `npm ci` — uses `npm install` or no install step at all.',
          'Uses `npm ci` but no Node.js version pin or cache configuration.',
          'Uses `actions/setup-node` with a pinned Node version and `cache: npm`.',
          'All actions pinned to major tags; Node version matches project\'s `.nvmrc` or `engines` field; cache configured.',
        ],
      },
      {
        id: 'documentation',
        criterion: 'README documentation',
        band: [
          'No README or README does not mention CI.',
          'README mentions CI exists but does not explain what it does.',
          'README explains what the workflow does and how to trigger it.',
          'README covers workflow purpose, how to trigger it, what "pinning action versions" means, and includes at least one screenshot of a passing and failing run.',
        ],
      },
    ],
  },

  /** cicd track — Mid: matrix strategy + artifact upload */
  'cicd-mid': {
    id: 'cicd-mid',
    label: 'CI/CD Mid: Matrix Strategy & Artifact Upload',
    rows: [
      {
        id: 'matrix_coverage',
        criterion: 'Matrix strategy coverage',
        band: [
          'No matrix — single Node.js version only.',
          'Matrix declared but only one version is active (others commented out).',
          'Matrix runs tests across at least two Node.js versions in parallel.',
          'Matrix runs across two or more versions; `fail-fast: false` set so all legs complete even if one fails.',
        ],
      },
      {
        id: 'artifact_upload',
        criterion: 'Artifact upload quality',
        band: [
          'No artifact upload.',
          'Artifact uploaded only on success — failures produce no inspectable output.',
          'Artifact uploaded with `if: always()` so it is available on failure.',
          'Artifact uploaded with `if: always()`; named with the matrix dimension (e.g. `test-results-node-22`); contains structured output (JUnit XML or HTML report).',
        ],
      },
      {
        id: 'local_verification',
        criterion: 'Local verification with `act`',
        band: [
          'No evidence of local workflow testing.',
          'README mentions `act` but no version recorded and no local run demonstrated.',
          'README documents the `act` version used and confirms the workflow ran locally.',
          'README documents `act` version, notes at least one difference between local and GitHub-hosted runner behaviour, and explains why.',
        ],
      },
      {
        id: 'repo_url',
        criterion: 'Public repo as artifact',
        band: [
          'No public repo submitted.',
          'Repo exists but README is missing or does not explain the pipeline.',
          'Repo with README explaining matrix purpose and how to run locally.',
          'Repo with README + green CI badge + matrix job visible in Actions tab + artifact downloadable.',
        ],
      },
    ],
  },

  /** cicd track — Capstone: full release pipeline with quality gates */
  'cicd-capstone': {
    id: 'cicd-capstone',
    label: 'CI/CD Capstone: Full Release Pipeline with Quality Gates',
    rows: [
      {
        id: 'gate_sequencing',
        criterion: 'Sequential gate design',
        band: [
          'All steps in a single job — no downstream blocking.',
          'Multiple jobs exist but no `needs:` dependency — they run in parallel unconditionally.',
          'Three distinct jobs with `needs:` dependencies; a failure in an upstream gate skips (not just fails) downstream jobs.',
          'Three-gate chain with explicit `needs:`; failure in any gate is demonstrated to skip downstream jobs, not just mark them red.',
        ],
      },
      {
        id: 'coverage_gate',
        criterion: 'Coverage threshold enforcement',
        band: [
          'No coverage measurement.',
          'Coverage is reported but no threshold configured — pipeline never fails on low coverage.',
          'Coverage threshold configured; pipeline fails the unit-test job when coverage falls below the floor.',
          'Threshold configured and demonstrated: a commit that drops below the floor causes the unit-test job to fail and the integration-test job to be skipped.',
        ],
      },
      {
        id: 'reusable_workflow',
        criterion: 'Reusable workflow or composite action',
        band: [
          'Setup steps duplicated verbatim across every job.',
          'Partial extraction — one job still has inline setup not covered by the shared action.',
          'Shared setup extracted into a reusable workflow or composite action; all jobs reference it.',
          'Shared action extracted, documented in the README, and the pipeline still passes after the refactor.',
        ],
      },
      {
        id: 'concurrency_cancellation',
        criterion: 'Concurrency cancellation',
        band: [
          'No concurrency configuration — multiple pushes queue unlimited parallel runs.',
          'Concurrency group defined but `cancel-in-progress` is false or absent.',
          'Concurrency group and `cancel-in-progress: true` configured.',
          'Configured and demonstrated: README includes a screenshot of a cancelled run triggered by a rapid second push.',
        ],
      },
      {
        id: 'ci_green',
        criterion: 'Green CI on submitted repo',
        band: [
          'No CI or CI is red.',
          'CI exists but green status is not verifiable (private repo or broken badge).',
          'Public repo with green CI badge confirmed at submission time.',
          'Public repo + green CI badge + all four jobs (lint, unit-tests, integration-tests, publish) visible and green in Actions tab.',
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
