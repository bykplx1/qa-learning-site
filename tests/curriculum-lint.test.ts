import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { lintDir } from '../scripts/lint-curriculum.js';

const FIXTURES = path.resolve(import.meta.dirname, 'fixtures/curriculum-lint');
const PASS = path.join(FIXTURES, 'pass');
const FAIL = path.join(FIXTURES, 'fail');

// Helper: run lint on a directory of one or more specific fixture files via a temp dir approach.
// Since lintDir walks a directory, we test each rule by pointing at sub-dirs or using the full
// pass/fail directories filtered by rule prefix. The simplest approach is to create per-rule
// temp sub-directories or just lint the relevant fixture directories directly.
// We wrap each in a tiny per-test temp dir concept by using actual fixture paths.

function lintFiles(dir: string, fileNames: string[]) {
  // We can't selectively lint files without a temp dir, so we rely on the fact that
  // corpus-level rules (R6, R8) need multiple files, while per-file rules only need one.
  // The test runner uses the full pass/ or fail/ dirs for corpus rules and individual
  // file sub-dirs created in each fixture directory.
  //
  // For per-file rules we lint a single-file directory that contains only the relevant fixture.
  // For corpus rules (R6, R8) we lint sub-dirs that contain exactly the files needed.
  //
  // Since creating sub-dirs per fixture is cumbersome, we use a helper that creates an
  // in-memory override by calling the internal parse + rule functions directly.
  // BUT the public API only exposes lintDir. So: fixtures are organized so that
  // per-rule pass/ and fail/ sub-directories exist with only the relevant files.
  //
  // Given the current fixture layout (flat pass/ and fail/ dirs), we detect which errors
  // come from which files by checking the error file paths.
  //
  // This approach is viable because each fixture has a unique slug/file prefix.
  void dir;
  void fileNames;
}
void lintFiles;

// ─── R1: Frontmatter validation ───────────────────────────────────────────────

describe('R1: frontmatter schema', () => {
  it('pass — valid frontmatter produces no R1 errors', () => {
    const errors = lintDir(PASS).filter(
      (e) => e.rule === 'R1:frontmatter' && e.file.includes('r1-valid-frontmatter')
    );
    expect(errors).toHaveLength(0);
  });

  it('fail — invalid cluster value triggers R1 error', () => {
    const errors = lintDir(FAIL).filter(
      (e) => e.rule === 'R1:frontmatter' && e.file.includes('r1-invalid-frontmatter')
    );
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toMatch(/cluster/i);
  });
});

// ─── R2: Diagram required ─────────────────────────────────────────────────────

