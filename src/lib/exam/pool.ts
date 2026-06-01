import { type QuizQuestion } from '../quiz/schema.js';
import { certIdFromGlobKey, loadCertQuestions } from './loadExam.js';
import { getCertificate } from './certificates.js';

export { certIdFromGlobKey as slugFromKey };

/**
 * Build the question set for one certificate's mock exam.
 *
 * Returns exactly `questionCount` questions from the certificate's dedicated
 * bank (or fewer if the bank is short — guarded by tests). Question ids are
 * already namespaced `<certId>:<id>` by the loader so they stay unique.
 */
export function buildCertExamPool(certId: string): QuizQuestion[] {
  const spec = getCertificate(certId);
  const questions = loadCertQuestions(certId);
  const count = spec?.questionCount ?? questions.length;
  return questions.slice(0, count);
}
