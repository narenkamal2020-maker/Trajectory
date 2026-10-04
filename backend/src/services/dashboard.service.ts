import { query } from '../config/oracle';
import { cache, userKey } from '../lib/cache';
import { num, round } from '../lib/util';
import { AnalyticsService } from './analytics.service';
import { TrajectoryService } from './trajectory.service';
import { RecommendationService } from './recommendation.service';
import { UserRepository } from '../db/repositories/user.repository';

/** Everything the Command Center needs in one round-trip. */
export const DashboardService = {
  async overview(userId: string) {
    return cache.wrap(userKey(userId, 'dashboard'), 30_000, async () => {
      const [user, totals, career, recs, interviews, sysDesign, percentile, recent, resume, apps] = await Promise.all([
        UserRepository.findById(userId),
        AnalyticsService.totals(userId),
        TrajectoryService.career(userId),
        RecommendationService.list(userId, 5),
        query<any>(`SELECT AVG(OVERALL_SCORE) AS AVG_SCORE, MAX(OVERALL_SCORE) AS BEST, COUNT(*) AS N FROM INTERVIEWS WHERE USER_ID = :userId AND STATUS = 'COMPLETED'`, { userId }),
        query<any>(
          `SELECT AVG(us.PROFICIENCY) AS P FROM USER_SKILLS us JOIN SKILLS s ON s.SKILL_ID = us.SKILL_ID WHERE us.USER_ID = :userId AND s.CATEGORY_ID = 'cat-sys'`,
          { userId }
        ),
        // Percentile by distinct problems solved across all users.
        query<any>(
          `SELECT
             (SELECT COUNT(*) FROM TRAJECTORY_USERS) AS TOTAL_USERS,
             (SELECT COUNT(*) FROM (
                SELECT u.USER_ID, (SELECT COUNT(DISTINCT s.QUESTION_ID) FROM SUBMISSIONS s WHERE s.USER_ID = u.USER_ID AND s.STATUS = 'ACCEPTED') AS SOLVED
                FROM TRAJECTORY_USERS u)
              WHERE SOLVED > (SELECT COUNT(DISTINCT QUESTION_ID) FROM SUBMISSIONS WHERE USER_ID = :userId AND STATUS = 'ACCEPTED')) AS AHEAD
           FROM DUAL`,
          { userId }
        ),
        query<any>(
          `SELECT * FROM (
             SELECT 'SUBMISSION' AS KIND, q.TITLE AS TITLE, s.STATUS AS DETAIL, s.SUBMITTED_AT AS AT FROM SUBMISSIONS s JOIN QUESTIONS q ON q.QUESTION_ID = s.QUESTION_ID WHERE s.USER_ID = :userId
             UNION ALL
             SELECT 'INTERVIEW', INTERVIEW_TYPE, TO_CHAR(ROUND(OVERALL_SCORE)), COMPLETED_AT FROM INTERVIEWS WHERE USER_ID = :userId AND STATUS = 'COMPLETED'
             UNION ALL
             SELECT 'RESUME', FILE_NAME, ANALYSIS_STATUS, CREATED_AT FROM RESUMES WHERE USER_ID = :userId
           ) ORDER BY AT DESC FETCH FIRST 8 ROWS ONLY`,
          { userId }
        ),
        query<any>(`SELECT ATS_SCORE, ANALYSIS_STATUS FROM RESUMES WHERE USER_ID = :userId ORDER BY CREATED_AT DESC FETCH FIRST 1 ROWS ONLY`, { userId }),
        query<any>(`SELECT COUNT(*) AS N FROM APPLICATIONS WHERE USER_ID = :userId`, { userId }),
      ]);

      const totalUsers = Math.max(1, num(percentile.rows?.[0]?.TOTAL_USERS, 1));
      const ahead = num(percentile.rows?.[0]?.AHEAD);
      const intRow = interviews.rows?.[0] ?? {};
      const skillValues = career.waypoints.map((w) => w.current);
      const techSkillsScore = skillValues.length ? round(skillValues.reduce((a, b) => a + b, 0) / skillValues.length) : 0;

      return {
        user: user ? { name: user.FULL_NAME, email: user.EMAIL } : null,
        // Fields consumed by the existing Command Center UI.
        readinessPercentage: career.readiness,
        trajectoryVelocityDays: career.etaDays,
        currentRole: career.currentRole ?? 'Getting started',
        targetRole: career.targetRole?.title ?? 'Choose a target role',
        clearedWaypointsCount: career.clearedWaypoints,
        totalWaypointsCount: career.totalWaypoints,
        solvedProblemsCount: totals.solved,
        streakDays: totals.streakDays,
        topPercentile: totals.solved === 0 ? 100 : Math.min(100, Math.max(1, Math.ceil((ahead / totalUsers) * 100))),
        techSkillsScore,
        mockScore: intRow.AVG_SCORE === null || intRow.AVG_SCORE === undefined ? 0 : round(num(intRow.AVG_SCORE)),
        codeVelocityMinutes: totals.avgSolveSeconds === null ? null : round(totals.avgSolveSeconds / 60),
        systemDesignScore: sysDesign.rows?.[0]?.P === null ? 0 : round(num(sysDesign.rows?.[0]?.P)),
        // Extra detail.
        accuracy: totals.accuracy,
        submissions: totals.submissions,
        interviewsCompleted: num(intRow.N),
        bestInterviewScore: intRow.BEST === null || intRow.BEST === undefined ? null : round(num(intRow.BEST)),
        atsScore: resume.rows?.[0]?.ATS_SCORE === null || !resume.rows?.[0] ? null : round(num(resume.rows[0].ATS_SCORE)),
        resumeStatus: resume.rows?.[0]?.ANALYSIS_STATUS ?? null,
        applicationsCount: num(apps.rows?.[0]?.N),
        nextWaypoints: career.waypoints.filter((w) => !w.cleared).slice(0, 4),
        milestones: career.milestones,
        recommendations: recs.items,
        recommendationEngine: recs.engine,
        recentActivity: (recent.rows ?? []).map((a) => ({
          kind: a.KIND, title: a.TITLE, detail: a.DETAIL, at: a.AT ? new Date(a.AT).toISOString() : null,
        })),
      };
    });
  },
};
