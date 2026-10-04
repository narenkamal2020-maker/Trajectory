import React from 'react';
import type { NavigationTab } from '../types';
import { RadarIcon, CodeIcon, MicIcon, FileTextIcon, BriefcaseIcon, SparklesIcon } from './Icons';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  streakDays: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, streakDays }) => {
  const navItems: Array<{ id: NavigationTab; label: string; icon: React.ReactNode }> = [
    { id: 'overview', label: 'Trajectory Hub', icon: <RadarIcon size={18} /> },
    { id: 'practice', label: 'Coding Practice', icon: <CodeIcon size={18} /> },
    { id: 'interview', label: 'AI Mock Studio', icon: <MicIcon size={18} /> },
    { id: 'resume', label: 'ATS Blueprint', icon: <FileTextIcon size={18} /> },
    { id: 'applications', label: 'Job Tracker', icon: <BriefcaseIcon size={18} /> },
  ];

  return (
    <aside className="sidebar" aria-label="Main Navigation">
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1-5)', padding: '0 var(--space-1) var(--space-3)' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-cyan))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          boxShadow: '0 4px 12px var(--color-primary-glow)'
        }}>
          <SparklesIcon size={20} />
        </div>
        <div className="sidebar-text">
          <h1 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--text-primary)', margin: 0 }}>
            TRAJECTORY
          </h1>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase', margin: 0 }}>
            Career Intelligence
          </p>
        </div>
      </div>

      {/* Navigation list */}
      <nav style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => onSelectTab(item.id)}
            aria-current={activeTab === item.id ? 'page' : undefined}
          >
            {item.icon}
            <span className="sidebar-text">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Streak badge & User widget */}
      <div className="glass-card" style={{ padding: 'var(--space-2)', marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1-5)' }}>
          <div style={{
            fontSize: '20px',
            lineHeight: 1,
            background: 'var(--color-amber-bg)',
            padding: '6px',
            borderRadius: 'var(--radius-sm)'
          }}>
            🔥
          </div>
          <div className="sidebar-text" style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Daily Streak</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{streakDays} Days</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
