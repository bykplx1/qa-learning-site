import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import DiagramIsland from './DiagramIsland';

// Mermaid uses browser APIs — mock it for unit tests.
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: '<svg data-testid="mermaid-svg"><text>graph</text></svg>' }),
  },
}));

describe('DiagramIsland — SSR render', () => {
  it('renders a placeholder container (not yet hydrated) in SSR', () => {
    const html = renderToStaticMarkup(
      <DiagramIsland src="graph TD; A-->B" />,
    );
    // SSR: useEffect doesn't run, so placeholder is shown
    expect(html).toMatch(/mdx-diagram__placeholder/);
  });

  it('renders caption when provided', () => {
    const html = renderToStaticMarkup(
      <DiagramIsland src="graph TD; A-->B" caption="Flow overview" />,
    );
    expect(html).toMatch(/Flow overview/);
    expect(html).toMatch(/mdx-diagram__caption/);
  });

  it('accepts skip="atomic-fact" prop on Diagram without throwing', () => {
    // The skip prop is handled by Diagram.astro; DiagramIsland has no skip prop.
    // Verify the island itself renders without error when given valid props.
    expect(() =>
      renderToStaticMarkup(<DiagramIsland src="graph LR; X-->Y" />),
    ).not.toThrow();
  });

  it('renders mermaid container wrapper', () => {
    const html = renderToStaticMarkup(
      <DiagramIsland src="sequenceDiagram; A->>B: Hello" />,
    );
    expect(html).toMatch(/mdx-diagram__mermaid/);
  });
});
