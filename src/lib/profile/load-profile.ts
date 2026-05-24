import { loadProfileRaw } from '../../db/queries';
import type { StreakResult } from '../streak/streak';
import type { CategoryProgress } from '../progress/progress';
import type { TopicAccuracy } from '../progress/quiz-accuracy';
import type { HeatmapCell } from '../heatmap/heatmap';
import type { ActivityItem } from '../activity/activity';
import { streakOf } from '../streak/streak';
import { categoryProgressOf } from '../progress/progress';
import { quizAccuracyByTopicOf } from '../progress/quiz-accuracy';
import { heatmapOf } from '../heatmap/heatmap';
import { recentActivityOf } from '../activity/activity';

export interface ProfileSubmission {
  projectSlug: string;
  repoUrl: string | null;
  reflection: string;
  isPublic: boolean;
  submittedAt: string;
}

export interface ProfilePayload {
  streak: StreakResult;
  heatmap: { year: number; cells: HeatmapCell[] };
  categoryProgress: CategoryProgress[];
  accuracyByTopic: TopicAccuracy[];
  recentActivity: ActivityItem[];
  submissions: ProfileSubmission[];
  completedCount: number;
  attemptCount: number;
}

export interface LoadProfileOptions {
  today?: Date;
  projectTitleBySlug?: Map<string, string>;
  /** Pre-built slug→title map from the curriculum collection; takes precedence over lessons_meta. */
  lessonTitleBySlug?: Map<string, string>;
}

export async function loadProfile(
  userId: string,
  options: LoadProfileOptions = {},
): Promise<ProfilePayload> {
  const today = options.today ?? new Date();
  const projectTitleBySlug = options.projectTitleBySlug ?? new Map<string, string>();
  const heatmapYear = today.getUTCFullYear();

  // Single round-trip: 5 parallel queries instead of the previous 13.
  const { dailyActivityRows, lessonViewRows, quizAttemptRows, lessonMetaRows, submissionRows } =
    await loadProfileRaw(userId);

  // Prefer the curriculum-collection map when provided (resolves real titles incl. acronyms).
  // Falls back to lessons_meta DB rows for backward compat (table is currently empty — #314).
  const lessonTitleBySlug =
    options.lessonTitleBySlug ?? new Map(lessonMetaRows.map((m) => [m.slug, m.title]));

  const streak = streakOf(dailyActivityRows, today);

  // heatmapOf accepts rows with attemptsCount+lessonsCount; filter to year in-memory.
  const yearStart = `${heatmapYear}-01-01`;
  const yearEnd = `${heatmapYear}-12-31`;
  const heatmapRows = dailyActivityRows.filter((r) => r.day >= yearStart && r.day <= yearEnd);
  const heatmapCells = heatmapOf(heatmapRows, heatmapYear);

  const categoryProgress = categoryProgressOf(lessonViewRows, quizAttemptRows, lessonMetaRows);

  const accuracyByTopic = quizAccuracyByTopicOf(quizAttemptRows, lessonMetaRows);

  const recentActivity = recentActivityOf(
    lessonViewRows,
    quizAttemptRows,
    submissionRows,
    lessonTitleBySlug,
    projectTitleBySlug,
    10,
  );

  const completedCount = lessonViewRows.filter((v) => v.completedAt != null).length;

  const attemptCount = quizAttemptRows.length;

  return {
    streak,
    heatmap: { year: heatmapYear, cells: heatmapCells },
    categoryProgress,
    accuracyByTopic,
    recentActivity,
    submissions: submissionRows.map((s) => ({
      projectSlug: s.projectSlug,
      repoUrl: s.repoUrl,
      reflection: s.reflection,
      isPublic: s.isPublic,
      submittedAt: s.submittedAt.toISOString(),
    })),
    completedCount,
    attemptCount,
  };
}
