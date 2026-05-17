import { describe, expect, it, vi } from 'vitest';
import { requestGapPrompts, containsScoreShapedContent } from './gap-prompt';
import type { LLMClient } from './gap-prompt';

function mockClient(response: string | Error): LLMClient {
  return {
    complete: vi.fn(async () => {
      if (response instanceof Error) throw response;
      return response;
    }),
  };
}

describe('containsScoreShapedContent', () => {
  it('detects /10 pattern', () => {
    expect(containsScoreShapedContent('Score: 7/10')).toBe(true);
  });
  it('detects /5 pattern', () => {
    expect(containsScoreShapedContent('Rating: 4/5')).toBe(true);
  });
  it('detects /100 pattern', () => {
    expect(containsScoreShapedContent('You scored 92/100')).toBe(true);
  });
  it('detects % pattern', () => {
    expect(containsScoreShapedContent('Your explanation was 80% accurate')).toBe(true);
  });
  it('detects "score" word', () => {
    expect(containsScoreShapedContent('Here is your score for this explanation')).toBe(true);
  });
  it('detects "rating" word', () => {
    expect(containsScoreShapedContent('Overall rating: good')).toBe(true);
  });
  it('detects "grade" word', () => {
    expect(containsScoreShapedContent('Your grade on this section')).toBe(true);
  });
  it('detects "points" word', () => {
    expect(containsScoreShapedContent('You earned 8 points')).toBe(true);
  });
  it('detects "out of" phrase', () => {
    expect(containsScoreShapedContent('Rate yourself out of 5')).toBe(true);
  });
  it('detects JSON score key', () => {
    expect(containsScoreShapedContent('{"score": 7, "questions": ["Q?"]}')).toBe(true);
  });
  it('detects JSON rating key', () => {
    expect(containsScoreShapedContent('{"rating": 4}')).toBe(true);
  });
  it('does not flag clean questions array', () => {
    expect(containsScoreShapedContent('["What does X mean?","How does Y relate?"]')).toBe(false);
  });
});

describe('requestGapPrompts', () => {
  it('returns questions when LLM returns a clean JSON array', async () => {
    const client = mockClient('["What is X?","How does Y work?","Why does Z matter?"]');
    const result = await requestGapPrompts('Some explanation text', client);
    expect(result).toEqual({ questions: ['What is X?', 'How does Y work?', 'Why does Z matter?'] });
  });

  it('refuses when LLM returns Score: 7/10 mixed with questions', async () => {
    const client = mockClient('Score: 7/10. Questions: ["What is X?"]');
    const result = await requestGapPrompts('Some explanation', client);
    expect(result).toMatchObject({ refused: true });
  });

  it('refuses when LLM returns JSON with a score key', async () => {
    const client = mockClient('{"score": 8, "questions": ["What is X?"]}');
    const result = await requestGapPrompts('Some explanation', client);
    expect(result).toMatchObject({ refused: true });
  });

  it('refuses when LLM returns percentage phrase', async () => {
    const client = mockClient('Your explanation was 80% accurate. Follow-up: ["Why?"]');
    const result = await requestGapPrompts('Some explanation', client);
    expect(result).toMatchObject({ refused: true });
  });

  it('refuses when LLM returns "out of" phrase', async () => {
    const client = mockClient('Rate yourself out of 5 before answering: ["Q?"]');
    const result = await requestGapPrompts('Some explanation', client);
    expect(result).toMatchObject({ refused: true });
  });

  it('refuses when LLM returns /5 pattern', async () => {
    const client = mockClient('Quality 4/5. Questions: ["Q?"]');
    const result = await requestGapPrompts('Some explanation', client);
    expect(result).toMatchObject({ refused: true });
  });

  it('refuses when LLM returns /100 pattern', async () => {
    const client = mockClient('92/100 accuracy. ["Q?"]');
    const result = await requestGapPrompts('Some explanation', client);
    expect(result).toMatchObject({ refused: true });
  });

  it('refuses when LLM returns JSON with rating key', async () => {
    const client = mockClient('{"rating": 3, "questions": ["What?","Why?"]}');
    const result = await requestGapPrompts('Some explanation', client);
    expect(result).toMatchObject({ refused: true });
  });

  it('refuses when LLM returns JSON with grade key', async () => {
    const client = mockClient('{"grade": "B+", "questions": ["What?"]}');
    const result = await requestGapPrompts('Some explanation', client);
    expect(result).toMatchObject({ refused: true });
  });

  it('refuses with error reason when LLM throws', async () => {
    const client = mockClient(new Error('Network timeout'));
    const result = await requestGapPrompts('Some explanation', client);
    expect(result).toMatchObject({ refused: true, reason: expect.stringContaining('error') });
  });

  it('does not throw when LLM throws — wraps in refusal', async () => {
    const client = mockClient(new Error('timeout'));
    await expect(requestGapPrompts('text', client)).resolves.not.toThrow();
  });

  it('refuses when LLM returns non-JSON', async () => {
    const client = mockClient('Here are some questions: blah blah');
    const result = await requestGapPrompts('text', client);
    expect(result).toMatchObject({ refused: true });
  });

  it('refuses when LLM returns JSON but not a string array', async () => {
    const client = mockClient('{"questions": ["Q?"]}');
    const result = await requestGapPrompts('text', client);
    expect(result).toMatchObject({ refused: true });
  });
});
