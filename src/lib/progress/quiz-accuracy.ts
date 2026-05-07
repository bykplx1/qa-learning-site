export interface QuizAttemptScoreRow {
  quizSlug: string;
  score: number;
  total: number;
}

export interface LessonMetaRow {
  slug: string;
  category: string;
}

export interface TopicAccuracy {
  category: string;
  attempts: number;
  correct: number;
  total: number;
  accuracy: number;
}

export function quizAccuracyByTopicOf(
  attempts: QuizAttemptScoreRow[],
  lessonsMeta: LessonMetaRow[],
): TopicAccuracy[] {
  const slugToCategory = new Map<string, string>();
  const categoryOrder: string[] = [];
  const seenCategories = new Set<string>();

  for (const m of lessonsMeta) {
    if (!slugToCategory.has(m.slug)) slugToCategory.set(m.slug, m.category);
    if (!seenCategories.has(m.category)) {
      seenCategories.add(m.category);
      categoryOrder.push(m.category);
    }
  }

  const acc = new Map<string, { attempts: number; correct: number; total: number }>();
  for (const a of attempts) {
    const category = slugToCategory.get(a.quizSlug);
    if (!category) continue;
    if (a.total <= 0) continue;
    let bucket = acc.get(category);
    if (!bucket) {
      bucket = { attempts: 0, correct: 0, total: 0 };
      acc.set(category, bucket);
    }
    bucket.attempts += 1;
    bucket.correct += a.score;
    bucket.total += a.total;
  }

  const result: TopicAccuracy[] = [];
  for (const category of categoryOrder) {
    const bucket = acc.get(category);
    if (!bucket || bucket.attempts === 0) continue;
    const accuracy = bucket.total === 0 ? 0 : Math.round((bucket.correct / bucket.total) * 100);
    result.push({
      category,
      attempts: bucket.attempts,
      correct: bucket.correct,
      total: bucket.total,
      accuracy,
    });
  }
  return result;
}
