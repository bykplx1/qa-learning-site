import { describe, it, expect } from 'vitest';
import { repairWin1252 } from './repair.js';

describe('repairWin1252', () => {
  it('repairs em-dash mojibake', () => {
    // â€" = WIN-1252 bytes E2 80 94 (em-dash U+2014) double-encoded as UTF-8
    const moji = 'â€”'; // â + € + "
    expect(repairWin1252(moji)).toBe('—'); // —
  });

  it('repairs en-dash mojibake', () => {
    // â€" = WIN-1252 bytes E2 80 93 (en-dash U+2013) double-encoded as UTF-8
    const moji = 'â€“'; // â + € + "
    expect(repairWin1252(moji)).toBe('–'); // –
  });

  it('repairs right-arrow mojibake', () => {
    // â†' = WIN-1252 bytes E2 86 92 (→ U+2192) double-encoded as UTF-8
    const moji = 'â†’'; // â + † + '
    expect(repairWin1252(moji)).toBe('→'); // →
  });

  it('repairs right-single-quote mojibake', () => {
    // â€™ = WIN-1252 bytes E2 80 99 (U+2019 = ') double-encoded
    const moji = 'â€™'; // â + € + ™
    expect(repairWin1252(moji)).toBe('’'); // '
  });

  it('passes through plain ASCII unchanged', () => {
    expect(repairWin1252('hello world')).toBe('hello world');
  });

  it('passes through correct unicode chars unchanged', () => {
    // A string that already has the correct em-dash should survive untouched
    expect(repairWin1252('—')).toBe('—'); // —
  });

  it('repairs a realistic sentence with multiple mojibake chars', () => {
    // "Perceivable â€" info presented" and "Heading order skipped (h1 â†' h3)"
    const input =
      'Perceivable â€” info presented in ways people can perceive.' +
      ' Heading order skipped (h1 â†’ h3).';
    const result = repairWin1252(input);
    expect(result).toContain('—'); // em-dash
    expect(result).toContain('→'); // →
    expect(result).toBe(
      'Perceivable — info presented in ways people can perceive.' +
      ' Heading order skipped (h1 → h3).'
    );
  });

  it('repairs inline in a longer string leaving ASCII neighbours intact', () => {
    const input = 'static â†’ unit â†’ integration â†’ E2E.';
    expect(repairWin1252(input)).toBe('static → unit → integration → E2E.');
  });
});
