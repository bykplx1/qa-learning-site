import { useCallback, useEffect, useRef, useState } from 'react';

interface NavLink {
  href: string;
  label: string;
  active?: boolean;
}

interface Props {
  links: NavLink[];
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function MobileNavToggle({ links }: Props) {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const firstFocusable = drawerRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    firstFocusable?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        return;
      }
      if (e.key === 'Tab') {
        const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, close]);

  useEffect(() => {
    if (!open) {
      document.documentElement.style.overflow = '';
      toggleRef.current?.focus();
    }
  }, [open]);

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        className="nav__toggle"
        aria-controls="mobile-nav"
        aria-expanded={open}
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        )}
      </button>

      {open && (
        <div
          className="mobile-nav__scrim"
          aria-hidden="true"
          onClick={close}
        />
      )}

      <nav
        ref={drawerRef}
        id="mobile-nav"
        aria-label="Primary mobile"
        aria-hidden={!open}
        className={`mobile-nav__drawer${open ? ' is-open' : ''}`}
        inert={!open ? ('' as unknown as undefined) : undefined}
      >
        <ul role="list" className="mobile-nav__list">
          {links.map(({ href, label, active }) => (
            <li key={href}>
              <a
                href={href}
                className={`mobile-nav__link${active ? ' is-active' : ''}`}
                onClick={close}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
