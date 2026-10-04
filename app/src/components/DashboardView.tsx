import React from 'react';
import type { UserSkillProficiency, QuestionItem, NavigationTab } from '../types';
import { SkillRadar } from './SkillRadar';
import { SparklesIcon, ZapIcon, AwardIcon, CodeIcon, MicIcon, CheckCircleIcon } from './Icons';

interface DashboardViewProps {
  skills: UserSkillProficiency[];
  questions: QuestionItem[];
  atsScore: number;
  streakDays: number;
  onNavigate: (tab: NavigationTab) => void;
  onStartPractice: (questionId: string) => void;
  onStartInterview: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  skills,
  questions,
  atsScore,
  streakDays,
  onNavigate,
  onStartPractice,
  onStartInterview
}) => {
  const solvedQuestionsCount = questions.filter(q => q.solved).length;
  const recentQuestions = questions.slice(0, 4);

  return (
    <main style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {/* Hero Adaptive AI Banner */}
      <section className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(6, 182, 212, 0.1))',
        borderColor: 'var(--border-active)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          <div style={{ maxWidth: '680px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', marginBottom: 'var(--space-1)' }}>
              <span className="badge badge-primary">
                <SparklesIcon size={14} /> AI Recommendation Engine
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Updated 12m ago</span>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>
              Target: Software Engineer II (Systems & Backend)
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              You are currently <strong>86% aligned</strong> with Tier-1 Tech benchmarks. To cross the 90% threshold,
              practice <strong>Dynamic Programming & Distributed Cache Design</strong>.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-1-5)' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onStartPractice(questions[0]?.id || '1')}
            >
              <ZapIcon size={16} /> Practice Next Problem
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onStartInterview}
            >
              <MicIcon size={16} /> Launch AI Mock
            </button>
          </div>
        </div>
      </section>

      {/* Top Level Metric Cards (4 Column 8px Grid) */}
      <section className="grid-4" aria-label="Key Performance Indicators">
        {/* Metric 1: Problems Solved */}
        <article className="glass-card glass-card-interactive" onClick={() => onNavigate('practice')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Problems Mastered</p>
              <h3 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {solvedQuestionsCount} <span style={{ fontSize: '15px', color: 'var(--text-muted)', fontWeight: 500 }}>/ {questions.length}</span>
              </h3>
            </div>
            <div style={{
              padding: '10px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(99, 102, 241, 0.15)',
              color: 'var(--color-primary)'
            }}>
              <CodeIcon size={22} />
            </div>
          </div>
          <div style={{ marginTop: 'var(--space-1-5)', fontSize: '12px', color: 'var(--color-emerald)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircleIcon size={14} /> +3 this week (Ahead of target)
          </div>
        </article>

        {/* Metric 2: ATS Resume Score */}
        <article className="glass-card glass-card-interactive" onClick={() => onNavigate('resume')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>ATS Match Score</p>
              <h3 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {atsScore}<span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>/100</span>
              </h3>
            </div>
            <div style={{
              padding: '10px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--color-emerald)'
            }}>
              <AwardIcon size={22} />
            </div>
          </div>
          <div style={{ marginTop: 'var(--space-1-5)', fontSize: '12px', color: 'var(--text-secondary)' }}>
            Strong match for Cloud & Backend roles
          </div>
        </article>

        {/* Metric 3: Mock Interview Average */}
        <article className="glass-card glass-card-interactive" onClick={() => onNavigate('interview')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>AI Interview Index</p>
              <h3 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>
                88.5<span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>/100</span>
              </h3>
            </div>
            <div style={{
              padding: '10px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(6, 182, 212, 0.15)',
              color: 'var(--color-cyan)'
            }}>
              <MicIcon size={22} />
            </div>
          </div>
          <div style={{ marginTop: 'var(--space-1-5)', fontSize: '12px', color: 'var(--color-emerald)' }}>
            Top 10% in System Architecture
          </div>
        </article>

        {/* Metric 4: Daily Streak */}
        <article className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Consistency Streak</p>
              <h3 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {streakDays} <span style={{ fontSize: '15px', color: 'var(--text-muted)', fontWeight: 500 }}>Days</span>
              </h3>
            </div>
            <div style={{
              padding: '10px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(245, 158, 11, 0.15)',
              color: 'var(--color-amber)'
            }}>
              <ZapIcon size={22} />
            </div>
          </div>
          <div style={{ marginTop: 'var(--space-1-5)', fontSize: '12px', color: 'var(--text-secondary)' }}>
            2 days until 10-day milestone badge
          </div>
        </article>
      </section>

      {/* Main Grid: Skill Radar + Recommended Coding Catalog */}
      <div className="grid-2">
        {/* Left: Interactive Skill Radar */}
        <SkillRadar skills={skills} />

        {/* Right: Recommended Challenges */}
        <section className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Curated Trajectory Questions</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Tailored to bridge your identified skill gaps</p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => onNavigate('practice')}
              style={{ color: 'var(--color-primary)' }}
            >
              View All ({questions.length})
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1-5)' }}>
            {recentQuestions.map((q) => (
              <div
                key={q.id}
                className="glass-card glass-card-interactive"
                onClick={() => onStartPractice(q.id)}
                style={{
                  padding: 'var(--space-1-5) var(--space-2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--bg-secondary)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1-5)' }}>
                  <span style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: 'var(--radius-sm)',
                    background: q.solved ? 'var(--color-emerald-bg)' : 'var(--bg-tertiary)',
                    color: q.solved ? 'var(--color-emerald)' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {q.solved ? <CheckCircleIcon size={16} /> : <CodeIcon size={16} />}
                  </span>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{q.title}</h4>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{q.category} · {q.avgTimeSec / 60} min avg</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                  <span className={`badge ${q.difficulty === 'EASY' ? 'badge-easy' : q.difficulty === 'MEDIUM' ? 'badge-medium' : 'badge-hard'}`}>
                    {q.difficulty}
                  </span>
                  <button type="button" className="btn btn-ghost btn-sm">Solve</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};
