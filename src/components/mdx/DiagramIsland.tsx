import { useEffect, useId, useRef, useState } from 'react';
import { ErrorBoundary } from '../ErrorBoundary';

interface Props {
  src: string;
  caption?: string;
  'data-theme'?: string;
}

function DiagramIslandInner({ src, caption, 'data-theme': dataTheme }: Props) {
  const id = useId().replace(/:/g, '-');
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    async function render() {
      try {
        const mermaid = (await import('mermaid')).default;
        const isDark =
          dataTheme === 'dark' ||
          (!dataTheme && document.documentElement.classList.contains('dark'));
        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? 'dark' : 'neutral',
          securityLevel: 'strict',
        });
        const { svg: rendered } = await mermaid.render(`diagram-${id}`, src.trim());
        if (!cancelled) setSvg(rendered);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    }
    render();
    return () => { cancelled = true; };
  }, [src, id, dataTheme]);

  if (error) {
    return (
      <div className="mdx-diagram__error" role="alert">
        <span className="eyebrow">diagram error</span>
        <pre>{error}</pre>
        {caption && <figcaption className="mdx-diagram__caption">{caption}</figcaption>}
      </div>
    );
  }

  return (
    <div className="mdx-diagram__mermaid" ref={containerRef}>
      {svg ? (
        <div
          className="mdx-diagram__svg-wrap"
          dangerouslySetInnerHTML={{ __html: svg }}
          aria-label={caption ?? 'Diagram'}
        />
      ) : (
        <div className="mdx-diagram__placeholder" aria-hidden="true" />
      )}
      {caption && <figcaption className="mdx-diagram__caption">{caption}</figcaption>}
    </div>
  );
}

export default function DiagramIsland(props: Props) {
  return <ErrorBoundary label="DiagramIsland"><DiagramIslandInner {...props} /></ErrorBoundary>;
}
