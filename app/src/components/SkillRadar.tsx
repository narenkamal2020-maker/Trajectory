import React from 'react';
import type { UserSkillProficiency } from '../types';

interface SkillRadarProps {
  skills: UserSkillProficiency[];
}

export const SkillRadar: React.FC<SkillRadarProps> = ({ skills }) => {
  // Compute category averages
  const categories = ['DSA & Algorithms', 'System Architecture', 'SQL & Databases', 'Core CS & Networks', 'Behavioral & Comm'];
  
  const categoryScores: Record<string, { total: number; count: number }> = {
    'DSA & Algorithms': { total: 84, count: 1 },
    'System Architecture': { total: 68, count: 1 },
    'SQL & Databases': { total: 92, count: 1 },
    'Core CS & Networks': { total: 76, count: 1 },
    'Behavioral & Comm': { total: 88, count: 1 },
  };

  skills.forEach(s => {
    if (categoryScores[s.category]) {
      categoryScores[s.category].total += s.proficiency;
      categoryScores[s.category].count += 1;
    }
  });

  const numAxes = categories.length;
  const radius = 100;
  const center = 130;

  // Compute radar polygon points
  const points = categories.map((cat, idx) => {
    const angle = (Math.PI * 2 / numAxes) * idx - Math.PI / 2;
    const avg = Math.min(100, Math.max(20, Math.round(categoryScores[cat].total / categoryScores[cat].count)));
    const r = (avg / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');

  const gridCircles = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Skill Trajectory Radar</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Multi-dimensional technical benchmark</p>
        </div>
        <span className="badge badge-primary">FAANG Index: 82%</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 'var(--space-1) 0' }}>
        <svg width="260" height="260" viewBox="0 0 260 260" style={{ overflow: 'visible' }}>
          {/* Background web rings */}
          {gridCircles.map((factor, i) => (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={radius * factor}
              fill="none"
              stroke="var(--border-subtle)"
              strokeWidth="1"
              strokeDasharray={factor === 1 ? 'none' : '3,3'}
            />
          ))}

          {/* Web axis spokes */}
          {categories.map((_, idx) => {
            const angle = (Math.PI * 2 / numAxes) * idx - Math.PI / 2;
            const x2 = center + radius * Math.cos(angle);
            const y2 = center + radius * Math.sin(angle);
            return (
              <line
                key={idx}
                x1={center}
                y1={center}
                x2={x2}
                y2={y2}
                stroke="var(--border-subtle)"
                strokeWidth="1"
              />
            );
          })}

          {/* Benchmark target polygon (FAANG 85%) */}
          <polygon
            points={categories.map((_, idx) => {
              const angle = (Math.PI * 2 / numAxes) * idx - Math.PI / 2;
              const r = 0.85 * radius;
              return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
            }).join(' ')}
            fill="none"
            stroke="rgba(6, 182, 212, 0.4)"
            strokeWidth="1.5"
            strokeDasharray="4,4"
          />

          {/* User Score Polygon */}
          <polygon
            points={points}
            fill="rgba(99, 102, 241, 0.3)"
            stroke="var(--color-primary)"
            strokeWidth="2.5"
          />

          {/* User Score Vertices */}
          {categories.map((cat, idx) => {
            const angle = (Math.PI * 2 / numAxes) * idx - Math.PI / 2;
            const avg = Math.min(100, Math.max(20, Math.round(categoryScores[cat].total / categoryScores[cat].count)));
            const r = (avg / 100) * radius;
            const cx = center + r * Math.cos(angle);
            const cy = center + r * Math.sin(angle);
            return (
              <circle
                key={idx}
                cx={cx}
                cy={cy}
                r="4"
                fill="var(--color-primary)"
                stroke="#fff"
                strokeWidth="1.5"
              />
            );
          })}
        </svg>
      </div>

      {/* Category breakdown meters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1-5)' }}>
        {categories.map((cat) => {
          const avg = Math.min(100, Math.round(categoryScores[cat].total / categoryScores[cat].count));
          return (
            <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{cat}</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{avg}%</span>
              </div>
              <div style={{ height: '6px', width: '100%', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${avg}%`,
                    background: avg >= 80 ? 'linear-gradient(90deg, var(--color-primary), var(--color-cyan))' : 'var(--color-primary)',
                    borderRadius: 'var(--radius-full)',
                    transition: 'width var(--transition-normal)'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
