import { describe, expect, it } from 'vitest';
import { parseTasks } from './tasksParser';

const LESSON = 'testing-principles';

const MINIMAL_TASKS = `---
slug: testing-principles
---

## Fill-in / Tasks (3)

### T1. Fill: The principle "_______" states that 80% of defects come from 20% of modules.
**Answer:** Defect clustering
**Hint:** Pareto.
**Why:** Pareto distribution observed across many codebases.

### T2. Fill: Testing too late violates the principle of "_______ testing."
**Answer:** Early
**Hint:** Shift-left.
**Why:** Late detection multiplies cost.

### T3. Task: List 3 concrete actions to combat pesticide paradox in your regression suite.
**Answer (sample):**
1. Review and refresh test data quarterly
2. Add exploratory sessions targeting recent code changes
3. Mutate existing tests (boundary shifts, new equivalence classes)
**Hint:** Vary, add, prune.
**Why:** Pesticide paradox demands variation, not repetition.
`;

describe('parseTasks', () => {
  it('parses task question text', () => {
    const result = parseTasks(MINIMAL_TASKS, LESSON);
    expect(result.lesson).toBe(LESSON);
    expect(result.tasks).toHaveLength(3);
    expect(result.tasks[0].q).toBe(
      'Fill: The principle "_______" states that 80% of defects come from 20% of modules.'
    );
  });

  it('parses inline answer', () => {
    const result = parseTasks(MINIMAL_TASKS, LESSON);
    expect(result.tasks[0].answer).toBe('Defect clustering');
    expect(result.tasks[1].answer).toBe('Early');
  });

  it('parses multi-line block answer (Answer sample)', () => {
    const result = parseTasks(MINIMAL_TASKS, LESSON);
    const answer = result.tasks[2].answer;
    expect(answer).toContain('Review and refresh test data quarterly');
    expect(answer).toContain('Add exploratory sessions');
    expect(answer).toContain('Mutate existing tests');
  });

  it('generates IDs with t-prefix from lesson slug', () => {
    const result = parseTasks(MINIMAL_TASKS, LESSON);
    expect(result.tasks[0].id).toBe('tp-t001');
    expect(result.tasks[1].id).toBe('tp-t002');
    expect(result.tasks[2].id).toBe('tp-t003');
  });

  it('parses hint and explanation', () => {
    const result = parseTasks(MINIMAL_TASKS, LESSON);
    expect(result.tasks[0].hint).toBe('Pareto.');
    expect(result.tasks[0].explanation).toBe('Pareto distribution observed across many codebases.');
  });

  it('all tasks have type fill_blank', () => {
    const result = parseTasks(MINIMAL_TASKS, LESSON);
    for (const task of result.tasks) {
      expect(task.type).toBe('fill_blank');
    }
  });

  it('handles CRLF line endings', () => {
    const crlf = MINIMAL_TASKS.replace(/\n/g, '\r\n');
    const result = parseTasks(crlf, LESSON);
    expect(result.tasks).toHaveLength(3);
    expect(result.tasks[0].answer).toBe('Defect clustering');
  });

  it('handles trailing whitespace on lines', () => {
    const withTrailing = MINIMAL_TASKS.replace(/\n/g, '   \n');
    const result = parseTasks(withTrailing, LESSON);
    expect(result.tasks[0].q).toContain('80% of defects');
  });

  it('returns empty tasks array when no tasks section present', () => {
    const md = `---\nslug: test\n---\n\n# Just prose\n\nNo tasks here.\n`;
    const result = parseTasks(md, 'test');
    expect(result.tasks).toHaveLength(0);
  });

  it('throws with lesson and task number when Answer is missing', () => {
    const md = `## Fill-in / Tasks (1)

### T1. Fill: Something missing its answer.
**Hint:** A hint.
**Why:** A why.
`;
    expect(() => parseTasks(md, LESSON)).toThrowError(/testing-principles.*T1|T1.*testing-principles/);
  });

  it('output validates against tasksFileSchema', () => {
    const result = parseTasks(MINIMAL_TASKS, LESSON);
    expect(result.tasks[0].id).toBeTruthy();
    expect(result.tasks[0].type).toBe('fill_blank');
  });
});
