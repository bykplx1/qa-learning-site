export type CtaKind = 'explain' | 'project';

export interface CtaOption {
  kind: CtaKind;
  href: string;
  label: string;
  description: string;
}

export interface EndCtaInput {
  /** Number of self-explanations the user has submitted for this concept. Pass 0 if unauthenticated. */
  reviewCount: number;
  /** Whether a project exists for this cluster. */
  hasProject: boolean;
  projectSlug: string | null;
  /** When false, no explain CTA is shown. */
  signedIn: boolean;
  clusterSlug: string;
  conceptSlug: string;
}

export interface EndCtaResult {
  options: CtaOption[];
}

export function resolveEndCta(input: EndCtaInput): EndCtaResult {
  const { reviewCount, hasProject, projectSlug, signedIn, conceptSlug } = input;

  const options: CtaOption[] = [];

  if (signedIn && reviewCount >= 2) {
    options.push({
      kind: 'explain',
      href: `/explain/${conceptSlug}`,
      label: 'Explain it back',
      description: 'Write a Feynman explanation to surface what you really know.',
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
