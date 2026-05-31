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
  // sec-a11y track rubrics (starter / mid / capstone) — #340
  // ---------------------------------------------------------------------------

  /** sec-a11y track — Starter: axe scan + manual form inspection on the-internet */
  'sec-a11y-starter': {
    id: 'sec-a11y-starter',
    label: 'Security + A11y Starter: axe Scan + Form Inspection',
    rows: [
      {
        id: 'a11y_coverage',
        criterion: 'Accessibility scan coverage',
        band: [
          'No axe scan run, or scan output not captured.',
          'Scan run on one page only; violations listed without categorisation.',
          'Scan run on at least three pages; violations categorised by WCAG criterion and severity.',
          'Scan on three+ pages; each serious/critical violation has a one-paragraph user-impact note.',
        ],
      },
      {
        id: 'security_observation',
        criterion: 'Security form inspection',
        band: [
          'No security observations — form HTML not inspected.',
          'Form inspected but observations are vague ("it looks fine") with no reference to specific attributes or standards.',
          'At least one concrete observation (e.g. missing autocomplete, absent CSRF token) tied to a named misconfiguration.',
          'Multiple observations noted with references to OWASP or browser security standards; each observation explains the exploit path.',
        ],
      },
      {
        id: 'report_quality',
        criterion: 'Report clarity',
        band: [
          'Raw tool output only — no summary or analysis.',
          'Summary exists but findings are listed without actionable next steps.',
          'Structured report: each finding has WCAG/OWASP reference, severity, and a one-line recommended fix.',
          'PM-ready report: executive summary + structured findings a developer can act on without follow-up questions.',
        ],
      },
      {
        id: 'runability',
        criterion: 'Single-command reproducibility',
        band: [
          'Cannot reproduce — missing dependencies or entry point.',
          'Reproduces after manual steps not documented in README.',
          'Runs with one command; README lists prerequisites and expected output.',
          'Runs with one command from a clean clone; README includes a sample of expected output.',
        ],
      },
    ],
  },

  /** sec-a11y track — Mid: ZAP baseline + axe audit on Juice Shop */
  'sec-a11y-mid': {
    id: 'sec-a11y-mid',
    label: 'Security + A11y Mid: ZAP Baseline + axe Audit',
    rows: [
      {
        id: 'zap_scan',
        criterion: 'ZAP baseline scan completeness',
        band: [
          'ZAP not run or report not captured.',
          'ZAP run but only alert count reported; no classification by severity or OWASP category.',
          'ZAP report captured; MEDIUM+ alerts classified by OWASP Top 10 category.',
          'ZAP report captured; all MEDIUM+ alerts classified, each with recommended fix and OWASP reference.',
        ],
      },
      {
        id: 'axe_coverage',
        criterion: 'axe scan breadth',
        band: [
          'axe not run or run on fewer than three pages.',
          'axe run on three+ pages but violations listed without WCAG reference.',
          'axe run on five+ pages; violations categorised by WCAG criterion and severity.',
          'axe run on five+ pages; each serious/critical violation has user-impact note and recommended fix.',
        ],
      },
      {
        id: 'triage',
        criterion: 'Findings triage and false-positive investigation',
        band: [
          'No triage — all tool alerts accepted uncritically.',
          'Findings listed by severity but no false-positive analysis.',
          'Priority table present; at least one alert ruled out as a false positive with reasoning.',
          'Priority table present; false-positive section explains investigation method and why each ruled-out alert is not exploitable.',
        ],
      },
      {
        id: 'repo_artifact',
        criterion: 'Public repo as artifact',
        band: [
          'No public repo submitted.',
          'Repo exists but scan artefacts or findings document is missing.',
          'Repo with raw scan outputs and `findings.md`; README explains how to reproduce.',
          'Repo with scan outputs + findings + README covering tool versions, reproduction steps, and one surprising finding.',
        ],
      },
    ],
  },

  /** sec-a11y track — Capstone: full audit pipeline with CI gate on Juice Shop */
  'sec-a11y-capstone': {
    id: 'sec-a11y-capstone',
    label: 'Security + A11y Capstone: Full Audit with CI Gate',
    rows: [
      {
        id: 'ci_gate',
        criterion: 'CI quality gate',
        band: [
          'No CI configuration.',
          'CI runs scans but does not fail on new findings — gate is absent or always green.',
          'CI runs scans and fails on new MEDIUM+ ZAP or critical/serious axe findings vs committed baseline.',
          'CI gate verified by deliberate regression (job turned red) and revert (job turned green); documented in README.',
        ],
      },
      {
        id: 'manual_verification',
        criterion: 'Manual verification of automated findings',
        band: [
          'No manual verification — tool output accepted as-is.',
          'One finding manually checked with screenshots but no reproduction steps documented.',
          'Three findings manually reproduced with steps, evidence, and impact statements.',
          'Three findings reproduced with steps + evidence + impact; at least one false positive identified and ruled out with explanation.',
        ],
      },
      {
        id: 'cross_reference',
        criterion: 'Security–accessibility overlap analysis',
        band: [
          'No cross-reference between security and accessibility findings.',
          'Cross-reference mentioned but without a concrete example.',
          'Two a11y findings identified as security-relevant with named WCAG criterion and exploit path explained.',
          'Two+ cross-references with WCAG and OWASP citations; a paragraph explaining why the overlap exists structurally (not just coincidentally).',
        ],
      },
      {
        id: 'audit_report',
        criterion: 'Audit report completeness',
        band: [
          'No audit report, or raw tool output only.',
          'Report lists findings but lacks executive summary, scope, or recommendations.',
          'Report has executive summary + findings table + scope/limitations section.',
          'Full professional report: executive summary + prioritised findings + manual verification section + cross-references + scope — readable by a non-engineer without follow-up.',
        ],
      },
      {
        id: 'ci_green',
        criterion: 'Green CI on submitted repo',
        band: [
          'No CI or CI is red.',
          'CI exists but green status not verifiable (private repo or broken badge).',
          'Public repo with green CI badge confirmed at submission time.',
          'Public repo + green CI badge + pipeline runs full ZAP + axe gate + uploads report artifact.',
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
