/**
 * SegmentedLesson — React island (client:load).
 *
 * Wraps the server-rendered prose container and shows/hides h2-delimited
 * sections behind explicit "Continue to segment N" clicks.
 *
 * NO autoplay. NO infinite scroll. The reader must click.
 *
 * How it works:
 *   On mount this island finds all h2 elements inside data-lesson-body,
 *   computes segment boundaries, and hides every segment after the first.
 *   Clicking "Continue" reveals one more segment and scrolls/focuses
 *   the newly-revealed heading.
 *
 * Accessibility:
 *   - Hidden segments use aria-hidden="true" + inert attribute, keeping
 *     them out of the tab order and screen-reader tree.
 *   - The "Continue" button is focused after render so keyboard users land on it.
 *   - Faded preview: CSS gradient overlay (non-colour cue: dashed rule also
 *     appears) so the affordance is perceivable without colour.
 *   - aria-live="polite" region announces newly-revealed segment title.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Segment } from '../../lib/lessons/segmenter';

interface Props {
  /** Ordered segment descriptors from computeSegments(). Empty → no-op. */
  segments: Segment[];
  /** CSS selector for the element that holds the rendered MDX. */
  bodySelector?: string;
}

export default function SegmentedLesson({
  segments,
  bodySelector = '[data-lesson-body]',
}: Props) {
  const [visibleCount, setVisibleCount] = useState(1);
  const [announced, setAnnounced] = useState('');
  const btnRef = useRef<HTMLButtonElement>(null);

  // Map of segment index → the DOM Element that starts it (the h2).
  const segHeadingEls = useRef<Map<number, HTMLElement>>(new Map());

  // On first render, hide all segments after index 1.
  useEffect(() => {
    if (segments.length === 0) return;

    const body = document.querySelector(bodySelector);
    if (!body) return;

    const h2s = Array.from(body.querySelectorAll('h2'));
    // Build a map: segment index → h2 el.
    h2s.forEach((el, i) => {
      segHeadingEls.current.set(i + 1, el as HTMLElement);
    });

    applyVisibility(body, h2s, 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Whenever visibleCount changes, update visibility in the DOM.
  useEffect(() => {
    if (segments.length === 0) return;

    const body = document.querySelector(bodySelector);
    if (!body) return;

    const h2s = Array.from(body.querySelectorAll<HTMLElement>('h2'));
    applyVisibility(body, h2s, visibleCount);

    // Scroll newly-revealed heading into view and focus it (keyboard a11y).
    if (visibleCount > 1) {
      const headingEl = segHeadingEls.current.get(visibleCount);
      if (headingEl) {
        headingEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        headingEl.setAttribute('tabindex', '-1');
        headingEl.focus({ preventScroll: true });
        // Announce to screen readers.
        setAnnounced(`Segment ${visibleCount}: ${segments[visibleCount - 1]?.title ?? ''}`);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleCount]);

  // Autofocus the "Continue" button on mount so keyboard users land on it —
  // but only if nothing else currently holds focus. Unconditionally calling
  // focus() races with sibling islands (e.g. QuizRunner) and steals focus
  // from in-flight user/test interactions on the same page.
  useEffect(() => {
    if (visibleCount !== 1) return;
    const active = document.activeElement;
    if (active && active !== document.body) return;
    btnRef.current?.focus({ preventScroll: true });
  }, [visibleCount]);

  if (segments.length === 0) return null;

  const nextIndex = visibleCount + 1;
  const hasMore = nextIndex <= segments.length;
  const nextSegment = hasMore ? segments[nextIndex - 1] : null;

  function reveal() {
    setVisibleCount((c) => c + 1);
  }

  return (
    <>
      {/* Polite live region for screen-reader announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        style={{ position: 'absolute', left: '-9999px' }}
      >
        {announced}
      </div>

      {hasMore && (
        <div className="segment-continue" data-testid="segment-continue">
          {nextSegment && (
            <p className="segment-next-label" aria-hidden="true">
              Up next: <strong>{nextSegment.title}</strong>
            </p>
          )}
          <button
            ref={btnRef}
            type="button"
            className="btn btn--primary segment-continue__btn"
            onClick={reveal}
            aria-label={`Continue to segment ${nextIndex}${nextSegment ? ': ' + nextSegment.title : ''}`}
            data-testid="segment-continue-btn"
          >
            Continue to segment {nextIndex}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// DOM helpers — run outside React render cycle.
// ---------------------------------------------------------------------------

/**
 * For each h2 boundary, collect all sibling DOM nodes until the next h2 (or
 * end of container) and hide/show them along with the h2 itself.
 *
 * A node belongs to segment i when it appears after h2[i-1] and before h2[i].
 */
function applyVisibility(
  body: Element,
  h2s: HTMLElement[],
  visibleCount: number,
): void {
  if (h2s.length === 0) return;

  // Walk all direct children of body and classify each by segment index.
  const children = Array.from(body.childNodes).filter(
    (n) => n.nodeType === Node.ELEMENT_NODE,
  ) as HTMLElement[];

  let currentSegment = 0;

  for (const child of children) {
    if (child.tagName === 'H2') {
      currentSegment += 1;
    }

    // Segment 0 means content before the first h2 (e.g. MDX import statements
    // rendered as nothing) — keep visible.
    const segIdx = currentSegment === 0 ? 0 : currentSegment;
    const show = segIdx <= visibleCount;

    if (show) {
      child.removeAttribute('aria-hidden');
      child.removeAttribute('inert');
      child.style.removeProperty('display');
    } else {
      child.setAttribute('aria-hidden', 'true');
      (child as HTMLElement & { inert: boolean }).inert = true;
    }
  }

  // Add a faded-preview hint on the first hidden segment's h2.
  const previewH2 = h2s[visibleCount]; // 0-indexed, so this is segment visibleCount+1
  h2s.forEach((h, i) => {
    const isPreview = i === visibleCount;
    h.classList.toggle('segment-preview-heading', isPreview);
  });

  // Mark the last visible h2's section end with the preview overlay class.
  // We do it on the body element itself so the CSS gradient covers the tail.
  const lastVisible = h2s[visibleCount - 1];
  if (previewH2) {
    body.classList.add('has-segment-preview');
  } else {
    body.classList.remove('has-segment-preview');
  }
}
