import { describe, expect, it } from 'vitest';
import { CERTIFICATES, getCertificate, examSlugFor, EXAM_PASS_THRESHOLD } from './certificates.js';

describe('certificate specifications', () => {
  it('defines exactly the three offered certifications', () => {
    expect(CERTIFICATES.map((c) => c.id).sort()).toEqual(['ct-ai', 'ctal-tta', 'ctfl']);
  });

  it('matches the real ISTQB exam parameters per scheme', () => {
    const byId = Object.fromEntries(CERTIFICATES.map((c) => [c.id, c]));
    expect(byId['ctfl']).toMatchObject({ questionCount: 40, durationMinutes: 60 });
    expect(byId['ct-ai']).toMatchObject({ questionCount: 40, durationMinutes: 60 });
    expect(byId['ctal-tta']).toMatchObject({ questionCount: 45, durationMinutes: 90 });
  });

  it('uses the 65% ISTQB pass mark for every certificate', () => {
    expect(EXAM_PASS_THRESHOLD).toBe(0.65);
    for (const cert of CERTIFICATES) {
      expect(cert.passThreshold).toBe(0.65);
    }
  });

  it('has unique ids, codes and non-empty descriptions', () => {
    expect(new Set(CERTIFICATES.map((c) => c.id)).size).toBe(CERTIFICATES.length);
    expect(new Set(CERTIFICATES.map((c) => c.code)).size).toBe(CERTIFICATES.length);
    for (const cert of CERTIFICATES) {
      expect(cert.description.length).toBeGreaterThan(0);
      expect(cert.clusters.length).toBeGreaterThan(0);
    }
  });

  it('getCertificate resolves known ids and rejects unknown ones', () => {
    expect(getCertificate('ctfl')?.code).toBe('CTFL');
    expect(getCertificate('nope')).toBeUndefined();
  });

  it('examSlugFor namespaces the per-certificate attempt slug', () => {
    expect(examSlugFor('ctfl')).toBe('mock-exam-ctfl');
    expect(examSlugFor('ct-ai')).toBe('mock-exam-ct-ai');
  });
});
