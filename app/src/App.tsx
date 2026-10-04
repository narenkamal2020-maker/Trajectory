import { useState, useEffect } from 'react';
import { DesktopLayout } from './components/navigation/DesktopLayout';
import { CommandCenter } from './components/dashboard/CommandCenter';
import { PracticeTerminalView } from './components/practice/PracticeTerminalView';
import { MockInterviewStudio } from './components/interview/MockInterviewStudio';
import { SkillConstellationView } from './components/constellation/SkillConstellationView';
import { CareerFlightPathView } from './components/career/CareerFlightPathView';
import { ResumeDiagnosticView } from './components/resume/ResumeDiagnosticView';
import { ProgressAnalyticsView } from './components/analytics/ProgressAnalyticsView';
import { WebSuite } from './components/web/WebSuite';

// Mobile Suite Components
import { TelemetryDashboardScreen } from './components/mobile/TelemetryDashboard';
import { CareerFlightPathScreen } from './components/mobile/CareerFlightPath';
import { PracticeTerminalScreen } from './components/mobile/PracticeTerminal';
import { InterviewView } from './components/InterviewView';
import { SkillRadar } from './components/SkillRadar';
import { ResumeView } from './components/ResumeView';
import { PipelineView } from './components/PipelineView';
import { MobileShell } from './components/mobile/MobileShell';

import { api, type DashboardOverview } from './services/api';
import type { ApplicationItem, UserSkillProficiency } from './types';
import { Monitor } from 'lucide-react';

const INITIAL_SKILLS: UserSkillProficiency[] = [
  { id: '1', name: 'Binary Trees & Graphs', category: 'DSA & Algorithms', proficiency: 88, attempts: 42, correct: 37 },
  { id: '2', name: 'Dynamic Programming', category: 'DSA & Algorithms', proficiency: 72, attempts: 28, correct: 20 },
  { id: '3', name: 'Distributed Caching', category: 'System Architecture', proficiency: 85, attempts: 15, correct: 13 },
  { id: '4', name: 'SQL Index Optimization', category: 'SQL & Databases', proficiency: 94, attempts: 30, correct: 28 },
  { id: '5', name: 'TCP/IP & WebSockets', category: 'Core CS & Networks', proficiency: 78, attempts: 18, correct: 14 },
  { id: '6', name: 'STAR Behavioral Method', category: 'Behavioral & Comm', proficiency: 90, attempts: 12, correct: 11 },
];

const INITIAL_APPLICATIONS: ApplicationItem[] = [
  { id: '1', company: 'Stripe', role: 'Staff Distributed Systems Engineer', stage: 'INTERVIEW', salaryPackage: '$240k + Equity', appliedDate: '2026-09-20' },
  { id: '2', company: 'Google', role: 'L6 Systems Architect', stage: 'OA', salaryPackage: 'L6 Band', appliedDate: '2026-09-24' },
  { id: '3', company: 'Datadog', role: 'Principal Storage Engineer', stage: 'APPLIED', salaryPackage: '$260k Base', appliedDate: '2026-09-28' },
  { id: '4', company: 'Vercel', role: 'Platform Infrastructure Lead', stage: 'OFFER', salaryPackage: '$280k Total Comp', appliedDate: '2026-09-12' },
];

