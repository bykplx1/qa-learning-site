import { describe, expect, it } from 'vitest';
import { buildCertExamPool, slugFromKey } from './pool.js';
import { CERTIFICATES } from './certificates.js';

describe('buildCertExamPool', () => {
  it('returns exactly the certificate question count for every certificate', () => {
    for (const cert of CERTIFICATES) {
      const pool = buildCertExamPool(cert.id);
      expect(pool, `${cert.id} pool size`).toHaveLength(cert.questionCount);
    }
  });

  it('produces unique, namespaced question ids per certificate', () => {
    for (const cert of CERTIFICATES) {
      const pool = buildCertExamPool(cert.id);
      const ids = pool.map((q) => q.id);
      expect(new Set(ids).size, `${cert.id} has duplicate ids in one draw`).toBe(ids.length);
      for (const id of ids) {
        expect(id.startsWith(`${cert.id}:`), `${id} not namespaced by ${cert.id}`).toBe(true);
      }
    }
  });

  it('draws only from the requested certificate bank', () => {
    const pool = buildCertExamPool('ct-ai');
    for (const q of pool) {
      expect(q.id.split(':')[0]).toBe('ct-ai');
    }
  });

  it('returns an empty pool for an unknown certificate', () => {
    expect(buildCertExamPool('not-a-cert')).toEqual([]);
  });
});

describe('slugFromKey', () => {
  it('strips path prefix and .exam.yaml suffix', () => {
    expect(slugFromKey('../../generated/exam/ctal-tta.exam.yaml')).toBe('ctal-tta');
  });
});
