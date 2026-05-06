export default function SearchTrigger() {
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('search:open'));
  };

  return (
    <button
      onClick={handleClick}
      aria-label="Search (Ctrl+K)"
      className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
    >
      <svg
        className="w-3.5 h-3.5"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
      </svg>
      <span className="hidden sm:inline">Search</span>
      <kbd className="hidden sm:inline text-xs bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1 font-sans">
        ⌘K
      </kbd>
    </button>
  );
}
