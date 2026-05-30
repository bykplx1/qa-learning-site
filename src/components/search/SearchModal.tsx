import { useState, useEffect, useRef, useCallback } from 'react';
import { ErrorBoundary } from '../ErrorBoundary';

interface PagefindResultData {
  url: string;
  meta: { title?: string; type?: string };
  excerpt: string;
  filters: Record<string, string[]>;
}

interface PagefindResult {
  id: string;
  data: () => Promise<PagefindResultData>;
}

interface PagefindInstance {
  search: (query: string) => Promise<{ results: PagefindResult[] }>;
  init?: () => Promise<void>;
}

function SearchModalInner() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PagefindResultData[]>([]);
  const [selected, setSelected] = useState(0);
  const [ready, setReady] = useState(false);
  const [loadAttempted, setLoadAttempted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const pagefindRef = useRef<PagefindInstance | null>(null);
  const loadStartedRef = useRef(false);

  const initPagefind = useCallback(async () => {
    if (loadStartedRef.current) return;
    loadStartedRef.current = true;
    try {
      const path = '/pagefind/' + 'pagefind.js';
      const pf = (await import(/* @vite-ignore */ path)) as PagefindInstance;
      if (pf.init) await pf.init();
      pagefindRef.current = pf;
      setReady(true);
    } catch {
      // Not available in dev mode — index is generated at build time
    } finally {
      setLoadAttempted(true);
    }
  }, []);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        void initPagefind();
        setOpen((prev) => !prev);
      }
    };
    const handleOpen = () => {
      void initPagefind();
      setOpen(true);
    };
    const handlePrefetch = () => void initPagefind();
    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('search:open', handleOpen);
    window.addEventListener('search:prefetch', handlePrefetch);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('search:open', handleOpen);
      window.removeEventListener('search:prefetch', handlePrefetch);
    };
  }, [initPagefind]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setSelected(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim() || !pagefindRef.current) {
      setResults([]);
      return;
    }
    let cancelled = false;
    pagefindRef.current.search(query).then(async (r) => {
      const data = await Promise.all(r.results.slice(0, 10).map((res) => res.data()));
      if (!cancelled) {
        setResults(data);
        setSelected(0);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [query]);

  useEffect(() => {
    if (listRef.current) {
      const item = listRef.current.children[selected] as HTMLElement | undefined;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [selected]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setResults([]);
  }, []);

  const navigate = useCallback(
    (url: string) => {
      window.location.href = url;
      close();
    },
    [close],
  );

  const handleOverlayKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape') {
        close();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelected((s) => Math.min(s + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelected((s) => Math.max(s - 1, 0));
      } else if (e.key === 'Enter' && results[selected]) {
        const r = results[selected];
        const href = (r.meta?.type ?? (r.filters?.section?.includes('quiz') ? 'quiz' : 'lesson')) === 'quiz' ? `${r.url}#quiz` : r.url;
        navigate(href);
      } else if (e.key === 'Tab') {
        const focusable = (e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>(
          'input, a, button, [tabindex]:not([tabindex="-1"])',
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    },
    [results, selected, navigate, close],
  );

  if (!open) return null;

  const selectedResult = results[selected];
  const getType = (r: PagefindResultData): string => r.meta?.type ?? (r.filters?.section?.includes('quiz') ? 'quiz' : 'lesson');
  const lessonResults = results.filter((r) => getType(r) !== 'quiz');
  const quizResults = results.filter((r) => getType(r) === 'quiz');

  return (
    <div
      className="pl-4 pr-4"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
        background: 'rgba(20, 20, 18, 0.45)',
        backdropFilter: 'blur(2px)',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      onClick={close}
      onKeyDown={handleOverlayKeyDown}
    >
      <div
        style={{
          width: 720,
          maxWidth: '95%',
          background: 'var(--paper)',
          border: '1px solid var(--rule)',
          borderRadius: 14,
          boxShadow: '0 30px 80px -20px rgba(0,0,0,0.4)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center gap-3.5"
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid var(--rule)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" style={{ color: 'var(--ink-3)' }}>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            placeholder={ready ? 'Search lessons and quizzes…' : 'Search unavailable in dev mode'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: 'var(--sans)',
              fontSize: 17,
              color: 'var(--ink)',
            }}
            aria-label="Search query"
            aria-autocomplete="list"
            aria-controls={results.length > 0 ? 'search-results' : undefined}
            aria-activedescendant={results[selected] ? `result-${selected}` : undefined}
          />
          <button onClick={close} className="kbd" aria-label="Close search" style={{ cursor: 'pointer' }}>
            esc
          </button>
        </div>

        {results.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 60%) minmax(0, 1fr)', maxHeight: 460 }}>
            <ul
              ref={listRef}
              id="search-results"
              role="listbox"
              className="p-2"
              style={{ listStyle: 'none', margin: 0, borderRight: '1px solid var(--rule)', overflowY: 'auto' }}
            >
              {lessonResults.length > 0 && (
                <li className="eyebrow" style={{ padding: '10px 14px 6px', listStyle: 'none' }}>
                  lessons · {lessonResults.length}
                </li>
              )}
              {results.map((r, i) => {
                const type = getType(r);
                const isQuiz = type === 'quiz';
                const href = isQuiz ? `${r.url}#quiz` : r.url;
                const isSelected = i === selected;
                if (isQuiz && i === lessonResults.length) {
                  // section break before first quiz
                }
                return (
                  <li key={r.url + i} id={`result-${i}`} role="option" aria-selected={isSelected}>
                    <a
                      href={href}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        gap: 4,
                        padding: '10px 14px',
                        borderRadius: 8,
                        marginBottom: 2,
                        // dynamic: background and border driven by isSelected state
                        background: isSelected ? 'var(--paper-2)' : 'transparent',
                        borderLeft: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
                        textDecoration: 'none',
                        color: 'var(--ink)',
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(href);
                      }}
                      tabIndex={0}
                    >
                      <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--ink)' }}>
                        {r.meta.title ?? 'Untitled'}
                      </div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>
                        {type}
                      </div>
                      <div
                        style={{
                          gridColumn: '1 / -1',
                          fontSize: 12,
                          color: 'var(--ink-2)',
                          lineHeight: 1.5,
                        }}
                        dangerouslySetInnerHTML={{ __html: r.excerpt }}
                      />
                    </a>
                  </li>
                );
              })}
              {quizResults.length > 0 && (
                <li className="eyebrow" style={{ padding: '16px 14px 6px', listStyle: 'none' }}>
                  quiz questions · {quizResults.length}
                </li>
              )}
            </ul>

            <div style={{ padding: 22 }}>
              {selectedResult && (
                <>
                  <span className="eyebrow">preview</span>
                  <div
                    style={{
                      fontFamily: 'var(--serif)',
                      fontSize: 22,
                      fontWeight: 450,
                      letterSpacing: '-0.02em',
                      marginTop: 6,
                      color: 'var(--ink)',
                    }}
                  >
                    {selectedResult.meta.title ?? 'Untitled'}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: 'var(--ink-2)',
                      lineHeight: 1.6,
                      marginTop: 14,
                    }}
                    dangerouslySetInnerHTML={{ __html: selectedResult.excerpt }}
                  />
                  <div className="my-4" style={{ height: 1, background: 'var(--rule)' }} />
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.7 }}>
                    ↑↓ navigate · ↵ open · esc close
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {query && results.length === 0 && ready && (
          <p className="py-6 px-4" style={{ fontSize: 13, color: 'var(--ink-3)', textAlign: 'center', margin: 0 }}>
            No results for "{query}"
          </p>
        )}

        <div
          className="flex justify-between py-2.5 px-4"
          style={{
            borderTop: '1px solid var(--rule)',
            background: 'var(--paper-2)',
            fontFamily: 'var(--mono)',
            fontSize: 11,
            color: 'var(--ink-3)',
          }}
        >
          <span>Pagefind · static index</span>
          <span>{ready ? 'ready.' : loadAttempted ? 'Search available after build' : 'loading…'}</span>
        </div>
      </div>
    </div>
  );
}

export default function SearchModal() {
  return <ErrorBoundary label="SearchModal"><SearchModalInner /></ErrorBoundary>;
}
