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
  /** GitHub repository used to fetch release assets on the landing page. */
  githubRepo: (env.VITE_GITHUB_REPO as string | undefined) ?? 'narenkamal2020-maker/LaunchLane',
  /** App Store URL — leave empty until the iOS app is live. */
  appStoreUrl: (env.VITE_APP_STORE_URL as string | undefined) ?? '',
  /** TestFlight URL — leave empty until the beta is live. */
  testFlightUrl: (env.VITE_TESTFLIGHT_URL as string | undefined) ?? '',
} as const;
