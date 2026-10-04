import { ApplicationRepository, type Application, type ApplicationStage } from '../db/repositories/application.repository';
import { cache } from '../lib/cache';
import { notFound } from '../lib/http';

export interface ApplicationInput {
  company: string;
  role: string;
  stage?: ApplicationStage;
  salaryPackage?: string | null;
  jobDescription?: string | null;
  appliedDate?: string | null;
  reminderDate?: string | null;
  notes?: string | null;
}

const view = (a: Application) => ({
  id: a.APP_ID,
  company: a.COMPANY_NAME,
  role: a.JOB_TITLE,
  stage: a.STAGE,
  salaryPackage: a.SALARY_PACKAGE ?? null,
  jobDescription: a.JOB_DESC_TEXT ?? null,
  appliedDate: a.APPLIED_DATE ? new Date(a.APPLIED_DATE).toISOString().slice(0, 10) : null,
  reminderDate: a.REMINDER_DATE ? new Date(a.REMINDER_DATE).toISOString().slice(0, 10) : null,
  notes: a.NOTES ?? null,
  updatedAt: new Date(a.UPDATED_AT).toISOString(),
});

const toDate = (s: string | null | undefined) => (s ? new Date(s) : undefined);

async function owned(userId: string, id: string) {
  const app = await ApplicationRepository.findById(id);
  if (!app || app.USER_ID !== userId) throw notFound('Application');
  return app;
}

export const ApplicationService = {
  async list(userId: string) {
    return (await ApplicationRepository.findByUser(userId)).map(view);
  },

  async create(userId: string, input: ApplicationInput) {
    const app = await ApplicationRepository.create({
      userId,
      companyName: input.company,
      jobTitle: input.role,
      stage: input.stage,
      salaryPackage: input.salaryPackage ?? undefined,
      jobDescText: input.jobDescription ?? undefined,
      appliedDate: toDate(input.appliedDate),
      reminderDate: toDate(input.reminderDate),
      notes: input.notes ?? undefined,
    });
    cache.invalidateUser(userId);
    return view(app);
  },

  async update(userId: string, id: string, input: Partial<ApplicationInput>) {
    await owned(userId, id);
    const app = await ApplicationRepository.update(id, {
      companyName: input.company,
      jobTitle: input.role,
      stage: input.stage,
      salaryPackage: input.salaryPackage === null ? undefined : input.salaryPackage,
      jobDescText: input.jobDescription === null ? undefined : input.jobDescription,
      appliedDate: toDate(input.appliedDate),
      reminderDate: toDate(input.reminderDate),
      notes: input.notes === null ? undefined : input.notes,
    });
    cache.invalidateUser(userId);
    return view(app);
  },

  async remove(userId: string, id: string) {
    await owned(userId, id);
    await ApplicationRepository.delete(id);
    cache.invalidateUser(userId);
  },
};
