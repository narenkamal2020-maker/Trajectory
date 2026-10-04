/**
 * Public site information shown on the contact page, footer and legal pages.
 * Edit these values (or set the VITE_* variables at build time) before going live.
 */
const env = import.meta.env;

export const SITE = {
  name: 'Trajectory',
  company: (env.VITE_COMPANY_NAME as string | undefined) ?? 'Naren',
  url: (env.VITE_SITE_URL as string | undefined) ?? '',
  contactEmail: (env.VITE_CONTACT_EMAIL as string | undefined) ?? 'naren.kamal2020@gmail.com',
  /** Postal address — leave empty to hide it everywhere. */
  address: (env.VITE_CONTACT_ADDRESS as string | undefined) ?? '',
  /** Shown on legal pages; bump when the text changes. */
  legalUpdated: '2026-10-04',
} as const;
