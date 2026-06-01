import { EXAM_PASS_THRESHOLD } from './config.js';

// ── ISTQB certificate specifications ─────────────────────────────────────────
// Each spec mirrors the real published exam structure for that certification
// (question count, time limit, pass mark). The mock exam draws `questionCount`
// questions from the certificate's dedicated bank and applies these limits, so
// the practice run matches the shape of the real sitting.
//
// Pass mark is 65% across all ISTQB schemes. Durations below are the standard
// (native-language) limits; the ExamRunner still offers ×1.5 / ×2 / untimed
// accommodations on top of these.

export interface CertificateSpec {
  /** URL slug and bank filename stem, e.g. `ctfl` → src/generated/exam/ctfl.exam.yaml */
  id: string;
  /** Short scheme code shown in chips/headings, e.g. `CTFL`. */
  code: string;
  /** Human title, e.g. `Foundation Level`. */
  name: string;
  /** Full certification name for descriptions. */
  fullName: string;
  /** Number of questions presented in one sitting (matches the real exam). */
  questionCount: number;
  /** Standard time limit in minutes (matches the real exam). */
  durationMinutes: number;
  /** Pass mark as a fraction (0.65 = 65% across all ISTQB schemes). */
  passThreshold: number;
  /** One-line summary for the selection card. */
  description: string;
  /** Curriculum clusters this scheme draws on, for context on the card. */
  clusters: string[];
}

export { EXAM_PASS_THRESHOLD };

export const CERTIFICATES: readonly CertificateSpec[] = [
  {
    id: 'ctfl',
    code: 'CTFL',
    name: 'Foundation Level',
    fullName: 'Certified Tester Foundation Level (CTFL v4.0)',
    questionCount: 40,
    durationMinutes: 60,
    passThreshold: EXAM_PASS_THRESHOLD,
    description:
      'The entry-level certification. Fundamentals of testing, the SDLC, static testing, test techniques, test management and tool support.',
    clusters: ['foundations', 'test-design', 'functional-execution'],
  },
  {
    id: 'ct-ai',
    code: 'CT-AI',
    name: 'AI Testing',
    fullName: 'Certified Tester AI Testing (CT-AI v1.0)',
    questionCount: 40,
    durationMinutes: 60,
    passThreshold: EXAM_PASS_THRESHOLD,
    description:
      'Quality engineering for AI-based systems: ML workflow, data quality, model metrics, bias, explainability and testing LLM-backed features.',
    clusters: ['ai-llm-qa'],
  },
  {
    id: 'ctal-tta',
    code: 'CTAL-TTA',
    name: 'Advanced — Technical Test Analyst',
    fullName: 'Certified Tester Advanced Level — Technical Test Analyst (CTAL-TTA v4.0)',
    questionCount: 45,
    durationMinutes: 90,
    passThreshold: EXAM_PASS_THRESHOLD,
    description:
      'Structure-based (white-box) techniques, static and dynamic analysis, and testing the quality characteristics — performance, security, reliability and maintainability — plus test automation.',
    clusters: ['automation-cicd', 'non-functional', 'test-design'],
  },
] as const;

const CERT_BY_ID = new Map(CERTIFICATES.map((c) => [c.id, c]));

export function getCertificate(id: string): CertificateSpec | undefined {
  return CERT_BY_ID.get(id);
}

/** sessionStorage / attempt slug for a certificate exam, e.g. `mock-exam-ctfl`. */
export function examSlugFor(certId: string): string {
  return `mock-exam-${certId}`;
}
