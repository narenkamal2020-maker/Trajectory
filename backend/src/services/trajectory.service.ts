import { query } from '../config/oracle';
import { cache, userKey } from '../lib/cache';
import { num, parseJson, dayKey } from '../lib/util';
import { computeReadiness, estimateDaysToReady, rankRoles } from '../engine/trajectory';
import { CatalogService } from './catalog.service';
import { SkillService } from './skill.service';
import { ProfileService } from './profile.service';
import { mlClient } from '../ml/client';
import { decryptField } from '../lib/crypto';

export const TrajectoryService = {
  /** Readiness for the user's primary target role (cheap; used by dashboard + snapshots). */
  async readiness(userId: string) {
    const [profile, prof] = await Promise.all([ProfileService.get(userId), SkillService.proficiencyMap(userId)]);
    const role = await CatalogService.resolveRole(profile?.targetRole);
    const res = computeReadiness(role?.requirements ?? [], prof);
    return { role, profile, proficiency: prof, ...res };
  },

  async career(userId: string) {
    return cache.wrap(userKey(userId, 'career'), 60_000, async () => {
      const base = await TrajectoryService.readiness(userId);
      const [roles, snaps, resume, interviews, solved] = await Promise.all([
        CatalogService.roles(),
        query<any>(
          `SELECT SNAPSHOT_DATE, SKILLS_JSON FROM PROGRESS_SNAPSHOTS WHERE USER_ID = :userId AND SNAPSHOT_DATE >= TRUNC(SYSDATE) - 30 ORDER BY SNAPSHOT_DATE`,
          { userId }
        ),
        query<any>(`SELECT ATS_SCORE, PARSED_TEXT FROM RESUMES WHERE USER_ID = :userId AND ANALYSIS_STATUS = 'COMPLETED' ORDER BY CREATED_AT DESC FETCH FIRST 1 ROWS ONLY`, { userId }),
        query<any>(`SELECT COUNT(*) AS N, AVG(OVERALL_SCORE) AS AVG_SCORE FROM INTERVIEWS WHERE USER_ID = :userId AND STATUS = 'COMPLETED'`, { userId }),
        query<any>(`SELECT COUNT(DISTINCT QUESTION_ID) AS N FROM SUBMISSIONS WHERE USER_ID = :userId AND STATUS = 'ACCEPTED'`, { userId }),
      ]);

      const history = (snaps.rows ?? [])
        .map((s) => ({ date: dayKey(new Date(s.SNAPSHOT_DATE)), remainingGap: num(parseJson<any>(s.SKILLS_JSON, {}).remainingGap, NaN) }))
        .filter((h) => Number.isFinite(h.remainingGap));
      history.push({ date: dayKey(new Date()), remainingGap: base.remainingGap });
      const eta = estimateDaysToReady(history, base.remainingGap);

      const ats = resume.rows?.[0]?.ATS_SCORE ?? null;
      const intCount = num(interviews.rows?.[0]?.N);
      const intAvg = interviews.rows?.[0]?.AVG_SCORE === null ? null : num(interviews.rows?.[0]?.AVG_SCORE);
      const solvedCount = num(solved.rows?.[0]?.N);

      const milestones = [
        { id: 'profile', label: 'Set a target role', done: !!base.role, detail: base.role?.title ?? 'Not set' },
        { id: 'resume', label: 'Resume ATS score ≥ 75', done: ats !== null && num(ats) >= 75, detail: ats === null ? 'No analyzed resume' : `ATS ${Math.round(num(ats))}` },
        { id: 'practice', label: 'Solve 20 practice problems', done: solvedCount >= 20, detail: `${solvedCount}/20 solved` },
        { id: 'interviews', label: '3 mock interviews averaging ≥ 70', done: intCount >= 3 && (intAvg ?? 0) >= 70, detail: `${intCount} completed${intAvg !== null ? `, avg ${Math.round(intAvg)}` : ''}` },
        { id: 'readiness', label: 'Reach 80% role readiness', done: base.readiness >= 80, detail: `${base.readiness}%` },
      ];

      let roleFit: Array<{ role: string; probability: number }> | null = null;
      const resumeText = decryptField(resume.rows?.[0]?.PARSED_TEXT);
      if (resumeText) roleFit = await mlClient.roleFit(String(resumeText).slice(0, 20000));

      return {
        targetRole: base.role ? { id: base.role.id, title: base.role.title, level: base.role.level } : null,
        currentRole: base.profile?.experienceLevel ?? null,
        readiness: base.readiness,
        waypoints: base.waypoints,
        clearedWaypoints: base.cleared,
        totalWaypoints: base.total,
        remainingGap: base.remainingGap,
        velocityPerDay: eta.velocityPerDay,
        etaDays: eta.etaDays,
        adjacentRoles: rankRoles(roles.map((r) => ({ roleId: r.id, title: r.title, reqs: r.requirements })), base.proficiency).slice(0, 5),
        milestones,
        roleFit,
        history,
      };
    });
  },
};
