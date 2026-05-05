import { tasksFileSchema, type TasksFile } from './schema.js';

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

export function parseTasks(markdown: string, lessonSlug: string): TasksFile {
  const text = normalize(markdown);
  const section = extractSection(text, /^## Fill-in\s*[/\/]\s*Tasks[^\n]*/m);
  if (!section) return tasksFileSchema.parse({ lesson: lessonSlug, tasks: [] });

  const prefix = slugToPrefix(lessonSlug);
  const blocks = section.split(/^(?=### T\d+\.)/m).filter((b) => /^### T\d+\./.test(b.trim()));

  const tasks = blocks.map((block) => {
    const lines = block.split('\n');
    const headerLine = lines[0];

    const headerMatch = headerLine.match(/^### T(\d+)\.\s*(.*)/);
    if (!headerMatch) {
      throw new Error(`Malformed task header in lesson "${lessonSlug}": ${headerLine}`);
    }
    const tNum = parseInt(headerMatch[1], 10);
    const qText = headerMatch[2].trim();
    const id = `${prefix}-t${String(tNum).padStart(3, '0')}`;

    const bodyText = lines.slice(1).join('\n');

    // Answer: either inline "**Answer:** text" or block "**Answer (...):**\ncontent..."
    const inlineAnswerMatch = bodyText.match(/\*\*Answer(?:\s*\([^)]*\))?:\*\*[ \t]+(.*?)(?=\n\*\*(?:Hint|Why):|$)/s);
    const blockAnswerMatch = bodyText.match(/\*\*Answer(?:\s*\([^)]*\))?:\*\*\s*\n([\s\S]*?)(?=\n\*\*(?:Hint|Why):|$)/);

    let answer: string;
    if (inlineAnswerMatch && inlineAnswerMatch[1].trim()) {
      answer = inlineAnswerMatch[1].trim();
    } else if (blockAnswerMatch) {
      answer = blockAnswerMatch[1].trim();
    } else {
      throw new Error(
        `Missing **Answer:** in lesson "${lessonSlug}" task T${tNum}`
      );
    }

    const hintMatch = bodyText.match(/\*\*Hint:\*\*\s+([\s\S]*?)(?=\n\*\*Why:\*\*|\n### |\n*$)/);
    const hint = hintMatch ? hintMatch[1].trim() : undefined;

    const whyMatch = bodyText.match(/\*\*Why:\*\*\s+([\s\S]*?)(?=\n### |\n*$)/);
    const explanation = whyMatch ? whyMatch[1].trim() : undefined;

    return {
      id,
      type: 'fill_blank' as const,
      q: qText,
      answer,
      ...(hint !== undefined && { hint }),
      ...(explanation !== undefined && { explanation }),
    };
  });

  return tasksFileSchema.parse({ lesson: lessonSlug, tasks });
}
