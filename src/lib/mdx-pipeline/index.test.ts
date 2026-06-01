import { describe, it, expect } from 'vitest';
import { REMARK_PLUGINS, REHYPE_PLUGINS } from './index.js';
import { remarkRepairMojibake } from '../encoding/remarkRepairMojibake.js';
import { remarkStripQuizSections } from '../quiz/remarkStripQuizSections.js';
import { remarkDemoteH1 } from '../lessons/remarkDemoteH1.js';
import { remarkSectionOrder } from '../lessons/remarkSectionOrder.js';
import { rehypeTakeawayBlockquote } from '../lessons/rehypeTakeawayBlockquote.js';
import { rehypeMermaidCached } from './rehypeMermaidCached.js';

describe('MDX pipeline contract', () => {
  it('has remarkRepairMojibake as the first remark plugin', () => {
    expect(REMARK_PLUGINS[0]).toBe(remarkRepairMojibake);
  });

  it('has remarkStripQuizSections before remarkSectionOrder', () => {
    const stripIdx = REMARK_PLUGINS.indexOf(remarkStripQuizSections);
    const orderIdx = REMARK_PLUGINS.indexOf(remarkSectionOrder);
    expect(stripIdx).toBeGreaterThanOrEqual(0);
    expect(orderIdx).toBeGreaterThan(stripIdx);
  });

  it('has remarkDemoteH1 before remarkSectionOrder', () => {
    const demoteIdx = REMARK_PLUGINS.indexOf(remarkDemoteH1);
    const orderIdx = REMARK_PLUGINS.indexOf(remarkSectionOrder);
    expect(demoteIdx).toBeGreaterThanOrEqual(0);
    expect(orderIdx).toBeGreaterThan(demoteIdx);
  });

  it('has remarkSectionOrder as the last remark plugin (dependency contract: must precede rehype step)', () => {
    expect(REMARK_PLUGINS[REMARK_PLUGINS.length - 1]).toBe(remarkSectionOrder);
  });

  it('has rehypeMermaidCached as the first rehype plugin (must precede rehypeTakeawayBlockquote)', () => {
    const first = REHYPE_PLUGINS[0];
    const plugin = Array.isArray(first) ? first[0] : first;
    expect(plugin).toBe(rehypeMermaidCached);
  });

  it('has rehypeTakeawayBlockquote as the last rehype plugin', () => {
    expect(REHYPE_PLUGINS[REHYPE_PLUGINS.length - 1]).toBe(rehypeTakeawayBlockquote);
  });

  it('contains all expected transforms (4 remark + 2 rehype)', () => {
    expect(REMARK_PLUGINS).toHaveLength(4);
    expect(REHYPE_PLUGINS).toHaveLength(2);
  });
});
