export type ActivityKind = 'lesson' | 'quiz' | 'project';

export interface LessonViewActivityRow {
  lessonSlug: string;
  completedAt: Date | string | null;
}

export interface QuizAttemptActivityRow {
  quizSlug: string;
  mode: string;
  score: number;
  total: number;
  attemptedAt: Date | string;
}

export interface ProjectSubmissionActivityRow {
  projectSlug: string;
  submittedAt: Date | string;
  updatedAt: Date | string;
}

export interface ActivityItem {
  kind: ActivityKind;
  slug: string;
  title: string;
  timestamp: Date;
  href: string;
  score?: number;
  total?: number;
  mode?: string;
}

function toDate(v: Date | string): Date {
  return v instanceof Date ? v : new Date(v);
}

function formatSlug(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function recentActivityOf(
  views: LessonViewActivityRow[],
  attempts: QuizAttemptActivityRow[],
  submissions: ProjectSubmissionActivityRow[],
  lessonTitleBySlug: Map<string, string>,
  projectTitleBySlug: Map<string, string>,
  limit = 10,
): ActivityItem[] {
  const items: ActivityItem[] = [];

  for (const v of views) {
    if (v.completedAt == null) continue;
    items.push({
      kind: 'lesson',
      slug: v.lessonSlug,
      title: lessonTitleBySlug.get(v.lessonSlug) ?? formatSlug(v.lessonSlug),
      timestamp: toDate(v.completedAt),
      href: `/lessons/${v.lessonSlug}`,
    });
  }

  for (const a of attempts) {
    items.push({
      kind: 'quiz',
      slug: a.quizSlug,
      title: lessonTitleBySlug.get(a.quizSlug) ?? formatSlug(a.quizSlug),
      timestamp: toDate(a.attemptedAt),
      href: `/lessons/${a.quizSlug}#quiz`,
      score: a.score,
      total: a.total,
      mode: a.mode,
    });
  }

  for (const s of submissions) {
    const ts = toDate(s.updatedAt ?? s.submittedAt);
    items.push({
      kind: 'project',
      slug: s.projectSlug,
      title: projectTitleBySlug.get(s.projectSlug) ?? formatSlug(s.projectSlug),
      timestamp: ts,
      href: `/projects/${s.projectSlug}`,
    });
  }

  items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  return items.slice(0, limit);
}
