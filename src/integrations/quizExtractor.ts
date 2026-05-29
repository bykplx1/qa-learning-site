import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringify } from 'yaml';
import type { AstroIntegration } from 'astro';
import { parseQuiz } from '../lib/quiz/quizParser.js';
import { parseTasks } from '../lib/quiz/tasksParser.js';
import { repairWin1252 } from '../lib/encoding/repair.js';

function parseFrontmatterSlug(raw: string): string | null {
  const normalized = raw.replace(/^﻿/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const m = normalized.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  return m[1].match(/^slug:\s*(.+)$/m)?.[1]?.trim() ?? null;
}

function walkMd(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walkMd(full, out);
    } else if (extname(entry) === '.md') {
      out.push(full);
    }
  }
  return out;
}

export function quizExtractorIntegration(): AstroIntegration {
  return {
    name: 'qa-quiz-extractor',
    hooks: {
      'astro:config:setup': ({ config, logger }) => {
        const vaultPath = fileURLToPath(new URL('content/qa-vault/', config.root));
        const outDir = fileURLToPath(new URL('src/generated/quiz/', config.root));
        const categoryRe = /[/\\]\d{2}-[^/\\]+[/\\]/;

        mkdirSync(outDir, { recursive: true });

        if (!existsSync(vaultPath)) {
          logger.info('Quiz extractor: vault not found — skipping (quiz files are pre-generated)');
          return;
        }

        let quizCount = 0;
        let tasksCount = 0;

        for (const filePath of walkMd(vaultPath)) {
          if (!categoryRe.test(filePath)) continue;

          let raw: string;
          try {
            raw = repairWin1252(readFileSync(filePath, 'utf-8'));
          } catch {
            continue;
          }

          const slug = parseFrontmatterSlug(raw);
          if (!slug) continue;

          try {
            const quiz = parseQuiz(raw, slug);
            if (quiz.questions.length > 0) {
              writeFileSync(join(outDir, `${slug}.quiz.yaml`), stringify(quiz));
              quizCount++;
            }
          } catch (err) {
            logger.error(`Quiz extractor: ${(err as Error).message}`);
            throw err;
          }

          try {
            const tasks = parseTasks(raw, slug);
            if (tasks.tasks.length > 0) {
              writeFileSync(join(outDir, `${slug}.tasks.yaml`), stringify(tasks));
              tasksCount++;
            }
          } catch (err) {
            logger.error(`Tasks extractor: ${(err as Error).message}`);
            throw err;
          }
        }

        logger.info(`Quiz extractor: ${quizCount} quiz files, ${tasksCount} tasks files written`);
      },
    },
  };
}
