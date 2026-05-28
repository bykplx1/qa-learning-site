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
import { lessonMetaRowsFromMap } from '../curriculum/lesson-meta';
import type { LessonMetaRecord } from '../curriculum/lesson-meta';

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
  /** Pre-built slug→meta map from the curriculum collection (replaces lessons_meta). */
  lessonMetaMap?: Map<string, LessonMetaRecord>;
  /** @deprecated Pass lessonMetaMap instead. Kept for backward compat in callers that only need titles. */
  lessonTitleBySlug?: Map<string, string>;
}

export async function loadProfile(
  userId: string,
  options: LoadProfileOptions = {},
): Promise<ProfilePayload> {
  const today = options.today ?? new Date();
  const projectTitleBySlug = options.projectTitleBySlug ?? new Map<string, string>();
  const heatmapYear = today.getUTCFullYear();

  // Single round-trip: parallel queries; daily_activity is now derived from sources (#351).
  const { dailyActivityRows, lessonViewRows, quizAttemptRows, submissionRows } =
    await loadProfileRaw(userId);

  // Build slug→title and slug→cluster maps for activity feed from the curriculum meta map.
  const lessonTitleBySlug: Map<string, string> =
    options.lessonTitleBySlug ??
    (options.lessonMetaMap
      ? new Map(Array.from(options.lessonMetaMap.values()).map((r) => [r.slug, r.title]))
      : new Map<string, string>());

  const clusterBySlug: Map<string, string> = options.lessonMetaMap
    ? new Map(Array.from(options.lessonMetaMap.values()).map((r) => [r.slug, r.cluster]))
    : new Map<string, string>();

  // Build lessonMetaRows for categoryProgress + accuracyByTopic.
  const lessonMetaRows =
    options.lessonMetaMap ? lessonMetaRowsFromMap(options.lessonMetaMap) : [];

  const streak = streakOf(dailyActivityRows, today);

  // heatmapOf accepts rows with attemptsCount+lessonsCount; filter to year in-memory.
  const yearStart = `${heatmapYear}-01-01`;
  const yearEnd = `${heatmapYear}-12-31`;
  const heatmapRows = dailyActivityRows.filter((r) => r.day >= yearStart && r.day <= yearEnd);
  const heatmapCells = heatmapOf(heatmapRows, heatmapYear);

  const categoryProgress = categoryProgressOf(lessonViewRows, quizAttemptRows, lessonMetaRows);

  // Filter to practice-mode only to avoid dilution from mock-exam attempts (#388).
  const practiceAttemptRows = quizAttemptRows.filter((a) => a.mode === 'practice');
  const accuracyByTopic = quizAccuracyByTopicOf(practiceAttemptRows, lessonMetaRows);

  const recentActivity = recentActivityOf(
    lessonViewRows,
    quizAttemptRows,
    submissionRows,
    lessonTitleBySlug,
    projectTitleBySlug,
    10,
    clusterBySlug,
  );

  const completedCount = lessonViewRows.filter((v) => v.completedAt != null).length;

  // Headline attempt count: practice-mode only (#388).
  const attemptCount = practiceAttemptRows.length;

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
