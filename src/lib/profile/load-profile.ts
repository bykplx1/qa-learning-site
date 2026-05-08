import {
  getCategoryProgress,
  getCompletedLessonCount,
  getHeatmap,
  getQuizAccuracyByTopic,
  getQuizAttemptCount,
  getRecentActivity,
  getStreak,
  listSubmissions,
} from '../../db/queries';
import type { StreakResult } from '../streak/streak';
import type { CategoryProgress } from '../progress/progress';
import type { TopicAccuracy } from '../progress/quiz-accuracy';
import type { HeatmapCell } from '../heatmap/heatmap';
import type { ActivityItem } from '../activity/activity';

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
}

export async function loadProfile(
  userId: string,
  options: LoadProfileOptions = {},
): Promise<ProfilePayload> {
  const today = options.today ?? new Date();
  const projectTitleBySlug = options.projectTitleBySlug ?? new Map<string, string>();
  const heatmapYear = today.getUTCFullYear();

  const [
    streak,
    heatmapCells,
    categoryProgress,
    accuracyByTopic,
    recentActivity,
    submissions,
    completedCount,
    attemptCount,
  ] = await Promise.all([
    getStreak(userId, today),
    getHeatmap(userId, heatmapYear),
    getCategoryProgress(userId),
    getQuizAccuracyByTopic(userId),
    getRecentActivity(userId, 10, projectTitleBySlug),
    listSubmissions(userId),
    getCompletedLessonCount(userId),
    getQuizAttemptCount(userId),
  ]);

  return {
    streak,
    heatmap: { year: heatmapYear, cells: heatmapCells },
    categoryProgress,
    accuracyByTopic,
    recentActivity,
    submissions: submissions.map((s) => ({
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
