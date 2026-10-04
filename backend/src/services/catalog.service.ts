/** Cached reference data: skills, categories, roles and the question index. */
import { query } from '../config/oracle';
import { cache } from '../lib/cache';
import { num } from '../lib/util';
import type { RoleRequirement } from '../engine/trajectory';
import type { Difficulty } from '../engine/skills';

const TTL = 10 * 60 * 1000;

export interface SkillInfo { id: string; name: string; categoryId: string; categoryName: string; parentCategoryId: string | null }
export interface RoleInfo { id: string; title: string; level: string | null; requirements: RoleRequirement[] }
export interface QuestionIndexItem {
  id: string; title: string; difficulty: Difficulty; categoryId: string; categoryName: string;
  type: 'CODE' | 'SQL'; tags: string[]; skillIds: string[]; solveRate: number | null; totalAttempts: number;
}

export const CatalogService = {
  skills(): Promise<SkillInfo[]> {
    return cache.wrap('catalog:skills', TTL, async () => {
      const r = await query<any>(
        `SELECT s.SKILL_ID, s.NAME, s.CATEGORY_ID, c.NAME AS CATEGORY_NAME, c.PARENT_ID
         FROM SKILLS s JOIN SKILL_CATEGORIES c ON c.CATEGORY_ID = s.CATEGORY_ID ORDER BY c.DISPLAY_ORDER, s.NAME`
      );
      return (r.rows ?? []).map((x) => ({ id: x.SKILL_ID, name: x.NAME, categoryId: x.CATEGORY_ID, categoryName: x.CATEGORY_NAME, parentCategoryId: x.PARENT_ID }));
    });
  },

  async skillMap(): Promise<Map<string, SkillInfo>> {
    return new Map((await CatalogService.skills()).map((s) => [s.id, s]));
  },

  categories(): Promise<Array<{ id: string; name: string; parentId: string | null; icon: string | null; order: number }>> {
    return cache.wrap('catalog:categories', TTL, async () => {
      const r = await query<any>(`SELECT * FROM SKILL_CATEGORIES ORDER BY DISPLAY_ORDER`);
      return (r.rows ?? []).map((x) => ({ id: x.CATEGORY_ID, name: x.NAME, parentId: x.PARENT_ID, icon: x.ICON, order: num(x.DISPLAY_ORDER) }));
    });
  },

  roles(): Promise<RoleInfo[]> {
    return cache.wrap('catalog:roles', TTL, async () => {
      const r = await query<any>(
        `SELECT jr.ROLE_ID, jr.TITLE, jr.ROLE_LEVEL, jrs.SKILL_ID, jrs.MIN_PROF, jrs.IMPORTANCE, s.NAME AS SKILL_NAME, c.NAME AS CATEGORY_NAME
         FROM JOB_ROLES jr
         LEFT JOIN JOB_ROLE_SKILLS jrs ON jrs.ROLE_ID = jr.ROLE_ID
         LEFT JOIN SKILLS s ON s.SKILL_ID = jrs.SKILL_ID
         LEFT JOIN SKILL_CATEGORIES c ON c.CATEGORY_ID = s.CATEGORY_ID
         WHERE jr.IS_ACTIVE = 1 ORDER BY jr.TITLE`
      );
      const roles = new Map<string, RoleInfo>();
      for (const x of r.rows ?? []) {
        if (!roles.has(x.ROLE_ID)) roles.set(x.ROLE_ID, { id: x.ROLE_ID, title: x.TITLE, level: x.ROLE_LEVEL, requirements: [] });
        if (x.SKILL_ID) {
          roles.get(x.ROLE_ID)!.requirements.push({
            skillId: x.SKILL_ID, skillName: x.SKILL_NAME, categoryName: x.CATEGORY_NAME, minProf: num(x.MIN_PROF), importance: num(x.IMPORTANCE),
          });
        }
      }
      return [...roles.values()];
    });
  },

  /** Map free-text target role (from onboarding) to a defined job role. */
  async resolveRole(targetRole: string | null | undefined): Promise<RoleInfo | null> {
    if (!targetRole) return null;
    const roles = await CatalogService.roles();
    const t = targetRole.toLowerCase();
    const exact = roles.find((r) => r.title.toLowerCase() === t || r.id === targetRole);
    if (exact) return exact;
    const rules: Array<[RegExp, string]> = [
      [/intern/, 'role-intern'],
      [/front[- ]?end|ui engineer|react/, 'role-fe'],
      [/back[- ]?end|api|server/, 'role-be'],
      [/full[- ]?stack/, 'role-fs'],
      [/data analy|business analy|bi /, 'role-da'],
      [/data scien/, 'role-ds'],
      [/machine learning|ml engineer|\bml\b|ai engineer|mle\b/, 'role-ml'],
      [/devops|sre|site reliability|platform|infrastructure|cloud/, 'role-devops'],
      [/software|developer|engineer|sde|swe|programmer/, 'role-swe'],
    ];
    for (const [re, id] of rules) if (re.test(t)) return roles.find((r) => r.id === id) ?? null;
    return roles.find((r) => r.id === 'role-swe') ?? null;
  },

  questionIndex(): Promise<QuestionIndexItem[]> {
    return cache.wrap('catalog:questions', 60 * 1000, async () => {
      const r = await query<any>(
        `SELECT q.QUESTION_ID, q.TITLE, q.DIFFICULTY, q.CATEGORY_ID, c.NAME AS CATEGORY_NAME, q.QUESTION_TYPE, q.TAGS,
                q.SOLVE_RATE, q.TOTAL_ATTEMPTS,
                (SELECT LISTAGG(qs.SKILL_ID, ',') WITHIN GROUP (ORDER BY qs.WEIGHT DESC) FROM QUESTION_SKILLS qs WHERE qs.QUESTION_ID = q.QUESTION_ID) AS SKILL_IDS
         FROM QUESTIONS q JOIN SKILL_CATEGORIES c ON c.CATEGORY_ID = q.CATEGORY_ID
         WHERE q.IS_ACTIVE = 1
         ORDER BY CASE q.DIFFICULTY WHEN 'EASY' THEN 1 WHEN 'MEDIUM' THEN 2 ELSE 3 END, q.TITLE`
      );
      return (r.rows ?? []).map((x) => ({
        id: x.QUESTION_ID, title: x.TITLE, difficulty: x.DIFFICULTY, categoryId: x.CATEGORY_ID, categoryName: x.CATEGORY_NAME,
        type: x.QUESTION_TYPE, tags: String(x.TAGS ?? '').split(',').filter(Boolean),
        skillIds: String(x.SKILL_IDS ?? '').split(',').filter(Boolean),
        solveRate: x.SOLVE_RATE === null ? null : num(x.SOLVE_RATE), totalAttempts: num(x.TOTAL_ATTEMPTS),
      }));
    });
  },

  async questionSkills(questionId: string): Promise<Array<{ skillId: string; weight: number }>> {
    const r = await query<any>(`SELECT SKILL_ID, WEIGHT FROM QUESTION_SKILLS WHERE QUESTION_ID = :questionId`, { questionId });
    return (r.rows ?? []).map((x) => ({ skillId: x.SKILL_ID, weight: num(x.WEIGHT, 1) }));
  },
};
