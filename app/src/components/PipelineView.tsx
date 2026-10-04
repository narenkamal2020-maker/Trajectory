import React, { useState } from 'react';
import type { ApplicationItem } from '../types';
import { PlusIcon } from './Icons';

interface PipelineViewProps {
  applications: ApplicationItem[];
  onAddApplication: (app: Omit<ApplicationItem, 'id'>) => void;
  onUpdateStage: (id: string, stage: ApplicationItem['stage']) => void;
}

const STAGES: Array<{ id: ApplicationItem['stage']; label: string; color: string }> = [
  { id: 'APPLIED', label: 'Applied', color: 'var(--color-primary)' },
  { id: 'OA', label: 'Online Assessment', color: 'var(--color-cyan)' },
  { id: 'INTERVIEW', label: 'Interviews', color: 'var(--color-amber)' },
  { id: 'OFFER', label: 'Offers', color: 'var(--color-emerald)' },
];

export const PipelineView: React.FC<PipelineViewProps> = ({
  applications,
  onAddApplication,
  onUpdateStage
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [salary, setSalary] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;

    onAddApplication({
      company,
      role,
      stage: 'APPLIED',
      salaryPackage: salary || undefined,
      appliedDate: new Date().toISOString().split('T')[0]
    });

    setCompany('');
    setRole('');
    setSalary('');
    setShowAddModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {/* Header & Add Action */}
      <section className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>Application & Offer Pipeline</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Track interview stages, assessments, and compensation offers</p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <PlusIcon size={16} /> Track New Application
        </button>
      </section>

      {/* Kanban Board Columns (4-Column 8px Grid) */}
      <div className="grid-4" style={{ alignItems: 'flex-start' }}>
        {STAGES.map((stage) => {
          const items = applications.filter((a) => a.stage === stage.id);
          return (
            <div
              key={stage.id}
              className="glass-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-1-5)',
                minHeight: '420px',
                background: 'var(--bg-secondary)'
              }}
            >
              {/* Column Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 'var(--space-1)', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{stage.label}</span>
                <span className="badge" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                  {items.length}
                </span>
              </div>

              {/* Column Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                {items.map((app) => (
                  <div
                    key={app.id}
                    className="glass-card"
                    style={{
                      padding: 'var(--space-1-5)',
                      background: 'var(--bg-primary)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{app.company}</strong>
                      {app.salaryPackage && (
                        <span className="badge badge-primary" style={{ fontSize: '11px' }}>{app.salaryPackage}</span>
                      )}
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{app.role}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Applied: {app.appliedDate}</span>

                    {/* Quick Move Stage Select */}
                    <div style={{ marginTop: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {STAGES.filter(s => s.id !== app.stage).map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => onUpdateStage(app.id, s.id)}
                          style={{ fontSize: '10px', padding: '2px 6px', background: 'var(--bg-tertiary)' }}
                        >
                          → {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {items.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 'var(--space-4) 0', color: 'var(--text-muted)', fontSize: '12px' }}>
                    No applications in this stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Application Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div className="glass-card" style={{ width: '420px', maxWidth: '90vw', padding: 'var(--space-3)', background: 'var(--bg-primary)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: 'var(--space-2)' }}>Add New Application</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1-5)' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Company Name</label>
                <input
                  type="text"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Stripe, Google, Datadog"
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Job Title / Level</label>
                <input
                  type="text"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Senior Backend Engineer"
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Salary / Compensation Package (Optional)</label>
                <input
                  type="text"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder="e.g. $175k Base + Equity"
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-1)', marginTop: 'var(--space-2)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Application</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
