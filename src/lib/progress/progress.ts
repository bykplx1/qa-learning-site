export interface LessonViewRow {
  lessonSlug: string;
  completedAt: Date | string | null;
}

export interface QuizAttemptRow {
  quizSlug: string;
}

export interface LessonMetaRow {
  slug: string;
  category: string;
}

export interface CategoryProgress {
  category: string;
  percent: number;
  completed: number;
  total: number;
}

export function categoryProgressOf(
  views: LessonViewRow[],
  _attempts: QuizAttemptRow[],
  lessonsMeta: LessonMetaRow[],
): CategoryProgress[] {
  const slugToCategory = new Map<string, string>();
  const categoryTotals = new Map<string, number>();
  const categoryOrder: string[] = [];

  for (const m of lessonsMeta) {
    if (slugToCategory.has(m.slug)) continue;
    slugToCategory.set(m.slug, m.category);
    if (!categoryTotals.has(m.category)) {
      categoryTotals.set(m.category, 0);
      categoryOrder.push(m.category);
    }
    categoryTotals.set(m.category, (categoryTotals.get(m.category) ?? 0) + 1);
  }

  const completedByCategory = new Map<string, Set<string>>();
  for (const v of views) {
    if (v.completedAt == null) continue;
    const category = slugToCategory.get(v.lessonSlug);
    if (!category) continue;
    let set = completedByCategory.get(category);
    if (!set) {
      set = new Set();
      completedByCategory.set(category, set);
    }
    set.add(v.lessonSlug);
  }

  return categoryOrder.map((category) => {
    const total = categoryTotals.get(category) ?? 0;
    const completed = completedByCategory.get(category)?.size ?? 0;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { category, percent, completed, total };
  });
}
