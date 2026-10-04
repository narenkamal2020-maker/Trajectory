import React from 'react';
import { SunIcon, MoonIcon, AwardIcon } from './Icons';

interface HeaderProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  targetRole: string;
  onOpenOnboarding: () => void;
  userName: string;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  targetRole,
  onOpenOnboarding,
  userName
}) => {
  return (
    <header className="app-header">
      {/* Role & status overview */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Target Blueprint:</span>
          <span className="badge badge-primary" style={{ fontSize: '13px', padding: '4px 10px' }}>
            {targetRole}
          </span>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onOpenOnboarding}
          title="Update Target Role & Preferences"
          style={{ fontSize: '12px', color: 'var(--color-primary)' }}
        >
          Customize
        </button>
      </div>

      {/* Action controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        {/* Readiness Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-1)',
          background: 'var(--bg-secondary)',
          padding: '6px 12px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border-subtle)',
          fontSize: '13px'
        }}>
          <AwardIcon size={16} className="text-primary" style={{ color: 'var(--color-primary)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Readiness:</span>
          <strong style={{ color: 'var(--color-emerald)' }}>86% (L4 Ready)</strong>
        </div>

        {/* Theme Toggle */}
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          style={{ width: '36px', height: '36px', padding: 0, borderRadius: 'var(--radius-md)' }}
        >
          {theme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
        </button>

        {/* User Profile Avatar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-1-5)',
          paddingLeft: 'var(--space-1)',
          borderLeft: '1px solid var(--border-subtle)'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-full)',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-violet))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: '14px'
          }}>
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
};
