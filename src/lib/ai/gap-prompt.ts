export type GapPromptResult =
  | { questions: string[] }
  | { refused: true; reason: string };

export interface LLMClient {
  complete(systemPrompt: string, userMessage: string): Promise<string>;
}

const SYSTEM_PROMPT =
  'You are a Socratic tutor. Return ONLY a JSON array of 2-4 follow-up questions about the user\'s explanation. Never return a score, rating, grade, percentage, or quality judgment. Questions only. Example: ["What does X mean?","How does Y relate to Z?"]';

const SCORE_PATTERN =
  /\d+\s*\/\s*(10|5|100)|score|rating|grade|points|out of|percent|\d+\s*%/i;

const SCORE_KEY_PATTERN = /"?(score|rating|grade)"?\s*:/i;

export function containsScoreShapedContent(text: string): boolean {
  return SCORE_PATTERN.test(text) || SCORE_KEY_PATTERN.test(text);
}

export async function requestGapPrompts(
  explanation: string,
  client: LLMClient,
): Promise<GapPromptResult> {
  let raw: string;
  try {
    raw = await client.complete(SYSTEM_PROMPT, explanation);
  } catch (err) {
    return {
      refused: true,
      reason: `error: ${err instanceof Error ? err.message : 'LLM call failed'}`,
    };
  }

  if (containsScoreShapedContent(raw)) {
    return { refused: true, reason: 'guardrail: score-shaped response stripped' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.trim());
  } catch {
    return { refused: true, reason: 'error: response was not valid JSON' };
  }

  if (
    !Array.isArray(parsed) ||
    !parsed.every((item) => typeof item === 'string')
  ) {
    return { refused: true, reason: 'error: response was not a string array' };
  }

  return { questions: parsed as string[] };
}
