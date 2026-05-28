import { ErrorBoundary } from '../ErrorBoundary';

function SearchTriggerInner() {
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('search:open'));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Search (Ctrl+K)"
      className="search-trigger"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <span>Search lessons, quizzes…</span>
      <span className="kbd">⌘ K</span>
    </button>
  );
}

export default function SearchTrigger() {
  return <ErrorBoundary label="SearchTrigger"><SearchTriggerInner /></ErrorBoundary>;
}