describe('R2: diagram requirement', () => {
  it('pass — patterns topic with <Diagram> produces no R2 errors', () => {
    const errors = lintDir(PASS).filter(
      (e) => e.rule === 'R2:diagram' && e.file.includes('r2-diagram-present')
    );
    expect(errors).toHaveLength(0);
  });

  it('pass — facts layer topic without <Diagram> produces no R2 errors', () => {
    const errors = lintDir(PASS).filter(
      (e) => e.rule === 'R2:diagram' && e.file.includes('r2-facts-exempt')
    );
    expect(errors).toHaveLength(0);
  });

  it('fail — patterns topic missing <Diagram> triggers R2 error', () => {
    const errors = lintDir(FAIL).filter(
      (e) => e.rule === 'R2:diagram' && e.file.includes('r2-missing-diagram')
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toMatch(/diagram/i);
  });
});

// ─── R3: ≥5 Prompts for patterns/systems ─────────────────────────────────────

describe('R3: prompt count', () => {
  it('pass — patterns topic with 5 <Prompt> tags produces no R3 errors', () => {
    const errors = lintDir(PASS).filter(
      (e) => e.rule === 'R3:prompts' && e.file.includes('r3-five-prompts')
    );
    expect(errors).toHaveLength(0);
  });

  it('fail — patterns topic with 4 <Prompt> tags triggers R3 error', () => {
    const errors = lintDir(FAIL).filter(
      (e) => e.rule === 'R3:prompts' && e.file.includes('r3-too-few-prompts')
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toMatch(/≥5/);
  });
});

// ─── R4: Exactly one <Feynman> for patterns/systems ──────────────────────────

describe('R4: feynman count', () => {
  it('pass — patterns topic with exactly one <Feynman> produces no R4 errors', () => {
    const errors = lintDir(PASS).filter(
      (e) => e.rule === 'R4:feynman' && e.file.includes('r4-one-feynman')
    );
    expect(errors).toHaveLength(0);
  });

  it('fail — patterns topic with two <Feynman> tags triggers R4 error', () => {
    const errors = lintDir(FAIL).filter(
      (e) => e.rule === 'R4:feynman' && e.file.includes('r4-two-feynmans')
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toMatch(/feynman/i);
  });
});

// ─── R5: ≥1 <PracticeTask> for systems ───────────────────────────────────────

describe('R5: practice task', () => {
  it('pass — systems topic with <PracticeTask> produces no R5 errors', () => {
    const errors = lintDir(PASS).filter(
      (e) => e.rule === 'R5:practice-task' && e.file.includes('r5-practice-task-systems')
    );
    expect(errors).toHaveLength(0);
  });

  it('fail — systems topic missing <PracticeTask> triggers R5 error', () => {
    const errors = lintDir(FAIL).filter(
      (e) => e.rule === 'R5:practice-task' && e.file.includes('r5-missing-practice-task')
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toMatch(/practice.?task/i);
  });
});

// ─── R6: No duplicate Prompt IDs across corpus ────────────────────────────────

describe('R6: duplicate prompt IDs', () => {
  it('pass — corpus with unique IDs produces no R6 errors', () => {
    const errors = lintDir(PASS).filter((e) => e.rule === 'R6:duplicate-prompt-id');
    expect(errors).toHaveLength(0);
  });

  it('fail — two files sharing a Prompt id trigger R6 error', () => {
    const errors = lintDir(FAIL).filter((e) => e.rule === 'R6:duplicate-prompt-id');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toMatch(/dup-shared-id/);
  });
});

// ─── R7: estimatedEncodingMinutes ≤ 25 ────────────────────────────────────────

describe('R7: encoding minutes cap', () => {
  it('pass — topic with estimatedEncodingMinutes=25 produces no R7 errors', () => {
    const errors = lintDir(PASS).filter(
      (e) => e.rule === 'R7:encoding-minutes' && e.file.includes('r7-encoding-minutes-ok')
    );
    expect(errors).toHaveLength(0);
  });

  it('fail — topic with estimatedEncodingMinutes=26 triggers R7 error', () => {
    const errors = lintDir(FAIL).filter(
      (e) => e.rule === 'R7:encoding-minutes' && e.file.includes('r7-encoding-minutes-over')
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toMatch(/26/);
  });
});

// ─── R8: Wikilinks resolve ────────────────────────────────────────────────────

describe('R8: wikilink resolution', () => {
  it('pass — wikilink pointing to a topic in the same corpus produces no R8 errors', () => {
    const errors = lintDir(PASS).filter(
      (e) => e.rule === 'R8:wikilinks' && e.file.includes('r8-wikilink-resolves')
    );
    expect(errors).toHaveLength(0);
  });

  it('fail — wikilink pointing to nonexistent slug triggers R8 error', () => {
    const errors = lintDir(FAIL).filter(
      (e) => e.rule === 'R8:wikilinks' && e.file.includes('r8-unresolved-wikilink')
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toMatch(/nonexistent-topic-xyz/);
  });
});

// ─── R9: Tool-lesson runbook requirements ─────────────────────────────────────

describe('R9: tool-lesson runbook', () => {
  it('pass — valid tool lesson with all sections, verified block, and tail', () => {
    const errors = lintDir(PASS).filter(
      (e) => e.rule === 'R9:tool-lesson' && e.file.includes('r9-tool-lesson-valid')
    );
    expect(errors).toHaveLength(0);
  });

  it('fail — tool lesson missing verified block triggers R9 error', () => {
    const errors = lintDir(FAIL).filter(
      (e) => e.rule === 'R9:tool-lesson' && e.file.includes('r9-tool-missing-verified')
    );
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toMatch(/verified/i);
  });

  it('fail — tool lesson missing required sections triggers R9 errors', () => {
    const errors = lintDir(FAIL).filter(
      (e) => e.rule === 'R9:tool-lesson' && e.file.includes('r9-tool-missing-sections')
    );
    expect(errors.length).toBeGreaterThan(0);
    const messages = errors.map((e) => e.message);
    expect(messages.some((m) => /set up/i.test(m))).toBe(true);
    expect(messages.some((m) => /implement/i.test(m))).toBe(true);
    expect(messages.some((m) => /common pitfalls/i.test(m))).toBe(true);
    expect(messages.some((m) => /maintain/i.test(m))).toBe(true);
  });

  it('fail — tool lesson with too few prompts and no Feynman triggers R9 error', () => {
    const errors = lintDir(FAIL).filter(
      (e) => e.rule === 'R9:tool-lesson' && e.file.includes('r9-tool-missing-tail')
    );
    expect(errors.length).toBeGreaterThan(0);
    const messages = errors.map((e) => e.message);
    expect(messages.some((m) => /≥3/i.test(m) || /prompt/i.test(m))).toBe(true);
    expect(messages.some((m) => /feynman/i.test(m))).toBe(true);
  });

  it('pass — non-tool lessons are unaffected (no R9 errors on standard fixtures)', () => {
    const errors = lintDir(PASS).filter(
      (e) =>
        e.rule === 'R9:tool-lesson' &&
        (e.file.includes('r1-valid-frontmatter') || e.file.includes('r5-practice-task-systems'))
    );
    expect(errors).toHaveLength(0);
  });
});

// ─── Smoke-test topic ─────────────────────────────────────────────────────────

describe('K-P0 smoke-test topic', () => {
  const SMOKE_DIR = path.resolve(import.meta.dirname, '..', 'content', 'curriculum');

  it('smoke-test topic passes all lint rules', () => {
    const errors = lintDir(SMOKE_DIR);
    expect(errors).toHaveLength(0);
  });
});
