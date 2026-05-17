// Matches either `<Prompt ... />` (self-closing) or `<Prompt ...>children</Prompt>`.
// Question may come from a `question=` attr or from children prose; answer is
// optional (empty string when absent — current authoring convention is
// children-as-question without a canonical answer).
const PROMPT_RE = /<Prompt\b([^>]*?)(?:\/>|>([\s\S]*?)<\/Prompt>)/g;

export interface PromptData {
  id: string;
  question: string;
  answer: string;
}

export function extractPrompts(body: string): PromptData[] {
  const results: PromptData[] = [];
  let m: RegExpExecArray | null;
  PROMPT_RE.lastIndex = 0;
  while ((m = PROMPT_RE.exec(body)) !== null) {
    const attrs = m[1] ?? '';
    const children = (m[2] ?? '').trim();
    const idM = /\bid=["']([^"']+)["']/.exec(attrs);
    if (!idM) continue;
    const qAttrM = /\bquestion=["']([^"']+)["']/.exec(attrs);
    const aAttrM = /\banswer=["']([^"']+)["']/.exec(attrs);
    const question = qAttrM ? qAttrM[1] : children;
    const answer = aAttrM ? aAttrM[1] : '';
    if (!question) continue;
    results.push({ id: idM[1], question, answer });
  }
  return results;
}
