import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ReviewEmptyState from './ReviewEmptyState';
import ReviewQueue from './ReviewQueue';

describe('ReviewEmptyState', () => {
  it('renders celebration heading', () => {
    const html = renderToStaticMarkup(<ReviewEmptyState />);
    // Apostrophe is entity-encoded in SSR output (You&#x27;re)
    expect(html).toMatch(/You(?:'|&#x27;)re done for now/i);
  });

  it('renders Explain it back CTA linking to /explain', () => {
    const html = renderToStaticMarkup(<ReviewEmptyState />);
    expect(html).toMatch(/href="\/explain"/);
    expect(html).toMatch(/Explain it back/i);
  });

  it('renders Start a project CTA linking to /projects', () => {
    const html = renderToStaticMarkup(<ReviewEmptyState />);
    expect(html).toMatch(/href="\/projects"/);
    expect(html).toMatch(/Start a project/i);
  });

  it('does not contain review-more / study-more / practice-more copy', () => {
    const html = renderToStaticMarkup(<ReviewEmptyState />);
    expect(html).not.toMatch(/review more/i);
    expect(html).not.toMatch(/study more/i);
    expect(html).not.toMatch(/practice more/i);
    expect(html).not.toMatch(/practice again/i);
    expect(html).not.toMatch(/continue reviewing/i);
  });

  it('has review-empty test id', () => {
    const html = renderToStaticMarkup(<ReviewEmptyState />);
    expect(html).toMatch(/data-testid="review-empty"/);
  });
});

describe('ReviewQueue — empty state (initialCard null)', () => {
  it('renders ReviewEmptyState when initialCard is null', () => {
    const html = renderToStaticMarkup(<ReviewQueue initialCard={null} />);
    // Apostrophe is entity-encoded in SSR output (You&#x27;re)
    expect(html).toMatch(/You(?:'|&#x27;)re done for now/i);
    expect(html).toMatch(/data-testid="review-empty"/);
  });

  it('does not contain review-more copy when initialCard is null', () => {
    const html = renderToStaticMarkup(<ReviewQueue initialCard={null} />);
    expect(html).not.toMatch(/review more/i);
    expect(html).not.toMatch(/study more/i);
  });

  it('renders both outbound CTAs when initialCard is null', () => {
    const html = renderToStaticMarkup(<ReviewQueue initialCard={null} />);
    expect(html).toMatch(/href="\/explain"/);
    expect(html).toMatch(/href="\/projects"/);
  });
});
