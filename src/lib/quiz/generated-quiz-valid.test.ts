import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { quizFileSchema } from './schema.js';

// Guard against the silent-drop failure mode: loadQuiz.ts warns-and-skips any
// quiz file that fails schema validation, so a malformed bank vanishes from the
// site and the exam pool with only a console.warn no one reads. This asserts
// every committed generated quiz actually parses + validates, so that class of
// bug fails CI loudly instead. (Regression: an unquoted `: ` in an option made
// YAML parse it as a map, dropping the qa-mindset and rag-testing quizzes.)
const QUIZ_DIR = join(process.cwd(), 'src/generated/quiz');
const quizFiles = readdirSync(QUIZ_DIR).filter((f) => f.endsWith('.quiz.yaml'));

describe('generated quiz banks', () => {
  it('has at least one quiz file', () => {
    expect(quizFiles.length).toBeGreaterThan(0);
  });

  it.each(quizFiles)('%s parses and validates against quizFileSchema', (file) => {
    const raw = readFileSync(join(QUIZ_DIR, file), 'utf8');
    const result = quizFileSchema.safeParse(parse(raw));
    const detail = result.success
      ? ''
      : result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    expect(result.success, `${file} — ${detail}`).toBe(true);
  });
});
