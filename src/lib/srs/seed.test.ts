import { describe, expect, it } from 'vitest';
import { extractPrompts } from './extract-prompts';

describe('extractPrompts', () => {
  it('parses self-closing Prompt with all three attributes', () => {
    const body = '<Prompt id="a" question="Q?" answer="A." />';
    expect(extractPrompts(body)).toEqual([{ id: 'a', question: 'Q?', answer: 'A.' }]);
  });

  it('parses children-as-question with no answer (current authoring convention)', () => {
    const body = `
<Prompt id="qa-mindset-1">
  What is the fundamental difference between a QA mindset and a verification mindset?
</Prompt>
    `.trim();
    expect(extractPrompts(body)).toEqual([
      {
        id: 'qa-mindset-1',
        question: 'What is the fundamental difference between a QA mindset and a verification mindset?',
        answer: '',
      },
    ]);
  });

  it('parses multiple children-style Prompts in a single body', () => {
    const body = `
<Prompt id="p1">First question?</Prompt>
<Prompt id="p2">Second question?</Prompt>
    `.trim();
    const out = extractPrompts(body);
    expect(out).toHaveLength(2);
    expect(out[0]).toEqual({ id: 'p1', question: 'First question?', answer: '' });
    expect(out[1]).toEqual({ id: 'p2', question: 'Second question?', answer: '' });
  });

  it('honors attribute order — id can appear after question/answer', () => {
    const body = '<Prompt question="Q?" answer="A." id="abc" />';
    expect(extractPrompts(body)).toEqual([{ id: 'abc', question: 'Q?', answer: 'A.' }]);
  });

  it('prefers question attr over children when both are present', () => {
    const body = '<Prompt id="x" question="From attr">From children</Prompt>';
    expect(extractPrompts(body)).toEqual([{ id: 'x', question: 'From attr', answer: '' }]);
  });

  it('skips Prompt without id', () => {
    const body = '<Prompt question="orphan?" answer="nope" />';
    expect(extractPrompts(body)).toEqual([]);
  });

  it('skips Prompt with empty children and no question attr', () => {
    const body = '<Prompt id="empty"></Prompt>';
    expect(extractPrompts(body)).toEqual([]);
  });

  it('returns [] for body with no Prompts', () => {
    expect(extractPrompts('# just prose, no prompts')).toEqual([]);
  });
});
