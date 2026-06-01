import { describe, expect, it } from 'vitest';
import { loadAllExamBanks, loadExamBank, loadCertQuestions, certIdFromGlobKey } from './loadExam.js';
import { CERTIFICATES } from './certificates.js';
import type { QuizQuestion } from '../quiz/schema.js';

/** Assert a question's answer index/indices are valid for its options. */
function assertAnswerInRange(q: QuizQuestion, certId: string) {
  const optCount = q.options?.length ?? 0;
  if (Array.isArray(q.answer)) {
    expect(q.type, `${certId}/${q.id} array answer must be a multi question`).toBe('multi');
    expect(q.answer.length, `${certId}/${q.id} multi answer must be non-empty`).toBeGreaterThan(0);
    expect(new Set(q.answer).size, `${certId}/${q.id} multi answer has duplicates`).toBe(q.answer.length);
    for (const idx of q.answer) {
      expect(idx, `${certId}/${q.id} answer index out of range`).toBeLessThan(optCount);
    }
  } else {
    expect(q.answer, `${certId}/${q.id} answer index out of range`).toBeLessThan(optCount);
  }
}

describe('certificate exam banks', () => {
  it('loads a bank for every offered certificate', () => {
    const banks = loadAllExamBanks();
    expect(banks.length).toBeGreaterThanOrEqual(CERTIFICATES.length);
    for (const cert of CERTIFICATES) {
      expect(loadExamBank(cert.id), `missing bank for ${cert.id}`).not.toBeNull();
    }
  });

  it('each bank holds at least its certificate question count', () => {
    for (const cert of CERTIFICATES) {
      const bank = loadExamBank(cert.id)!;
      expect(
        bank.questions.length,
        `${cert.id} bank has ${bank.questions.length} < required ${cert.questionCount}`,
      ).toBeGreaterThanOrEqual(cert.questionCount);
    }
  });

  it('every question has a valid answer within its options', () => {
    for (const cert of CERTIFICATES) {
      for (const q of loadExamBank(cert.id)!.questions) {
        expect(q.options?.length ?? 0, `${cert.id}/${q.id} needs options`).toBeGreaterThanOrEqual(2);
        assertAnswerInRange(q, cert.id);
      }
    }
  });

  it('question ids are unique within each bank', () => {
    for (const cert of CERTIFICATES) {
      const ids = loadExamBank(cert.id)!.questions.map((q) => q.id);
      expect(new Set(ids).size, `${cert.id} has duplicate question ids`).toBe(ids.length);
    }
  });

  it('loadCertQuestions namespaces ids as "<certId>:<id>"', () => {
    const qs = loadCertQuestions('ctfl');
    expect(qs.length).toBeGreaterThan(0);
    for (const q of qs) {
      expect(q.id).toMatch(/^ctfl:/);
    }
  });

  it('returns no questions for an unknown certificate', () => {
    expect(loadCertQuestions('does-not-exist')).toEqual([]);
    expect(loadExamBank('does-not-exist')).toBeNull();
  });
});

describe('certIdFromGlobKey', () => {
  it('strips path prefix and .exam.yaml suffix', () => {
    expect(certIdFromGlobKey('../../generated/exam/ctfl.exam.yaml')).toBe('ctfl');
    expect(certIdFromGlobKey('ct-ai.exam.yaml')).toBe('ct-ai');
  });
});
