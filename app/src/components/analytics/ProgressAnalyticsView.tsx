import React from 'react';
import { PipelineView } from '../PipelineView';
import { SkillRadar } from '../SkillRadar';
import type { ApplicationItem, UserSkillProficiency } from '../../types';

interface ProgressAnalyticsViewProps {
  applications: ApplicationItem[];
  onAddApplication: (app: Omit<ApplicationItem, 'id'>) => void;
  onUpdateStage: (id: string, stage: ApplicationItem['stage']) => void;
}

const INITIAL_SKILLS: UserSkillProficiency[] = [
  { id: '1', name: 'Binary Trees & Graphs', category: 'DSA & Algorithms', proficiency: 88, attempts: 42, correct: 37 },
  { id: '2', name: 'Dynamic Programming', category: 'DSA & Algorithms', proficiency: 72, attempts: 28, correct: 20 },
  { id: '3', name: 'Distributed Caching', category: 'System Architecture', proficiency: 85, attempts: 15, correct: 13 },
  { id: '4', name: 'SQL Index Optimization', category: 'SQL & Databases', proficiency: 94, attempts: 30, correct: 28 },
  { id: '5', name: 'TCP/IP & WebSockets', category: 'Core CS & Networks', proficiency: 78, attempts: 18, correct: 14 },
  { id: '6', name: 'STAR Behavioral Method', category: 'Behavioral & Comm', proficiency: 90, attempts: 12, correct: 11 },
];

export const ProgressAnalyticsView: React.FC<ProgressAnalyticsViewProps> = ({
  applications,
  onAddApplication,
  onUpdateStage,
}) => {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header Bar */}
      <div>
        <span className="font-mono text-xs text-[#ffd371] tracking-widest uppercase font-bold">
          TELEMETRY LOGS & CAREER PIPELINE
        </span>
        <h1 className="font-headline text-2xl sm:text-3xl font-bold text-white mt-1">
          Progress & Analytics
        </h1>
      </div>

      {/* Skill Radar Telemetry */}
      <div className="p-6 rounded-2xl bg-[#11131d] border border-white/10 shadow-2xl space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-white/10">
          <span className="font-headline font-bold text-base text-white">
            Bayesian Competency Radar
          </span>
          <span className="font-mono text-xs text-[#ffd371]">6 VECTORS</span>
        </div>
        <SkillRadar skills={INITIAL_SKILLS} />
      </div>

      {/* Application Tracker Pipeline */}
      <div className="space-y-4">
        <PipelineView
          applications={applications}
          onAddApplication={onAddApplication}
          onUpdateStage={onUpdateStage}
        />
      </div>
    </div>
  );
};
