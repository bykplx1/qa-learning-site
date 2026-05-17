/**
 * scripts/lint-curriculum.ts
 *
 * Enforces depth-gate rules on every .mdx file under content/curriculum/.
 * Exit code 0 = all rules pass. Exit code 1 = one or more violations.
 *
 * Usage:
 *   npx tsx scripts/lint-curriculum.ts [--dir <path>]
 *
 * --dir defaults to content/curriculum relative to repo root.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import { load as yamlLoad } from 'js-yaml';
import { curriculumFrontmatterSchema } from '../src/lib/curriculum/schema.js';
import type { Node } from 'unist';

// ─── Types ───────────────────────────────────────────────────────────────────

interface MdxJsxAttribute {
  type: 'mdxJsxAttribute';
  name: string;
  value: string | null | { type: string; value?: string; expression?: { value: string } };
}

interface MdxJsxElement extends Node {
  type: 'mdxJsxFlowElement' | 'mdxJsxTextElement';
  name: string | null;
  attributes: MdxJsxAttribute[];
  children: Node[];
}

interface FileMeta {
  filePath: string;
  slug: string;
  frontmatter: Record<string, unknown>;
  elements: MdxJsxElement[];
  rawBody: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stripFrontmatter(source: string): { yaml: string; body: string } {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { yaml: '', body: source };
  return { yaml: match[1], body: match[2] };
}

function collectMdxElements(root: Node): MdxJsxElement[] {
  const elements: MdxJsxElement[] = [];
  function walk(node: Node) {
    if (
      node.type === 'mdxJsxFlowElement' ||
      node.type === 'mdxJsxTextElement'
    ) {
      const el = node as MdxJsxElement;
      if (el.name) elements.push(el);
    }
    const children = (node as { children?: Node[] }).children;
    if (children) children.forEach(walk);
  }
  walk(root);
  return elements;
}

function getAttrValue(el: MdxJsxElement, name: string): string | null {
  const attr = el.attributes.find((a) => a.name === name);
  if (!attr) return null;
  if (typeof attr.value === 'string') return attr.value;
  if (attr.value && typeof attr.value === 'object') {
    if ('value' in attr.value && typeof attr.value.value === 'string') {
      return attr.value.value;
    }
    if ('expression' in attr.value && attr.value.expression?.value) {
      return attr.value.expression.value;
    }
  }
  return null;
}

function getElementsByName(elements: MdxJsxElement[], name: string): MdxJsxElement[] {
  return elements.filter((el) => el.name === name);
}

// ─── WIKILINK_RE mirrors the pattern in src/lib/wikilinks/resolver.ts ────────
// Captures: escaped?, target, section?, alias?
const WIKILINK_RE = /(\\?)\[\[([^\]#|\n]*?)(?:#([^\]|\n]*?))?(?:\|([^\]\n]*?))?\]\]/g;

function extractWikilinks(body: string): string[] {
  const slugs: string[] = [];
  WIKILINK_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = WIKILINK_RE.exec(body)) !== null) {
    const escape = m[1];
    const target = m[2].trim();
    if (escape) continue;        // escaped \[[...]] — not a real link
    if (!target) continue;       // anchor-only [[#section]] — no cross-page target
    slugs.push(target);
  }
  return slugs;
}

// ─── Parse a single MDX file ──────────────────────────────────────────────────

const processor = unified().use(remarkParse).use(remarkMdx);

function parseFile(filePath: string): FileMeta {
  const source = fs.readFileSync(filePath, 'utf-8');
  const { yaml, body } = stripFrontmatter(source);

  let frontmatter: Record<string, unknown> = {};
  if (yaml) {
    frontmatter = (yamlLoad(yaml) as Record<string, unknown>) ?? {};
  }

  const tree = processor.parse(body) as Node;
  const elements = collectMdxElements(tree);

  const slug = (frontmatter.slug as string) ?? path.basename(filePath, '.mdx');

  return { filePath, slug, frontmatter, elements, rawBody: body };
}

// ─── Lint rules ───────────────────────────────────────────────────────────────

export interface LintError {
  rule: string;
  file: string;
  message: string;
}

function ruleValidFrontmatter(meta: FileMeta): LintError[] {
  const result = curriculumFrontmatterSchema.safeParse(meta.frontmatter);
  if (result.success) return [];
  const issues = result.error.issues ?? [];
  return issues.map((e) => ({
    rule: 'R1:frontmatter',
    file: meta.filePath,
    message: `${e.path.map(String).join('.')}: ${e.message}`,
  }));
}

function ruleDiagramRequired(meta: FileMeta): LintError[] {
  const layer = meta.frontmatter.layer as string;
  if (layer === 'facts') return []; // facts layer is exempt

  const diagrams = getElementsByName(meta.elements, 'Diagram');
  if (diagrams.length >= 1) return [];

  return [
    {
      rule: 'R2:diagram',
      file: meta.filePath,
      message: `layer "${layer}" requires at least one <Diagram> tag (found 0)`,
    },
  ];
}

function rulePromptCount(meta: FileMeta): LintError[] {
  const layer = meta.frontmatter.layer as string;
  if (layer !== 'patterns' && layer !== 'systems') return [];

  const prompts = getElementsByName(meta.elements, 'Prompt');
  if (prompts.length >= 5) return [];

  return [
    {
      rule: 'R3:prompts',
      file: meta.filePath,
      message: `layer "${layer}" requires ≥5 <Prompt> tags (found ${prompts.length})`,
    },
  ];
}

function ruleExactlyOneFeynman(meta: FileMeta): LintError[] {
  const layer = meta.frontmatter.layer as string;
  if (layer !== 'patterns' && layer !== 'systems') return [];

  const feynmans = getElementsByName(meta.elements, 'Feynman');
  if (feynmans.length === 1) return [];

  return [
    {
      rule: 'R4:feynman',
      file: meta.filePath,
      message: `layer "${layer}" requires exactly one <Feynman> tag (found ${feynmans.length})`,
    },
  ];
}

function rulePracticeTaskRequired(meta: FileMeta): LintError[] {
  const layer = meta.frontmatter.layer as string;
  if (layer !== 'systems') return [];

  const tasks = getElementsByName(meta.elements, 'PracticeTask');
  if (tasks.length >= 1) return [];

  return [
    {
      rule: 'R5:practice-task',
      file: meta.filePath,
      message: `layer "systems" requires at least one <PracticeTask> tag (found 0)`,
    },
  ];
}

function ruleEncodingMinutesCap(meta: FileMeta): LintError[] {
  const minutes = meta.frontmatter.estimatedEncodingMinutes as number;
  if (typeof minutes !== 'number') return []; // R1 will catch missing/invalid value
  if (minutes <= 25) return [];

  return [
    {
      rule: 'R7:encoding-minutes',
      file: meta.filePath,
      message: `estimatedEncodingMinutes is ${minutes} — must be ≤ 25`,
    },
  ];
}

// ─── Corpus-level rules (require all files) ───────────────────────────────────

function ruleDuplicatePromptIds(allMeta: FileMeta[]): LintError[] {
  const seen = new Map<string, string>(); // id → first file path
  const errors: LintError[] = [];

  for (const meta of allMeta) {
    const prompts = getElementsByName(meta.elements, 'Prompt');
    for (const el of prompts) {
      const id = getAttrValue(el, 'id');
      if (!id) continue;
      if (seen.has(id)) {
        errors.push({
          rule: 'R6:duplicate-prompt-id',
          file: meta.filePath,
          message: `Prompt id="${id}" already used in ${seen.get(id)}`,
        });
      } else {
        seen.set(id, meta.filePath);
      }
    }
  }

  return errors;
}

function ruleWikilinksResolve(
  allMeta: FileMeta[],
  allowedUnresolved: Set<string>
): LintError[] {
  const slugSet = new Set(allMeta.map((m) => m.slug));
  const errors: LintError[] = [];

  for (const meta of allMeta) {
    const links = extractWikilinks(meta.rawBody);
    for (const target of links) {
      if (!slugSet.has(target) && !allowedUnresolved.has(target)) {
        errors.push({
          rule: 'R8:wikilinks',
          file: meta.filePath,
          message: `Unresolved wikilink [[${target}]] — slug not found in corpus and not listed in _wikilink-unresolved.json`,
        });
      }
    }
  }

  return errors;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function lintDir(curriculumDir: string): LintError[] {
  const mdxFiles: string[] = [];

  function walkDir(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(full);
      } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
        mdxFiles.push(full);
      }
    }
  }

  walkDir(curriculumDir);

  if (mdxFiles.length === 0) return [];

  const allMeta = mdxFiles.map(parseFile);

  // Load allowed-unresolved wikilinks from optional manifest
  const allowedUnresolvedPath = path.join(curriculumDir, '_wikilink-unresolved.json');
  let allowedUnresolved = new Set<string>();
  if (fs.existsSync(allowedUnresolvedPath)) {
    const list = JSON.parse(fs.readFileSync(allowedUnresolvedPath, 'utf-8')) as string[];
    allowedUnresolved = new Set(list);
  }

  const errors: LintError[] = [];

  for (const meta of allMeta) {
    errors.push(...ruleValidFrontmatter(meta));
    errors.push(...ruleDiagramRequired(meta));
    errors.push(...rulePromptCount(meta));
    errors.push(...ruleExactlyOneFeynman(meta));
    errors.push(...rulePracticeTaskRequired(meta));
    errors.push(...ruleEncodingMinutesCap(meta));
  }

  errors.push(...ruleDuplicatePromptIds(allMeta));
  errors.push(...ruleWikilinksResolve(allMeta, allowedUnresolved));

  return errors;
}

// ─── CLI entry-point ──────────────────────────────────────────────────────────

const isMain =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  (process.argv[1] === fileURLToPath(import.meta.url) ||
    process.argv[1].endsWith('lint-curriculum.ts') ||
    process.argv[1].endsWith('lint-curriculum.js'));

if (isMain) {
  const dirArgIdx = process.argv.indexOf('--dir');
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const curriculumDir =
    dirArgIdx !== -1 && process.argv[dirArgIdx + 1]
      ? path.resolve(process.argv[dirArgIdx + 1])
      : path.join(repoRoot, 'content', 'curriculum');

  if (!fs.existsSync(curriculumDir)) {
    console.error(`[lint-curriculum] Directory not found: ${curriculumDir}`);
    process.exit(1);
  }

  const errors = lintDir(curriculumDir);

  if (errors.length === 0) {
    console.log('[lint-curriculum] All rules passed.');
    process.exit(0);
  }

  // Group errors by file for readable output
  const byFile = new Map<string, LintError[]>();
  for (const e of errors) {
    const rel = path.relative(repoRoot, e.file);
    if (!byFile.has(rel)) byFile.set(rel, []);
    byFile.get(rel)!.push(e);
  }

  console.error(`[lint-curriculum] ${errors.length} error(s) found:\n`);
  for (const [file, fileErrors] of byFile) {
    console.error(`  ${file}`);
    for (const e of fileErrors) {
      console.error(`    [${e.rule}] ${e.message}`);
    }
  }
  process.exit(1);
}
