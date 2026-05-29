export type CtaKind = 'review' | 'explain' | 'project';

export interface CtaOption {
  kind: CtaKind;
  href: string;
  label: string;
  description: string;
}

export interface EndCtaInput {
  /** Number of due review cards for this user+cluster. Pass 0 if unauthenticated. */
  dueCards: number;
  /** Number of self-explanations the user has submitted for this concept. Pass 0 if unauthenticated. */
  reviewCount: number;
  /** Whether a project exists for this cluster. */
  hasProject: boolean;
  projectSlug: string | null;
  /** When false the signed-out fallback review CTA is used and no explain CTA is shown. */
  signedIn: boolean;
  clusterSlug: string;
  conceptSlug: string;
}

export interface EndCtaResult {
  options: CtaOption[];
}

export function resolveEndCta(input: EndCtaInput): EndCtaResult {
  const { dueCards, reviewCount, hasProject, projectSlug, signedIn, clusterSlug, conceptSlug } =
    input;

  const options: CtaOption[] = [];

  if (signedIn) {
    if (dueCards > 0) {
      options.push({
        kind: 'review',
        href: `/review?cluster=${clusterSlug}`,
        label: 'Review due cards',
        description: 'Retrieve what you encoded — spacing drives retention.',
      });
    }

    if (reviewCount >= 2) {
      options.push({
        kind: 'explain',
        href: `/explain/${conceptSlug}`,
        label: 'Explain it back',
        description: 'Write a Feynman explanation to surface what you really know.',
      });
    }
  } else {
    options.push({
      kind: 'review',
      href: '/review',
      label: 'Review due cards',
      description: 'Retrieve what you encoded — spacing drives retention.',
    });
  }

  if (hasProject && projectSlug) {
    options.push({
      kind: 'project',
      href: `/projects/${projectSlug}`,
      label: 'Start a project',
      description: 'Apply what you know and build something real.',
    });
  }

  return { options };
}
