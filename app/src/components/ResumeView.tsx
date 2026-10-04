import React from 'react';

interface ResumeViewProps {
  atsScore: number;
  targetRole: string;
}

export const ResumeView: React.FC<ResumeViewProps> = ({ atsScore, targetRole }) => {
  const detectedGaps = [
    'Missing quantifiable business metrics for distributed database scaling (e.g., QPS, latency reduction %)',
    'Add specific keywords: Kafka Streams, Redis Cluster, Distributed Transactions, Kubernetes RBAC',
    'No explicit mention of Unit / Integration test coverage percentages'
  ];

  const actionableFixes = [
    'Replace "Worked on API optimization" with "Engineered asynchronous caching layer reducing p99 latency from 450ms to 42ms for 2M daily requests"',
    'Highlight production debugging experience in high-concurrency microservices',
    'Add an open-source or GitHub project link demonstrating TypeScript & Go microservices'
  ];

  const suggestedQuestions = [
    'Can you walk through an architectural decision where you had to balance consistency vs latency in your resume project?',
    'How do you profile memory leaks in Node.js or Java backend workers in production?',
    'Explain how you structured your database schema indexing for multi-tenant tenant isolation.'
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {/* Header Banner */}
      <section className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', marginBottom: '4px' }}>
            <span className="badge badge-primary">ATS AI Intelligence</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Analyzed for {targetRole}</span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>Resume ATS Diagnostic & Blueprint</h2>
        </div>

        {/* ATS Score Dial */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', background: 'var(--bg-secondary)', padding: 'var(--space-1-5) var(--space-2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: 'var(--radius-full)',
            background: 'conic-gradient(var(--color-emerald) 82%, var(--bg-tertiary) 0deg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '16px',
              color: 'var(--color-emerald)'
            }}>
              {atsScore}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>OVERALL ATS SCORE</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-emerald)' }}>Tier-1 Pass Rate (Top 12%)</div>
          </div>
        </div>
      </section>

      {/* Grid: Gaps + Actionable Improvements */}
      <div className="grid-2">
        {/* Left: Identified Keyword & Experience Gaps */}
        <section className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚠️ Identified Skill & Impact Gaps
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1-5)' }}>
            {detectedGaps.map((gap, idx) => (
              <div key={idx} style={{ padding: 'var(--space-1-5)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, borderLeft: '3px solid var(--color-amber)' }}>
                {gap}
              </div>
            ))}
          </div>
        </section>

        {/* Right: Actionable Resume Fixes */}
        <section className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ✨ Recommended Bullet-Point Optimizations
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1-5)' }}>
            {actionableFixes.map((fix, idx) => (
              <div key={idx} style={{ padding: 'var(--space-1-5)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, borderLeft: '3px solid var(--color-emerald)' }}>
                {fix}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Bottom Section: AI Generated Tailored Interview Questions from Resume */}
      <section className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🎯 Questions Recruiters Will Ask Based On Your Resume
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1-5)' }}>
          {suggestedQuestions.map((q, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-1-5) var(--space-2)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{idx + 1}. {q}</span>
              <span className="badge badge-primary">Practice Q</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
