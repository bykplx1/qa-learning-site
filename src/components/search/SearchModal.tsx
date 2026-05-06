import { useState, useEffect, useRef, useCallback } from 'react';

interface PagefindResultData {
  url: string;
  meta: { title?: string };
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

export default function SearchModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PagefindResultData[]>([]);
  const [selected, setSelected] = useState(0);
  const [ready, setReady] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const pagefindRef = useRef<PagefindInstance | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        // @ts-ignore @vite-ignore — file only exists after build, not in node_modules
        const pf = await import(/* @vite-ignore */ '/pagefind/pagefind.js') as PagefindInstance;
        if (pf.init) await pf.init();
        pagefindRef.current = pf;
        setReady(true);
      } catch {
        // Not available in dev mode
      }
    };
    load();
  }, []);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    const handleOpen = () => setOpen(true);
    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('search:open', handleOpen);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('search:open', handleOpen);
    };
  }, []);

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
    return () => { cancelled = true; };
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

  const navigate = useCallback((url: string) => {
    window.location.href = url;
    close();
  }, [close]);

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
        const href = r.filters?.section?.includes('quiz') ? `${r.url}#quiz` : r.url;
        navigate(href);
      } else if (e.key === 'Tab') {
        // Keep focus inside modal
        const focusable = (e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>(
          'input, a, button, [tabindex]:not([tabindex="-1"])'
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
    [results, selected, navigate, close]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      onClick={close}
      onKeyDown={handleOverlayKeyDown}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-gray-200 dark:border-gray-700">
          <svg
            className="ml-4 mr-2 w-4 h-4 text-gray-400 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            placeholder={ready ? 'Search lessons and quizzes…' : 'Search unavailable in dev mode'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 py-3 pr-4 text-base bg-transparent outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
            aria-label="Search query"
            aria-autocomplete="list"
            aria-controls="search-results"
            aria-activedescendant={results[selected] ? `result-${selected}` : undefined}
          />
          <button
            onClick={close}
            className="mr-3 text-xs text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Close search"
          >
            Esc
          </button>
        </div>

        {results.length > 0 && (
          <ul
            ref={listRef}
            id="search-results"
            role="listbox"
            className="max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800"
          >
            {results.map((r, i) => {
              const isQuiz = r.filters?.section?.includes('quiz');
              const href = isQuiz ? `${r.url}#quiz` : r.url;
              const isSelected = i === selected;
              return (
                <li
                  key={r.url + i}
                  id={`result-${i}`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <a
                    href={href}
                    className={`block px-4 py-3 transition-colors ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(href);
                    }}
                    tabIndex={0}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{r.meta.title ?? 'Untitled'}</span>
                      {isQuiz && (
                        <span className="shrink-0 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded px-1.5 py-0.5">
                          Quiz
                        </span>
                      )}
                    </div>
                    <div
                      className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 [&_mark]:bg-yellow-200 dark:[&_mark]:bg-yellow-800 [&_mark]:rounded"
                      dangerouslySetInnerHTML={{ __html: r.excerpt }}
                    />
                  </a>
                </li>
              );
            })}
          </ul>
        )}

        {query && results.length === 0 && ready && (
          <p className="px-4 py-4 text-sm text-gray-400 text-center">No results for "{query}"</p>
        )}

        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 flex gap-3 text-xs text-gray-400">
          <span><kbd className="font-sans">↑↓</kbd> navigate</span>
          <span><kbd className="font-sans">↵</kbd> open</span>
          <span><kbd className="font-sans">Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
