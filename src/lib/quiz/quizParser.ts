import { quizFileSchema, type QuizFile } from './schema.js';

const ANSWER_LETTERS_RE = /^[A-Z]+$/;

function normalize(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function extractSection(text: string, headingRe: RegExp): string | null {
  const match = headingRe.exec(text);
  if (!match) return null;
  const after = text.slice(match.index + match[0].length);
  const nextH2 = /\n(?=## )/m.exec(after);
  return nextH2 ? after.slice(0, nextH2.index) : after;
}

function slugToPrefix(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w[0].toLowerCase())
    .join('')
    .slice(0, 4);
}

function letterToIndex(letter: string): number {
  return letter.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);
}

export function parseQuiz(markdown: string, lessonSlug: string): QuizFile {
  const text = normalize(markdown);
  const section = extractSection(text, /^## Quiz[^\n]*/m);
  if (!section) return quizFileSchema.parse({ lesson: lessonSlug, questions: [] });

  const prefix = slugToPrefix(lessonSlug);
  const blocks = section.split(/^(?=### Q\d+\.)/m).filter((b) => /^### Q\d+\./.test(b.trim()));

  const questions = blocks.map((block) => {
    const lines = block.split('\n');
    const headerLine = lines[0];

    // Extract question number and text from "### Q1. Question text"
    const headerMatch = headerLine.match(/^### Q(\d+)\.\s*(.*)/);
    if (!headerMatch) {
      throw new Error(`Malformed quiz question header in lesson "${lessonSlug}": ${headerLine}`);
    }
    const qNum = parseInt(headerMatch[1], 10);
    const qText = headerMatch[2].trim();
    const id = `${prefix}-${String(qNum).padStart(3, '0')}`;

    // Collect options (lines starting with "- A) " etc.), supporting multi-line options
    const options: string[] = [];
    let i = 1;
    while (i < lines.length) {
      const optMatch = lines[i].match(/^- ([A-Z])\) (.*)/);
      if (optMatch) {
        let optText = optMatch[2];
        i++;
        // Continuation: lines that don't start a new option, answer, or heading
        while (
          i < lines.length &&
          !/^- [A-Z]\) /.test(lines[i]) &&
          !/^\*\*Answer/.test(lines[i]) &&
          !/^### /.test(lines[i]) &&
          lines[i].trim() !== ''
        ) {
          optText += ' ' + lines[i].trim();
          i++;
        }
        options.push(`${optMatch[1]}) ${optText.trim()}`);
      } else {
        i++;
      }
    }

    // Extract Answer
    const bodyText = lines.slice(1).join('\n');
    const answerMatch = bodyText.match(/\*\*Answer:\*\*\s+([A-Z]+)/);
    if (!answerMatch) {
      throw new Error(
        `Missing **Answer:** in lesson "${lessonSlug}" question Q${qNum}`
      );
    }
    const answerLetters = answerMatch[1];
    if (!ANSWER_LETTERS_RE.test(answerLetters)) {
      throw new Error(
        `Invalid answer "${answerLetters}" in lesson "${lessonSlug}" question Q${qNum}`
      );
    }

    const answerIndices = answerLetters.split('').map(letterToIndex);
    const answer = answerIndices.length === 1 ? answerIndices[0] : answerIndices;
    const type = answerIndices.length > 1 ? 'multi' as const : 'single' as const;

    // Extract Hint (from **Hint:** to **Why:** or end)
    const hintMatch = bodyText.match(/\*\*Hint:\*\*\s+([\s\S]*?)(?=\n\*\*Why:\*\*|\n### |\n*$)/);
    const hint = hintMatch ? hintMatch[1].trim() : undefined;

    // Extract Why/explanation (from **Why:** to end of block or next ### heading)
    const whyMatch = bodyText.match(/\*\*Why:\*\*\s+([\s\S]*?)(?=\n### |\n*$)/);
    const explanation = whyMatch ? whyMatch[1].trim() : undefined;

    return {
      id,
      type,
      q: qText,
      options: options.length > 0 ? options : undefined,
      answer,
      difficulty: 'medium' as const,
      ...(hint !== undefined && { hint }),
      ...(explanation !== undefined && { explanation }),
    };
  });

  return quizFileSchema.parse({ lesson: lessonSlug, questions });
}
