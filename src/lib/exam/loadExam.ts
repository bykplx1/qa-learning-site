import { parse } from 'yaml';
import { examBankSchema, type ExamBank, type QuizQuestion } from '../quiz/schema.js';
import { repairWin1252 } from '../encoding/repair.js';

// Eagerly load all certificate exam-bank YAML files at build time. Using ?raw so
// we can repair Win-1252 mojibake before parsing, mirroring loadQuiz.ts.
const examGlob = import.meta.glob('../../generated/exam/*.exam.yaml', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

/** Derive the certificate id from a glob key like `../../generated/exam/ctfl.exam.yaml`. */
export function certIdFromGlobKey(key: string): string {
  const base = key.split('/').pop() ?? key;
  return base.replace(/\.exam\.yaml$/, '');
}

export interface LoadedExamBank extends ExamBank {
  certId: string;
}

function parseOne(raw: string, certId: string): LoadedExamBank | null {
  const repaired = repairWin1252(raw);
  const result = examBankSchema.safeParse(parse(repaired));
  if (!result.success) {
    console.warn(`[exam/loadExam] Schema validation failed for "${certId}":`, result.error.issues);
    return null;
  }
  return { certId, ...result.data };
}

let _cache: LoadedExamBank[] | null = null;

/** All certificate exam banks, validated and Win-1252-repaired (memoised). */
export function loadAllExamBanks(): LoadedExamBank[] {
  if (_cache) return _cache;
  const result: LoadedExamBank[] = [];
  for (const [key, raw] of Object.entries(examGlob)) {
    const bank = parseOne(raw, certIdFromGlobKey(key));
    if (bank) result.push(bank);
  }
  _cache = result;
  return result;
}

/** The exam bank for one certificate id, or null if missing / invalid. */
export function loadExamBank(certId: string): LoadedExamBank | null {
  return loadAllExamBanks().find((b) => b.certId === certId) ?? null;
}

/**
 * Questions for one certificate, ids namespaced as `<certId>:<id>` so they stay
 * unique and traceable inside the runner / persistence layer.
 */
export function loadCertQuestions(certId: string): QuizQuestion[] {
  const bank = loadExamBank(certId);
  if (!bank) return [];
  return bank.questions.map((q) => ({ ...q, id: `${certId}:${q.id}` }));
}