export function App() {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [activeRoute, setActiveRoute] = useState<string>('dashboard');
  const [mobileTab, setMobileTab] = useState<'orbit' | 'practice' | 'mocks' | 'skills' | 'career' | 'more'>('orbit');
  
  const [overview, setOverview] = useState<DashboardOverview | undefined>(undefined);
  const [applications, setApplications] = useState<ApplicationItem[]>(INITIAL_APPLICATIONS);

  useEffect(() => {
    async function fetchOverview() {
      const data = await api.getDashboardOverview();
      setOverview(data);
    }
    fetchOverview();
  }, []);

  const handleNavigate = (route: string) => {
    if (route === 'mobile') {
      setViewMode('mobile');
    } else {
      setActiveRoute(route);
    }
  };

  // 1. DESKTOP COMMAND CENTER & SUITE
  if (viewMode === 'desktop') {
    return (
      <DesktopLayout
        activeRoute={activeRoute}
        onNavigate={handleNavigate}
        onSwitchToMobile={() => setViewMode('mobile')}
      >
        {activeRoute === 'dashboard' && (
          <CommandCenter overview={overview} onNavigate={handleNavigate} />
        )}

        {activeRoute === 'practice' && (
          <PracticeTerminalView />
        )}

        {activeRoute === 'interviews' && (
          <MockInterviewStudio />
        )}

        {activeRoute === 'skills' && (
          <SkillConstellationView onNavigate={handleNavigate} />
        )}

        {activeRoute === 'career' && (
          <CareerFlightPathView onNavigate={handleNavigate} />
        )}

        {activeRoute === 'analytics' && (
          <ProgressAnalyticsView
            applications={applications}
            onAddApplication={(newApp) => {
              const item: ApplicationItem = { ...newApp, id: String(Date.now()) };
              setApplications((prev) => [item, ...prev]);
            }}
            onUpdateStage={(id, stage) => {
              setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, stage } : a)));
            }}
          />
        )}

        {activeRoute === 'resume' && (
          <ResumeDiagnosticView />
        )}

        {activeRoute === 'landing' && (
          <WebSuite onSwitchToMobile={() => setViewMode('mobile')} />
        )}
      </DesktopLayout>
    );
  }

  // 2. MOBILE COMPANION SUITE
  return (
    <div className="min-h-screen bg-[#060812] flex flex-col items-center justify-center p-0 sm:p-4 relative selection:bg-[#ffd371] selection:text-[#3f2e00]">
      {/* Floating Return to Desktop View Button */}
      <div className="fixed top-3 right-3 sm:top-6 sm:right-6 z-50">
        <button
          type="button"
          onClick={() => setViewMode('desktop')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#191b26]/90 hover:bg-[#272935] text-[#ffd371] border border-[#ffd371]/40 shadow-lg text-[11px] font-mono font-semibold transition-all cursor-pointer"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>DESKTOP COMMAND CENTER</span>
        </button>
      </div>

      {mobileTab === 'orbit' && (
        <TelemetryDashboardScreen onTabChange={(t) => setMobileTab(t)} />
      )}

      {mobileTab === 'career' && (
        <CareerFlightPathScreen onTabChange={(t) => setMobileTab(t)} />
      )}

      {mobileTab === 'practice' && (
        <PracticeTerminalScreen onTabChange={(t) => setMobileTab(t)} />
      )}

      {mobileTab === 'mocks' && (
        <MobileShell activeTab="mocks" onTabChange={(t) => setMobileTab(t)}>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-mono text-white/50">
              <span className="text-amber-400 font-bold">AI MOCK INTERVIEW STUDIO</span>
              <span>VOICE SYNTHESIS LIVE</span>
            </div>
            <InterviewView />
          </div>
        </MobileShell>
      )}

      {mobileTab === 'skills' && (
        <MobileShell activeTab="skills" onTabChange={(t) => setMobileTab(t)}>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-mono text-white/50">
              <span className="text-amber-400 font-bold">SKILL RADAR TELEMETRY</span>
              <span>L6 BENCHMARK</span>
            </div>
            <SkillRadar skills={INITIAL_SKILLS} />
          </div>
        </MobileShell>
      )}

      {mobileTab === 'more' && (
        <MobileShell activeTab="more" onTabChange={(t) => setMobileTab(t)}>
          <div className="space-y-4">
            <ResumeView atsScore={88} targetRole="Staff Distributed Systems Architect" />
            <PipelineView
              applications={applications}
              onAddApplication={(newApp) => {
                const item: ApplicationItem = { ...newApp, id: String(Date.now()) };
                setApplications((prev) => [item, ...prev]);
              }}
              onUpdateStage={(id, stage) => {
                setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, stage } : a)));
              }}
            />
          </div>
        </MobileShell>
      )}
    </div>
  );
}

export default App;
