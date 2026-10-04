import React, { useState } from 'react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: string;
  onSave: (data: { role: string; industry: string; experience: string }) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onSave
}) => {
  const [role, setRole] = useState(currentRole);
  const [industry, setIndustry] = useState('Enterprise SaaS & Cloud');
  const [experience, setExperience] = useState('3-5 Years (Mid-Senior)');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ role, industry, experience });
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="glass-card" style={{ width: '480px', maxWidth: '92vw', padding: 'var(--space-3)', background: 'var(--bg-primary)' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
          Customize Career Blueprint
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
          Align Trajectory algorithms and interview difficulty to your desired career target.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>TARGET ROLE</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '14px' }}
            >
              <option value="Senior Backend Engineer">Senior Backend Engineer</option>
              <option value="Fullstack Software Engineer">Fullstack Software Engineer</option>
              <option value="Systems & Infrastructure Engineer">Systems & Infrastructure Engineer</option>
              <option value="AI & Machine Learning Engineer">AI & Machine Learning Engineer</option>
              <option value="Engineering Manager / Tech Lead">Engineering Manager / Tech Lead</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>TARGET INDUSTRY</label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '14px' }}
            >
              <option value="Enterprise SaaS & Cloud">Enterprise SaaS & Cloud</option>
              <option value="FinTech & High-Frequency Systems">FinTech & High-Frequency Systems</option>
              <option value="FAANG / Big Tech">FAANG / Big Tech</option>
              <option value="AI & Autonomous Systems">AI & Autonomous Systems</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>EXPERIENCE LEVEL</label>
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '14px' }}
            >
              <option value="0-2 Years (Associate / Junior)">0-2 Years (Associate / Junior)</option>
              <option value="3-5 Years (Mid-Senior)">3-5 Years (Mid-Senior)</option>
              <option value="6-9 Years (Senior / Staff)">6-9 Years (Senior / Staff)</option>
              <option value="10+ Years (Principal / Architect)">10+ Years (Principal / Architect)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-1)', marginTop: 'var(--space-2)' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Target Blueprint</button>
          </div>
        </form>
      </div>
    </div>
  );
};
