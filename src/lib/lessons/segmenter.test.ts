import { describe, it, expect } from 'vitest';
import { estimateWordCount } from './segmenter';

describe('estimateWordCount', () => {
  it('returns 0 for undefined body', () => {
    expect(estimateWordCount(undefined)).toBe(0);
  });

  it('returns 0 for empty string', () => {
    expect(estimateWordCount('')).toBe(0);
  });

  it('counts words in plain text', () => {
    expect(estimateWordCount('hello world foo bar')).toBe(4);
  });

  it('strips markdown heading syntax', () => {
    const body = '## Section One\nsome content here';
    const count = estimateWordCount(body);
    // "Section", "One", "some", "content", "here" = 5
    expect(count).toBe(5);
  });

  it('strips JSX tags', () => {
    const body = '<Diagram caption="test">hello world</Diagram>';
    const count = estimateWordCount(body);
    expect(count).toBe(2); // "hello world"
  });

  it('strips YAML front matter', () => {
    const body = '---\nslug: test\ntitle: Hello\n---\nactual content here';
    const count = estimateWordCount(body);
    // "actual", "content", "here" = 3
    expect(count).toBe(3);
  });

  it('returns a number above 1500 for a 2000-word body', () => {
    const words = Array.from({ length: 2000 }, (_, i) => `word${i}`).join(' ');
    expect(estimateWordCount(words)).toBeGreaterThan(1500);
  });
});
