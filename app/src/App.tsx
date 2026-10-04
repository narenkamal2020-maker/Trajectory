import { lazy, Suspense, useEffect, type ReactElement } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import { ToastProvider } from './lib/toast';
import { ThemeProvider } from './lib/theme';
import { ConfirmProvider } from './components/extras';
import { CookieBanner } from './components/CookieBanner';
import { captureAttribution, trackPageView } from './lib/analytics';

captureAttribution();
import { OfflineProvider } from './lib/offline-context';
import { match, navigate, usePath } from './lib/router';
import { AppShell } from './components/AppShell';
import { Spinner } from './components/ui';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';

// Heavier pages are code-split.
const LandingPage = lazy(() => import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage').then((m) => ({ default: m.OnboardingPage })));
const PracticeListPage = lazy(() => import('./pages/PracticeListPage').then((m) => ({ default: m.PracticeListPage })));
const PracticeWorkspacePage = lazy(() => import('./pages/PracticeWorkspacePage').then((m) => ({ default: m.PracticeWorkspacePage })));
const InterviewsPage = lazy(() => import('./pages/InterviewsPage').then((m) => ({ default: m.InterviewsPage })));
const InterviewSessionPage = lazy(() => import('./pages/InterviewSessionPage').then((m) => ({ default: m.InterviewSessionPage })));
const SkillsPage = lazy(() => import('./pages/SkillsPage').then((m) => ({ default: m.SkillsPage })));
const CareerPage = lazy(() => import('./pages/CareerPage').then((m) => ({ default: m.CareerPage })));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })));
const ResumePage = lazy(() => import('./pages/ResumePage').then((m) => ({ default: m.ResumePage })));
const ApplicationsPage = lazy(() => import('./pages/ApplicationsPage').then((m) => ({ default: m.ApplicationsPage })));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })));
const AdminUserPage = lazy(() => import('./pages/admin/AdminUserPage').then((m) => ({ default: m.AdminUserPage })));
const AdminTopicsPage = lazy(() => import('./pages/admin/AdminTopicsPage').then((m) => ({ default: m.AdminTopicsPage })));
const AdminQuestionsPage = lazy(() => import('./pages/admin/AdminQuestionsPage').then((m) => ({ default: m.AdminQuestionsPage })));
const QuestionEditorPage = lazy(() => import('./pages/admin/QuestionEditorPage').then((m) => ({ default: m.QuestionEditorPage })));
const AdminSecurityPage = lazy(() => import('./pages/admin/AdminSecurityPage').then((m) => ({ default: m.AdminSecurityPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));

const PrivacyPage = lazy(() => import('./pages/public/LegalPages').then((m) => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('./pages/public/LegalPages').then((m) => ({ default: m.TermsPage })));
const ContactPage = lazy(() => import('./pages/public/ContactPage').then((m) => ({ default: m.ContactPage })));
const FaqPage = lazy(() => import('./pages/public/FaqPage').then((m) => ({ default: m.FaqPage })));
const NotFoundPage = lazy(() => import('./pages/public/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

/** Entry pages for signed-out visitors (signed-in users are sent into the app). */
const ENTRY = ['/', '/login', '/register'];
/** Content pages anyone can read, signed in or not. */
const OPEN: Record<string, () => ReactElement> = {
  '/privacy': () => <PrivacyPage />,
  '/terms': () => <TermsPage />,
  '/contact': () => <ContactPage />,
  '/faq': () => <FaqPage />,
};
const APP_ROUTES = ['/dashboard', '/practice', '/interviews', '/skills', '/career', '/analytics', '/resume', '/applications', '/settings', '/onboarding', '/admin'];
const isAppRoute = (p: string) => APP_ROUTES.some((r) => p === r || p.startsWith(r + '/'));

function AdminRoutes({ clean }: { clean: string }) {
  let p: Record<string, string> | null;
  if (clean === '/admin/questions/new') return <QuestionEditorPage />;
  if ((p = match('/admin/questions/:id', clean))) return <QuestionEditorPage id={p.id} />;
  if ((p = match('/admin/users/:id', clean))) return <AdminUserPage id={p.id} />;
  if (clean === '/admin/questions') return <AdminQuestionsPage />;
  if (clean === '/admin/topics') return <AdminTopicsPage />;
  if (clean === '/admin/security') return <AdminSecurityPage />;
  if (clean === '/admin') return <AdminUsersPage />;
  return <NotFoundInApp />;
}

function NotFoundInApp() {
  return (
    <div className="text-center py-16">
      <p className="font-mono text-sm text-[var(--color-text-muted)]">404</p>
      <h1 className="font-headline text-2xl font-bold text-white mt-1">This page doesn&rsquo;t exist</h1>
      <p className="text-sm text-[var(--color-text-secondary)] mt-2">Check the address, or head back to your dashboard.</p>
      <a href="#/dashboard" className="inline-block mt-6 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-on-primary)] font-bold">Go to dashboard</a>
    </div>
  );
}

function AuthedRoutes({ path, isAdmin }: { path: string; isAdmin: boolean }) {
  const clean = path.split('?')[0];
  if (clean === '/admin' || clean.startsWith('/admin/')) return isAdmin ? <AdminRoutes clean={clean} /> : <NotFoundInApp />;
  let p: Record<string, string> | null;
  if ((p = match('/practice/:id', clean))) return <PracticeWorkspacePage id={p.id} />;
  if ((p = match('/interviews/:id', clean))) return <InterviewSessionPage id={p.id} />;
  switch (clean) {
    case '/dashboard': return <DashboardPage />;
    case '/practice': return <PracticeListPage />;
    case '/interviews': return <InterviewsPage />;
    case '/skills': return <SkillsPage />;
    case '/career': return <CareerPage />;
    case '/analytics': return <AnalyticsPage />;
    case '/resume': return <ResumePage />;
    case '/applications': return <ApplicationsPage />;
    case '/settings': return <SettingsPage />;
    default: return <NotFoundInApp />;
  }
}

function Router() {
  const path = usePath();
  const { status, requiresOnboarding, user } = useAuth();
  const clean = path.split('?')[0];

  useEffect(() => { trackPageView(); }, [clean]);

  useEffect(() => {
    if (OPEN[clean]) return;
    if (status === 'authenticated' && ENTRY.includes(clean)) navigate(user?.role === 'ADMIN' ? '/admin' : requiresOnboarding ? '/onboarding' : '/dashboard', true);
    if (status === 'authenticated' && requiresOnboarding && user?.role !== 'ADMIN' && clean !== '/onboarding' && isAppRoute(clean)) navigate('/onboarding', true);
    // Only real app pages require sign-in; unknown paths fall through to the 404 page.
    if (status === 'anonymous' && isAppRoute(clean)) navigate('/login', true);
  }, [status, clean, requiresOnboarding, user?.role]);

  if (status === 'loading') return <div className="min-h-screen bg-[var(--color-bg-base)]"><Spinner label="Starting Trajectory…" /></div>;

  if (OPEN[clean]) return <Suspense fallback={<Spinner />}>{OPEN[clean]()}</Suspense>;

  if (status === 'anonymous') {
    if (clean === '/login') return <AuthPage mode="login" />;
    if (clean === '/register') return <AuthPage mode="register" />;
    if (clean === '/') return <LandingPage />;
    return <Suspense fallback={<Spinner />}>{isAppRoute(clean) ? <Spinner /> : <NotFoundPage />}</Suspense>;
  }
  if (clean === '/onboarding') return <OnboardingPage />;
  if (!isAppRoute(clean) && !ENTRY.includes(clean)) return <Suspense fallback={<Spinner />}><NotFoundPage /></Suspense>;
  return (
    <AppShell>
      <Suspense fallback={<Spinner />}>
        <AuthedRoutes path={path} isAdmin={user?.role === 'ADMIN'} />
      </Suspense>
    </AppShell>
  );
}

export function App() {
  return (
    <ThemeProvider>
    <ToastProvider>
    <ConfirmProvider>
      <AuthProvider>
        <OfflineProvider>
          <Suspense fallback={<div className="min-h-screen bg-[var(--color-bg-base)]" />}>
            <Router />
            <CookieBanner />
          </Suspense>
        </OfflineProvider>
      </AuthProvider>
    </ConfirmProvider>
    </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
