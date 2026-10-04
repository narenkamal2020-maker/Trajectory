import React, { useState } from 'react';
import { SparklesIcon, SendIcon } from './Icons';

export const InterviewView: React.FC = () => {
  const [interviewType, setInterviewType] = useState<'TECHNICAL' | 'SYSTEM_DESIGN' | 'BEHAVIORAL'>('TECHNICAL');
  const [messages, setMessages] = useState<Array<{ role: 'INTERVIEWER' | 'USER'; content: string; feedback?: string }>>([
    {
      role: 'INTERVIEWER',
      content: 'Welcome to your Trajectory Technical Mock Interview! I will be asking you about distributed systems and cache invalidation strategies. To begin, could you explain how you would design a high-throughput rate limiter for a multi-region API gateway?'
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isEvaluating) return;

    const userText = inputVal;
    setInputVal('');
    const newMsgs = [...messages, { role: 'USER' as const, content: userText }];
    setMessages(newMsgs);
    setIsEvaluating(true);

    setTimeout(() => {
      setIsEvaluating(false);
      setMessages([
        ...newMsgs,
        {
          role: 'INTERVIEWER' as const,
          content: 'Excellent point about using Redis Token Bucket with local in-memory fallback. How would you handle synchronization latency across regions without incurring double-decrement race conditions?',
          feedback: '💡 **Evaluation Rubric**: Clear architectural terminology (88/100). Technical depth was strong; consider mentioning monotonic clock drift or sliding window log tradeoffs.'
        }
      ]);
    }, 1200);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 'var(--space-3)', height: 'calc(100vh - 120px)' }}>
      {/* Left Column: Interview Settings & Rubric Stats */}
      <aside className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>AI Mock Studio</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Real-time voice & text technical evaluation</p>
        </div>

        {/* Type Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>SESSION TYPE</label>
          {(['TECHNICAL', 'SYSTEM_DESIGN', 'BEHAVIORAL'] as const).map((type) => (
            <button
              key={type}
              type="button"
              className={`btn btn-sm ${interviewType === type ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setInterviewType(type)}
              style={{ justifyContent: 'flex-start', textAlign: 'left' }}
            >
              {type === 'TECHNICAL' ? '💻 Coding & Algorithms' : type === 'SYSTEM_DESIGN' ? '🏗️ System Architecture' : '🗣️ Behavioral & Leadership'}
            </button>
          ))}
        </div>

        {/* Live Audio Visualizer Card */}
        <div className="glass-card" style={{ background: 'var(--bg-secondary)', textAlign: 'center', padding: 'var(--space-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', height: '40px', marginBottom: '8px' }}>
            <div className="wave-bar" />
            <div className="wave-bar" />
            <div className="wave-bar" />
            <div className="wave-bar" />
            <div className="wave-bar" />
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>AI Interviewer Audio Stream Active</div>
        </div>

        {/* Live Score Breakdown */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-1-5)' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>LIVE BENCHMARK RUBRIC</div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Technical Depth</span>
            <strong style={{ color: 'var(--color-emerald)' }}>92 / 100</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Problem Solving</span>
            <strong style={{ color: 'var(--color-primary)' }}>86 / 100</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Communication</span>
            <strong style={{ color: 'var(--color-cyan)' }}>88 / 100</strong>
          </div>
        </div>
      </aside>

      {/* Right Column: Interactive Chat Interface */}
      <section className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', overflow: 'hidden' }}>
        {/* Messages Stream */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', paddingRight: '4px' }}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.role === 'USER' ? 'flex-end' : 'flex-start',
                gap: '4px'
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {msg.role === 'INTERVIEWER' ? '🤖 Trajectory AI Interviewer' : '👤 You'}
              </div>

              <div
                style={{
                  maxWidth: '80%',
                  padding: 'var(--space-1-5) var(--space-2)',
                  borderRadius: 'var(--radius-md)',
                  background: msg.role === 'USER' ? 'var(--color-primary)' : 'var(--bg-secondary)',
                  color: msg.role === 'USER' ? '#ffffff' : 'var(--text-primary)',
                  fontSize: '14px',
                  lineHeight: 1.6,
                  border: msg.role === 'USER' ? 'none' : '1px solid var(--border-subtle)',
                }}
              >
                {msg.content}
              </div>

              {msg.feedback && (
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    fontSize: '12px',
                    color: 'var(--text-secondary)'
                  }}
                  dangerouslySetInnerHTML={{ __html: msg.feedback.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
                />
              )}
            </div>
          ))}

          {isEvaluating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13px' }}>
              <SparklesIcon size={16} className="text-primary animate-pulse-glow" /> AI Interviewer is analyzing response...
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 'var(--space-1)', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-1-5)' }}>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Type your technical response or speak..."
            style={{
              flex: 1,
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              padding: '10px var(--space-2)',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button type="submit" className="btn btn-primary" disabled={isEvaluating || !inputVal.trim()}>
            <SendIcon size={16} /> Send
          </button>
        </form>
      </section>
    </div>
  );
};
