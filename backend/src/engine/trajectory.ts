/**
 * Career trajectory math: role readiness, waypoints and ETA.
 * Readiness = importance-weighted average of min(1, proficiency / required) over a role's skills.
 */
import { round } from '../lib/util';

export interface RoleRequirement {
  skillId: string;
  skillName: string;
  categoryName?: string;
  minProf: number;
  importance: number;
}

export interface Waypoint {
  skillId: string;
  skillName: string;
  categoryName?: string;
  required: number;
  current: number;
  gap: number;
  importance: number;
  cleared: boolean;
}

export interface RoleReadiness {
  readiness: number; // 0..100
  waypoints: Waypoint[];
  cleared: number;
  total: number;
  remainingGap: number; // sum of importance-weighted proficiency points still missing
}

export function computeReadiness(reqs: RoleRequirement[], proficiency: Map<string, number>): RoleReadiness {
  if (!reqs.length) return { readiness: 0, waypoints: [], cleared: 0, total: 0, remainingGap: 0 };
  let weighted = 0, totalWeight = 0, remainingGap = 0;
  const waypoints: Waypoint[] = reqs.map((r) => {
    const current = proficiency.get(r.skillId) ?? 0;
    const ratio = Math.min(1, current / Math.max(1, r.minProf));
    weighted += ratio * r.importance;
    totalWeight += r.importance;
    const gap = Math.max(0, r.minProf - current);
    remainingGap += gap * r.importance;
    return {
      skillId: r.skillId, skillName: r.skillName, categoryName: r.categoryName,
      required: r.minProf, current: round(current), gap: round(gap), importance: r.importance, cleared: gap === 0,
    };
  });
  // Order: cleared first (the path behind you), then by most valuable remaining gap.
  waypoints.sort((a, b) => Number(b.cleared) - Number(a.cleared) || b.gap * b.importance - a.gap * a.importance);
  return {
    readiness: round((weighted / totalWeight) * 100),
    waypoints,
    cleared: waypoints.filter((w) => w.cleared).length,
    total: waypoints.length,
    remainingGap: round(remainingGap),
  };
}

/**
 * Velocity = importance-weighted proficiency points gained per day, measured from a history of
 * (date, remainingGap) points. Returns null when there isn't enough signal yet.
 */
export function estimateDaysToReady(
  history: Array<{ date: string; remainingGap: number }>,
  currentGap: number
): { velocityPerDay: number | null; etaDays: number | null } {
  if (currentGap <= 0) return { velocityPerDay: null, etaDays: 0 };
  const pts = [...history].sort((a, b) => a.date.localeCompare(b.date));
  if (pts.length < 2) return { velocityPerDay: null, etaDays: null };
  const first = pts[0], last = pts[pts.length - 1];
  const days = Math.max(1, (Date.parse(last.date) - Date.parse(first.date)) / 86400_000);
  const velocity = (first.remainingGap - last.remainingGap) / days;
  if (velocity <= 0.01) return { velocityPerDay: round(Math.max(0, velocity), 2), etaDays: null };
  return { velocityPerDay: round(velocity, 2), etaDays: Math.ceil(currentGap / velocity) };
}

/** Rank all roles by readiness — used for the "adjacent roles" panel. */
export function rankRoles(
  roles: Array<{ roleId: string; title: string; reqs: RoleRequirement[] }>,
  proficiency: Map<string, number>
) {
  return roles
    .map((r) => {
      const res = computeReadiness(r.reqs, proficiency);
      return { roleId: r.roleId, title: r.title, readiness: res.readiness, cleared: res.cleared, total: res.total };
    })
    .sort((a, b) => b.readiness - a.readiness);
}
